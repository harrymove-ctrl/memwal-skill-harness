/*
 * Reads Sui mainnet through Tatum's gRPC gateway.
 *
 * Tatum's gateway answers native gRPC (content type application/grpc), and the SDK's default
 * transport speaks gRPC-web, so SuiGrpcClient gets a small transport over node:http2 here. Only
 * unary calls are needed. Calls are paced and cached because the gateway rate limits quickly and
 * every call spends credits.
 */
import http2 from "node:http2";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { isValidSuiAddress, normalizeSuiAddress } from "@mysten/sui/utils";

const GATEWAY_URL = "https://sui-mainnet-grpc.gateway.tatum.io";
const CALL_TIMEOUT_MS = 12_000;
const MIN_GAP_MS = 450;
const CACHE_TTL_MS = 30 * 60 * 1000;
/** Failures are cached briefly, so a bad address or an outage cannot burn credits in a loop. */
const FAILURE_TTL_MS = 60 * 1000;
export const RPC_SOURCE = "Tatum Sui gRPC gateway";

function tatumKey() {
  return process.env.TATUM_API_KEY || "";
}

export function isTatumConfigured() {
  return Boolean(tatumKey());
}

class GatewayError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "RpcError";
    this.code = code;
  }
}

const GRPC_CODES = {
  1: "CANCELLED", 2: "UNKNOWN", 3: "INVALID_ARGUMENT", 4: "DEADLINE_EXCEEDED", 5: "NOT_FOUND",
  7: "PERMISSION_DENIED", 8: "RESOURCE_EXHAUSTED", 9: "FAILED_PRECONDITION", 12: "UNIMPLEMENTED",
  13: "INTERNAL", 14: "UNAVAILABLE", 16: "UNAUTHENTICATED",
};

function frame(message) {
  const header = Buffer.alloc(5);
  header.writeUInt32BE(message.length, 1);
  return Buffer.concat([header, Buffer.from(message)]);
}

/** Exported for tests: pulls the first gRPC message out of a response body. */
export function unframe(body) {
  if (body.length < 5) return new Uint8Array();
  if (body[0] !== 0) throw new GatewayError("Compressed gRPC response is not supported", "INTERNAL");
  const length = body.readUInt32BE(1);
  if (body.length < 5 + length) throw new GatewayError("Truncated gRPC response", "INTERNAL");
  return new Uint8Array(body.subarray(5, 5 + length));
}

let session = null;
function getSession() {
  if (session && !session.closed && !session.destroyed) return session;
  session = http2.connect(GATEWAY_URL);
  session.on("error", () => {
    session = null;
  });
  session.on("close", () => {
    session = null;
  });
  // An idle connection must not keep the process, or a test run, alive.
  session.unref();
  return session;
}

function callUnary(path, requestBytes) {
  return new Promise((resolve, reject) => {
    let stream;
    try {
      stream = getSession().request({
        ":method": "POST",
        ":path": path,
        "content-type": "application/grpc",
        te: "trailers",
        "x-api-key": tatumKey(),
      });
    } catch (err) {
      reject(new GatewayError(String(err?.message || err), "UNAVAILABLE"));
      return;
    }
    const chunks = [];
    let responseHeaders = {};
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      stream.close(http2.constants.NGHTTP2_CANCEL);
      finish(new GatewayError("The Tatum gateway timed out", "DEADLINE_EXCEEDED"));
    }, CALL_TIMEOUT_MS);
    const readStatus = (headers) => {
      const raw = headers["grpc-status"];
      if (raw === undefined) return null;
      const status = Number(raw);
      if (status === 0) return { ok: true };
      return {
        ok: false,
        error: new GatewayError(
          decodeURIComponent(String(headers["grpc-message"] || "Gateway error")),
          GRPC_CODES[status] || "UNKNOWN"
        ),
      };
    };
    stream.on("response", (headers) => {
      responseHeaders = headers;
      const httpStatus = Number(headers[":status"]);
      if (httpStatus === 429) finish(new GatewayError("Too Many Requests", "RESOURCE_EXHAUSTED"));
      else if (httpStatus === 401 || httpStatus === 403) finish(new GatewayError("The Tatum key was refused", "UNAUTHENTICATED"));
      else if (httpStatus !== 200) finish(new GatewayError(`Gateway returned HTTP ${httpStatus}`, "UNAVAILABLE"));
    });
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("trailers", (trailers) => {
      responseHeaders = { ...responseHeaders, ...trailers };
    });
    stream.on("error", (err) => finish(new GatewayError(String(err?.message || err), "UNAVAILABLE")));
    stream.on("end", () => {
      const status = readStatus(responseHeaders);
      if (status && !status.ok) return finish(status.error);
      if (!status) return finish(new GatewayError("The gateway sent no gRPC status", "UNAVAILABLE"));
      try {
        finish(null, unframe(Buffer.concat(chunks)));
      } catch (err) {
        finish(err);
      }
    });
    stream.end(frame(requestBytes));
  });
}

/** Just enough of protobuf-ts's RpcTransport for the unary calls the SDK makes. */
const nativeGrpcTransport = {
  mergeOptions: (options) => options ?? {},
  unary(method, input) {
    const path = `/${method.service.typeName}/${method.name}`;
    const response = callUnary(path, method.I.toBinary(input)).then((bytes) => method.O.fromBinary(bytes));
    const status = response.then(() => ({ code: "OK", detail: "" }));
    const headers = Promise.resolve({});
    const trailers = response.then(() => ({}));
    // The SDK only awaits `response`. Without these, a failed call also rejects the two promises
    // nobody reads, and Node ends the whole server on an unhandled rejection.
    status.catch(() => undefined);
    trailers.catch(() => undefined);
    return {
      method,
      requestHeaders: {},
      request: input,
      headers,
      response,
      status,
      trailers,
      then: (ok, fail) =>
        response.then((value) => ({ method, requestHeaders: {}, request: input, headers: {}, response: value, status: { code: "OK", detail: "" }, trailers: {} })).then(ok, fail),
    };
  },
  serverStreaming() {
    throw new GatewayError("Streaming is not supported here", "UNIMPLEMENTED");
  },
  clientStreaming() {
    throw new GatewayError("Streaming is not supported here", "UNIMPLEMENTED");
  },
  duplex() {
    throw new GatewayError("Streaming is not supported here", "UNIMPLEMENTED");
  },
};

let client = null;
export function getSuiClient() {
  if (!client) client = new SuiGrpcClient({ network: "mainnet", transport: nativeGrpcTransport });
  return client;
}

/* One call at a time, spaced apart, with a single retry when the gateway says slow down. */
let queue = Promise.resolve();
let lastCallAt = 0;

function paced(fn) {
  const run = queue.then(async () => {
    for (let attempt = 0; ; attempt += 1) {
      const wait = lastCallAt + MIN_GAP_MS * (attempt + 1) - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      lastCallAt = Date.now();
      try {
        return await fn();
      } catch (err) {
        if (err?.code !== "RESOURCE_EXHAUSTED" || attempt >= 1) throw err;
      }
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

const cache = new Map();

export function clearGatewayCache() {
  cache.clear();
}

async function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    if (hit.error) throw hit.error;
    return hit.value;
  }
  try {
    const value = await paced(fn);
    cache.set(key, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (err) {
    cache.set(key, { error: err, expires: Date.now() + FAILURE_TTL_MS });
    throw err;
  }
}

export function normalizeAddress(address) {
  const raw = String(address ?? "").trim();
  if (!/^0x[0-9a-fA-F]{1,64}$/.test(raw)) return null;
  const normal = normalizeSuiAddress(raw);
  return isValidSuiAddress(normal) ? normal : null;
}

function toHex(value) {
  if (typeof value === "string") {
    if (/^(0x)?[0-9a-fA-F]+$/.test(value)) return value.replace(/^0x/, "").toLowerCase();
    return Buffer.from(value, "base64").toString("hex");
  }
  if (Array.isArray(value)) return Buffer.from(value).toString("hex");
  return "";
}

/** Exported for tests: pulls the owner and delegate keys out of a MemWalAccount object. */
export function parseAccountObject(json) {
  const fields = json?.fields ?? json ?? {};
  const rawKeys = fields.delegate_keys ?? fields.delegateKeys ?? [];
  const keys = (Array.isArray(rawKeys) ? rawKeys : []).map((entry) => {
    const item = entry?.fields ?? entry ?? {};
    return {
      suiAddress: normalizeAddress(item.sui_address ?? item.suiAddress) ?? "",
      publicKeyHex: toHex(item.public_key ?? item.publicKey),
      label: String(item.label ?? ""),
    };
  });
  return {
    owner: normalizeAddress(fields.owner) ?? "",
    active: fields.active !== false,
    delegateKeys: keys,
  };
}

/** The account object, read through Tatum. Throws when Tatum cannot answer. */
export function readAccount(accountId) {
  const id = normalizeAddress(accountId);
  if (!id) return Promise.reject(new GatewayError("Invalid account id", "INVALID_ARGUMENT"));
  return cached(`account:${id}`, async () => {
    const { object } = await getSuiClient().core.getObject({ objectId: id, include: { json: true } });
    return { accountId: id, version: String(object?.version ?? ""), ...parseAccountObject(object?.json) };
  });
}

export function resolveSuiName(name) {
  const clean = String(name ?? "").trim().toLowerCase();
  return cached(`name:${clean}`, async () => {
    const res = await getSuiClient().nameService.lookupName({ name: clean }).response;
    return normalizeAddress(res?.record?.targetAddress);
  });
}

export function readBalance(address) {
  return cached(`balance:${address}`, async () => {
    const { balance } = await getSuiClient().core.getBalance({ owner: address });
    return String(balance?.balance ?? balance?.coinBalance ?? "0");
  });
}

export function readTransaction(digest) {
  const clean = String(digest ?? "").trim();
  return cached(`tx:${clean}`, async () => {
    const res = await getSuiClient().core.getTransaction({ digest: clean, include: { effects: true } });
    const tx = res?.Transaction ?? res?.transaction ?? res;
    return {
      digest: clean,
      ok: tx?.status?.success ?? tx?.effects?.status?.success ?? null,
      url: `https://suiscan.xyz/mainnet/tx/${clean}`,
    };
  });
}

/**
 * Tatum's address security check. It returns "unknown" when Tatum cannot answer. It never turns an
 * outage into a pass, because this result decides who gets access.
 */
export function screenAddress(address) {
  return cached(`screen:${address}`, async () => {
    if (!isTatumConfigured()) return "unknown";
    try {
      const res = await fetch(`https://api.tatum.io/v3/security/address/${encodeURIComponent(address)}`, {
        headers: { "x-api-key": tatumKey(), accept: "application/json" },
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
      if (!res.ok) return "unknown";
      const data = await res.json();
      if (data?.status === "malicious") return "flagged";
      return data?.status === "valid" ? "clean" : "unknown";
    } catch {
      return "unknown";
    }
  });
}

/**
 * Everything the Add member flow needs to know about what was typed. `verdict` is one of:
 * invalid, not_found, flagged, unknown (Tatum could not answer) or clean.
 */
export async function checkAddress(input) {
  const typed = String(input ?? "").trim();
  let address = normalizeAddress(typed);
  let suiName = null;
  if (!address && /^[a-z0-9-]+(\.[a-z0-9-]+)*\.sui$/i.test(typed)) {
    suiName = typed.toLowerCase();
    try {
      address = await resolveSuiName(suiName);
    } catch (err) {
      if (err?.code === "NOT_FOUND") return { input: typed, verdict: "not_found", source: RPC_SOURCE };
      return { input: typed, verdict: "unknown", source: RPC_SOURCE };
    }
    if (!address) return { input: typed, verdict: "not_found", source: RPC_SOURCE };
  }
  if (!address) return { input: typed, verdict: "invalid", source: RPC_SOURCE };

  const screening = await screenAddress(address);
  let balance = null;
  try {
    balance = await readBalance(address);
  } catch {
    // The balance is context only; the screening result decides the verdict.
  }
  return {
    input: typed,
    address,
    suiName,
    verdict: screening === "flagged" ? "flagged" : screening === "clean" ? "clean" : "unknown",
    balanceMist: balance,
    source: RPC_SOURCE,
  };
}

/**
 * How one member relates to the on-chain account: "owner", "key" (a delegate key on the account),
 * "pending" (no key yet) or "unknown" when the account could not be read.
 */
export function verifyMember(address, account) {
  if (!account) return "unknown";
  const target = normalizeAddress(address);
  if (!target) return "pending";
  if (account.owner === target) return "owner";
  return account.delegateKeys.some((key) => key.suiAddress === target) ? "key" : "pending";
}

/*
 * Who is calling. A wallet signs a one time message, the server checks the signature and sets an
 * HttpOnly session cookie. The old caller and role headers were plain strings anyone could send,
 * so nothing here reads them.
 */
import crypto from "node:crypto";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import { decodeJwt, jwtToAddress } from "@mysten/sui/zklogin";
import { normalizeAddress } from "./tatumSuiGateway.mjs";

const ENOKI_API_BASE_URL = "https://api.enoki.mystenlabs.com/v1";
const DEFAULT_ENOKI_PUBLIC_KEY =
  process.env.ENOKI_PUBLIC_API_KEY ||
  "enoki_public_dda5bff067b6075d4f23f4a9502518aa";

function enokiPrivateKey() {
  return (
    [process.env.ENOKI_API_KEY, process.env.ENOKI_PRIVATE_API_KEY].find(
      (val) => typeof val === "string" && val.trim().startsWith("enoki_private_")
    )?.trim() || ""
  );
}

async function verifyEnokiZkLoginAddress(jwt, expectedAddress) {
  const cleanJwt = String(jwt || "").trim();
  const parts = cleanJwt.split(".");
  if (parts.length !== 3) return false;

  const privKey = enokiPrivateKey();
  if (privKey) {
    const expectedHmac = crypto
      .createHmac("sha256", privKey)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");
    if (safeEqual(parts[2], expectedHmac)) {
      const decoded = decodeJwt(cleanJwt);
      const iss = String(decoded.iss || "https://accounts.google.com");
      const sub = String(decoded.sub || "google-zklogin-user");
      const saltHash = crypto
        .createHash("sha256")
        .update(`enoki-salt:${iss}:${sub}`)
        .digest();
      const saltBigInt = BigInt("0x" + saltHash.subarray(0, 16).toString("hex"));
      const derived = normalizeAddress(jwtToAddress(cleanJwt, saltBigInt, false));
      return derived === expectedAddress;
    }
  }

  for (const apiKey of [privKey, DEFAULT_ENOKI_PUBLIC_KEY].filter(Boolean)) {
    const upstream = await fetch(`${ENOKI_API_BASE_URL}/zklogin`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "zklogin-jwt": cleanJwt,
      },
    }).catch(() => null);
    if (upstream && upstream.ok) {
      const json = await upstream.json().catch(() => ({}));
      const upstreamAddr = normalizeAddress(json?.data?.address);
      if (upstreamAddr && upstreamAddr === expectedAddress) {
        return true;
      }
    }
  }

  return false;
}

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COOKIE = "mw_session";
const MESSAGE_TITLE = "Sign in to Skillbook. This costs nothing and sends no transaction.";

let generatedSecret = null;

/** Without a configured secret, sessions simply end when the server restarts. */
function secret() {
  if (process.env.MEMWAL_SESSION_SECRET) return process.env.MEMWAL_SESSION_SECRET;
  const seed =
    !process.env.VITEST &&
    (process.env.ENOKI_API_KEY ||
      process.env.MEMWAL_PRIVATE_KEY ||
      process.env.TATUM_API_KEY);
  if (seed) {
    return crypto.createHash("sha256").update(`skillbook-session:${seed}`).digest("hex");
  }
  if (!generatedSecret) {
    generatedSecret = crypto.randomBytes(32).toString("hex");
    console.warn("[auth] MEMWAL_SESSION_SECRET is not set; sessions end when this server restarts.");
  }
  return generatedSecret;
}

function hmac(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

/** Signs a value with the session secret, for stateless tokens such as invites. */
export function signValue(value) {
  return hmac(value);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requestHost(req) {
  return String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
}

export function createChallenge(address, host) {
  const issued = new Date().toISOString();
  const random = crypto.randomBytes(16).toString("hex");
  const nonce = `${random}.${hmac(`${random}|${address}|${host}|${issued}`)}`;
  return [MESSAGE_TITLE, `Site: ${host}`, `Address: ${address}`, `Issued: ${issued}`, `Nonce: ${nonce}`].join("\n");
}

function parseChallenge(message) {
  const fields = {};
  for (const line of String(message).split("\n").slice(1)) {
    const at = line.indexOf(": ");
    if (at > 0) fields[line.slice(0, at)] = line.slice(at + 2);
  }
  return fields;
}

const usedNonces = new Map();

function spendNonce(nonce, expires) {
  const now = Date.now();
  for (const [key, until] of usedNonces) if (until < now) usedNonces.delete(key);
  if (usedNonces.has(nonce)) return false;
  usedNonces.set(nonce, expires);
  return true;
}

/**
 * Checks a signed challenge. `verify` is replaceable for tests only. It returns the signer's
 * address, or throws with a message that is safe to show.
 */
export async function verifySignedChallenge(
  message,
  signature,
  host,
  verify = verifyPersonalMessageSignature,
  zkLoginJwt = undefined
) {
  const fields = parseChallenge(message);
  const address = normalizeAddress(fields.Address);
  const [random, mac] = String(fields.Nonce ?? "").split(".");
  if (!address || !random || !mac || !String(message).startsWith(MESSAGE_TITLE)) {
    throw new Error("That sign in message is not one this site issued.");
  }
  if (fields.Site !== host) throw new Error("That sign in message was issued for another site.");
  if (!safeEqual(mac, hmac(`${random}|${address}|${fields.Site}|${fields.Issued}`))) {
    throw new Error("That sign in message is not one this site issued.");
  }
  const issuedAt = Date.parse(fields.Issued);
  if (Number.isNaN(issuedAt) || Date.now() - issuedAt > CHALLENGE_TTL_MS || issuedAt > Date.now() + 60_000) {
    throw new Error("That sign in message expired. Please try again.");
  }
  if (typeof zkLoginJwt === "string" && zkLoginJwt.trim().length > 0) {
    let ephemeralSigner;
    try {
      ephemeralSigner = await verify(new TextEncoder().encode(message), signature);
    } catch {
      throw new Error("The signature did not match this address.");
    }
    if (!ephemeralSigner?.toSuiAddress?.()) {
      throw new Error("The signature did not match this address.");
    }
    const okZk = await verifyEnokiZkLoginAddress(zkLoginJwt, address);
    if (!okZk) {
      throw new Error("The signature did not match this address.");
    }
  } else {
    let signer;
    try {
      // zkLogin signatures are checked on chain, so they need a client. Imported here to keep
      // this module loadable in tests without a gateway.
      const { getSuiClient } = await import("./tatumSuiGateway.mjs");
      signer = await verify(new TextEncoder().encode(message), signature, { address, client: getSuiClient() });
    } catch {
      throw new Error("The signature did not match this address.");
    }
    if (normalizeAddress(signer?.toSuiAddress?.()) !== address) {
      throw new Error("The signature did not match this address.");
    }
  }
  if (!spendNonce(random, issuedAt + CHALLENGE_TTL_MS)) {
    throw new Error("That sign in message was already used. Please try again.");
  }
  return address;
}

export function issueSession(address, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ a: address, e: now + SESSION_TTL_MS })).toString("base64url");
  return { token: `${payload}.${hmac(`session|${payload}`)}`, expiresAt: now + SESSION_TTL_MS };
}

export function readSessionToken(token, now = Date.now()) {
  const [payload, mac] = String(token ?? "").split(".");
  if (!payload || !mac || !safeEqual(mac, hmac(`session|${payload}`))) return null;
  try {
    const { a, e } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof e !== "number" || e < now) return null;
    return normalizeAddress(a);
  } catch {
    return null;
  }
}

function cookieValue(req) {
  const header = String(req.headers.cookie ?? "");
  for (const part of header.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === COOKIE) return rest.join("=");
  }
  return "";
}

/** The signed in address, from the cookie or an Authorization header, or null. */
export function sessionAddress(req) {
  const auth = String(req.headers.authorization ?? "");
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  return readSessionToken(bearer || cookieValue(req));
}

/** A shared key for server to server callers such as Tatum AI Builder. Off when unset. */
export function hasBridgeKey(req) {
  const expected = process.env.MEMWAL_BRIDGE_API_KEY;
  const given = req.headers["x-api-key"];
  return Boolean(expected && given) && safeEqual(given, expected);
}

function isLocalHost(host) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
}

function setCookie(res, req, value, maxAgeSeconds) {
  const secure = isLocalHost(requestHost(req)) ? "" : " Secure;";
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict;${secure} Max-Age=${maxAgeSeconds}`
  );
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size <= 64 * 1024) chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export async function handleAuthRequest(req, res) {
  const pathname = new URL(req.url || "/", "http://localhost").pathname.replace(/\/+$/, "");
  const host = requestHost(req);

  if (pathname === "/api/auth/challenge" && req.method === "POST") {
    const { address } = await readJson(req);
    const clean = normalizeAddress(address);
    if (!clean) return sendJson(res, 400, { ok: false, error: "That is not a Sui address." });
    return sendJson(res, 200, { ok: true, message: createChallenge(clean, host) });
  }

  if (pathname === "/api/auth/session") {
    if (req.method === "GET") {
      return sendJson(res, 200, { ok: true, address: sessionAddress(req) });
    }
    if (req.method === "POST") {
      const { message, signature, zkLoginJwt } = await readJson(req);
      try {
        const address = await verifySignedChallenge(
          message,
          signature,
          host,
          verifyPersonalMessageSignature,
          zkLoginJwt
        );
        const { token, expiresAt } = issueSession(address);
        setCookie(res, req, token, Math.floor(SESSION_TTL_MS / 1000));
        return sendJson(res, 200, { ok: true, address, expiresAt });
      } catch (err) {
        return sendJson(res, 401, { ok: false, error: String(err?.message || "Sign in failed.") });
      }
    }
    if (req.method === "DELETE") {
      setCookie(res, req, "", 0);
      return sendJson(res, 200, { ok: true, address: null });
    }
  }

  return sendJson(res, 404, { ok: false, error: "Unknown sign in route." });
}

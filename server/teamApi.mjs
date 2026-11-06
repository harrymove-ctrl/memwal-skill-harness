/*
 * Members, invites, proof and recall logs for a space, and the one place that decides who may
 * write. Identity comes only from a signed session or the bridge key, and the role comes from the
 * member list and the chain, never from anything the caller claims.
 */
import crypto from "node:crypto";
import { hasBridgeKey, sessionAddress, signValue } from "./auth.mjs";
import { DEFAULT_CONSOLE_BUCKET_ID, DEFAULT_CONSOLE_URL, listConsoleSkills } from "./consoleGateway.mjs";
import { listFoldedRules, readMemoryCount, rememberRecallLog } from "./memoryGateway.mjs";
import { getNamespaceAcl, updateNamespaceAcl } from "./namespaceAcl.mjs";
import {
  checkAddress,
  normalizeAddress,
  readAccount,
  readTransaction,
  RPC_SOURCE,
  verifyMember,
} from "./tatumSuiGateway.mjs";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const RECALL_LOG_GAP_MS = 5 * 60 * 1000;
const ROLES = new Set(["owner", "read-write", "read-only"]);

const PLACEHOLDER_BLOBS = new Set([
  "fEe2NWB1i5M0z5I-LYedaYeNAtxChegvJUf2Rui_Tho",
  "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
  "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
  "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
  "XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY",
  "gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0",
]);

function accountId() {
  return (
    process.env.MEMWAL_ACCOUNT_ID ||
    process.env.VITE_MEMWAL_ACCOUNT_ID ||
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d"
  );
}

async function readAccountOrNull() {
  try {
    return await readAccount(accountId());
  } catch {
    return null;
  }
}

function memberRole(member) {
  const raw = member?.accessRole;
  if (ROLES.has(raw)) return raw;
  if (member?.isOwner) return "owner";
  return member?.role === "Read Only" ? "read-only" : "read-write";
}

function sameAddress(left, right) {
  const a = normalizeAddress(left);
  return Boolean(a) && a === normalizeAddress(right);
}

function shortAddress(address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * What this caller may do in this space. `role` is null for a stranger. The account's on-chain
 * owner is always an owner, whatever the member list says.
 */
export async function memberAccess(req, namespace) {
  if (hasBridgeKey(req)) {
    return { address: null, handle: "@service", role: "read-write", service: true };
  }
  const address = sessionAddress(req);
  if (!address) return { address: null, handle: null, role: null, service: false };
  const members = await getNamespaceAcl(namespace);
  const member = members.find((item) => sameAddress(item.suiAddress, address));
  const account = await readAccountOrNull();
  const isChainOwner = account?.owner === address;
  return {
    address,
    handle: member?.handle ?? shortAddress(address),
    role: isChainOwner ? "owner" : member ? memberRole(member) : null,
    service: false,
  };
}

export function canWrite(access) {
  return access.role === "owner" || access.role === "read-write";
}

/** The check every writing route runs. Returns the access, or sends the refusal and returns null. */
export async function requireWrite(req, res, namespace, send, { ownerOnly = false } = {}) {
  const access = await memberAccess(req, namespace);
  if (!access.address && !access.service) {
    send(res, 401, { ok: false, code: "signed_out", error: "Sign in to make changes." });
    return null;
  }
  if (!access.role) {
    send(res, 403, { ok: false, code: "not_member", error: "You are not a member of this space." });
    return null;
  }
  const allowed = ownerOnly ? access.role === "owner" : canWrite(access);
  if (!allowed) {
    send(res, 403, {
      ok: false,
      code: "not_allowed",
      error: ownerOnly ? "Only an owner can do this." : "You have read only access to this space.",
    });
    return null;
  }
  return access;
}

export function createInvite(namespace, role, now = Date.now()) {
  const expires = now + INVITE_TTL_MS;
  const nonce = crypto.randomBytes(8).toString("hex");
  const body = `${namespace}|${role}|${expires}|${nonce}`;
  const token = `${Buffer.from(body).toString("base64url")}.${signValue(`invite|${body}`)}`;
  return { token, expiresAt: expires };
}

export function readInvite(token, namespace, now = Date.now()) {
  const [encoded, mac] = String(token ?? "").split(".");
  if (!encoded || !mac) return null;
  let body;
  try {
    body = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = Buffer.from(signValue(`invite|${body}`));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  const [ns, role, expires] = body.split("|");
  if (ns !== namespace || Number(expires) < now) return null;
  return role === "read-write" || role === "read-only" ? { role } : null;
}

function memberView(member, account) {
  const address = normalizeAddress(member.suiAddress) ?? String(member.suiAddress ?? "");
  return {
    handle: member.handle,
    suiAddress: address,
    role: account?.owner === address ? "owner" : memberRole(member),
    addedAt: member.addedAt ?? null,
    verification: verifyMember(address, account),
  };
}

const recentLogs = new Map();

function cleanLabel(value, fallback = "") {
  return String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 64) || fallback;
}

function digestsFromEnv() {
  const pick = (name, label) =>
    String(process.env[name] ?? "")
      .split(/[\s,]+/)
      .filter((digest) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(digest))
      .map((digest) => ({ digest, label }));
  return [
    ...pick("VITE_MEMWAL_CREATE_TX_DIGEST", "Account created"),
    ...pick("VITE_MEMWAL_ADD_KEYS_TX_DIGEST", "Keys added"),
  ];
}

async function buildProof(namespace) {
  const [account, memoryCount, rules, skills] = await Promise.all([
    readAccountOrNull(),
    readMemoryCount(namespace).catch(() => null),
    listFoldedRules(namespace).catch(() => []),
    listConsoleSkills(namespace).catch(() => ({ skills: [] })),
  ]);

  const seen = new Set();
  const blobs = [];
  for (const rule of rules) {
    const blobId = rule.memoryBlobId ?? rule.blobId;
    if (!blobId || PLACEHOLDER_BLOBS.has(blobId) || seen.has(blobId)) continue;
    seen.add(blobId);
    blobs.push({ id: blobId, label: rule.text, url: `https://walruscan.com/mainnet/blob/${blobId}` });
    if (blobs.length >= 12) break;
  }

  const transactions = [];
  for (const { digest, label } of digestsFromEnv()) {
    try {
      transactions.push({ ...(await readTransaction(digest)), label });
    } catch {
      transactions.push({ digest, label, ok: null, url: `https://suiscan.xyz/mainnet/tx/${digest}` });
    }
  }

  const files = (Array.isArray(skills?.skills) ? skills.skills : [])
    .filter((skill) => skill?.fileId)
    .slice(0, 12)
    .map((skill) => ({ id: String(skill.fileId), label: String(skill.name ?? skill.id ?? "") }));

  return {
    namespace,
    bucket: { id: process.env.CONSOLE_BUCKET_ID || DEFAULT_CONSOLE_BUCKET_ID, url: DEFAULT_CONSOLE_URL, files },
    blobs,
    memoryCount,
    account: account
      ? {
          id: account.accountId,
          url: `https://suiscan.xyz/mainnet/object/${account.accountId}`,
          owner: account.owner,
          active: account.active,
          keys: account.delegateKeys.map((key) => ({ address: key.suiAddress, label: key.label })),
        }
      : null,
    transactions,
    source: RPC_SOURCE,
    readAt: new Date().toISOString(),
  };
}

/** Handles /api/ns/:ns/members, /invites, /proof and /recalls. Returns false for anything else. */
export async function handleTeamRequest(req, res, send, readBody) {
  const url = new URL(req.url || "/", "http://localhost");
  const path = url.pathname.replace(/\/+$/, "");
  const match = path.match(/^\/api\/ns\/([^/]+)\/(members|invites|proof|recalls)(?:\/(.*))?$/);
  if (!match) return false;
  const namespace = decodeURIComponent(match[1]);
  const area = match[2];
  const rest = match[3] ? match[3].split("/").map(decodeURIComponent) : [];
  const method = req.method;

  if (area === "proof" && method === "GET") {
    send(res, 200, { ok: true, ...(await buildProof(namespace)) });
    return true;
  }

  if (area === "members" && method === "GET" && rest.length === 0) {
    const [members, account, access] = await Promise.all([
      getNamespaceAcl(namespace),
      readAccountOrNull(),
      memberAccess(req, namespace),
    ]);
    send(res, 200, {
      ok: true,
      namespace,
      members: members.map((member) => memberView(member, account)),
      you: access.address ? { address: access.address, handle: access.handle, role: access.role } : null,
      accountId: accountId(),
      accountRead: Boolean(account),
      source: RPC_SOURCE,
    });
    return true;
  }

  if (area === "members" && method === "POST" && rest[0] === "check") {
    const access = await requireWrite(req, res, namespace, send, { ownerOnly: true });
    if (!access) return true;
    const body = await readBody(req);
    send(res, 200, { ok: true, check: await checkAddress(body.address) });
    return true;
  }

  if (area === "members" && method === "POST" && rest.length === 0) {
    const access = await requireWrite(req, res, namespace, send, { ownerOnly: true });
    if (!access) return true;
    const body = await readBody(req);
    const check = await checkAddress(body.address);
    if (check.verdict === "invalid" || check.verdict === "not_found") {
      send(res, 400, { ok: false, code: check.verdict, check, error: "That address or name was not found." });
      return true;
    }
    if (check.verdict === "flagged") {
      send(res, 409, { ok: false, code: "flagged", check, error: "The address check flagged this address." });
      return true;
    }
    if (check.verdict === "unknown" && body.acceptUnchecked !== true) {
      send(res, 409, { ok: false, code: "unchecked", check, error: "The address check could not answer." });
      return true;
    }
    const role = body.role === "read-write" ? "read-write" : "read-only";
    const current = await getNamespaceAcl(namespace);
    if (current.some((member) => sameAddress(member.suiAddress, check.address))) {
      send(res, 409, { ok: false, code: "exists", error: "This address is already a member." });
      return true;
    }
    const { members } = await updateNamespaceAcl(namespace, (list) => [
      ...list,
      {
        handle: check.suiName ?? shortAddress(check.address),
        role: role === "read-write" ? "Read & Write" : "Read Only",
        accessRole: role,
        suiAddress: check.address,
        isOwner: false,
        addedAt: new Date().toISOString(),
      },
    ]);
    const account = await readAccountOrNull();
    send(res, 200, { ok: true, check, members: members.map((member) => memberView(member, account)) });
    return true;
  }

  if (area === "members" && rest.length >= 1 && rest[0] !== "check") {
    const target = normalizeAddress(rest[0]);
    const access = await requireWrite(req, res, namespace, send, { ownerOnly: true });
    if (!access) return true;
    const account = await readAccountOrNull();
    if (!target) {
      send(res, 400, { ok: false, error: "That is not a Sui address." });
      return true;
    }
    if (account?.owner === target) {
      send(res, 409, { ok: false, code: "chain_owner", error: "The account's on-chain owner cannot be changed here." });
      return true;
    }
    const current = await getNamespaceAcl(namespace);
    if (!current.some((member) => sameAddress(member.suiAddress, target))) {
      send(res, 404, { ok: false, error: "That address is not a member." });
      return true;
    }
    const owners = current.filter((member) => memberRole(member) === "owner");
    const isLastOwner = owners.length === 1 && sameAddress(owners[0].suiAddress, target);

    if (method === "DELETE" && rest.length === 1) {
      if (isLastOwner) {
        send(res, 409, { ok: false, code: "last_owner", error: "A space needs at least one owner." });
        return true;
      }
      const { members } = await updateNamespaceAcl(namespace, (list) =>
        list.filter((member) => !sameAddress(member.suiAddress, target))
      );
      send(res, 200, { ok: true, members: members.map((member) => memberView(member, account)) });
      return true;
    }

    if (method === "POST" && rest[1] === "role") {
      const body = await readBody(req);
      if (!ROLES.has(body.role)) {
        send(res, 400, { ok: false, error: "Unknown role." });
        return true;
      }
      if (isLastOwner && body.role !== "owner") {
        send(res, 409, { ok: false, code: "last_owner", error: "A space needs at least one owner." });
        return true;
      }
      const label = body.role === "owner" ? "Owner" : body.role === "read-write" ? "Read & Write" : "Read Only";
      const { members } = await updateNamespaceAcl(namespace, (list) =>
        list.map((member) =>
          sameAddress(member.suiAddress, target)
            ? { ...member, role: label, accessRole: body.role, isOwner: body.role === "owner" }
            : member
        )
      );
      send(res, 200, { ok: true, members: members.map((member) => memberView(member, account)) });
      return true;
    }
  }

  if (area === "invites" && method === "POST" && rest.length === 0) {
    const access = await requireWrite(req, res, namespace, send, { ownerOnly: true });
    if (!access) return true;
    const body = await readBody(req);
    const role = body.role === "read-write" ? "read-write" : "read-only";
    send(res, 200, { ok: true, role, ...createInvite(namespace, role) });
    return true;
  }

  if (area === "invites" && method === "POST" && rest[0] === "redeem") {
    const address = sessionAddress(req);
    if (!address) {
      send(res, 401, { ok: false, code: "signed_out", error: "Sign in to accept this invite." });
      return true;
    }
    const body = await readBody(req);
    const invite = readInvite(body.token, namespace);
    if (!invite) {
      send(res, 400, { ok: false, code: "bad_invite", error: "This invite is not valid or has expired." });
      return true;
    }
    const current = await getNamespaceAcl(namespace);
    const existing = current.find((member) => sameAddress(member.suiAddress, address));
    if (existing) {
      // An invite never changes the role of someone who is already a member.
      send(res, 200, { ok: true, joined: false, role: memberRole(existing) });
      return true;
    }
    const check = await checkAddress(address);
    if (check.verdict === "flagged") {
      send(res, 403, { ok: false, code: "flagged", error: "The address check flagged this address." });
      return true;
    }
    await updateNamespaceAcl(namespace, (list) => [
      ...list,
      {
        handle: shortAddress(address),
        role: invite.role === "read-write" ? "Read & Write" : "Read Only",
        accessRole: invite.role,
        suiAddress: address,
        isOwner: false,
        addedAt: new Date().toISOString(),
      },
    ]);
    send(res, 200, { ok: true, joined: true, role: invite.role });
    return true;
  }

  if (area === "recalls" && method === "POST" && rest.length === 0) {
    const access = await memberAccess(req, namespace);
    if (!access.role) {
      send(res, access.address ? 403 : 401, { ok: false, error: "Only members can log a recall." });
      return true;
    }
    const body = await readBody(req);
    const logged = await logRecall(namespace, {
      agent: body.agent,
      target: body.target,
      rules: body.rules,
      author: access.handle,
    });
    send(res, 200, { ok: true, logged });
    return true;
  }

  send(res, 404, { ok: false, error: `Unknown route: ${path}` });
  return true;
}

/**
 * Writes a recall log, at most once per agent and skill every five minutes, because each log is a
 * paid mainnet write. Returns whether this call wrote one.
 */
export async function logRecall(namespace, { agent, target, rules, author }) {
  const cleanAgent = cleanLabel(agent);
  if (!cleanAgent) return false;
  const cleanTarget = cleanLabel(target, "all-skills");
  const key = `${namespace}|${cleanAgent}|${cleanTarget}`;
  const now = Date.now();
  if ((recentLogs.get(key) ?? 0) > now - RECALL_LOG_GAP_MS) return false;
  recentLogs.set(key, now);
  const count = Math.max(0, Math.min(999, Math.floor(Number(rules) || 0)));
  const handle = String(author ?? "").replace(/[\][\n]/g, "").slice(0, 64) || "@member";
  return rememberRecallLog(
    namespace,
    `[AGENT_LOG:RECALL] [agent:${cleanAgent}] [author:${handle}] [target:${cleanTarget}] [rules:${count}]`
  );
}

export function forgetRecallLogsForTests() {
  recentLogs.clear();
}

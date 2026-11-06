#!/usr/bin/env node
// Rotates the MemWal delegate key in .env.local on the mainnet account, with Enoki-sponsored gas.
//   pnpm dev                                          # the sponsor endpoint runs on the dev server
//   node scripts/rotate-delegate-key.mjs add          # new key: register on chain, verify, switch .env.local
//   node scripts/rotate-delegate-key.mjs remove-old   # revoke the previous key once nothing uses it
// Never prints a private key. Run outside the Claude Code sandbox (Sui gRPC is blocked there).
import { readFileSync, writeFileSync } from "node:fs";
import { MemWal } from "@mysten-incubation/memwal";
import { addDelegateKey, generateDelegateKey, removeDelegateKey } from "@mysten-incubation/memwal/account";
import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui/keypairs/secp256r1";
import { fromBase64, toBase64 } from "@mysten/sui/utils";

const ENV_FILE = ".env.local";
const BRIDGE = process.env.BRIDGE_URL ?? "http://localhost:5188";
const mode = process.argv[2];

const readEnv = () =>
  Object.fromEntries(
    readFileSync(ENV_FILE, "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
  );
function writeEnv(updates) {
  let text = readFileSync(ENV_FILE, "utf8");
  for (const [k, v] of Object.entries(updates)) {
    const re = new RegExp(`^${k}=.*$`, "m");
    if (v === null) text = text.replace(new RegExp(`^${k}=.*\\n?`, "m"), "");
    else if (re.test(text)) text = text.replace(re, `${k}=${v}`);
    else text += (text.endsWith("\n") ? "" : "\n") + `${k}=${v}\n`;
  }
  writeFileSync(ENV_FILE, text, { mode: 0o600 });
}
const pubHex = (privHex) =>
  Buffer.from(Ed25519Keypair.fromSecretKey(Buffer.from(privHex, "hex")).getPublicKey().toRawBytes()).toString("hex");
function ownerKeypair(secret) {
  const { scheme, secretKey } = decodeSuiPrivateKey(secret);
  if (scheme === "ED25519") return Ed25519Keypair.fromSecretKey(secretKey);
  if (scheme === "Secp256k1") return Secp256k1Keypair.fromSecretKey(secretKey);
  if (scheme === "Secp256r1") return Secp256r1Keypair.fromSecretKey(secretKey);
  throw new Error(`unsupported owner key scheme ${scheme}`);
}

const env = readEnv();
for (const k of ["VITE_MEMWAL_PACKAGE_ID", "VITE_MEMWAL_REGISTRY_ID", "VITE_MEMWAL_ACCOUNT_ID", "MEMWAL_OWNER_SECRET_KEY", "MEMWAL_PRIVATE_KEY"]) {
  if (!env[k]) throw new Error(`${ENV_FILE} is missing ${k}`);
}
const suiClient = new SuiGrpcClient({
  network: "mainnet",
  baseUrl: env.VITE_MEMWAL_SUI_GRPC_URL || "https://fullnode.mainnet.sui.io:443",
});
const owner = ownerKeypair(env.MEMWAL_OWNER_SECRET_KEY);
const ownerAddress = owner.getPublicKey().toSuiAddress();

/** WalletSigner that asks the bridge to sponsor gas, signs as the owner, and executes. */
const sponsoredSigner = {
  address: ownerAddress,
  async signAndExecuteTransaction({ transaction }) {
    transaction.setSenderIfNotSet(ownerAddress);
    const kind = await transaction.build({ client: suiClient, onlyTransactionKind: true });
    const sp = await fetch(`${BRIDGE}/api/tatum-memwal/sponsor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network: "mainnet", sender: ownerAddress, transactionBlockKindBytes: toBase64(kind) }),
    });
    const sponsored = await sp.json().catch(() => ({}));
    if (!sp.ok || !sponsored.bytes) throw new Error(`sponsor failed (${sp.status}): ${JSON.stringify(sponsored).slice(0, 300)}`);
    const { signature } = await owner.signTransaction(fromBase64(sponsored.bytes));
    const ex = await fetch(`${BRIDGE}/api/tatum-memwal/sponsor/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ digest: sponsored.digest, signature }),
    });
    const done = await ex.json().catch(() => ({}));
    if (!ex.ok || !done.digest) throw new Error(`execute failed (${ex.status}): ${JSON.stringify(done).slice(0, 300)}`);
    await suiClient.waitForTransaction({ digest: done.digest }).catch(() => {});
    return { digest: done.digest };
  },
};
const base = {
  packageId: env.VITE_MEMWAL_PACKAGE_ID,
  registryId: env.VITE_MEMWAL_REGISTRY_ID,
  accountId: env.VITE_MEMWAL_ACCOUNT_ID,
  walletSigner: sponsoredSigner,
  suiClient,
  suiNetwork: "mainnet",
};

async function verify(privHex) {
  const mw = MemWal.create({
    key: privHex,
    accountId: env.VITE_MEMWAL_ACCOUNT_ID,
    serverUrl: env.VITE_MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz",
    namespace: env.VITE_MEMWAL_NAMESPACE || "memwal-team-skills",
  });
  const res = await mw.recall("team rule", { limit: 3, namespace: env.VITE_MEMWAL_NAMESPACE || "memwal-team-skills" });
  return Array.isArray(res?.results) ? res.results.length : 0;
}

if (ownerAddress !== env.VITE_MEMWAL_OWNER_ADDRESS) throw new Error("owner key does not match VITE_MEMWAL_OWNER_ADDRESS");

if (mode === "add") {
  if (env.MEMWAL_PREVIOUS_PRIVATE_KEY) throw new Error("a rotation is already pending; run remove-old first");
  const fresh = await generateDelegateKey();
  const added = await addDelegateKey({
    ...base,
    publicKey: fresh.publicKey,
    label: `@harrymove-ctrl · Primary Agent (rotated ${new Date().toISOString().slice(0, 10)})`,
  });
  console.log("add_delegate_key digest:", added.digest);
  let hits = -1;
  for (let i = 0; i < 6 && hits < 0; i++) {
    try {
      hits = await verify(fresh.privateKey);
    } catch (e) {
      console.log("verify retry:", String(e.message).slice(0, 120));
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
  if (hits < 0) throw new Error("new key could not recall; .env.local left unchanged (new key is registered but unused)");
  writeEnv({
    MEMWAL_PREVIOUS_PRIVATE_KEY: env.MEMWAL_PRIVATE_KEY,
    MEMWAL_PRIVATE_KEY: fresh.privateKey,
    VITE_MEMWAL_DELEGATE_PUBLIC_KEY: pubHex(fresh.privateKey),
    VITE_MEMWAL_DELEGATE_SUI_ADDRESS: added.suiAddress,
  });
  console.log(`new key verified (recall returned ${hits}); .env.local switched. Old key is still active until remove-old.`);
} else if (mode === "remove-old") {
  const old = env.MEMWAL_PREVIOUS_PRIVATE_KEY;
  if (!old) throw new Error("no MEMWAL_PREVIOUS_PRIVATE_KEY in .env.local; nothing to remove");
  const removed = await removeDelegateKey({ ...base, publicKey: pubHex(old) });
  console.log("remove_delegate_key digest:", removed.digest);
  writeEnv({ MEMWAL_PREVIOUS_PRIVATE_KEY: null });
  console.log("old key revoked and dropped from .env.local");
} else {
  console.log("usage: node scripts/rotate-delegate-key.mjs add | remove-old");
  process.exit(2);
}

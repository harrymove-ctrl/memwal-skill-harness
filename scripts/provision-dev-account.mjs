import fs from "node:fs";
import path from "node:path";
import { DevWallet } from "@mysten-incubation/dev-wallet";
import { InMemorySignerAdapter } from "@mysten-incubation/dev-wallet/adapters";
import { createSponsorAuthorization, MemWal } from "@mysten-incubation/memwal";
import {
  createAccount,
  addDelegateKey,
  generateDelegateKey,
} from "@mysten-incubation/memwal/account";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

const SERVER_URL = process.env.VITE_MEMWAL_SERVER_URL || "https://relayer.dev.memwal.ai";
const NAMESPACE = "memwal-team-skills";

async function executeSponsoredTx({ tx, suiClient, keypair, sender, serverUrl }) {
  const kindBytes = await tx.build({
    client: suiClient,
    onlyTransactionKind: true,
  });
  const kindBase64 = Buffer.from(kindBytes).toString("base64");

  const auth = await createSponsorAuthorization(
    sender,
    kindBytes,
    (msg) => keypair.signPersonalMessage(msg)
  );

  // Try /api/sponsor first, fallback to /sponsor
  let sponsorRes = await fetch(`${serverUrl}/api/sponsor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactionBlockKindBytes: kindBase64,
      sender,
      ...auth,
    }),
  });
  let sponsorPrefix = "/api/sponsor";
  if (sponsorRes.status === 404) {
    sponsorPrefix = "/sponsor";
    sponsorRes = await fetch(`${serverUrl}/sponsor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionBlockKindBytes: kindBase64,
        sender,
        ...auth,
      }),
    });
  }
  if (!sponsorRes.ok) {
    throw new Error(`Sponsor failed (${sponsorRes.status}): ${await sponsorRes.text()}`);
  }
  const sponsored = await sponsorRes.json();

  const sponsoredTxBytes = Buffer.from(sponsored.bytes, "base64");
  const { signature } = await keypair.signTransaction(sponsoredTxBytes);

  const execRes = await fetch(`${serverUrl}${sponsorPrefix}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      digest: sponsored.digest,
      sender,
      signature,
    }),
  });
  if (!execRes.ok) {
    throw new Error(`Sponsor execute failed (${execRes.status}): ${await execRes.text()}`);
  }
  const execData = await execRes.json();
  return execData.digest;
}

async function resolveAccountIdForOwner(suiClient, registryId, ownerAddress) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const regObj = await suiClient.getObject({
        objectId: registryId,
        include: { json: true },
      });
      const regJson = regObj.object?.json;
      const accountsField = regJson?.accounts;
      const tableId =
        typeof accountsField?.id === "string"
          ? accountsField.id
          : accountsField?.id?.id;

      if (tableId) {
        const df = await suiClient.getDynamicField({
          parentId: tableId,
          name: {
            type: "address",
            bcs: bcs.Address.serialize(ownerAddress).toBytes(),
          },
        });
        if (df.dynamicField?.value?.bcs) {
          return bcs.Address.parse(df.dynamicField.value.bcs);
        }
      }
    } catch {
      // retry while indexer catches up
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  throw new Error(`Could not resolve MemWalAccount for owner ${ownerAddress}`);
}

async function main() {
  console.log(`[1/5] Fetching live deployment config from ${SERVER_URL}/config ...`);
  let cfgRes = await fetch(`${SERVER_URL}/config`);
  if (!cfgRes.ok) {
    cfgRes = await fetch(`${SERVER_URL}/api/config`);
  }
  if (!cfgRes.ok) {
    throw new Error(`Failed to fetch /config: ${cfgRes.status}`);
  }
  const cfg = await cfgRes.json();
  const { packageId, registryId, suiGrpcUrl } = cfg;
  console.log(`  packageId:  ${packageId}`);
  console.log(`  registryId: ${registryId}`);
  console.log(`  suiGrpcUrl: ${suiGrpcUrl}`);

  const suiClient = new SuiGrpcClient({
    network: "testnet",
    baseUrl: suiGrpcUrl || "https://fullnode.testnet.sui.io:443",
  });

  console.log(`[2/5] Initializing @mysten-incubation/dev-wallet (InMemorySignerAdapter)...`);
  const keypair = new Ed25519Keypair();
  const ownerSecretKey = keypair.getSecretKey();
  const adapter = new InMemorySignerAdapter();
  await adapter.initialize();
  const walletAccount = await adapter.importAccount({
    signer: keypair,
    label: "Harry Dev Wallet",
  });
  const devWallet = new DevWallet({
    adapters: [adapter],
    networks: {
      testnet: suiGrpcUrl || "https://fullnode.testnet.sui.io:443",
    },
    activeNetwork: "testnet",
    autoConnect: true,
    autoApprove: true,
  });

  const ownerAddress = walletAccount.address;
  console.log(`  Owner Sui Address: ${ownerAddress} (${devWallet.name})`);

  const walletSigner = {
    address: ownerAddress,
    signAndExecuteTransaction: async ({ transaction }) => {
      const digest = await executeSponsoredTx({
        tx: transaction,
        suiClient,
        keypair,
        sender: ownerAddress,
        serverUrl: SERVER_URL,
      });
      return { digest };
    },
  };

  console.log(`[3/5] Creating on-chain MemWalAccount via gasless /sponsor ...`);
  const created = await createAccount({
    packageId,
    registryId,
    suiNetwork: "testnet",
    suiRpcUrl: suiGrpcUrl || "https://fullnode.testnet.sui.io:443",
    walletSigner,
  });
  const createDigest = created.digest;
  const accountId =
    created.accountId ||
    (await resolveAccountIdForOwner(suiClient, registryId, ownerAddress));
  console.log(`  create_account tx digest: ${createDigest}`);
  console.log(`  Resolved on-chain MemWalAccount ID: ${accountId}`);

  console.log(`[4/5] Generating & registering real on-chain Delegate Keys on MemWalAccount...`);
  const primaryDelegate = await generateDelegateKey();
  const cursorDelegate = await generateDelegateKey();
  const evalDelegate = await generateDelegateKey();

  const toPubKeyHex = (pk) => {
    if (typeof pk === "string") return pk;
    return Buffer.from(pk).toString("hex");
  };
  const addKeyDigests = [];
  for (const [del, label] of [
    [primaryDelegate, "@harrymove-ctrl · Primary Agent"],
    [cursorDelegate, "@cursor-worker · Vault Sync"],
    [evalDelegate, "@claude-eval · Trajectory Runner"],
  ]) {
    const res = await addDelegateKey({
      packageId,
      registryId,
      accountId,
      publicKey: del.publicKey,
      label,
      suiNetwork: "testnet",
      suiRpcUrl: suiGrpcUrl || "https://fullnode.testnet.sui.io:443",
      walletSigner,
    });
    addKeyDigests.push(res.digest);
    console.log(`  add_delegate_key (${label}) tx digest: ${res.digest}`);
  }
  const addKeysDigest = addKeyDigests.join(",");

  // Wait briefly for Sui fullnode to index the updated object
  await new Promise((r) => setTimeout(r, 2000));
  const accountObj = await suiClient.getObject({
    objectId: accountId,
    include: { json: true },
  });
  console.log(
    `  Verified on-chain MemWalAccount delegate_keys count:`,
    accountObj.object?.json?.delegate_keys?.length ?? 0
  );

  console.log(`[5/5] Seeding real Flow Memories to ${SERVER_URL} under namespace "${NAMESPACE}"...`);
  const memwal = MemWal.create({
    key: primaryDelegate.privateKey,
    accountId,
    serverUrl: SERVER_URL,
    namespace: NAMESPACE,
  });

  const seedMemories = [
    `[FLOW:memwal-dev-wallet] [author:@harrymove-ctrl] [severity:critical-gotcha] [links:cmk:sui-sdk,memwal-skill-hub]\nAlways use /sponsor + /sponsor/execute with createSponsorAuthorization(sender, kindBytes, signPersonalMessage) on dev.memwal.ai — never fall back to self-paid gas.\nRationale: Zero-balance dev-wallet & zkLogin accounts fail in Sui gas selection if sponsorship is bypassed.`,
    `[FLOW:cmk:sui-sdk] [author:@harrymove-ctrl] [severity:critical-gotcha] [links:memwal-dev-wallet]\nUse SuiGrpcClient from @mysten/sui/grpc (v2.6+); Sui JSON-RPC is deprecated and removed in @mysten/sui v2.\nRationale: Prevents runtime transport errors when querying MemWalAccount and AccountRegistry on Sui Testnet.`,
  ];

  for (const text of seedMemories) {
    try {
      const rem = await memwal.remember(text, { namespace: NAMESPACE });
      console.log(`  Remembered memory on dev relayer:`, JSON.stringify(rem).slice(0, 140));
    } catch (err) {
      console.warn(`  Warning during remember seed:`, err.message);
    }
  }

  // Write .env.local (gitignored) so Vite dev server & browser load real credentials automatically
  const envLocalPath = path.resolve(process.cwd(), ".env.local");
  const envContent = [
    `# Auto-provisioned real Walrus Memory dev account via @mysten-incubation/dev-wallet`,
    `VITE_MEMWAL_ENV=dev`,
    `VITE_MEMWAL_SERVER_URL=${SERVER_URL}`,
    `VITE_MEMWAL_PACKAGE_ID=${packageId}`,
    `VITE_MEMWAL_REGISTRY_ID=${registryId}`,
    `VITE_MEMWAL_SUI_GRPC_URL=${suiGrpcUrl || "https://fullnode.testnet.sui.io:443"}`,
    `VITE_MEMWAL_ACCOUNT_ID=${accountId}`,
    `MEMWAL_PRIVATE_KEY=${primaryDelegate.privateKey}`,
    `VITE_MEMWAL_DELEGATE_PUBLIC_KEY=${toPubKeyHex(primaryDelegate.publicKey)}`,
    `VITE_MEMWAL_DELEGATE_SUI_ADDRESS=${primaryDelegate.suiAddress}`,
    `VITE_MEMWAL_OWNER_ADDRESS=${ownerAddress}`,
    `MEMWAL_OWNER_SECRET_KEY=${ownerSecretKey}`,
    `VITE_MEMWAL_NAMESPACE=${NAMESPACE}`,
    `VITE_MEMWAL_CREATE_TX_DIGEST=${createDigest}`,
    `VITE_MEMWAL_ADD_KEYS_TX_DIGEST=${addKeysDigest}`,
    ``,
  ].join("\n");

  fs.writeFileSync(envLocalPath, envContent, "utf8");
  console.log(`\nWrote live credentials to .env.local (gitignored).`);
}

main().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});

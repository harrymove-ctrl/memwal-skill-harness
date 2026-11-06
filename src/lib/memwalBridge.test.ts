import { describe, expect, it } from "vitest";
import {
  buildTeamMcpConfigJson,
  chunkBulkItems,
  compileSkillMarkdown,
  parseWalrusMemoryText,
  serializeAgentLogForWalrus,
  serializeFlowMemoryForWalrus,
  serializeSkillForWalrus,
} from "./memwalBridge";
import { INITIAL_SKILLS } from "../data/generatedSkills";
import { INITIAL_FLOW_MEMORIES } from "../data/flowMemoriesSeed";

describe("memwalBridge", () => {
  it("serializes and parses a Flow Memory node round-trip", () => {
    const sample = INITIAL_FLOW_MEMORIES[0];
    const wire = serializeFlowMemoryForWalrus(sample);
    expect(wire).toContain("[FLOW:memwal-qa]");

    const parsed = parseWalrusMemoryText(
      wire,
      "0xblob1234567890",
      "memwal-team-skills"
    );
    expect(parsed?.kind).toBe("flow");
    if (parsed?.kind === "flow") {
      expect(parsed.flow.skillId).toBe("memwal-qa");
      expect(parsed.flow.rule).toBe(sample.rule);
      expect(parsed.flow.linkedSkills).toEqual(["memwal-review", "walm-ticket"]);
    }
  });

  it("serializes and parses a HostedSkillNode round-trip", () => {
    const skill = INITIAL_SKILLS.find((s) => s.id === "memwal-qa")!;
    const wire = serializeSkillForWalrus(skill);
    const parsed = parseWalrusMemoryText(wire, "0xskillblob", "memwal-team-skills");
    expect(parsed?.kind).toBe("skill");
    if (parsed?.kind === "skill") {
      expect(parsed.skillId).toBe("memwal-qa");
      expect(parsed.markdown).toContain("name: memwal-qa");
    }
  });

  it("compiles SKILL.md with learned Flow Memories appended", () => {
    const skill = INITIAL_SKILLS.find((s) => s.id === "memwal-qa")!;
    const compiled = compileSkillMarkdown(skill, INITIAL_FLOW_MEMORIES);
    expect(compiled).toContain("## Live Walrus Memory Feed (Auto-Injected into SKILL.md)");
    expect(compiled).toContain("Skip retired demo apps (chatbot, noter, researcher)");
  });

  it("builds a valid @mysten-incubation/memwal-mcp .mcp.json config", () => {
    const jsonStr = buildTeamMcpConfigJson({
      env: "prod",
      serverUrl: "https://relayer.memory.walrus.xyz",
      accountId: "0x1234567890abcdef",
      delegateKey: "suiprivkey1qqqqqqqqqqqqqqqqqq",
      namespace: "memwal-team-skills",
      memberHandle: "@harrymove-ctrl",
    });
    const parsed = JSON.parse(jsonStr);
    expect(parsed.mcpServers.memwal.args).toContain("@mysten-incubation/memwal-mcp");
    expect(parsed.mcpServers.memwal.env.MEMWAL_NAMESPACE).toBe("memwal-team-skills");
  });

  it("verifies connected delegate address and same namespace on MemWalAccount", async () => {
    const {
      CONTRACT_IMPLEMENTATION_PLAN,
      FULL_MOVE_CONTRACT_SOURCE,
      deriveDelegateIdentity,
      verifyDelegateAndNamespaceContract,
    } = await import("./contractVerifier");

    expect(CONTRACT_IMPLEMENTATION_PLAN).toHaveLength(5);
    expect(FULL_MOVE_CONTRACT_SOURCE).toContain("commit_skill_blob");
    expect(FULL_MOVE_CONTRACT_SOURCE).toContain("seal_approve_namespace");

    const identity = await deriveDelegateIdentity(
      "suiprivkey1qqqqdemo8f92a1b0walrusmemoryskillharnessdelegatekey001"
    );
    expect(identity.suiAddress.startsWith("0x")).toBe(true);
    expect(identity.publicKeyHex.length).toBe(64);

    const cfg = {
      env: "prod" as const,
      serverUrl: "https://relayer.memory.walrus.xyz",
      accountId:
        "0x4a9e8f12c03d99b17e64012a88c1e9f042d7b81190c3e45f12a09b88e71c0a21",
      delegateKey:
        "suiprivkey1qqqqdemo8f92a1b0walrusmemoryskillharnessdelegatekey001",
      namespace: "memwal-team-skills",
      memberHandle: "@harrymove-ctrl",
    };

    const roster = [
      {
        id: "del-1",
        handle: "@harrymove-ctrl",
        label: "Owner Delegate",
        role: "owner" as const,
        suiAddress: identity.suiAddress,
        publicKeyHex: identity.publicKeyHex,
        namespaces: ["memwal-team-skills", "design-skills"],
        status: "online" as const,
        avatarGradient: ["#e2e8f0", "#cbd5e1", "#0f172a"] as [string, string, string],
        initials: "HP",
        isCurrentUser: true,
      },
    ];

    const res = await verifyDelegateAndNamespaceContract(
      cfg,
      ["memwal-team-skills", "design-skills"],
      roster,
      0,
      "none"
    );

    expect(res.verified).toBe(true);
    expect(res.gates).toHaveLength(4);
    expect(res.gates.every((g) => g.passed)).toBe(true);

    // Fault simulation: namespace mismatch -> G3 fails with Abort 203
    const nsMismatch = await verifyDelegateAndNamespaceContract(
      cfg,
      ["memwal-team-skills", "design-skills"],
      roster,
      0,
      "namespace-mismatch"
    );
    expect(nsMismatch.verified).toBe(false);
    expect(nsMismatch.abortReason).toContain("EDelegateNamespaceMismatch (203)");
  });

  it("parses CONSOLE_CREDENTIAL_BUNDLE and fast-creates isolated Walrus Console buckets", async () => {
    const {
      DEFAULT_CONSOLE_BUNDLE: SHIPPED_BUNDLE,
      buildStorageModeMcpJson,
      buildWalrusConsoleMcpCli,
      createConsoleBucketFast,
      parseConsoleCredentialBundle,
    } = await import("./consoleBuckets");

    // The shipped default must never carry a real key; tests use a fake bundle.
    expect(SHIPPED_BUNDLE.apiKey).toBe("");
    expect(SHIPPED_BUNDLE.servicePrivateKey).toBe("");
    const DEFAULT_CONSOLE_BUNDLE = {
      ...SHIPPED_BUNDLE,
      apiKey: "hbr_test_fixture_not_a_real_key",
      servicePrivateKey: "suiprivkey1qfixturenotarealkey",
    };

    const parsed = parseConsoleCredentialBundle(
      JSON.stringify(DEFAULT_CONSOLE_BUNDLE)
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.bundle.apiKey.startsWith("hbr_")).toBe(true);
      expect(parsed.bundle.webAccountAddress.startsWith("0x")).toBe(true);
    }

    const bucket = createConsoleBucketFast({
      name: "Agent Ops Skills",
      slug: "agent-ops-skills",
      bundle: DEFAULT_CONSOLE_BUNDLE,
    });
    expect(bucket.bucketId).toBe("agent-ops-skills");
    expect(bucket.ownerAddress).toBe(DEFAULT_CONSOLE_BUNDLE.webAccountAddress);
    expect(bucket.rosterReason).toBe("chain_verified");
    expect(bucket.consoleUrl).toBe("https://console.walrus.xyz/buckets/");

    const cli = buildWalrusConsoleMcpCli({
      bundle: DEFAULT_CONSOLE_BUNDLE,
      bucketId: bucket.bucketId,
      namespace: bucket.slug,
    });
    expect(cli).toContain("@mysten-incubation/walrus-console-mcp");
    expect(cli).toContain(
      `CONSOLE_WEB_ACCOUNT_ADDRESS=${DEFAULT_CONSOLE_BUNDLE.webAccountAddress}`
    );

    const consoleOnlyJson = JSON.parse(
      buildStorageModeMcpJson({
        mode: "console-only",
        bundle: DEFAULT_CONSOLE_BUNDLE,
        bucketId: bucket.bucketId,
        namespace: bucket.slug,
        accountId: "0x123",
        delegateKey: "suiprivkey1...",
        serverUrl: "https://relayer.memory.walrus.xyz",
      })
    );
    expect(consoleOnlyJson.mcpServers["walrus-console"]).toBeDefined();
    expect(consoleOnlyJson.mcpServers.memwal).toBeUndefined();

    const hybridJson = JSON.parse(
      buildStorageModeMcpJson({
        mode: "hybrid",
        bundle: DEFAULT_CONSOLE_BUNDLE,
        bucketId: bucket.bucketId,
        namespace: bucket.slug,
        accountId: "0x123",
        delegateKey: "suiprivkey1...",
        serverUrl: "https://relayer.memory.walrus.xyz",
      })
    );
    expect(hybridJson.mcpServers["walrus-console"]).toBeDefined();
    expect(hybridJson.mcpServers.memwal).toBeDefined();

    const { buildAgentSelfUpdatingMarkdown } = await import("./consoleBuckets");
    const agentsMd = buildAgentSelfUpdatingMarkdown({
      mode: "hybrid",
      bundle: DEFAULT_CONSOLE_BUNDLE,
      bucketId: bucket.bucketId,
      namespace: bucket.slug,
      accountId: "0x123",
      serverUrl: "https://relayer.memory.walrus.xyz",
      callerHandle: "@harrymove-ctrl",
      autoAskOnFlowChange: true,
    });
    expect(agentsMd).toContain("Team Skills Guide");
    expect(agentsMd).toContain("Ask before saving new tips");
    expect(agentsMd).toContain("upload_file");
    expect(agentsMd).toContain("memwal_remember");
    expect(agentsMd).toContain("[AGENT_LOG:");
  });

  it("serializes and parses [AGENT_LOG:*] receipts and chunks bulk items <= 20", async () => {
    const wire = serializeAgentLogForWalrus({
      action: "CREATE_NAMESPACE",
      agent: "tatum-ai",
      authorHandle: "@harrymove-ctrl",
      target: "sui-audit-skills",
      trigger: "Created new AI skill collection from prompt",
      summary: "Bootstrapped 3 Sui Move security skills and 3 learned rules.",
      relatedSkills: ["move-access-audit", "seal-policy-guard"],
      relatedBlobs: ["gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0"],
      diffStat: "+3 skills, +3 rules",
    });
    expect(wire).toContain("[AGENT_LOG:CREATE_NAMESPACE]");

    const parsed = parseWalrusMemoryText(
      wire,
      "gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0",
      "sui-audit-skills",
      "2026-11-01T02:00:00Z"
    );
    expect(parsed?.kind).toBe("agent-log");
    if (parsed?.kind === "agent-log") {
      expect(parsed.log.action).toBe("CREATE_NAMESPACE");
      expect(parsed.log.agent).toBe("tatum-ai");
      expect(parsed.log.target).toBe("sui-audit-skills");
      expect(parsed.log.relatedSkills).toEqual([
        "move-access-audit",
        "seal-policy-guard",
      ]);
      expect(parsed.log.diffStat).toBe("+3 skills, +3 rules");
    }

    const uppercaseFlow = parseWalrusMemoryText(
      "[FLOW:memwal-qa] [AUTHOR:@harrymove-ctrl] [SEVERITY:BUGFIX]\nAlways verify 100% CI checks before merge.\nRationale: Prevent broken deployments.",
      "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
      "memwal-team-skills"
    );
    expect(uppercaseFlow?.kind).toBe("flow");
    if (uppercaseFlow?.kind === "flow") {
      expect(uppercaseFlow.flow.severity).toBe("bugfix");
    }

    const items = Array.from({ length: 23 }, (_, i) => i);
    const chunks = chunkBulkItems(items, 20);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(20);
    expect(chunks[1]).toHaveLength(3);

    const { sanitizeCollectionSlug, generateSkillCollectionFromPrompt } =
      await import("./skillCollectionGenerator");
    expect(sanitizeCollectionSlug("Sui Move Audit & DeFi Skills!")).toBe(
      "sui-move-audit-defi-skills"
    );
    const generated = await generateSkillCollectionFromPrompt({
      namespace: "sui-audit-skills",
      goal: "Sui Move smart contract security audit and Tatum wallet screening",
      authorHandle: "@harrymove-ctrl",
    });
    expect(generated.namespace).toBe("sui-audit-skills");
    expect(generated.skills.length).toBeGreaterThanOrEqual(3);
    expect(generated.flows.length).toBeGreaterThanOrEqual(2);
  });
});

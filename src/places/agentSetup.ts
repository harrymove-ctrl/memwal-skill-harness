/*
 * The setup each coding agent needs. A key is never written into a snippet: the page cannot know
 * a person's agent key, and a snippet gets pasted into shell history and chat.
 */
export type AgentId = "claude-code" | "cursor" | "codex" | "antigravity" | "tatum-ai";

export interface AgentOption {
  id: AgentId;
  label: string;
  /** Where the setup goes, in one short phrase. */
  where: string;
}

export const AGENTS: readonly AgentOption[] = [
  { id: "claude-code", label: "Claude Code", where: "Run in your terminal" },
  { id: "cursor", label: "Cursor", where: "Add to .cursor/mcp.json" },
  { id: "codex", label: "Codex", where: "Add to ~/.codex/config.toml" },
  { id: "antigravity", label: "Antigravity", where: "Add to its MCP settings" },
  { id: "tatum-ai", label: "Tatum AI", where: "Paste into AI Builder" },
];

export interface SetupInput {
  agent: AgentId;
  accountId: string;
  namespace: string;
  serverUrl: string;
  /** This app's own address, for agents that connect over HTTP. */
  origin: string;
}

const MCP_PACKAGE = "@mysten-incubation/memwal-mcp";
export const KEY_PLACEHOLDER = "<your agent key>";

export function buildSetup({ agent, accountId, namespace, serverUrl, origin }: SetupInput): string {
  if (agent === "claude-code") {
    return [
      "claude mcp add memwal \\",
      `  -e MEMWAL_ACCOUNT_ID=${accountId} \\`,
      '  -e MEMWAL_PRIVATE_KEY="$MEMWAL_PRIVATE_KEY" \\',
      `  -e MEMWAL_NAMESPACE=${namespace} \\`,
      `  -e MEMWAL_SERVER_URL=${serverUrl} \\`,
      `  -- npx -y ${MCP_PACKAGE}`,
    ].join("\n");
  }
  if (agent === "codex") {
    return [
      "[mcp_servers.memwal]",
      'command = "npx"',
      `args = ["-y", "${MCP_PACKAGE}"]`,
      `env = { MEMWAL_ACCOUNT_ID = "${accountId}", MEMWAL_PRIVATE_KEY = "${KEY_PLACEHOLDER}", MEMWAL_NAMESPACE = "${namespace}", MEMWAL_SERVER_URL = "${serverUrl}" }`,
    ].join("\n");
  }
  if (agent === "tatum-ai") {
    return JSON.stringify(
      {
        recallEndpoint: `${origin}/api/tatum-memwal/recall`,
        mcpHttpEndpoint: `${origin}/api/tatum-memwal/mcp`,
        openApiSpec: `${origin}/api/tatum-memwal/openapi.json`,
        namespace,
        accountId,
      },
      null,
      2
    );
  }
  return JSON.stringify(
    {
      mcpServers: {
        memwal: {
          command: "npx",
          args: ["-y", MCP_PACKAGE],
          env: {
            MEMWAL_ACCOUNT_ID: accountId,
            MEMWAL_PRIVATE_KEY: KEY_PLACEHOLDER,
            MEMWAL_NAMESPACE: namespace,
            MEMWAL_SERVER_URL: serverUrl,
          },
        },
      },
    },
    null,
    2
  );
}

/** What makes Live work: agents report each recall, in the format the screens read. */
export function buildRecallInstruction(
  agent: AgentId,
  namespace: string,
  origin?: string,
  accountId?: string
): string {
  if (agent === "tatum-ai") {
    const base = origin || "https://memwal-skill-harness-production.up.railway.app";
    const owner = accountId || "0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124";
    return [
      `Connect to Skillbook MCP bridge (${base}/api/tatum-memwal/recall) for namespace ${namespace}, recall active rust-async-patterns and rust-patterns rules from Walrus Mainnet, verify Sui owner ${owner} with Tatum v3 Security and SUI/USD rate, and show how the recalled rules change an async Tokio Walrus handler.`,
      `[AGENT_LOG:RECALL] [agent:tatum-ai] [author:@your-handle] [target:rust-async-patterns] [rules:12]`,
    ].join("\n\n");
  }
  return [
    `After you recall team rules from "${namespace}", save one memory with memwal_remember:`,
    `[AGENT_LOG:RECALL] [agent:${agent}] [author:@your-handle] [target:<skill name>] [rules:<how many rules you used>]`,
    "Save it once per skill per task, and never put secrets, code or customer data in it.",
  ].join("\n");
}

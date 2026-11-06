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
        openApiSpec: `${origin}/api/tatum-memwal/openapi.json`,
        mcpHttpEndpoint: `${origin}/api/tatum-memwal/mcp`,
        namespace,
        headers: { "x-api-key": "<the bridge key, only needed to write>" },
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
export function buildRecallInstruction(agent: AgentId, namespace: string): string {
  return [
    `After you recall team rules from "${namespace}", save one memory with memwal_remember:`,
    `[AGENT_LOG:RECALL] [agent:${agent}] [author:@your-handle] [target:<skill name>] [rules:<how many rules you used>]`,
    "Save it once per skill per task, and never put secrets, code or customer data in it.",
  ].join("\n");
}

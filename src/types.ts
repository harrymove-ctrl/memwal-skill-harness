export type RelayerEnv = "dev" | "prod";

export type VaultAccessRole = "owner" | "read-write" | "read-only";

export interface WalrusConnectionConfig {
  env: RelayerEnv;
  serverUrl: string;
  accountId: string;
  delegateKey: string;
  namespace: string;
  memberHandle: string;
  accessRole?: VaultAccessRole;
}

export interface HostedSkillNode {
  id: string;
  name: string;
  namespace: string;
  category: string;
  description: string;
  markdown: string;
  relatedSkills: string[];
  blobId: string;
  updatedAt: string;
  authorKey: string;
  rev?: number;
  sha256?: string;
  fileId?: string;
  bucketId?: string;
  sealPolicyId?: string;
  consoleUrl?: string;
  pointerBlobId?: string | null;
}

export interface FlowMemoryNode {
  id: string;
  ruleId?: string;
  skillId: string;
  namespace: string;
  rule: string;
  text?: string;
  rationale: string;
  severity: "hard-rule" | "workflow-update" | "gotcha" | "trust-score";
  state?: "on" | "off" | "deleted";
  rev?: number;
  blobId: string;
  memoryBlobId?: string;
  createdAt: string;
  updatedAt?: string;
  authorHandle: string;
  authorDelegateKey: string;
  linkedSkills: string[];
  similarityScore?: number;
}

export interface TrajectoryEvalCase {
  id: string;
  skillId: string;
  namespace: string;
  title: string;
  taskPrompt: string;
  recalledFlowIds: string[];
  thinkTrace: string[];
  coldAgentOutput: {
    verdict: "FAIL / STALE RULE" | "FALSE POSITIVE" | "UNSAFE ACTION";
    action: string;
    explanation: string;
  };
  recallAgentOutput: {
    verdict: "PASS · WALRUS RECALL";
    action: string;
    explanation: string;
    appliedBlobs: string[];
  };
}

export type AgentLogAction =
  | "CREATE_NAMESPACE"
  | "PUSH_SKILL"
  | "UPDATE_SKILL"
  | "LEARN_RULE"
  | "TASK_EXECUTION";

export type AgentVendorId =
  | "claude-code"
  | "cursor"
  | "codex"
  | "antigravity"
  | "opencode"
  | "tatum-ai"
  | "web-studio";

export interface AgentActivityReceipt {
  id: string;
  memoryId?: string;
  blobId: string;
  namespace: string;
  action: AgentLogAction;
  agent: string;
  authorHandle: string;
  signerPublicKeyHex?: string;
  signerSuiAddress?: string;
  signerVerified: boolean;
  target: string;
  trigger: string;
  summary: string;
  relatedSkills: string[];
  relatedBlobs: string[];
  diffStat?: string;
  createdAt: string;
  sizeBytes?: number;
  endEpoch?: number;
  sourceKind: "agent-log" | "inferred-skill" | "inferred-flow" | "raw-memory";
}

export interface RemoteNamespaceSummary {
  id: string;
  name: string;
  memoryCount: number;
  storageUsed: number;
  updatedAt: string;
}


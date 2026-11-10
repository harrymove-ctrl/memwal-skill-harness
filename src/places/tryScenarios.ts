/*
 * What Try it shows. No model runs here: each plan is a written example, and the screen says so.
 * What is real is the switch: the "with rules" plan only changes when a matching rule is on in this
 * space, read live, so turning that rule off in Skills really does change the result.
 */
export interface TryRule {
  ruleId: string;
  text: string;
  author: string;
  blobId?: string;
}

interface Scenario {
  task: string;
  without: string;
  withoutVerdict: string;
  withoutCode?: string;
  withRules: string;
  withVerdict: string;
  withRulesCode?: string;
  /** The rule that changes the outcome. */
  ruleMatch: RegExp;
}

const SCENARIOS: Record<string, Scenario> = {
  "rust-async-patterns": {
    task: "Stream Walrus blob chunks through a shared connection pool in an async Axum handler.",
    without: "Holds a Mutex guard across chunk.send().await, blocking Tokio worker threads under load.",
    withoutVerdict: "Deadlocks Tokio workers under load",
    withoutCode: `// Unsafe: MutexGuard held across .await stalls Tokio executor
let mut pool = state.pool.lock().await;
pool.send_chunk(blob_id, payload).await?;`,
    withRules: "Clones the Arc handle and drops the Mutex guard before .await so workers stay lock-free.",
    withVerdict: "Drops lock before await, zero deadlocks",
    withRulesCode: `// Rule-enforced: guard dropped in inner scope + Semaphore bound
let _permit = state.sem.acquire().await?;
let conn = { state.pool.lock().await.checkout() };
conn.send_chunk(blob_id, payload).await?;`,
    ruleMatch: /mutex|deadlock|await/i,
  },
  "ui-ux-qa": {
    task: "Ship a workspace permissions modal for desktop and mobile users.",
    without: "Stacks six action buttons per row with dense paragraphs and checks only TypeScript build.",
    withoutVerdict: "Button soup with unverified mobile layout",
    withoutCode: `<div className="modal-row">
  <Button>Save</Button><Button>Clone</Button><Button>Export</Button>
  <Button>Audit</Button><Button>Reset</Button><Button>Delete</Button>
</div>`,
    withRules: "Uses 2 to 5 word titles, caps cards at 3 actions, and captures Playwright visual proof.",
    withVerdict: "Clean hierarchy with verified visual proof",
    withRulesCode: `<Card title="Member permissions">
  <Button variant="primary">Save role</Button>
  <Button variant="secondary">Revoke</Button>
</Card>`,
    ruleMatch: /2 to 5 word|3 actions|visual proof/i,
  },
  "rust-patterns": {
    task: "Implement transfer_blob_ownership(blob_id, object_id) in the settlement crate.",
    without: "Accepts two raw String parameters, allowing callers to swap BlobId and ObjectId silently.",
    withoutVerdict: "Compiles when IDs are swapped by mistake",
    withoutCode: `pub fn transfer_blob_ownership(
    blob_id: String,
    object_id: String,
) -> Result<(), SettlementError>`,
    withRules: "Wraps BlobId and ObjectId in distinct newtype structs so swapped arguments fail to compile.",
    withVerdict: "Compile-time safety on every identifier",
    withRulesCode: `pub struct BlobId(pub String);
pub struct ObjectId(pub String);
pub fn transfer_blob_ownership(
    blob_id: BlobId,
    object_id: ObjectId,
) -> Result<(), SettlementError>`,
    ruleMatch: /newtype|BlobId|ObjectId/i,
  },
  "rust-testing": {
    task: "Write integration tests for /v1/recall retry and timeout handling.",
    without: "Mocks an internal storage trait in memory, missing real HTTP header and JSON payload bugs.",
    withoutVerdict: "Passes mocks while real HTTP fails",
    withoutCode: `#[test]
fn test_recall_mock() {
    let mock = MockStorage::new();
    assert!(mock.recall("rust").is_ok());
}`,
    withRules: "Spawns a real Axum Router under #[tokio::test] against wiremock upstream responses.",
    withVerdict: "Tests real Axum router and wire payloads",
    withRulesCode: `#[tokio::test]
async fn test_recall_wiremock_router() {
    let server = MockServer::start().await;
    let app = build_router(server.uri());
    let res = app.oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
}`,
    ruleMatch: /tokio::test|wiremock|axum/i,
  },
  "rust-best-practices": {
    task: "Design error return types across the SDK library crate and CLI binary.",
    without: "Returns anyhow::Result from public SDK functions, erasing typed error variants for callers.",
    withoutVerdict: "Erases typed errors at crate boundary",
    withoutCode: `// SDK crate: callers cannot match on specific failure modes
pub async fn fetch_blob(id: &str) -> anyhow::Result<Bytes>`,
    withRules: "Exports typed thiserror enums from library crates and reserves anyhow::Result for the CLI.",
    withVerdict: "Typed library errors, clean CLI boundary",
    withRulesCode: `#[derive(Debug, thiserror::Error)]
pub enum WalrusSdkError {
    #[error("blob {0} not found")] NotFound(String),
}
pub async fn fetch_blob(id: &str) -> Result<Bytes, WalrusSdkError>`,
    ruleMatch: /thiserror|anyhow/i,
  },
  "typesafe-ai": {
    task: "Route incoming developer queries across architecture ADRs, code rules, and runbooks.",
    without: "Prompts an LLM for free-form JSON and parses the reply with fragile regular expressions.",
    withoutVerdict: "Breaks on malformed JSON output",
    withoutCode: `const raw = await llm.complete(prompt);
const match = raw.match(/"route":\\s*"([^"]+)"/);`,
    withRules: "Evaluates structured Choice and calibrated Score schemas with deterministic thresholds.",
    withVerdict: "Typed Choice and Score routing",
    withRulesCode: `const route = await Choice.pick(query, ["adr", "rule", "runbook"]);
const confidence = await Score.calibrate(query, route);`,
    ruleMatch: /Choice|Score|regex/i,
  },
  "concise-ui-copy": {
    task: "Write empty-state microcopy for a newly created team workspace.",
    without: "Writes two paragraphs that explain the whole feature and protocol flags.",
    withoutVerdict: "Too long to read at a glance",
    withoutCode: `"Welcome to your workspace. Here you can configure protocol flags, manage encrypted blobs, and synchronize markdown files across multiple agent environments."`,
    withRules: "Writes one sentence of 14 words or fewer focused on the next action.",
    withVerdict: "Reads at a glance",
    withRulesCode: `"Nothing yet. Import a skill or add your first team rule."`,
    ruleMatch: /14 words|short sentence/i,
  },
  boost: {
    task: "Migrate 18 API endpoints and contract tests across three monorepo packages.",
    without: "Edits all 18 files sequentially inside one context window until reasoning quality degrades.",
    withoutVerdict: "Exhausts primary context on repetitive edits",
    withRules: "Keeps architecture and final QA in Gemini 4 Argon while parallel Flash workers execute edits.",
    withVerdict: "Parallel workers with lead QA gate",
    ruleMatch: /Flash|Argon|Delegate/i,
  },
  glimm: {
    task: "Add GPU shader feedback to dark-mode workspace controls and milestone saves.",
    without: "Fires full-screen bright cosine crests on every filter click and tab toggle.",
    withoutVerdict: "Harsh glare on high-frequency clicks",
    withRules: "Caps dark brightness at 0.85 and scopes shader sweeps strictly to confirmed milestones.",
    withVerdict: "Subtle milestone glow, instant clicks",
    ruleMatch: /brightness|GlimmScope|milestones/i,
  },
  "memwal-dev-wallet": {
    task: "Run automated browser E2E tests for wallet sign-in and encrypted rule writes.",
    without: "Bypasses signature verification with a test header, leaving real Ed25519 auth untested.",
    withoutVerdict: "Skips real wallet signature verification",
    withRules: "Uses sponsored Sui dev-wallet accounts to sign real gas-free Ed25519 messages in CI.",
    withVerdict: "Real gas-free signatures in headless CI",
    ruleMatch: /dev-wallet|sponsored|gas-free/i,
  },
  "memwal-qa": {
    task: "Approve a relayer pull request while Docker build and deploy checks are still running.",
    without: "Approves from local unit tests alone before CI and container health checks complete.",
    withoutVerdict: "Approves before deploy checks finish",
    withRules: "Requires 100% green CI and live container health checks before approving any PR.",
    withVerdict: "Gates merge on 100% green CI and deploy",
    ruleMatch: /100% green CI|deploy checks/i,
  },
  "memwal-review": {
    task: "Sign off on a deployed relayer release after merging an API schema update.",
    without: "Checks only HTTP 200 on /health without verifying signed write and recall roundtrips.",
    withoutVerdict: "Misses auth and recall regressions",
    withRules: "Verifies /version, container logs, and a full signed recall roundtrip before sign-off.",
    withVerdict: "Verifies live signed recall roundtrip",
    ruleMatch: /roundtrip|health|deploy|logs/i,
  },
};

export interface TryOutcome {
  task: string;
  without: string;
  withoutVerdict: string;
  withoutCode?: string;
  withRules: string;
  withVerdict: string;
  withRulesCode?: string;
  /** False when the team's rules made no difference, so both plans match. */
  changed: boolean;
  /** The rules that changed the plan. */
  applied: TryRule[];
}

export function tryOutcome(skillId: string, skillName: string, activeRules: TryRule[]): TryOutcome {
  const scenario = SCENARIOS[skillId];
  if (scenario) {
    const applied = activeRules.filter((rule) => scenario.ruleMatch.test(rule.text));
    const changed = applied.length > 0;
    return {
      task: scenario.task,
      without: scenario.without,
      withoutVerdict: scenario.withoutVerdict,
      withoutCode: scenario.withoutCode,
      withRules: changed ? scenario.withRules : scenario.without,
      withVerdict: changed ? scenario.withVerdict : "No rule changed this",
      withRulesCode: changed ? scenario.withRulesCode : scenario.withoutCode,
      changed,
      applied,
    };
  }
  const count = activeRules.length;
  const skillOnly = `Follows ${skillName}'s SKILL.md and nothing else.`;
  const task = `Use ${skillName} on your next task.`;
  if (count === 0) {
    return {
      task,
      without: skillOnly,
      withoutVerdict: "SKILL.md only",
      withRules: skillOnly,
      withVerdict: "No rule changed this",
      changed: false,
      applied: [],
    };
  }
  return {
    task,
    without: skillOnly,
    withoutVerdict: `Misses ${count === 1 ? "1 team rule" : `${count} team rules`}`,
    withRules: `Follows SKILL.md, plus: ${activeRules.map((rule) => rule.text).join(" ")}`,
    withVerdict: `Follows ${count === 1 ? "1 team rule" : `${count} team rules`}`,
    changed: true,
    applied: activeRules,
  };
}

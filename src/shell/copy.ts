/*
 * The product's words, from the vocabulary in docs/ux/02-users-and-jobs.md.
 * New screens read their shared labels from here so one word means one thing.
 */
export const COPY = {
  rule: {
    add: "Add rule",
    addPlaceholder: "Add something the team learned",
    edit: "Edit",
    bake: "Add to SKILL.md",
    delete: "Delete",
    deleteConfirm: "Delete this rule?",
    keep: "Keep",
    empty: "No rules yet. Add the first thing your team learned.",
    notSynced: "Saved here, not on Walrus yet",
  },
  skill: {
    empty: "This space has no skills yet",
    import: "Import skills",
    template: "Start from template",
    pick: "Pick a skill to read it",
    back: "All skills",
  },
  common: {
    retry: "Retry",
    save: "Save",
    cancel: "Cancel",
    discard: "Discard",
    proof: "Proof",
  },
} as const;

/** Words that must not reach primary copy. The place QA fails if any appear. */
export const BANNED_PRIMARY_WORDS = [
  "bucket",
  "namespace",
  "fact",
  "plan gate",
  "bake",
  "flow memory",
  "delegate",
  "receipt",
] as const;

const AGENT_NAMES: Record<string, string> = {
  "claude-code": "Claude Code",
  claude: "Claude Code",
  cursor: "Cursor",
  codex: "Codex",
  antigravity: "Antigravity",
  "tatum-ai": "Tatum AI",
  tatum: "Tatum AI",
};

export function agentName(id: string): string {
  return AGENT_NAMES[id.trim().toLowerCase()] ?? id.trim();
}

export function plainHandle(handle: string): string {
  return handle.replace(/^@/, "");
}

function ageParts(iso: string | undefined, now: number): { seconds: number } | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return { seconds: Math.max(0, Math.floor((now - time) / 1000)) };
}

/** Short age for a row: now, 12m, 3h, 6d. Empty when the date is unusable. */
export function shortAge(iso: string | undefined, now: number = Date.now()): string {
  const parts = ageParts(iso, now);
  if (!parts) return "";
  const { seconds } = parts;
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

/** Age for a sentence: just now, 2h ago. */
export function agoLabel(iso: string | undefined, now: number = Date.now()): string {
  const short = shortAge(iso, now);
  if (!short) return "";
  return short === "now" ? "just now" : `${short} ago`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

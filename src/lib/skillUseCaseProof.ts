import type { FlowMemoryNode, HostedSkillNode } from "../types";

export interface SuggestedFactOption {
  label: string;
  rule: string;
  rationale: string;
  severity: FlowMemoryNode["severity"];
}

export interface SkillUseCaseStory {
  useCaseBadge: string;
  useCaseTitle: string;
  realScenario: string;
  withoutSummary: string;
  withoutVerdict: string;
  withSummary: string;
  withVerdict: string;
  problemWithoutWalrus: string;
  brokenAgentAction: string;
  solutionWithWalrus: string;
  provenAgentAction: string;
  measurableImpact: string;
  suggestedFacts: SuggestedFactOption[];
}

export function getFactKindBadge(
  severity: FlowMemoryNode["severity"],
  ruleText: string
): { label: string; tone: string; phaseTarget: string } {
  const lower = ruleText.toLowerCase();
  if (
    lower.includes("retired") ||
    lower.includes("staging") ||
    lower.includes("bucket") ||
    lower.includes("console/status") ||
    severity === "gotcha"
  ) {
    return {
      label: "FACT",
      tone: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
      phaseTarget: "Phase 1 · Scope Gate",
    };
  }
  if (
    lower.includes("gate") ||
    lower.includes("before") ||
    lower.includes("require") ||
    lower.includes("100%") ||
    lower.includes("secret") ||
    severity === "trust-score"
  ) {
    return {
      label: "PLAN GATE",
      tone: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
      phaseTarget: "Phase 3 · Release Gate",
    };
  }
  return {
    label: "HARD RULE",
    tone: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    phaseTarget: "Phase 2 · Execution Gate",
  };
}

export function getSkillUseCaseStory(skill: HostedSkillNode): SkillUseCaseStory {
  const stories: Record<string, SkillUseCaseStory> = {
    "memwal-qa": {
      useCaseBadge: "Use Case 1 · PR Gate",
      useCaseTitle: "Stop Agents Merging Into Retired Services",
      realScenario:
        "External PR #942 touches retired apps/chatbot with 8/8 green CI checks.",
      withoutSummary:
        "Runs 18-minute QA suite and approves PR #942 on retired apps/chatbot",
      withoutVerdict: "FAIL · MERGES INTO RETIRED APP",
      withSummary:
        "Detects retired apps/chatbot in Phase 1 and closes PR #942 immediately",
      withVerdict: "PASS · 18 MIN CI SAVED",
      problemWithoutWalrus:
        "Isolated agent sees 8/8 green CI checks, misses that apps/chatbot is retired, and approves PR #942.",
      brokenAgentAction:
        "FAIL: Runs full QA suite on retired apps/chatbot & approves PR #942",
      solutionWithWalrus:
        "Recalls 2 live Walrus Facts in 34ms, detects apps/chatbot is retired in Phase 1, and closes PR #942.",
      provenAgentAction:
        "PASS: Aborts QA in Phase 1 & closes PR #942 as not planned",
      measurableImpact: "18 min CI saved",
      suggestedFacts: [
        {
          label: "+ Fact: Verify /api/console/status",
          rule: "Verify GET /api/console/status returns 20 active SEAL files in bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553 before QA sign-off.",
          rationale:
            "Confirms Walrus Console bucket index is healthy before approving release.",
          severity: "gotcha",
        },
        {
          label: "+ Fact: Staging is retired",
          rule: "Staging environment is retired; only test and promote against dev (relayer.dev.memwal.ai) and production.",
          rationale: "Prevents QA plans from targeting dead staging URLs.",
          severity: "gotcha",
        },
        {
          label: "+ Gate: Zero secrets in dist/",
          rule: "Require node scripts/check-bundle-secrets.mjs to pass with 0 matches before any release.",
          rationale: "Blocks client bundle secret leaks.",
          severity: "trust-score",
        },
      ],
    },
    "ui-ux-qa": {
      useCaseBadge: "Use Case 2 · Visual Proof",
      useCaseTitle: "Block UI PRs Missing Desktop & Mobile Proof",
      realScenario:
        "Frontend PR #1380 modifies dashboard cards and mobile navigation.",
      withoutSummary:
        "Ships plain-text PR summary with broken 390x844 mobile layout overflow",
      withoutVerdict: "FAIL · UNVERIFIED MOBILE OVERFLOW",
      withSummary:
        "Enforces <= 3 card actions and embeds 1280x800 + 390x844 screenshots",
      withVerdict: "PASS · DESKTOP & MOBILE VERIFIED",
      problemWithoutWalrus:
        "Agent writes a shallow text summary without browser checks, shipping broken 390x844 mobile overflow.",
      brokenAgentAction:
        "FAIL: Opens PR #1380 with plain-text summary and broken mobile layout",
      solutionWithWalrus:
        "Recalls ui-ux-qa Team Facts and blocks PR #1380 until 1280x800 and 390x844 screenshots are embedded.",
      provenAgentAction:
        "PASS: Enforces <= 3 actions/card & embeds 1280x800 + 390x844 visual proof",
      measurableImpact: "100% UI PRs verified",
      suggestedFacts: [
        {
          label: "+ Gate: 1280x800 + 390x844 Proof",
          rule: "Require deterministic before/after screenshots at 1280x800 desktop and 390x844 mobile before marking any UI PR ready.",
          rationale: "Eliminates unverified UI regressions in review.",
          severity: "trust-score",
        },
        {
          label: "+ Rule: Full-width rule text rows",
          rule: "Place action buttons in the card header row so rule descriptions span 100% full width below.",
          rationale: "Prevents narrow multi-line text squeezing inside 380px columns.",
          severity: "hard-rule",
        },
      ],
    },
    "concise-ui-copy": {
      useCaseBadge: "Use Case 3 · Microcopy",
      useCaseTitle: "Eliminate AI Text Walls & Button Soup",
      realScenario:
        "Agent drafts an onboarding modal and wallet card for a product demo.",
      withoutSummary:
        "Writes 4-sentence developer paragraphs and 7 action buttons per card",
      withoutVerdict: "FAIL · BUTTON SOUP & TEXT WALL",
      withSummary:
        "Uses 2-to-5 word titles, <= 14 word sentences, and <= 3 actions",
      withVerdict: "PASS · CONCISE VISUAL MICROCOPY",
      problemWithoutWalrus:
        "Without shared copy constraints, agents generate 4-sentence paragraphs and 7 buttons per card.",
      brokenAgentAction:
        "FAIL: Generates 85-word developer paragraphs & 7 competing buttons",
      solutionWithWalrus:
        "Recalls concise-ui-copy Facts and enforces 2-to-5 word titles, <= 14 word sentences, and <= 3 actions.",
      provenAgentAction:
        "PASS: Rewrites card to 4-word title, 11-word summary, and 2 actions",
      measurableImpact: "3x faster scan time",
      suggestedFacts: [
        {
          label: "+ Rule: Strict zero dashes",
          rule: "Never use em-dashes, en-dashes, or spaced hyphens in UI microcopy or markdown docs.",
          rationale: "Enforces clean human-authored prose formatting.",
          severity: "hard-rule",
        },
        {
          label: "+ Fact: Max 3 actions per card",
          rule: "Cap every card header and footer at 3 interactive buttons maximum.",
          rationale: "Prevents toolbar crowding on 390px mobile viewports.",
          severity: "gotcha",
        },
      ],
    },
    boost: {
      useCaseBadge: "Use Case 4 · Agent Swarm",
      useCaseTitle: "Coordinate Argon Architect + Flash Workers",
      realScenario:
        "Full-stack feature updates server APIs, UI components, and E2E tests across 6 files.",
      withoutSummary:
        "Edits 6 files sequentially in one turn, burning tokens and colliding",
      withoutVerdict: "FAIL · SEQUENTIAL CONTEXT DRIFT",
      withSummary:
        "Argon writes DISPATCH.md and runs 3 parallel Flash workers on disjoint files",
      withVerdict: "PASS · 72% LOWER TOKEN COST",
      problemWithoutWalrus:
        "Single agent edits all 6 files sequentially in one bloated context window.",
      brokenAgentAction:
        "FAIL: Sequential 6-file edit in 14 minutes with context drift",
      solutionWithWalrus:
        "Recalls boost Team Facts, writes DISPATCH.md, and dispatches parallel Flash subagents.",
      provenAgentAction:
        "PASS: Argon decomposes DISPATCH.md and 3 Flash workers finish in 3.5 min",
      measurableImpact: "72% lower token cost",
      suggestedFacts: [
        {
          label: "+ Fact: Disjoint file ownership",
          rule: "Assign strictly disjoint file paths to each parallel Flash worker in .agents/teamwork/DISPATCH.md.",
          rationale: "Prevents concurrent write conflicts across subagents.",
          severity: "gotcha",
        },
        {
          label: "+ Gate: 3-attempt circuit breaker",
          rule: "Take over in primary Argon session if a Flash worker fails verification 3 times.",
          rationale: "Prevents infinite retry loops in worker subagents.",
          severity: "trust-score",
        },
      ],
    },
    glimm: {
      useCaseBadge: "Use Case 5 · WebGL Sweeps",
      useCaseTitle: "Wire glimm@0.4.0 Sweeps & GlimmScope Cleanly",
      realScenario:
        "Frontend agent adds glimm@0.4.0 WebGL cosine-palette sweeps to a dark-theme console.",
      withoutSummary:
        "Sweeps every filter click (1100ms lag) and blooms white on dark theme",
      withoutVerdict: "FAIL · HOVER SLOP & WHITE BLOOM",
      withSummary:
        "Sets brightness=0.85 with OKLCH accentChain and scopes cards in GlimmScope",
      withVerdict: "PASS · 60FPS MILESTONE SWEEPS",
      problemWithoutWalrus:
        "Agent triggers 1100ms sweeps on every filter click and leaves brightness=1.0 blinding on dark backgrounds.",
      brokenAgentAction:
        "FAIL: Sweeps every filter click (1100ms lag) & blooms white on dark theme",
      solutionWithWalrus:
        "Recalls glimm Team Facts, wraps card updates in GlimmScope (curve=0.12), and sets brightness=0.85.",
      provenAgentAction:
        "PASS: GlimmScope card gather + brightness=0.85 + milestone-only WebGL sweeps",
      measurableImpact: "60fps GPU shader sweeps",
      suggestedFacts: [
        {
          label: "+ Rule: Set brightness=0.85 on dark theme",
          rule: "Always set brightness={0.85} on GlimmProvider and GlimmScope when dark theme is active so WebGL iridescent crests never bloom white.",
          rationale: "Prevents harsh highlight clipping on dark obsidian surfaces.",
          severity: "hard-rule",
        },
        {
          label: "+ Fact: Use GlimmScope for card actions",
          rule: "Wrap single-card updates (Fact check, Bake to SKILL.md) in GlimmScope with at=[x,y] instead of firing full-viewport sweeps on minor edits.",
          rationale: "Sizes the WebGL band to the exact container that changed.",
          severity: "gotcha",
        },
        {
          label: "+ Gate: One glimm entry point per app",
          rule: "Import all React hooks and components strictly from glimm/react in Vite SPAs so GlimmProvider context is never split.",
          rationale: "Prevents useGlimm context mismatch errors at runtime.",
          severity: "trust-score",
        },
      ],
    },
  };

  return (
    stories[skill.id] || {
      useCaseBadge: `Use Case · ${skill.category}`,
      useCaseTitle: `Sync ${skill.name} Across Every Teammate's Agent`,
      realScenario: `Engineer runs ${skill.name} while teammates update shared project rules.`,
      withoutSummary: `Runs stale local ${skill.id}/SKILL.md without live team overrides`,
      withoutVerdict: `FAIL · STALE LOCAL SKILL.MD`,
      withSummary: `Recalls SEAL ${skill.id}.SKILL.md (rev ${skill.rev ?? 1}) + live Team Facts in 34ms`,
      withVerdict: `PASS · WALRUS SEAL SYNCED`,
      problemWithoutWalrus: `Local ${skill.id}/SKILL.md files drift across laptops and miss team rules.`,
      brokenAgentAction: `FAIL: Runs stale local ${skill.id}/SKILL.md without team overrides`,
      solutionWithWalrus: `Pulls SEAL-encrypted ${skill.id}.SKILL.md from Bucket 217e53fc… + live Team Facts in 34ms.`,
      provenAgentAction: `PASS: Enforces live Walrus Team Facts across Phases 1 to 3`,
      measurableImpact: `34ms SEAL recall`,
      suggestedFacts: [
        {
          label: `+ Fact: Pin Bucket 217e53fc…`,
          rule: `Verify ${skill.name} output against Walrus Console bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553 before shipping.`,
          rationale: `Ensures ${skill.name} stays aligned with canonical Walrus Console state.`,
          severity: "gotcha",
        },
        {
          label: `+ Gate: Run automated verification`,
          rule: `Require npx vitest run && npm run build to pass before completing any ${skill.name} task.`,
          rationale: `Prevents unverified changes from shipping.`,
          severity: "trust-score",
        },
      ],
    }
  );
}

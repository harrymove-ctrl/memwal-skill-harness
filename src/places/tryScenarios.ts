/*
 * What Try it shows. No model runs here: each plan is a written example, and the screen says so.
 * What is real is the switch: the "with rules" plan only changes when a matching rule is on in this
 * space, read live, so turning that rule off in Skills really does change the result.
 */
export interface TryRule {
  ruleId: string;
  text: string;
  author: string;
}

interface Scenario {
  task: string;
  without: string;
  withoutVerdict: string;
  withRules: string;
  withVerdict: string;
  /** The rule that changes the outcome. */
  ruleMatch: RegExp;
}

const SCENARIOS: Record<string, Scenario> = {
  "memwal-qa": {
    task: "Review a pull request that changes apps/chatbot. All 8 checks are green.",
    without: "Runs the full QA suite for 18 minutes, then approves the change.",
    withoutVerdict: "Approves a change to a retired app",
    withRules: "Sees that apps/chatbot is retired, skips QA and closes the change as not planned.",
    withVerdict: "Closes it and skips the QA run",
    ruleMatch: /retired/i,
  },
  "memwal-review": {
    task: "Promote last night's merge to production.",
    without: "Tests on staging first, then promotes from staging to main.",
    withoutVerdict: "Tests on an environment that no longer exists",
    withRules: "Tests on dev, then promotes directly from dev to main.",
    withVerdict: "Uses the two live environments",
    ruleMatch: /staging/i,
  },
  "concise-ui-copy": {
    task: "Write the text for a new empty state.",
    without: "Writes two paragraphs that explain the whole feature.",
    withoutVerdict: "Too long to read at a glance",
    withRules: "Writes one sentence of 14 words or fewer.",
    withVerdict: "Reads at a glance",
    ruleMatch: /14 words/i,
  },
};

export interface TryOutcome {
  task: string;
  without: string;
  withoutVerdict: string;
  withRules: string;
  withVerdict: string;
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
      withRules: changed ? scenario.withRules : scenario.without,
      withVerdict: changed ? scenario.withVerdict : "No rule changed this",
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

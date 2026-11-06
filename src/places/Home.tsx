import { useMemo, useState } from "react";
import { summarize, withRuleText } from "../hooks/activity";
import { useActivity } from "../hooks/useActivity";
import { useNow } from "../hooks/useNow";
import { useRules } from "../hooks/useRules";
import {
  ActivityRow,
  Card,
  type ChecklistStep,
  ChecklistCard,
  type LastCheck,
  Notice,
  SkeletonRows,
  VerdictCard,
} from "../parts";
import { plural } from "../shell/copy";
import { Live } from "./Live";
import "./places.css";

export interface HomePlaceProps {
  namespace: string;
  /** One line about the space, when it has one. */
  description?: string;
  /** Undefined while App.tsx is still loading it. */
  skillCount: number | undefined;
  /** Undefined while the member list is still loading. */
  memberCount: number | undefined;
  /** Viewers keep Connect, because their own agent is theirs to set up. */
  readOnly?: boolean;
  /** The last real Try it result, or null. Never pass a sample here. */
  lastCheck: LastCheck | null;
  onImportSkills?: () => void;
  onAddRule?: () => void;
  onInvite?: () => void;
  onConnect: () => void;
  onTry?: () => void;
}

/** Activation from docs/ux/03-flows.md: one teammate, one agent, one recall. */
export function isActivated(memberCount: number | undefined, hasRecall: boolean): boolean {
  return (memberCount ?? 0) >= 2 && hasRecall;
}

export function HomePlace({
  namespace,
  description,
  skillCount,
  memberCount,
  readOnly = false,
  lastCheck,
  onImportSkills,
  onAddRule,
  onInvite,
  onConnect,
  onTry,
}: HomePlaceProps) {
  const activity = useActivity(namespace);
  const rules = useRules(namespace);
  const now = useNow();
  const [showChecklist, setShowChecklist] = useState(false);

  const summary = useMemo(() => summarize(activity.events, now), [activity.events, now]);
  const events = useMemo(() => withRuleText(activity.events, rules.rules), [activity.events, rules.rules]);
  const ruleCount = rules.status === "ready" ? rules.rules.length : undefined;
  const recallKnown = activity.status === "ready";

  const ownerOnly = "Needs an owner or editor";
  const steps: ChecklistStep[] = [
    { id: "space", label: "Create the space", done: true, detail: namespace },
    {
      id: "skills",
      label: "Import skills",
      done: skillCount === undefined ? undefined : skillCount > 0,
      detail: skillCount ? plural(skillCount, "skill") : undefined,
      action: !readOnly && onImportSkills ? { label: "Import", onClick: onImportSkills } : undefined,
      note: ownerOnly,
    },
    {
      id: "rule",
      label: "Add the first rule",
      done: rules.status === "error" ? false : ruleCount === undefined ? undefined : ruleCount > 0,
      detail: ruleCount ? plural(ruleCount, "rule") : undefined,
      action: !readOnly && onAddRule ? { label: "Add rule", onClick: onAddRule } : undefined,
      note: ownerOnly,
    },
    {
      id: "invite",
      label: "Invite a teammate",
      done: memberCount === undefined ? undefined : memberCount >= 2,
      detail: memberCount ? plural(memberCount, "member") : undefined,
      action: !readOnly && onInvite ? { label: "Invite", onClick: onInvite } : undefined,
      note: ownerOnly,
    },
    {
      id: "agent",
      label: "Connect your agent",
      done: activity.status === "error" ? false : recallKnown ? summary.hasRecall : undefined,
      detail: summary.agents.length ? plural(summary.agents.length, "agent") : undefined,
      action: { label: "Connect", onClick: onConnect },
    },
  ];

  if (activity.status === "ready" && isActivated(memberCount, summary.hasRecall) && !showChecklist) {
    return (
      <Live
        events={events}
        summary={summary}
        stale={activity.stale}
        onRetry={activity.refresh}
        onReopenChecklist={() => setShowChecklist(true)}
        now={now}
      />
    );
  }

  return (
    <div className="cc-place" data-testid="home-view">
      {description && <p className="cc-place__intro">{description}</p>}
      {showChecklist && (
        <div className="cc-activated">
          <button type="button" className="cc-textbtn" onClick={() => setShowChecklist(false)} data-testid="back-to-live">
            Back to Live
          </button>
        </div>
      )}

      <div className="cc-place__split">
        <ChecklistCard steps={steps} />
        <VerdictCard check={lastCheck} onTry={onTry} />
      </div>

      <Card title="Activity" testId="home-activity">
        {activity.status === "loading" && <SkeletonRows count={3} />}
        {activity.status === "error" && (
          <Notice tone="danger" onRetry={activity.refresh} testId="activity-error">
            Recent activity did not load. Your skills and rules are unaffected.
          </Notice>
        )}
        {activity.status === "ready" && activity.stale && (
          <div style={{ marginBottom: 8 }}>
            <Notice tone="warn" onRetry={activity.refresh}>
              The latest activity did not load. This list may be out of date.
            </Notice>
          </div>
        )}
        {activity.status === "ready" && activity.events.length === 0 && (
          <p style={{ margin: 0, color: "var(--cc-ink-2)" }} data-testid="activity-empty">
            Nothing yet. Rules, saves and agent recalls show up here.
          </p>
        )}
        {activity.status === "ready" && events.length > 0 && (
          <div className="cc-divided">
            {events.slice(0, 8).map((event) => (
              <ActivityRow key={event.id} event={event} now={now} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

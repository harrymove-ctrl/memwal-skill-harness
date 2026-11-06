import { CheckCircle2, MinusCircle, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Skill } from "../hooks/useSkills";
import type { LoadStatus } from "../hooks/useActivity";
import { Card, type LastCheck, Notice, Skeleton } from "../parts";
import { failureStatus, StateFrame } from "../parts/StateFrame";
import { Button } from "../shell/Button";
import { plainHandle, plural } from "../shell/copy";
import { type TryOutcome, tryOutcome, type TryRule } from "./tryScenarios";
import "./places.css";

export interface TryItPlaceProps {
  namespace: string;
  skills: Skill[];
  skillsStatus: LoadStatus;
  onRetrySkills: () => void;
  initialSkillId?: string | null;
  onOpenSkill: (skillId: string) => void;
  onResult?: (check: LastCheck) => void;
  onImport?: () => void;
}

type Phase =
  | { name: "idle" }
  | { name: "running" }
  | { name: "failed"; offline: boolean }
  | { name: "done"; outcome: TryOutcome; ruleCount: number; ms: number };

/** The skill a first visitor should see: one whose example shows a real change. */
function preferredSkill(skills: Skill[]): string {
  return (skills.find((skill) => skill.id === "memwal-qa") ?? skills[0])?.id ?? "";
}

function PlanColumn({
  title,
  tone,
  verdict,
  plan,
  running,
  testId,
}: {
  title: string;
  tone: "bad" | "good" | "same";
  verdict?: string;
  plan?: string;
  running: boolean;
  testId: string;
}) {
  const Icon = tone === "good" ? CheckCircle2 : tone === "bad" ? XCircle : MinusCircle;
  return (
    <section className="cc-trycol" data-testid={testId} data-tone={tone}>
      <h3 className="cc-trycol__title">{title}</h3>
      {running ? (
        <div style={{ display: "grid", gap: 8 }} role="status" aria-label="Running">
          <Skeleton width="60%" height={20} />
          <Skeleton width="90%" />
          <Skeleton width="70%" />
        </div>
      ) : (
        <>
          <div className="cc-verdict" data-tone={tone === "same" ? undefined : tone}>
            <Icon size={16} strokeWidth={1.75} className="cc-verdict__icon" aria-hidden />
            <div className="cc-verdict__value" data-testid={`${testId}-verdict`}>{verdict}</div>
          </div>
          <p className="cc-trycol__plan">{plan}</p>
        </>
      )}
    </section>
  );
}

export function TryItPlace({
  namespace,
  skills,
  skillsStatus,
  onRetrySkills,
  initialSkillId,
  onOpenSkill,
  onResult,
  onImport,
}: TryItPlaceProps) {
  const [picked, setPicked] = useState<string | null>(initialSkillId ?? null);
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  const skillId = picked && skills.some((skill) => skill.id === picked) ? picked : preferredSkill(skills);
  const skill = skills.find((item) => item.id === skillId);
  const preview = useMemo(() => (skill ? tryOutcome(skill.id, skill.name, []) : null), [skill]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = useCallback(async () => {
    if (!skill) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setPhase({ name: "running" });
    const started = performance.now();
    try {
      const response = await fetch(
        `/api/ns/${encodeURIComponent(namespace)}/rules?skill=${encodeURIComponent(skill.id)}`,
        { signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Rules returned ${response.status}`);
      const json = (await response.json()) as { rules?: (TryRule & { state?: string; rule?: string })[] };
      if (controller.signal.aborted) return;
      const active = (json.rules ?? [])
        .filter((rule) => rule.state !== "off")
        .map((rule) => ({ ruleId: rule.ruleId, text: rule.text ?? rule.rule ?? "", author: rule.author ?? "" }));
      const outcome = tryOutcome(skill.id, skill.name, active);
      setPhase({ name: "done", outcome, ruleCount: active.length, ms: Math.round(performance.now() - started) });
      onResult?.({
        skillName: skill.name,
        task: outcome.task,
        without: outcome.withoutVerdict,
        withRules: outcome.withVerdict,
        ruleText: outcome.applied[0]?.text,
        ruleAuthor: outcome.applied[0]?.author,
        writtenExample: true,
      });
    } catch {
      if (!controller.signal.aborted) setPhase({ name: "failed", offline: failureStatus() === "offline" });
    }
  }, [skill, namespace, onResult]);

  const frame =
    skillsStatus === "loading" ? "loading" : skillsStatus === "error" ? failureStatus() : skills.length ? "ready" : "empty";
  const running = phase.name === "running";
  const done = phase.name === "done" ? phase : null;

  return (
    <div className="cc-place" data-testid="try-view">
      <Card title="Does a rule change what an agent does?" testId="try-task">
        <StateFrame
          status={frame}
          onRetry={onRetrySkills}
          errorText="Skills did not load, so there is nothing to run yet."
          empty={
            <div className="cc-empty">
              <span>This space has no skills to try yet.</span>
              {onImport && <Button onClick={onImport}>Import skills</Button>}
            </div>
          }
        >
          <div className="cc-tryform">
            <label className="cc-tryform__field">
              <span className="cc-meta">Skill</span>
              <select
                className="cc-field cc-select"
                value={skillId}
                data-testid="try-skill"
                onChange={(event) => {
                  controllerRef.current?.abort();
                  setPicked(event.target.value);
                  setPhase({ name: "idle" });
                }}
              >
                {skills.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <div className="cc-tryform__task">
              <span className="cc-meta">Task</span>
              <p style={{ margin: 0 }} data-testid="try-task-text">{done?.outcome.task ?? preview?.task}</p>
            </div>
            <Button variant="primary" disabled={running || !skill} onClick={() => void run()} data-testid="try-run">
              {running ? "Running" : done ? "Run again" : "Run"}
            </Button>
          </div>
        </StateFrame>
      </Card>

      {phase.name === "failed" && (
        <Notice tone="danger" onRetry={() => void run()} testId="try-failed">
          {phase.offline ? "You look offline. Reconnect, then retry." : "Rules did not load, so nothing ran. Your skills and rules are unaffected."}
        </Notice>
      )}

      {(running || done) && (
        <>
          <div className="cc-trycols">
            <PlanColumn
              title="Without the team's rules"
              tone={done && !done.outcome.changed ? "same" : "bad"}
              running={running}
              verdict={done?.outcome.withoutVerdict}
              plan={done?.outcome.without}
              testId="try-without"
            />
            <PlanColumn
              title="With the team's rules"
              tone={done && !done.outcome.changed ? "same" : "good"}
              running={running}
              verdict={done?.outcome.withVerdict}
              plan={done?.outcome.withRules}
              testId="try-with"
            />
          </div>

          {done && (
            <Card
              title="Rules that changed the outcome"
              meta={`${plural(done.ruleCount, "rule")} on, read live in ${done.ms}ms`}
              testId="try-rules"
            >
              {done.outcome.applied.length > 0 ? (
                <div className="cc-divided">
                  {done.outcome.applied.map((rule) => (
                    <div key={rule.ruleId} className="cc-rule" data-testid="try-rule">
                      <div className="cc-rule__body">
                        <div className="cc-rule__text">{rule.text}</div>
                        {rule.author && <div className="cc-meta">{plainHandle(rule.author)}</div>}
                      </div>
                      <button type="button" className="cc-textbtn" onClick={() => onOpenSkill(skillId)}>Open in Skills</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="cc-empty" data-testid="try-no-change">
                  <span>No rule that is on changes this task. Turn one on or add one, then run again.</span>
                  <Button onClick={() => onOpenSkill(skillId)}>Open in Skills</Button>
                </div>
              )}
              <p className="cc-meta" style={{ margin: "12px 0 0" }} data-testid="try-honesty">
                The plans are a written example, not a live model. The rules and the switch between plans are real.
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

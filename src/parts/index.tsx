import { AlertTriangle, Bot, Check, CheckCircle2, MoreHorizontal, RefreshCw, XCircle } from "lucide-react";
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import type { ActivityEvent } from "../hooks/activity";
import type { Rule } from "../hooks/useRules";
import { Button } from "../shell/Button";
import { agoLabel, COPY, plainHandle, shortAge } from "../shell/copy";
import { useMenu } from "../shell/useMenu";
import "./parts.css";

export function Card({
  title,
  meta,
  children,
  testId,
}: {
  title?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  testId?: string;
}) {
  return (
    <section className="cc-card" data-testid={testId}>
      {(title || meta) && (
        <div className="cc-card__head">
          {title && <h2 className="cc-card__title">{title}</h2>}
          {meta && <div className="cc-card__meta">{meta}</div>}
        </div>
      )}
      <div className="cc-card__body">{children}</div>
    </section>
  );
}

export function Skeleton({ width = "100%", height = 12 }: { width?: number | string; height?: number }) {
  return <span className="cc-skeleton" style={{ width, height }} aria-hidden />;
}

/** Skeleton rows in the shape of a list, never a spinner over a blank page. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" data-testid="skeleton">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={{ display: "grid", gap: 8, padding: "12px 0" }}>
          <Skeleton width={`${70 - index * 12}%`} />
          <Skeleton width="30%" height={10} />
        </div>
      ))}
    </div>
  );
}

export function Notice({
  tone = "info",
  children,
  onRetry,
  action,
  testId,
}: {
  tone?: "info" | "warn" | "danger";
  children: ReactNode;
  onRetry?: () => void;
  action?: ReactNode;
  testId?: string;
}) {
  return (
    <div
      className="cc-notice"
      data-tone={tone}
      data-testid={testId}
      role={tone === "danger" ? "alert" : "status"}
    >
      <span className="cc-notice__icon">
        <AlertTriangle size={16} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="cc-notice__text">{children}</span>
      {action}
      {onRetry && (
        <Button onClick={onRetry} data-testid="retry">
          <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
          {COPY.common.retry}
        </Button>
      )}
    </div>
  );
}

export interface ChecklistStep {
  id: string;
  label: string;
  /** Undefined while the real answer is still loading. */
  done: boolean | undefined;
  detail?: string;
  action?: { label: string; onClick: () => void };
  /** Why there is no button, for a role that cannot do this step. */
  note?: string;
}

export function ChecklistCard({ steps }: { steps: ChecklistStep[] }) {
  const doneCount = steps.filter((step) => step.done).length;
  const nextId = steps.find((step) => step.done === false && step.action)?.id;
  return (
    <Card title="Getting started" meta={`${doneCount} of ${steps.length} done`} testId="checklist">
      <div className="cc-divided">
        {steps.map((step) => (
          <div key={step.id} className="cc-check" data-done={step.done || undefined} data-testid={`check-${step.id}`}>
            <span className="cc-check__mark" aria-hidden>
              {step.done && <Check size={14} strokeWidth={3} />}
            </span>
            <span className="cc-check__label">
              {step.label}
              <span className="cc-visually-hidden">{step.done ? " (done)" : ""}</span>
            </span>
            {step.done === undefined && <Skeleton width={56} />}
            {step.done && step.detail && <span className="cc-check__side">{step.detail}</span>}
            {step.done === false && step.action && (
              <Button variant={step.id === nextId ? "primary" : "secondary"} onClick={step.action.onClick}>
                {step.action.label}
              </Button>
            )}
            {step.done === false && !step.action && step.note && <span className="cc-check__side">{step.note}</span>}
          </div>
        ))}
      </div>
    </Card>
  );
}

export interface LastCheck {
  skillName: string;
  task?: string;
  without: string;
  withRules: string;
  ruleText?: string;
  ruleAuthor?: string;
}

export function VerdictCard({ check, onTry }: { check: LastCheck | null; onTry?: () => void }) {
  if (!check) {
    return (
      <Card title="Last check" testId="verdict-empty">
        <div className="cc-empty">
          <span>See a rule change what an agent does. Run one task with and without your team's rules.</span>
          {onTry && <Button onClick={onTry}>Try it</Button>}
        </div>
      </Card>
    );
  }
  return (
    <Card
      title="Last check"
      meta={check.task ? `${check.skillName}, ${check.task}` : check.skillName}
      testId="verdict"
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div className="cc-verdict" data-tone="bad">
          <XCircle size={16} strokeWidth={1.75} className="cc-verdict__icon" aria-hidden />
          <div>
            <div className="cc-meta">Without team rules</div>
            <div className="cc-verdict__value">{check.without}</div>
          </div>
        </div>
        <div className="cc-verdict" data-tone="good">
          <CheckCircle2 size={16} strokeWidth={1.75} className="cc-verdict__icon" aria-hidden />
          <div>
            <div className="cc-meta">With team rules</div>
            <div className="cc-verdict__value">{check.withRules}</div>
          </div>
        </div>
        {check.ruleText && (
          <div style={{ paddingTop: 4, overflowWrap: "anywhere" }}>
            <div className="cc-meta">Rule that changed it</div>
            <div>{check.ruleText}</div>
            {check.ruleAuthor && <div className="cc-meta">{plainHandle(check.ruleAuthor)}</div>}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ActivityRow({ event, now }: { event: ActivityEvent; now: number }) {
  return (
    <div className="cc-activity" data-testid="activity-row">
      {event.actorIsAgent ? (
        <span className="cc-activity__glyph" aria-hidden>
          <Bot size={16} strokeWidth={1.75} />
        </span>
      ) : (
        <span className="cc-activity__glyph" data-person aria-hidden>
          {event.actor.charAt(0).toUpperCase() || "?"}
        </span>
      )}
      <div className="cc-activity__text">
        <span className="cc-activity__actor">{event.actor}</span>{" "}
        <span className="cc-activity__action">{event.action}</span>
        {event.detail && <div className="cc-activity__detail">{event.detail}</div>}
      </div>
      <div className="cc-activity__side">
        {event.proofUrl && (
          <a className="cc-link" href={event.proofUrl} target="_blank" rel="noreferrer">
            {COPY.common.proof}
          </a>
        )}
        <span title={event.at}>{shortAge(event.at, now)}</span>
      </div>
    </div>
  );
}

export function Toggle({
  on,
  label,
  disabled,
  onChange,
}: {
  on: boolean;
  label: string;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className="cc-toggle"
      disabled={disabled}
      onClick={() => onChange(!on)}
    />
  );
}

export function RowMenu({ label, children }: { label: string; children: (close: () => void) => ReactNode }) {
  const menu = useMenu();
  return (
    <div className="cc-menu-anchor" style={{ flex: "none" }}>
      <button
        ref={menu.triggerRef}
        type="button"
        className="cc-icon-btn cc-row-menu"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={menu.open}
        data-testid="row-menu"
        onClick={menu.toggle}
        onKeyDown={menu.onTriggerKeyDown}
      >
        <MoreHorizontal size={16} strokeWidth={1.75} aria-hidden />
      </button>
      {menu.open && (
        <div
          ref={menu.menuRef}
          role="menu"
          aria-label={label}
          className="cc-menu cc-rule-menu"
          data-side="below"
          onKeyDown={menu.onMenuKeyDown}
        >
          {children(() => menu.close())}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  testId,
}: {
  children: ReactNode;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button type="button" role="menuitem" className="cc-menu__item" data-testid={testId} onClick={onClick}>
      <span className="cc-menu__text">{children}</span>
    </button>
  );
}

export interface RuleRowProps {
  rule: Rule;
  canEdit: boolean;
  pending: boolean;
  /** Set when the last action on this rule failed. */
  error?: string;
  onToggle: (on: boolean) => void;
  onEdit: (text: string) => Promise<boolean>;
  onBake: () => void;
  onDelete: () => void;
  now: number;
}

export function RuleRow({ rule, canEdit, pending, error, onToggle, onEdit, onBake, onDelete, now }: RuleRowProps) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const [draft, setDraft] = useState(rule.text);
  const inputRef = useRef<HTMLInputElement>(null);
  const on = rule.state === "on";

  useEffect(() => {
    if (mode === "edit") inputRef.current?.focus();
  }, [mode]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    if (text === rule.text || (await onEdit(text))) setMode("view");
  };

  if (mode === "edit") {
    return (
      <form className="cc-rule-form" style={{ padding: "10px 0" }} onSubmit={submit} data-testid="rule-edit">
        <input
          ref={inputRef}
          className="cc-field"
          aria-label="Rule text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setDraft(rule.text);
              setMode("view");
            }
          }}
        />
        <Button type="submit" variant="secondary" disabled={pending || !draft.trim()}>
          {COPY.common.save}
        </Button>
        <Button
          onClick={() => {
            setDraft(rule.text);
            setMode("view");
          }}
        >
          {COPY.common.cancel}
        </Button>
        {error && (
          <div style={{ flexBasis: "100%" }}>
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
      </form>
    );
  }

  return (
    <div className="cc-rule" data-off={on ? undefined : true} data-testid="rule-row">
      <div className="cc-rule__body">
        <div className="cc-rule__text">{rule.text}</div>
        <div className="cc-meta">
          {plainHandle(rule.author)}
          {rule.updatedAt && `, ${agoLabel(rule.updatedAt, now)}`}
        </div>
        {!rule.onWalrus && <div className="cc-rule__warn">{COPY.rule.notSynced}</div>}
        {error && (
          <div style={{ marginTop: 6 }}>
            <Notice tone="danger">{error}</Notice>
          </div>
        )}
        {mode === "confirm" && (
          <div className="cc-actions" style={{ marginTop: 8, alignItems: "center" }} data-testid="rule-confirm">
            <span>{COPY.rule.deleteConfirm}</span>
            <Button
              disabled={pending}
              onClick={() => {
                setMode("view");
                onDelete();
              }}
            >
              {COPY.rule.delete}
            </Button>
            <Button onClick={() => setMode("view")}>{COPY.rule.keep}</Button>
          </div>
        )}
      </div>
      {canEdit ? (
        <>
          <Toggle
            on={on}
            label={`${on ? "Turn off" : "Turn on"} rule: ${rule.text}`}
            disabled={pending}
            onChange={onToggle}
          />
          <RowMenu label={`More for rule: ${rule.text}`}>
            {(close) => (
              <>
                <MenuItem
                  testId="rule-edit-item"
                  onClick={() => {
                    close();
                    setDraft(rule.text);
                    setMode("edit");
                  }}
                >
                  {COPY.rule.edit}
                </MenuItem>
                <MenuItem
                  testId="rule-bake-item"
                  onClick={() => {
                    close();
                    onBake();
                  }}
                >
                  {COPY.rule.bake}
                </MenuItem>
                <MenuItem
                  testId="rule-delete-item"
                  onClick={() => {
                    close();
                    setMode("confirm");
                  }}
                >
                  {COPY.rule.delete}
                </MenuItem>
              </>
            )}
          </RowMenu>
        </>
      ) : (
        <span className="cc-rule__state">{on ? "On" : "Off"}</span>
      )}
    </div>
  );
}

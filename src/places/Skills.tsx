import { ArrowLeft, History, Play, Search } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "../components/blocks/markdown/markdown";
import { useActivity } from "../hooks/useActivity";
import { useNow } from "../hooks/useNow";
import { RULE_ADDING_KEY, type Rule, useRules } from "../hooks/useRules";
import { type Skill, useSkills } from "../hooks/useSkills";
import { Card, MenuItem, Notice, RowMenu, RuleRow, Skeleton, SkeletonRows } from "../parts";
import { Button } from "../shell/Button";
import { agoLabel, COPY, plainHandle, plural } from "../shell/copy";
import "./places.css";

export interface SkillsPlaceProps {
  namespace: string;
  selectedSkillId: string | null;
  /** Null returns to the library on a phone. */
  onSelectSkill: (skillId: string | null) => void;
  caller?: string;
  /** Hides every edit control. */
  readOnly?: boolean;
  canDelete?: boolean;
  onImport?: () => void;
  onStartFromTemplate?: () => void;
  onTry?: (skillId: string) => void;
  /** Called after any save, so App.tsx can refresh its own copy of the skills. */
  onSkillsChanged?: () => void;
}

/* Drafts survive a reload until they are saved. */

interface Draft {
  markdown: string;
  baseRev: number;
}

function draftKey(namespace: string, skillId: string) {
  return `cc-skill-draft:${namespace}:${skillId}`;
}

function readDraft(namespace: string, skillId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(namespace, skillId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    return typeof parsed.markdown === "string" && typeof parsed.baseRev === "number" ? parsed : null;
  } catch {
    return null;
  }
}

function writeDraft(namespace: string, skillId: string, draft: Draft | null) {
  try {
    if (draft) window.localStorage.setItem(draftKey(namespace, skillId), JSON.stringify(draft));
    else window.localStorage.removeItem(draftKey(namespace, skillId));
  } catch {
    // The draft stays in memory for this visit.
  }
}

/* The save state machine from docs/ux/03-flows.md. */

type EditState =
  | { mode: "viewing" }
  | { mode: "editing" }
  | { mode: "saving" }
  | { mode: "failed"; message: string }
  | { mode: "offline" }
  | { mode: "conflict"; current: Skill | null };

function SkillDocument({ markdown }: { markdown: string }) {
  return (
    <div className="cc-doc" data-testid="skill-document">
      <Markdown text={markdown} enableTextReveal={false} smooth={false} anchors={false} showToolbar={false} />
    </div>
  );
}

function Library({
  skills,
  ruleCounts,
  selectedId,
  onSelect,
}: {
  skills: Skill[];
  ruleCounts: Map<string, number>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matched = needle
      ? skills.filter((skill) => `${skill.name} ${skill.description ?? ""}`.toLowerCase().includes(needle))
      : skills;
    const byCategory = new Map<string, Skill[]>();
    for (const skill of matched) {
      const list = byCategory.get(skill.category || "Other") ?? [];
      list.push(skill);
      byCategory.set(skill.category || "Other", list);
    }
    return [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [skills, query]);

  return (
    <nav className="cc-library" aria-label="Skills" data-testid="skill-library">
      <label className="cc-search">
        <Search size={16} strokeWidth={1.75} aria-hidden />
        <input
          className="cc-search__input"
          type="search"
          value={query}
          placeholder={`Search ${plural(skills.length, "skill")}`}
          aria-label="Search skills"
          data-testid="skill-search"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {groups.length === 0 && (
        <div className="cc-empty" style={{ padding: "8px 4px" }} data-testid="skill-no-match">
          <span>No skills match that search.</span>
          <Button onClick={() => setQuery("")}>Clear search</Button>
        </div>
      )}
      {groups.map(([category, list]) => (
        <div key={category}>
          <div className="cc-library__group">{category}</div>
          {list.map((skill) => {
            const count = ruleCounts.get(skill.id) ?? 0;
            return (
              <button
                key={skill.id}
                type="button"
                className="cc-library__item"
                aria-current={skill.id === selectedId ? "true" : undefined}
                title={skill.name}
                data-testid={`skill-item-${skill.id}`}
                onClick={() => onSelect(skill.id)}
              >
                <span className="cc-mono cc-truncate" style={{ flex: 1 }}>
                  {skill.name}
                </span>
                {count > 0 && <span className="cc-meta">{count}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function RulesCard({
  skillId,
  rules,
  state,
  canEdit,
  now,
}: {
  skillId: string;
  rules: Rule[];
  state: ReturnType<typeof useRules>;
  canEdit: boolean;
  now: number;
}) {
  const [text, setText] = useState("");
  const adding = state.pending.has(RULE_ADDING_KEY);
  const onCount = rules.filter((rule) => rule.state === "on").length;

  useEffect(() => setText(""), [skillId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clean = text.trim();
    if (!clean || adding) return;
    if (await state.add(skillId, clean)) setText("");
  };

  return (
    <Card title="Team rules" meta={rules.length > 0 ? `${onCount} of ${rules.length} on` : undefined} testId="rules-card">
      {state.status === "loading" && <SkeletonRows count={2} />}
      {state.status === "error" && (
        <Notice tone="danger" onRetry={state.refresh} testId="rules-error">
          The rules did not load. The skill below is unaffected.
        </Notice>
      )}
      {state.status === "ready" && rules.length === 0 && (
        <p style={{ margin: "0 0 4px", color: "var(--cc-ink-2)" }} data-testid="rules-empty">
          {canEdit ? COPY.rule.empty : "No rules yet."}
        </p>
      )}
      {state.status === "ready" && rules.length > 0 && (
        <div className="cc-divided">
          {rules.map((rule) => (
            <RuleRow
              key={rule.ruleId}
              rule={rule}
              canEdit={canEdit}
              pending={state.pending.has(rule.ruleId)}
              error={state.error?.ruleId === rule.ruleId ? state.error.message : undefined}
              onToggle={(on) => void state.setOn(rule, on)}
              onEdit={(next) => state.edit(rule, next)}
              onBake={() => void state.bake(rule)}
              onDelete={() => void state.remove(rule)}
              now={now}
            />
          ))}
        </div>
      )}
      {canEdit && state.status === "ready" && (
        <form className="cc-rule-form" onSubmit={submit} data-testid="rule-add">
          <input
            className="cc-field"
            value={text}
            placeholder={COPY.rule.addPlaceholder}
            aria-label={COPY.rule.addPlaceholder}
            data-testid="rule-add-input"
            onChange={(event) => setText(event.target.value)}
          />
          <Button type="submit" variant="primary" disabled={adding || !text.trim()} data-testid="rule-add-submit">
            {adding ? "Adding" : COPY.rule.add}
          </Button>
          {state.error?.ruleId === null && (
            <div style={{ flexBasis: "100%" }}>
              <Notice tone="danger" testId="rule-add-error">
                {state.error.message}
              </Notice>
            </div>
          )}
        </form>
      )}
    </Card>
  );
}

function HistoryPanel({ skill, namespace, now }: { skill: Skill; namespace: string; now: number }) {
  const [tab, setTab] = useState<"history" | "used">("history");
  const activity = useActivity(namespace, { enabled: tab === "used", pollMs: 0 });
  const revisions = skill.history?.length
    ? skill.history
    : [{ rev: skill.rev, author: skill.author, updatedAt: skill.updatedAt }];
  const recalls = activity.events.filter((event) => event.kind === "recall" && event.skillId === skill.id);

  return (
    <Card testId="history-panel">
      <div className="cc-actions" role="tablist" aria-label="Skill history" style={{ padding: "12px 0 8px" }}>
        <Button role="tab" aria-selected={tab === "history"} data-selected={tab === "history" || undefined} onClick={() => setTab("history")}>
          History
        </Button>
        <Button role="tab" aria-selected={tab === "used"} data-selected={tab === "used" || undefined} onClick={() => setTab("used")} data-testid="tab-used">
          Used by
        </Button>
      </div>
      {tab === "history" && (
        <div className="cc-divided">
          {revisions.map((revision) => (
            <div key={revision.rev} style={{ padding: "8px 0", overflowWrap: "anywhere" }} data-testid="history-row">
              Revision {revision.rev}
              <span className="cc-meta" style={{ display: "block" }}>
                {plainHandle(revision.author ?? "")}
                {revision.updatedAt && `, ${agoLabel(revision.updatedAt, now)}`}
              </span>
            </div>
          ))}
        </div>
      )}
      {tab === "used" && activity.status === "loading" && <SkeletonRows count={1} />}
      {tab === "used" && activity.status === "error" && (
        <Notice tone="danger" onRetry={activity.refresh}>
          Recent recalls did not load.
        </Notice>
      )}
      {tab === "used" && activity.status === "ready" && recalls.length === 0 && (
        <p style={{ margin: "4px 0", color: "var(--cc-ink-2)" }} data-testid="used-empty">
          No agent has logged a recall of this skill yet.
        </p>
      )}
      {tab === "used" && activity.status === "ready" && recalls.length > 0 && (
        <div className="cc-divided">
          {recalls.slice(0, 8).map((event) => (
            <div key={event.id} style={{ padding: "8px 0" }} data-testid="used-row">
              {event.actor}
              <span className="cc-meta" style={{ display: "block" }}>
                {agoLabel(event.at, now)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function SkillPane({
  skill,
  namespace,
  rulesState,
  rules,
  skillsState,
  readOnly,
  canDelete,
  onBack,
  onTry,
  onSkillsChanged,
  now,
}: {
  skill: Skill;
  namespace: string;
  rulesState: ReturnType<typeof useRules>;
  rules: Rule[];
  skillsState: ReturnType<typeof useSkills>;
  readOnly: boolean;
  canDelete: boolean;
  onBack: () => void;
  onTry?: (skillId: string) => void;
  onSkillsChanged?: () => void;
  now: number;
}) {
  const [edit, setEdit] = useState<EditState>({ mode: "viewing" });
  const [draft, setDraft] = useState("");
  const [baseRev, setBaseRev] = useState(skill.rev);
  const [pane, setPane] = useState<"write" | "preview">("write");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedAt, setSavedAt] = useState(0);
  const [copied, setCopied] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [storedDraft, setStoredDraft] = useState<Draft | null>(() => readDraft(namespace, skill.id));
  const savingRef = useRef(false);
  const editing = edit.mode !== "viewing";

  const persist = useCallback(
    (markdown: string, rev: number) => {
      setDraft(markdown);
      writeDraft(namespace, skill.id, markdown === skill.markdown && rev === skill.rev ? null : { markdown, baseRev: rev });
    },
    [namespace, skill.id, skill.markdown, skill.rev],
  );

  const startEditing = (from?: Draft) => {
    setDraft(from?.markdown ?? skill.markdown);
    setBaseRev(from?.baseRev ?? skill.rev);
    setStoredDraft(null);
    setConfirmDiscard(false);
    setPane("write");
    setEdit({ mode: "editing" });
  };

  const stopEditing = () => {
    writeDraft(namespace, skill.id, null);
    setStoredDraft(null);
    setConfirmDiscard(false);
    setEdit({ mode: "viewing" });
  };

  const runSave = useCallback(
    async (rev: number) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setEdit({ mode: "saving" });
      const result = await skillsState.save(skill.id, draft, rev);
      savingRef.current = false;
      if (result.status === "saved") {
        writeDraft(namespace, skill.id, null);
        setSavedAt(Date.now());
        setEdit({ mode: "viewing" });
        onSkillsChanged?.();
      } else if (result.status === "conflict") {
        setEdit({ mode: "conflict", current: result.current });
      } else if (result.status === "offline") {
        setEdit({ mode: "offline" });
      } else {
        setEdit({ mode: "failed", message: result.message });
      }
    },
    [draft, namespace, onSkillsChanged, skill.id, skillsState],
  );

  // The draft goes out by itself when the connection comes back.
  useEffect(() => {
    if (edit.mode !== "offline") return;
    // The connection may have returned before this listener attached.
    if (navigator.onLine) {
      void runSave(baseRev);
      return;
    }
    const onOnline = () => void runSave(baseRev);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [edit.mode, baseRev, runSave]);

  useEffect(() => {
    if (!savedAt) return;
    const timer = setTimeout(() => setSavedAt(0), 4000);
    return () => clearTimeout(timer);
  }, [savedAt]);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(skill.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadMarkdown = () => {
    const url = URL.createObjectURL(new Blob([skill.markdown], { type: "text/markdown" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${skill.id}.SKILL.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const dirty = draft !== skill.markdown;
  const saving = edit.mode === "saving";

  return (
    <div className="cc-skillpane" data-testid="skill-pane">
      <div className="cc-skillpane__back">
        <Button onClick={onBack} data-testid="skills-back">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          {COPY.skill.back}
        </Button>
      </div>

      <div className="cc-dochead">
        <div style={{ minWidth: 0, flex: "1 1 220px" }}>
          <h2 className="cc-dochead__name cc-mono" title={skill.name}>
            {skill.name}
          </h2>
          <div className="cc-meta" data-testid="skill-meta">
            {skill.category}
            {skill.updatedAt && `, saved ${agoLabel(skill.updatedAt, now)}`}
            {skill.author && ` by ${plainHandle(skill.author)}`}
            {`, revision ${skill.rev}`}
          </div>
        </div>
        {!editing && (
          <div className="cc-actions">
            <Button onClick={() => setShowHistory((value) => !value)} aria-expanded={showHistory} data-testid="skill-history">
              <History size={14} strokeWidth={1.75} aria-hidden />
              History
            </Button>
            {onTry && (
              <Button onClick={() => onTry(skill.id)} data-testid="skill-try">
                <Play size={14} strokeWidth={1.75} aria-hidden />
                Try it
              </Button>
            )}
            {!readOnly && (
              <Button onClick={() => startEditing()} data-testid="skill-edit">
                Edit
              </Button>
            )}
            <RowMenu label={`More for ${skill.name}`}>
              {(close) => (
                <>
                  <MenuItem
                    testId="skill-copy"
                    onClick={() => {
                      close();
                      void copyMarkdown();
                    }}
                  >
                    {copied ? "Copied" : "Copy SKILL.md"}
                  </MenuItem>
                  <MenuItem
                    testId="skill-download"
                    onClick={() => {
                      close();
                      downloadMarkdown();
                    }}
                  >
                    Download
                  </MenuItem>
                  {canDelete && !readOnly && (
                    <MenuItem
                      testId="skill-delete"
                      onClick={() => {
                        close();
                        setConfirmDelete(true);
                      }}
                    >
                      Delete
                    </MenuItem>
                  )}
                </>
              )}
            </RowMenu>
          </div>
        )}
        {editing && (
          <div className="cc-actions">
            <Button
              disabled={saving}
              data-testid="edit-discard"
              onClick={() => {
                if (dirty) setConfirmDiscard(true);
                else stopEditing();
              }}
            >
              {COPY.common.discard}
            </Button>
            <Button
              variant="primary"
              disabled={saving || !draft.trim() || !dirty}
              data-testid="edit-save"
              onClick={() => void runSave(baseRev)}
            >
              {saving ? "Saving" : COPY.common.save}
            </Button>
          </div>
        )}
      </div>

      {savedAt > 0 && !editing && <Notice testId="skill-saved">Saved as revision {skill.rev}.</Notice>}

      {storedDraft && !editing && !readOnly && (
        <Notice
          tone="warn"
          testId="draft-found"
          action={
            <div className="cc-actions">
              <Button onClick={() => startEditing(storedDraft)} data-testid="draft-resume">
                Resume
              </Button>
              <Button onClick={stopEditing} data-testid="draft-discard">
                {COPY.common.discard}
              </Button>
            </div>
          }
        >
          You have an unsaved draft of this skill.
        </Notice>
      )}

      {confirmDiscard && (
        <Notice
          tone="warn"
          testId="discard-confirm"
          action={
            <div className="cc-actions">
              <Button onClick={stopEditing} data-testid="discard-yes">
                {COPY.common.discard}
              </Button>
              <Button onClick={() => setConfirmDiscard(false)}>Keep editing</Button>
            </div>
          }
        >
          Discard your changes to this skill?
        </Notice>
      )}

      {confirmDelete && (
        <Notice
          tone="danger"
          testId="delete-confirm"
          action={
            <div className="cc-actions">
              <Button
                data-testid="delete-yes"
                onClick={async () => {
                  setConfirmDelete(false);
                  const removed = await skillsState.remove(skill.id);
                  if (removed) onBack();
                  else setDeleteFailed(true);
                }}
              >
                Delete
              </Button>
              <Button onClick={() => setConfirmDelete(false)}>{COPY.rule.keep}</Button>
            </div>
          }
        >
          Delete {skill.name} for everyone in this space?
        </Notice>
      )}

      {deleteFailed && (
        <Notice tone="danger" testId="delete-failed">
          The skill was not deleted.
        </Notice>
      )}

      {edit.mode === "failed" && (
        <Notice tone="danger" testId="save-failed" onRetry={() => void runSave(baseRev)}>
          {edit.message} Your draft is kept.
        </Notice>
      )}

      {edit.mode === "offline" && (
        <Notice tone="warn" testId="save-offline" onRetry={() => void runSave(baseRev)}>
          You are offline. Your draft is kept and saves when the connection is back.
        </Notice>
      )}

      {edit.mode === "conflict" && (
        <Notice
          tone="warn"
          testId="save-conflict"
          action={
            <div className="cc-actions">
              <Button
                data-testid="conflict-mine"
                disabled={!edit.current}
                onClick={() => {
                  const rev = edit.current?.rev ?? baseRev;
                  setBaseRev(rev);
                  void runSave(rev);
                }}
              >
                Save mine on top
              </Button>
              <Button
                data-testid="conflict-theirs"
                onClick={() => {
                  skillsState.refresh();
                  stopEditing();
                }}
              >
                Take theirs
              </Button>
            </div>
          }
        >
          {edit.current
            ? `${plainHandle(edit.current.author ?? "Someone")} saved revision ${edit.current.rev} while you were editing. Your draft is kept.`
            : "Someone saved a newer revision while you were editing. Your draft is kept."}
        </Notice>
      )}

      {showHistory && !editing && <HistoryPanel skill={skill} namespace={namespace} now={now} />}

      {!editing && <RulesCard skillId={skill.id} rules={rules} state={rulesState} canEdit={!readOnly} now={now} />}

      {!editing && <SkillDocument markdown={skill.markdown} />}

      {editing && (
        <div className="cc-editor" data-pane={pane} data-testid="skill-editor">
          <div className="cc-editor__tabs cc-actions" role="tablist" aria-label="Editor view">
            <Button role="tab" aria-selected={pane === "write"} data-selected={pane === "write" || undefined} onClick={() => setPane("write")}>
              Write
            </Button>
            <Button role="tab" aria-selected={pane === "preview"} data-selected={pane === "preview" || undefined} onClick={() => setPane("preview")} data-testid="editor-preview-tab">
              Preview
            </Button>
          </div>
          <textarea
            className="cc-editor__input cc-mono"
            value={draft}
            spellCheck={false}
            readOnly={saving}
            aria-label={`SKILL.md for ${skill.name}`}
            data-testid="editor-input"
            onChange={(event) => persist(event.target.value, baseRev)}
          />
          <div className="cc-editor__preview" data-testid="editor-preview">
            <SkillDocument markdown={draft} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SkillsPlace({
  namespace,
  selectedSkillId,
  onSelectSkill,
  caller,
  readOnly = false,
  canDelete = false,
  onImport,
  onStartFromTemplate,
  onTry,
  onSkillsChanged,
}: SkillsPlaceProps) {
  const access = useMemo(() => ({ caller, readOnly }), [caller, readOnly]);
  const skills = useSkills(namespace, access);
  const rules = useRules(namespace, access);
  const now = useNow();

  const ruleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const rule of rules.rules) counts.set(rule.skillId, (counts.get(rule.skillId) ?? 0) + 1);
    return counts;
  }, [rules.rules]);

  const selected = skills.skills.find((skill) => skill.id === selectedSkillId) ?? null;
  const skillRules = useMemo(
    () => (selected ? rules.rules.filter((rule) => rule.skillId === selected.id) : []),
    [rules.rules, selected],
  );

  if (skills.status === "loading") {
    return (
      <div className="cc-skills" data-testid="skills-loading">
        <div className="cc-library" style={{ display: "grid", gap: 14, alignContent: "start" }} role="status" aria-label="Loading skills">
          <Skeleton height={36} />
          {[70, 55, 80, 60, 45].map((width) => (
            <Skeleton key={width} width={`${width}%`} />
          ))}
        </div>
        <div className="cc-skillpane">
          <SkeletonRows count={4} />
        </div>
      </div>
    );
  }

  if (skills.status === "error") {
    return (
      <div className="cc-place">
        <Notice tone="danger" onRetry={skills.refresh} testId="skills-error">
          The skills did not load. Nothing was changed.
        </Notice>
      </div>
    );
  }

  if (skills.skills.length === 0) {
    return (
      <div className="cc-place">
        <Card testId="skills-empty">
          <div className="cc-empty" style={{ paddingTop: 14 }}>
            <span style={{ color: "var(--cc-ink)", fontWeight: 600 }}>{COPY.skill.empty}</span>
            {readOnly ? (
              <span>An owner or editor can add the first one.</span>
            ) : (
              <div className="cc-actions">
                {onImport && (
                  <Button variant="primary" onClick={onImport}>
                    {COPY.skill.import}
                  </Button>
                )}
                {onStartFromTemplate && <Button onClick={onStartFromTemplate}>{COPY.skill.template}</Button>}
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="cc-skills" data-selected={selected ? true : undefined} data-testid="skills-place">
      <Library skills={skills.skills} ruleCounts={ruleCounts} selectedId={selected?.id ?? null} onSelect={onSelectSkill} />
      {selected ? (
        <SkillPane
          key={`${namespace}:${selected.id}`}
          skill={selected}
          namespace={namespace}
          rulesState={rules}
          rules={skillRules}
          skillsState={skills}
          readOnly={readOnly}
          canDelete={canDelete}
          onBack={() => onSelectSkill(null)}
          onTry={onTry}
          onSkillsChanged={onSkillsChanged}
          now={now}
        />
      ) : (
        <div className="cc-skillpane cc-skillpane--hint" data-testid="skills-pick">
          <p style={{ margin: 0, color: "var(--cc-ink-2)" }}>{COPY.skill.pick}</p>
        </div>
      )}
    </div>
  );
}

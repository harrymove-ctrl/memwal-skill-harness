/*
 * The product's app root: routing, session and data for the shell and places. It is mounted by
 * src/Root.tsx beside the older App.tsx, which keeps only /bento and ?legacy=1.
 */
import { type ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMembers } from "./hooks/useMembers";
import { useSession } from "./hooks/useSession";
import { useSkills } from "./hooks/useSkills";
import { GlimmNavBridge, GlimmWorkspaceProvider } from "./lib/glimmStudio";
import { Card, type LastCheck, Notice, SkeletonRows } from "./parts";
import { ProofDrawer } from "./parts/ProofDrawer";
import { AgentsPlace } from "./places/Agents";
import { HomePlace } from "./places/Home";
import { LandingPlace } from "./places/Landing";
import { SignInDialog } from "./places/SignIn";
import { SkillsPlace } from "./places/Skills";
import { TeamPlace } from "./places/Team";
import { TryItPlace } from "./places/TryIt";
import { AppShell } from "./shell/AppShell";
import { Button } from "./shell/Button";
import { type MemberRole, type ShellMember } from "./shell/AccountMenu";
import { LogoMark } from "./shell/Logo";
import { PLACE_LABELS, PLACE_PATHS, type Place, placeFromPath, resolvePath } from "./shell/places";
import { applyTheme, initialTheme, type Theme } from "./shell/theme";

const DEFAULT_SPACE = (import.meta.env.VITE_DEMO_NAMESPACE || import.meta.env.VITE_MEMWAL_NAMESPACE || "memwal-team-skills") as string;
const ACCOUNT_ID = (import.meta.env.VITE_MEMWAL_ACCOUNT_ID || "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d") as string;
const SERVER_URL = (import.meta.env.VITE_MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz") as string;
const SPACE_KEY = "cc-space";

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Remembering this is a convenience; nothing depends on it.
  }
}

function initialSpace(): string {
  return new URLSearchParams(window.location.search).get("ns") || readStored(SPACE_KEY) || DEFAULT_SPACE;
}

function readLastCheck(space: string): LastCheck | null {
  const key = `cc-last-check:${space}`;
  const raw = readStored(key);
  if (!raw) return null;
  if (/apps\/chatbot|staging is retired|retired demo apps/i.test(raw)) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as LastCheck;
    return parsed && typeof parsed.without === "string" && typeof parsed.withRules === "string" ? parsed : null;
  } catch {
    return null;
  }
}

const SKILL_TEMPLATE = (id: string) => `---
name: ${id}
description: What this skill is for, in one line.
---

# ${id}

## When to use it

Describe the task this skill covers.

## Steps

1. The first thing an agent should do.
2. The next thing.
`;

/** A skill id from a file's front matter or name. Null when neither gives a usable id. */
export function skillIdFromFile(fileName: string, markdown: string): string | null {
  const declared = markdown.match(/^---[\s\S]*?^name:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1];
  const base = declared ?? (/^skill\.md$/i.test(fileName) ? "" : fileName.replace(/\.(md|markdown)$/i, ""));
  const slug = base.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return slug || null;
}

interface SpaceInfo {
  name: string;
  skillCount?: number;
}

export function CommandCenter() {
  const [path, setPath] = useState(() => resolvePath(window.location.pathname));
  const [search, setSearch] = useState(() => window.location.search);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [space, setSpace] = useState(initialSpace);
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [showSignIn, setShowSignIn] = useState(false);
  const [showProof, setShowProof] = useState(false);
  const [lastCheck, setLastCheck] = useState<LastCheck | null>(() => readLastCheck(initialSpace()));
  const [skillsKey, setSkillsKey] = useState(0);
  const [importMessage, setImportMessage] = useState<{ tone: "info" | "danger"; text: string } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const sweepRef = useRef<((action: () => void, opts?: { label?: string }) => void) | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const session = useSession();
  const members = useMembers(space);
  const skills = useSkills(space);
  const isDark = theme === "dark";

  useEffect(() => {
    const onPop = () => {
      setPath(resolvePath(window.location.pathname));
      setSearch(window.location.search);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Old links keep working, and the address bar shows where they landed.
  useEffect(() => {
    if (window.location.pathname !== path && !path.startsWith("/join")) {
      window.history.replaceState(null, "", `${path}${window.location.search}`);
    }
  }, [path]);

  const refreshMembers = members.refresh;
  useEffect(() => {
    refreshMembers();
    // Only a change of identity needs a fresh answer about who you are.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.address]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/tatum-memwal/namespaces", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { namespaces: [] }))
      .then((json: { namespaces?: { name: string; memoryCount?: number }[] }) => {
        setSpaces((json.namespaces ?? []).filter((item) => !/^e2e-/.test(item.name)).map((item) => ({ name: item.name })));
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const go = useCallback((nextPath: string, query = "", { sweep = true } = {}) => {
    const apply = () => {
      window.history.pushState(null, "", `${nextPath}${query}`);
      setPath(nextPath);
      setSearch(query);
      document.querySelector('[data-testid="shell-main"]')?.scrollTo?.(0, 0);
    };
    if (sweep && sweepRef.current) sweepRef.current(apply);
    else apply();
  }, []);

  const navigate = useCallback((place: Place) => go(PLACE_PATHS[place]), [go]);

  /* An invite: join after signing in, then land on Home. */
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const inviteToken = path === "/join" ? params.get("invite") : null;
  const redeemed = useRef(false);
  useEffect(() => {
    if (!inviteToken || session.status !== "signedIn" || redeemed.current) return;
    redeemed.current = true;
    (async () => {
      try {
        const response = await fetch(`/api/ns/${encodeURIComponent(space)}/invites/redeem`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: inviteToken }),
        });
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        if (!response.ok) {
          setInviteError(json.error ?? "This invite did not work. Ask for a new one.");
          return;
        }
        refreshMembers();
        go(PLACE_PATHS.home, "", { sweep: false });
      } catch {
        setInviteError("Could not reach the server. Reload this page to try the invite again.");
      }
    })();
  }, [inviteToken, session.status, space, go, refreshMembers]);

  const place = placeFromPath(path);
  const role = members.you?.role ?? null;
  const canEdit = role === "owner" || role === "read-write";
  const signedIn = session.status === "signedIn" && session.address;

  useEffect(() => {
    if (path === "/" && signedIn) go(PLACE_PATHS.home, "", { sweep: false });
  }, [path, signedIn, go]);

  const member: ShellMember | null = signedIn
    ? {
        handle: members.you?.handle ?? session.address!,
        role: (role === "owner" ? "Owner" : role === "read-write" ? "Editor" : "Viewer") as MemberRole,
      }
    : null;

  const toggleTheme = useCallback(() => {
    const apply = () => {
      setTheme((current) => {
        const next = current === "dark" ? "light" : "dark";
        applyTheme(next);
        return next;
      });
    };
    if (sweepRef.current) sweepRef.current(apply, { label: "theme:toggle" });
    else apply();
  }, []);

  const switchSpace = useCallback((name: string) => {
    const apply = () => {
      setSpace(name);
      store(SPACE_KEY, name);
      setLastCheck(readLastCheck(name));
      setImportMessage(null);
    };
    if (sweepRef.current) sweepRef.current(apply, { label: `space:${name}` });
    else apply();
  }, []);

  const saveCheck = useCallback(
    (check: LastCheck) => {
      setLastCheck(check);
      store(`cc-last-check:${space}`, JSON.stringify(check));
    },
    [space]
  );

  const reloadSkills = skills.refresh;
  const createSkill = useCallback(
    async (id: string, markdown: string): Promise<boolean> => {
      const response = await fetch(`/api/ns/${encodeURIComponent(space)}/skills/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, name: id }),
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        setImportMessage({ tone: "danger", text: json.error ?? `${id} did not save. Please try again.` });
        return false;
      }
      reloadSkills();
      setSkillsKey((key) => key + 1);
      return true;
    },
    [space, reloadSkills]
  );

  const onFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])];
    event.target.value = "";
    if (files.length === 0) return;
    setImportMessage(null);
    let saved = 0;
    for (const file of files) {
      const markdown = await file.text();
      const id = skillIdFromFile(file.name, markdown);
      if (!id) {
        setImportMessage({ tone: "danger", text: `${file.name} has no name in its front matter, so it was not imported.` });
        return;
      }
      if (!(await createSkill(id, markdown))) return;
      saved += 1;
    }
    setImportMessage({ tone: "info", text: saved === 1 ? "Imported 1 skill." : `Imported ${saved} skills.` });
    go(PLACE_PATHS.skills, "", { sweep: false });
  };

  const openImport = useCallback(() => fileInput.current?.click(), []);

  const startFromTemplate = useCallback(async () => {
    const taken = new Set(skills.skills.map((skill) => skill.id));
    let id = "new-skill";
    for (let n = 2; taken.has(id); n += 1) id = `new-skill-${n}`;
    if (await createSkill(id, SKILL_TEMPLATE(id))) go(PLACE_PATHS.skills, `?skill=${encodeURIComponent(id)}`, { sweep: false });
  }, [skills.skills, createSkill, go]);

  const overlays = (
    <>
      {showSignIn && <SignInDialog session={session} onClose={() => setShowSignIn(false)} />}
      {showProof && <ProofDrawer namespace={space} signedIn={Boolean(signedIn)} onClose={() => setShowProof(false)} />}
    </>
  );

  if (!place) {
    return (
      <GlimmWorkspaceProvider isDark={isDark}>
        <GlimmNavBridge sweepRef={sweepRef} />
        <LandingPlace
          onTryDemo={() => go(PLACE_PATHS.try)}
          onSignIn={() => setShowSignIn(true)}
          onShowProof={() => setShowProof(true)}
          invitedTo={inviteToken ? space : null}
          inviteError={inviteError}
          isDark={isDark}
        />
        {overlays}
      </GlimmWorkspaceProvider>
    );
  }

  const skillParam = params.get("skill");
  const shellSpaces = spaces.some((item) => item.name === space)
    ? spaces.map((item) => (item.name === space ? { ...item, skillCount: skills.skills.length } : item))
    : [{ name: space, skillCount: skills.skills.length }, ...spaces];

  const requiresAccount =
    place === "home" ||
    place === "team" ||
    place === "agents" ||
    (place === "skills" && !skillParam);

  return (
    <GlimmWorkspaceProvider isDark={isDark}>
      <GlimmNavBridge sweepRef={sweepRef} />
      <input
        ref={fileInput}
        type="file"
        accept=".md,.markdown,text/markdown"
        multiple
        hidden
        data-testid="import-input"
        onChange={(event) => void onFiles(event)}
      />
      <AppShell
        place={place}
        onNavigate={navigate}
        space={signedIn ? { name: space, skillCount: skills.skills.length } : null}
        spaces={signedIn ? shellSpaces : []}
        onSwitchSpace={(name) => {
          if (!signedIn) {
            setShowSignIn(true);
            return;
          }
          switchSpace(name);
        }}
        onNewSpace={!signedIn ? () => setShowSignIn(true) : undefined}
        member={member}
        onSignOut={() => void session.signOut()}
        onSignIn={() => setShowSignIn(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        title={place === "home" && signedIn ? space : PLACE_LABELS[place]}
        toolbar={
          place === "home" && signedIn ? (
            <Button onClick={() => setShowProof(true)} data-testid="open-proof">Proof</Button>
          ) : undefined
        }
      >
        {session.status === "signedOut" && !requiresAccount && (
          <div className="cc-demo-note" data-testid="demo-note">
            <span>Public demo sandbox. Sign in to load your own account, space, and team rules.</span>
            <button type="button" className="cc-textbtn" onClick={() => setShowSignIn(true)}>Sign in</button>
          </div>
        )}
        {importMessage && (
          <div className="cc-demo-note" style={{ border: 0, background: "none" }}>
            <Notice tone={importMessage.tone} testId="import-message">{importMessage.text}</Notice>
          </div>
        )}
        {requiresAccount && session.status === "loading" && (
          <div className="cc-place">
            <Card title="Checking session">
              <SkeletonRows count={3} />
            </Card>
          </div>
        )}
        {requiresAccount && session.status === "signedOut" && (
          <div className="cc-place" data-testid="auth-gate">
            <Card
              title={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <LogoMark size={20} glint className="cc-brand__mark" />
                  Sign in to load your account
                </span>
              }
            >
              <div style={{ display: "grid", gap: 12 }}>
                <p style={{ margin: 0, color: "var(--cc-ink-2)" }}>
                  No account is connected yet. Sign in with Slush or Google (Mysten Enoki zkLogin) to load your space, team members, connected agents, and activity stream.
                </p>
                <div className="cc-actions">
                  <Button variant="primary" onClick={() => setShowSignIn(true)} data-testid="auth-gate-signin">
                    Sign in
                  </Button>
                  <Button onClick={() => navigate("try")} data-testid="auth-gate-try">
                    Try the demo
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {place === "home" && signedIn && (
          <HomePlace
            namespace={space}
            skillCount={skills.status === "ready" ? skills.skills.length : undefined}
            memberCount={members.status === "ready" ? members.members.length : undefined}
            readOnly={!canEdit}
            lastCheck={lastCheck}
            onImportSkills={openImport}
            onAddRule={() => navigate("skills")}
            onInvite={() => navigate("team")}
            onConnect={() => navigate("agents")}
            onTry={() => navigate("try")}
          />
        )}
        {place === "skills" && (signedIn || Boolean(skillParam)) && (
          <SkillsPlace
            key={`${space}:${skillsKey}`}
            namespace={space}
            selectedSkillId={skillParam}
            onSelectSkill={(id) => {
              const query = id ? `?skill=${encodeURIComponent(id)}` : "";
              window.history.replaceState(null, "", `${PLACE_PATHS.skills}${query}`);
              setSearch(query);
            }}
            caller={members.you?.handle ?? undefined}
            readOnly={!canEdit}
            canDelete={role === "owner"}
            onImport={openImport}
            onStartFromTemplate={() => void startFromTemplate()}
            onTry={(id) => go(PLACE_PATHS.try, `?skill=${encodeURIComponent(id)}`)}
            onSkillsChanged={reloadSkills}
          />
        )}
        {place === "try" && (
          <TryItPlace
            key={space}
            namespace={space}
            skills={skills.skills}
            skillsStatus={skills.status}
            onRetrySkills={reloadSkills}
            initialSkillId={skillParam}
            onOpenSkill={(id) => go(PLACE_PATHS.skills, `?skill=${encodeURIComponent(id)}`)}
            onResult={saveCheck}
            onImport={canEdit ? openImport : undefined}
          />
        )}
        {place === "team" && signedIn && (
          <TeamPlace
            namespace={space}
            state={members}
            inviteUrl={(token) =>
              `${window.location.origin}/join?ns=${encodeURIComponent(space)}&invite=${encodeURIComponent(token)}`
            }
            onSignIn={() => setShowSignIn(true)}
          />
        )}
        {place === "agents" && signedIn && (
          <AgentsPlace namespace={space} accountId={ACCOUNT_ID} serverUrl={SERVER_URL} origin={window.location.origin} />
        )}
      </AppShell>
      {overlays}
    </GlimmWorkspaceProvider>
  );
}

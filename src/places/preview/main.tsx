/*
 * Dev only: open /src/places/preview/index.html on the dev server. It is not a
 * Rollup input, so it never reaches the production build.
 *
 * ?place=home|skills|try|team|agents|landing   &proof=1 opens Proof, &signin=1 opens Sign in
 * ?state=loading|empty|error|offline|readonly   every screen state, on any place
 * ?members=long|unverified|empty  ?addresult=clean|flagged|unchecked|invalid|exists  ?proofstate=noaccount
 * ?api=mock (default): sample data, nothing leaves the browser.
 * ?api=real: real reads from this dev server; every write is refused here, so
 *   the preview can never change a real space.
 * ?scene=new|progress|live|quiet   (mock data for Home)
 * ?skills=empty|long               (mock data for Skills)
 * ?role=Owner|Editor|Viewer  ?theme=dark|light  ?skill=<id>  ?delay=<ms>
 * ?fail=activity,rules,skills,save,state,add,delete  ?conflict=1
 */
import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import { AppShell } from "../../shell/AppShell";
import { PLACE_LABELS, type Place } from "../../shell/places";
import { applyTheme, initialTheme, type Theme } from "../../shell/theme";
import { useMembers } from "../../hooks/useMembers";
import { useSession } from "../../hooks/useSession";
import { useSkills } from "../../hooks/useSkills";
import type { LastCheck } from "../../parts";
import { ProofDrawer } from "../../parts/ProofDrawer";
import { Button } from "../../shell/Button";
import { AgentsPlace } from "../Agents";
import { HomePlace } from "../Home";
import { LandingPlace } from "../Landing";
import { SignInDialog } from "../SignIn";
import { SkillsPlace } from "../Skills";
import { TeamPlace } from "../Team";
import { TryItPlace } from "../TryIt";

declare global {
  interface Window {
    __placeEvents: string[];
  }
}
window.__placeEvents = [];
const log = (event: string) => window.__placeEvents.push(event);

const params = new URLSearchParams(window.location.search);
const forced = params.get("state");
if (forced === "empty") {
  params.set("scene", "new");
  params.set("skills", "empty");
  params.set("rules", "empty");
  params.set("members", "empty");
}
if (forced === "readonly") params.set("role", "Viewer");
if (forced === "offline") Object.defineProperty(navigator, "onLine", { get: () => false });
const scene = params.get("scene") ?? "progress";
const fail = new Set((params.get("fail") ?? "").split(",").filter(Boolean));
if (forced === "error" || forced === "offline") {
  for (const area of ["activity", "rules", "skills", "members", "proof"]) fail.add(area);
}
const delay = forced === "loading" ? 100_000_000 : Number(params.get("delay") ?? 60);
const real = params.get("api") === "real";

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
const receipt = (id: string, minutes: number, preview: string) => ({
  memoryId: id,
  blobId: `blob${id}`,
  walruscanUrl: `https://walruscan.com/mainnet/blob/blob${id}`,
  signerHandle: "@harrymove-ctrl",
  createdAt: ago(minutes),
  preview,
});
const recall = (id: string, minutes: number, agent: string, skill: string, rules = 2) =>
  receipt(id, minutes, `[AGENT_LOG:RECALL] [agent:${agent}] [author:@harrymove-ctrl] [target:${skill}] [rules:${rules}]`);

const OTHER_ACTIVITY = [
  receipt("t1", 60, '[RULE:r1] [skill:sample-review] [state:on] [rev:1] [author:@teammate-qa]\n{"ruleId":"r1","text":"Sample rule: run the checks before approving."}'),
  receipt("s1", 180, '[SKILL_REF:sample-qa]\n{"id":"sample-qa","rev":4,"author":"@harrymove-ctrl"}'),
  receipt("o1", 240, "[RULE_STATE:r2] [state:off] [rev:3]"),
];

const LIVE_RECALLS = [
  recall("a1", 1, "claude-code", "sample-qa"),
  recall("a2", 12, "cursor", "sample-review", 3),
  recall("a3", 70, "claude-code", "sample-review"),
  recall("a4", 130, "claude-code", "sample-qa", 1),
  recall("a5", 135, "cursor", "sample-qa"),
  recall("a6", 400, "cursor", "sample-qa"),
  recall("a7", 700, "claude-code", "sample-qa"),
  recall("a8", 60 * 50, "codex", "sample-review"),
];

function activityFor() {
  if (scene === "new") return [];
  if (scene === "live") return [...LIVE_RECALLS, ...OTHER_ACTIVITY];
  if (scene === "quiet") return [recall("q1", 60 * 50, "codex", "sample-review"), ...OTHER_ACTIVITY];
  return OTHER_ACTIVITY;
}

const LONG = "a-very-long-skill-name-that-a-real-team-could-type-for-its-review-playbook-2026";
const LONG_RULE =
  "A very long rule that somebody pasted in one go because it explains the whole release process, including every environment, every check, and who to ask when a deploy fails on a Friday afternoon before a long weekend.";
const MARKDOWN = `---
name: sample-review
description: A sample skill for this preview.
---

# Sample review

Review the latest merged changes through code review, automated checks, real user flows and logs.

## Workflow for every change

1. Identify the environment from the branch.
2. Check that the merge commit is deployed.

\`\`\`bash
npm run build
\`\`\`
`;

type MockSkill = Record<string, unknown> & { id: string; rev: number };
const skill = (id: string, category: string, rev = 1): MockSkill => ({
  id,
  name: id,
  category,
  description: `Sample skill ${id}`,
  markdown: MARKDOWN,
  rev,
  author: "@harrymove-ctrl",
  updatedAt: ago(120),
  history: [
    { rev, author: "@harrymove-ctrl", updatedAt: ago(120) },
    { rev: Math.max(1, rev - 1), author: "@teammate-qa", updatedAt: ago(3000) },
  ],
});

let mockSkills: MockSkill[] =
  params.get("skills") === "empty"
    ? []
    : params.get("skills") === "long"
      ? [skill(LONG, "A very long category name for the library column", 12), ...Array.from({ length: 40 }, (_, i) => skill(`sample-skill-${i}`, `Group ${i % 5}`))]
      : params.get("place") === "try"
        ? [skill("sample-review", "Workflows", 4), skill("memwal-qa", "Workflows", 2), skill("sample-rust", "Rust and relayer")]
        : [skill("sample-review", "Workflows", 4), skill("sample-qa", "Workflows", 2), skill("sample-rust", "Rust and relayer")];

let mockRules: Record<string, unknown>[] =
  params.get("rules") === "empty" || scene === "new"
    ? []
    : [
        { ruleId: "r1", skillId: "sample-review", text: "Sample rule: run the checks before approving.", state: "on", author: "@teammate-qa", updatedAt: ago(60), rev: 1, blobId: "realBlobA" },
        { ruleId: "r2", skillId: "sample-review", text: "Sample rule: post in the channel before promoting.", state: "off", author: "@harrymove-ctrl", updatedAt: ago(4000), rev: 3, blobId: "realBlobB" },
        { ruleId: "r3", skillId: "sample-review", text: params.get("skills") === "long" ? LONG_RULE : "Sample rule waiting to sync.", state: "on", author: "@teammate-with-a-very-long-handle-name", updatedAt: ago(5), rev: 1, blobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0" },
        { ruleId: "r4", skillId: "memwal-qa", text: "Skip retired demo apps during QA and close their pull requests as not planned.", state: params.get("retired") === "off" ? "off" : "on", author: "@harrymove-ctrl", updatedAt: ago(90), rev: 1, blobId: "realBlobC" },
      ];

const ROLE_WIRE = { Owner: "owner", Editor: "read-write", Viewer: "read-only" } as const;
const addr = (byte: string) => `0x${byte.repeat(32)}`;
const youAddress = addr("aa");
type MockMember = { handle: string; suiAddress: string; role: string; addedAt: string; verification: string };
let mockMembers: MockMember[] =
  params.get("members") === "empty"
    ? []
    : [
        { handle: "@harrymove-ctrl", suiAddress: youAddress, role: "owner", addedAt: ago(9000), verification: "owner" },
        { handle: "@teammate-dev", suiAddress: addr("bb"), role: "read-write", addedAt: ago(7000), verification: params.get("members") === "unverified" ? "unknown" : "key" },
        { handle: "@teammate-qa", suiAddress: addr("cc"), role: "read-only", addedAt: ago(5000), verification: params.get("members") === "unverified" ? "unknown" : "pending" },
        ...(params.get("members") === "long"
          ? [{ handle: "@a-teammate-with-an-extremely-long-handle-that-someone-really-did-choose-2026", suiAddress: addr("dd"), role: "read-only", addedAt: ago(100), verification: "pending" }]
          : []),
      ];
let joinedInvite = 0;

const PROOF = {
  namespace: "sample-space",
  bucket: { id: "217e53fc-36ff-4d1b-8834-04f69c2ef553", url: "https://console.example/bucket", files: [{ id: "file-sample-1", label: "sample-review" }, { id: "file-sample-2", label: LONG }] },
  blobs: [
    { id: "realBlobA", label: "Sample rule: run the checks before approving.", url: "https://walruscan.com/mainnet/blob/realBlobA" },
    { id: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0", label: "A placeholder that must never show", url: "https://walruscan.com/mainnet/blob/placeholder" },
  ],
  memoryCount: 61,
  account: {
    id: addr("46"),
    url: "https://suiscan.xyz/mainnet/object/sample",
    owner: youAddress,
    active: true,
    keys: [{ address: addr("bb"), label: "@teammate-dev, Relayer and Rust" }],
  },
  transactions: [
    { digest: "5p7GMukmf64UtGoyv7UbpeEV3MRdW6aDrZgJ4R1f5Vq6", label: "Account created", ok: true, url: "https://suiscan.xyz/mainnet/tx/sample" },
    { digest: "9q8FNvnjg75VuHpzw8VcqfeW4NSeX7EshKZ5S2g6Wr7T", label: "Keys added", ok: null, url: "https://suiscan.xyz/mainnet/tx/sample2" },
  ],
  source: "Tatum Sui gRPC gateway",
  readAt: new Date().toISOString(),
};

let conflictSent = false;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

const passthrough = window.fetch.bind(window);

window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, window.location.origin);
  const method = (init?.method ?? "GET").toUpperCase();
  if (!url.pathname.startsWith("/api/")) return passthrough(input, init);

  if (real) {
    if (method !== "GET") {
      log(`blocked:${method}:${url.pathname}`);
      return json({ ok: false, error: "The preview never writes to a real space." }, 403);
    }
    return passthrough(input, init);
  }

  log(`${method}:${url.pathname}`);
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, delay);
    init?.signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  if (url.pathname === "/api/auth/session") {
    return json({ ok: true, address: params.get("signedout") ? null : youAddress });
  }

  if (url.pathname.endsWith("/proof")) {
    if (fail.has("proof")) return json({ ok: false }, 500);
    return json({ ok: true, ...PROOF, account: params.get("proofstate") === "noaccount" ? null : PROOF.account });
  }

  if (url.pathname.endsWith("/invites")) {
    return fail.has("invite") ? json({ ok: false }, 500) : json({ ok: true, role: "read-only", token: `sample-token-${(joinedInvite += 1)}`, expiresAt: Date.now() + 1000 });
  }

  const memberMatch = url.pathname.match(/\/members\/([^/]+)(\/role)?$/);
  if (memberMatch && memberMatch[1] !== "check") {
    if (fail.has("member")) return json({ ok: false, error: "A space needs at least one owner." }, 409);
    const target = decodeURIComponent(memberMatch[1]!);
    if (method === "DELETE") mockMembers = mockMembers.filter((item) => item.suiAddress !== target);
    else {
      const next = JSON.parse(String(init?.body ?? "{}")).role;
      mockMembers = mockMembers.map((item) => (item.suiAddress === target ? { ...item, role: next } : item));
    }
    return json({ ok: true, members: mockMembers });
  }

  if (url.pathname.endsWith("/members")) {
    if (method === "GET") {
      if (fail.has("members")) return json({ ok: false }, 500);
      const role = (params.get("role") ?? "Owner") as keyof typeof ROLE_WIRE;
      return json({
        ok: true,
        members: mockMembers,
        you: params.get("signedout") ? null : params.get("stranger") ? { address: addr("ee"), handle: null, role: null } : { address: youAddress, handle: "@harrymove-ctrl", role: ROLE_WIRE[role] ?? "owner" },
        accountRead: params.get("members") !== "unverified",
      });
    }
    const body = JSON.parse(String(init?.body ?? "{}"));
    const result = params.get("addresult") ?? "clean";
    if (result === "flagged") return json({ ok: false, code: "flagged", error: "flagged" }, 409);
    if (result === "invalid") return json({ ok: false, code: "invalid", error: "invalid" }, 400);
    if (result === "exists") return json({ ok: false, code: "exists", error: "exists" }, 409);
    if (result === "unchecked" && !body.acceptUnchecked) return json({ ok: false, code: "unchecked", error: "unchecked" }, 409);
    mockMembers = [...mockMembers, { handle: "new-teammate.sui", suiAddress: addr("ff"), role: body.role, addedAt: new Date().toISOString(), verification: "pending" }];
    return json({ ok: true, members: mockMembers, check: { verdict: result === "unchecked" ? "unknown" : "clean", address: addr("ff") } });
  }

  if (url.pathname.endsWith("/activity")) {
    return fail.has("activity") ? json({ ok: false }, 500) : json({ ok: true, receipts: activityFor() });
  }

  const stateMatch = url.pathname.match(/\/rules\/([^/]+)\/state$/);
  if (stateMatch) {
    if (fail.has("state")) return json({ ok: false, error: "boom" }, 500);
    const next = JSON.parse(String(init?.body ?? "{}")).state;
    mockRules = next === "deleted"
      ? mockRules.filter((rule) => rule.ruleId !== stateMatch[1])
      : mockRules.map((rule) => (rule.ruleId === stateMatch[1] ? { ...rule, state: next } : rule));
    return json({ ok: true, ruleId: stateMatch[1], state: next });
  }

  if (/\/rules\/[^/]+\/bake$/.test(url.pathname)) {
    return json({ ok: true, baked: true });
  }

  if (url.pathname.endsWith("/rules")) {
    if (method === "GET") {
      if (fail.has("rules")) return json({ ok: false }, 500);
      const only = url.searchParams.get("skill");
      return json({ ok: true, rules: only ? mockRules.filter((rule) => rule.skillId === only) : mockRules });
    }
    if (fail.has("add")) return json({ ok: false, error: "boom" }, 500);
    const body = JSON.parse(String(init?.body ?? "{}"));
    const rule = {
      ruleId: body.ruleId ?? `rule-${Date.now()}`,
      skillId: body.skillId,
      text: body.text,
      state: "on",
      author: body.author ?? "@harrymove-ctrl",
      updatedAt: new Date().toISOString(),
      rev: 1,
      blobId: "realBlobNew",
    };
    return json({ ok: true, rule, syncedToWalrus: true });
  }

  const skillMatch = url.pathname.match(/\/skills\/(.+)$/);
  if (skillMatch) {
    const id = decodeURIComponent(skillMatch[1]!);
    if (method === "DELETE") {
      if (fail.has("delete")) return json({ ok: false }, 500);
      mockSkills = mockSkills.filter((item) => item.id !== id);
      return json({ ok: true });
    }
    const current = mockSkills.find((item) => item.id === id)!;
    const ifMatch = Number((init?.headers as Record<string, string>)["If-Match"]);
    if (params.get("conflict") && !conflictSent) {
      conflictSent = true;
      const theirs = { ...current, rev: current.rev + 1, author: "@teammate-qa" };
      mockSkills = mockSkills.map((item) => (item.id === id ? theirs : item));
      return json({ ok: false, conflict: true, currentSkill: theirs }, 409);
    }
    if (ifMatch !== current.rev) return json({ ok: false, conflict: true, currentSkill: current }, 409);
    if (fail.has("save")) return json({ ok: false, error: "boom" }, 500);
    const saved = { ...current, markdown: JSON.parse(String(init?.body)).markdown, rev: current.rev + 1, updatedAt: new Date().toISOString() };
    mockSkills = mockSkills.map((item) => (item.id === id ? saved : item));
    return json({ ok: true, skill: saved });
  }

  if (url.pathname.endsWith("/skills")) {
    return fail.has("skills") ? json({ ok: false }, 500) : json({ ok: true, skills: mockSkills });
  }

  return json({ ok: false }, 404);
};

const REAL_SPACE = "memwal-team-skills";

function TryPreview({ namespace }: { namespace: string }) {
  const skills = useSkills(namespace);
  const [, setCheck] = useState<LastCheck | null>(null);
  return (
    <TryItPlace
      namespace={namespace}
      skills={skills.skills}
      skillsStatus={skills.status}
      onRetrySkills={skills.refresh}
      initialSkillId={params.get("skill")}
      onOpenSkill={(id) => log(`open:${id}`)}
      onResult={(check) => {
        setCheck(check);
        log(`check:${check.withRules}`);
      }}
      onImport={() => log("import")}
    />
  );
}

function TeamPreview({ namespace }: { namespace: string }) {
  const members = useMembers(namespace);
  return (
    <TeamPlace
      namespace={namespace}
      state={members}
      inviteUrl={(token) => `${window.location.origin}/join?ns=${namespace}&invite=${token}`}
      onSignIn={() => log("sign-in")}
    />
  );
}

function LandingPreview() {
  const session = useSession();
  const [signIn, setSignIn] = useState(Boolean(params.get("signin")));
  const [proof, setProof] = useState(Boolean(params.get("proof")));
  return (
    <>
      <LandingPlace
        onTryDemo={() => log("demo")}
        onSignIn={() => setSignIn(true)}
        onShowProof={() => setProof(true)}
        invitedTo={params.get("invited")}
        inviteError={params.get("inviteerror")}
      />
      {signIn && <SignInDialog session={session} onClose={() => setSignIn(false)} />}
      {proof && <ProofDrawer namespace="sample-space" onClose={() => setProof(false)} />}
    </>
  );
}

function Preview() {
  const role = (params.get("role") ?? "Owner") as "Owner" | "Editor" | "Viewer";
  const readOnly = role === "Viewer";
  const namespace = real ? REAL_SPACE : "sample-space";
  const [place, setPlace] = useState<Place>((params.get("place") as Place) ?? "home");
  const [selected, setSelected] = useState<string | null>(params.get("skill"));
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [proofOpen, setProofOpen] = useState(Boolean(params.get("proof")));
  const signInSession = useSession();
  const [signInOpen, setSignInOpen] = useState(Boolean(params.get("signin")));

  const memberCount = useMemo(() => {
    if (real) return 1;
    return scene === "live" || scene === "quiet" ? 3 : 1;
  }, []);

  return (
    <AppShell
      place={place}
      onNavigate={setPlace}
      space={{ name: namespace, skillCount: 19 }}
      spaces={[{ name: namespace, skillCount: 19 }]}
      onSwitchSpace={() => undefined}
      member={params.get("signedout") ? null : { handle: "harrymove-ctrl", role }}
      onSignOut={() => undefined}
      onSignIn={() => setSignInOpen(true)}
      toolbar={place === "home" ? <Button onClick={() => setProofOpen(true)} data-testid="open-proof">Proof</Button> : undefined}
      theme={theme}
      onToggleTheme={() =>
        setTheme((value) => {
          const next = value === "dark" ? "light" : "dark";
          applyTheme(next);
          return next;
        })
      }
      title={place === "home" ? namespace : PLACE_LABELS[place]}
    >
      {place === "skills" ? (
        <SkillsPlace
          namespace={namespace}
          selectedSkillId={selected}
          onSelectSkill={setSelected}
          caller={real ? undefined : "@harrymove-ctrl"}
          readOnly={readOnly}
          canDelete={role === "Owner"}
          onImport={() => log("import")}
          onStartFromTemplate={() => log("template")}
          onTry={(id) => log(`try:${id}`)}
          onSkillsChanged={() => log("skills-changed")}
        />
      ) : place === "home" ? (
        <HomePlace
          namespace={namespace}
          skillCount={real ? 19 : scene === "new" ? 0 : 3}
          memberCount={memberCount}
          readOnly={readOnly}
          lastCheck={
            params.get("check")
              ? {
                  skillName: "sample-qa",
                  task: "sample task",
                  without: "Sample: approves the change",
                  withRules: "Sample: closes it as not planned",
                  ruleText: "Sample rule that changed the outcome.",
                  ruleAuthor: "@harrymove-ctrl",
                }
              : null
          }
          onImportSkills={() => log("import")}
          onAddRule={() => log("add-rule")}
          onInvite={() => log("invite")}
          onConnect={() => log("connect")}
          onTry={() => log("try")}
        />
      ) : place === "try" ? (
        <TryPreview namespace={namespace} />
      ) : place === "team" ? (
        <TeamPreview namespace={namespace} />
      ) : (
        <AgentsPlace namespace={namespace} accountId={addr("46")} serverUrl="https://relayer.example" origin={window.location.origin} />
      )}
      {proofOpen && <ProofDrawer namespace={namespace} onClose={() => setProofOpen(false)} />}
      {signInOpen && <SignInDialog session={signInSession} onClose={() => setSignInOpen(false)} />}
    </AppShell>
  );
}

applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {params.get("place") === "landing" ? <LandingPreview /> : <Preview />}
  </StrictMode>,
);

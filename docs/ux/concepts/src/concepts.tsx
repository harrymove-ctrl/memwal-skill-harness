import {
  ArrowUpRight,
  Bot,
  CircleCheck,
  CircleX,
  Copy,
  FileText,
  History,
  Link2,
  Play,
  Search,
  ShieldCheck,
  SquareTerminal,
  UserPlus,
} from "lucide-react";
import { Avatar, Bar, Chart, Check, Facepile, Row, Stage, Text, Toggle, Window } from "../kit";
import { AgentGlyph, Button, Card, IdPill, Sidebar } from "./shell";

/** The wide hero frame every concept shares: a 1040px window inset top, running off the bottom. */
/** `?t=dark` renders every concept in the dark command center look (the 2026-11-03 decision). */
const URL_THEME: "light" | "dark" | null =
  typeof location !== "undefined" ? (new URLSearchParams(location.search).get("t") as "light" | "dark" | null) : null;

function Frame({ theme: themeProp = "light", children }: { theme?: "light" | "dark"; children: React.ReactNode }) {
  const theme = URL_THEME ?? themeProp;
  return (
    <Stage width={1120} height={700} theme={theme} accent={theme === "dark" ? "#34d399" : "#059669"} className="mx-stage">
      {() => <div className="mx-hero">{children}</div>}
    </Stage>
  );
}

const MEMBERS = ["harrymove-ctrl", "mysten-dev", "teammate-qa"];

/** A. Calm workspace: Home with the getting started checklist, activity and the last check. */
export function HomeCalm() {
  return (
    <Frame>
      <Window sidebar={<Sidebar place="home" counts={{ skills: "19" }} />} title="memwal-team-skills" toolbar={<><Facepile names={MEMBERS} size={24} />
              <Button icon={<ShieldCheck size={14} strokeWidth={1.75} />}>Proof</Button></>} sidebarWidth={212} className="mx-window">
        <div className="mx-main">
          <div className="mx-intro">QA, review and release playbooks for the MemWal team</div>

          <div className="mx-grid">
            <Card title="Getting started" meta="3 of 5 done">
              <div className="mx-steps">
                {[
                  { t: "Create the space", m: "memwal-team-skills", done: true },
                  { t: "Import skills", m: "19 skills", done: true },
                  { t: "Add the first rule", m: "24 rules", done: true },
                ].map((s) => (
                  <div className="mx-step" key={s.t} data-done>
                    <Check on size={18} />
                    <span className="mx-step__t">{s.t}</span>
                    <span className="mx-step__m">{s.m}</span>
                  </div>
                ))}
                <div className="mx-step">
                  <Check on={false} size={18} />
                  <span className="mx-step__t">Invite a teammate</span>
                  <Button icon={<UserPlus size={14} strokeWidth={1.75} />}>Invite</Button>
                </div>
                <div className="mx-step">
                  <Check on={false} size={18} />
                  <span className="mx-step__t">Connect your agent</span>
                  <Button primary icon={<Plug2 />}>Connect</Button>
                </div>
              </div>
            </Card>

            <Card title="Last check" meta="memwal-qa · PR #942">
              <div className="mx-verdicts">
                <div className="mx-verdict" data-tone="bad">
                  <CircleX size={16} strokeWidth={1.9} />
                  <div>
                    <div className="mx-verdict__k">Without team rules</div>
                    <div className="mx-verdict__v">Approves a PR for a retired app</div>
                  </div>
                </div>
                <div className="mx-verdict" data-tone="good">
                  <CircleCheck size={16} strokeWidth={1.9} />
                  <div>
                    <div className="mx-verdict__k">With team rules</div>
                    <div className="mx-verdict__v">Closes it as not planned</div>
                  </div>
                </div>
              </div>
              <div className="mx-usedrule">
                <div className="mx-usedrule__k">Rule that changed it</div>
                <div className="mx-usedrule__t">Skip retired demo apps during QA and close their PRs as not planned.</div>
                <div className="mx-usedrule__m">harrymove-ctrl · in Walrus Memory</div>
              </div>
            </Card>
          </div>

          <Card title="Activity" meta="Today" className="mx-activity">
            <Row
              lead={<AgentGlyph><SquareTerminal size={15} strokeWidth={1.75} /></AgentGlyph>}
              title={<span><b>Claude Code</b> recalled 2 rules for memwal-qa</span>}
              meta="2m"
            />
            <Row
              lead={<Avatar name="teammate-qa" size={28} />}
              title={<span><b>teammate-qa</b> taught a rule in memwal-review</span>}
              subtitle={<span className="mx-quote">Staging is retired, so promote directly from dev to main.</span>}
              meta="1h"
            />
            <Row lead={<Avatar name="harrymove-ctrl" size={28} />} title={<span><b>harrymove-ctrl</b> saved memwal-qa, revision 4</span>} meta="3h" />
            <Row lead={<Avatar plain size={28} />} title={<Bar w={260} />} meta={<Bar w={18} />} />
          </Card>
        </div>
      </Window>
    </Frame>
  );
}

function Plug2() {
  return <Link2 size={14} strokeWidth={1.9} />;
}

/** B. Command center: the live view, dark. */
export function HomeCommand() {
  const bars = [4, 6, 3, 8, 7, 11, 9, 14, 12, 18, 16, 24];
  return (
    <Frame theme="dark">
      <Window sidebar={<Sidebar place="home" counts={{ skills: "19" }} />} title="Live" toolbar={<><span className="mx-livepill"><span className="mx-livepill__dot" />2 agents active</span></>} sidebarWidth={212} className="mx-window">
        <div className="mx-main">
          <div className="mx-intro">What your agents are doing with the team's rules</div>
          <div className="mx-grid mx-grid--live">
            <Card title="Rules applied today" className="mx-bigcard">
              <div className="mx-big">24</div>
              <div className="mx-sub">across 6 skills, up from 9 yesterday</div>
              <div className="mx-chart">
                <Chart kind="bars" data={bars} width={380} height={96} show />
              </div>
            </Card>
            <Card title="Agents now">
              {[
                { n: "Claude Code", s: "Recalling memwal-qa", on: true },
                { n: "Cursor", s: "Idle, last recall 12m ago", on: true },
                { n: "Codex", s: "Offline for 2 days", on: false },
              ].map((a) => (
                <Row
                  key={a.n}
                  lead={<AgentGlyph><Bot size={15} strokeWidth={1.75} /></AgentGlyph>}
                  title={a.n}
                  subtitle={a.s}
                  meta={<span className="mx-dot" data-on={a.on || undefined} />}
                />
              ))}
            </Card>
          </div>
          <Card title="Stream" className="mx-activity">
            <Row lead={<AgentGlyph><SquareTerminal size={15} strokeWidth={1.75} /></AgentGlyph>} title={<span><b>Claude Code</b> used “Skip retired demo apps during QA” on PR #942</span>} meta="now" />
            <Row lead={<AgentGlyph><Bot size={15} strokeWidth={1.75} /></AgentGlyph>} title={<span><b>Cursor</b> recalled 3 rules for memwal-review</span>} meta="12m" />
            <Row lead={<Avatar name="teammate-qa" size={28} />} title={<span><b>teammate-qa</b> taught a rule in memwal-review</span>} meta="1h" />
            <Row lead={<AgentGlyph><SquareTerminal size={15} strokeWidth={1.75} /></AgentGlyph>} title={<span><b>Claude Code</b> recalled 2 rules for memwal-qa</span>} meta="2h" />
            <Row lead={<Avatar plain size={28} />} title={<Bar w={300} />} meta={<Bar w={18} />} />
          </Card>
        </div>
      </Window>
    </Frame>
  );
}

/** C. Guided story: the signed out landing, built around the before and after. */
export function Landing() {
  return (
    <Frame>
      <Window url="memwal-skill-harness.up.railway.app" urlShape="pill" className="mx-window mx-window--browser">
        <div className="mx-landing">
          <div className="mx-topbar">
            <span className="mx-wordmark">MemWal</span>
            <span className="mx-topbar__links">
              <span>How it works</span>
              <span>Docs</span>
              <span>GitHub</span>
            </span>
            <Button>Sign in</Button>
          </div>
          <div className="mx-landing__hero">
            <div className="mx-display">
              Teach your agents once.
              <br />
              <span className="mx-accent">Every teammate's IDE remembers it.</span>
            </div>
            <div className="mx-lede">
              Skills live in a Walrus Console bucket. Team rules live in Walrus Memory. Access is checked on Sui.
            </div>
            <div className="mx-ctas">
              <Button primary icon={<Play size={14} strokeWidth={2} />}>Try the demo</Button>
              <Button>Create a space</Button>
            </div>
          </div>
          <div className="mx-compare">
            <div className="mx-compare__task">
              <FileText size={15} strokeWidth={1.75} />
              <span>A contributor opened PR #942 in apps/chatbot. All 8 checks pass. Merge into dev?</span>
            </div>
            <div className="mx-compare__cols">
              <div className="mx-side-result" data-tone="bad">
                <div className="mx-side-result__k">Agent without team rules</div>
                <div className="mx-side-result__v"><CircleX size={18} strokeWidth={1.9} /> Approves and merges</div>
                <Bar w={300} tone={2} />
                <Bar w={240} tone={2} />
              </div>
              <div className="mx-side-result" data-tone="good">
                <div className="mx-side-result__k">Agent with your team's rules</div>
                <div className="mx-side-result__v"><CircleCheck size={18} strokeWidth={1.9} /> Closes it as not planned</div>
                <div className="mx-rulechip">apps/chatbot is retired. Rule by harrymove-ctrl</div>
              </div>
            </div>
          </div>
          <div className="mx-works">
            <span className="mx-works__k">Works with</span>
            {["Claude Code", "Cursor", "Codex", "Antigravity", "Tatum AI"].map((n) => (
              <span className="mx-works__n" key={n}>{n}</span>
            ))}
          </div>
        </div>
      </Window>
    </Frame>
  );
}

const LIBRARY = [
  { cat: "Workflows" },
  { n: "gh-issue-fixed", c: 1 },
  { n: "memwal-review", c: 3, on: true },
  { n: "memwal-qa", c: 2 },
  { n: "routing" },
  { cat: "Rust and relayer" },
  { n: "rust-async-patterns", c: 1 },
  { n: "rust-best-practices" },
  { n: "rust-testing" },
  { cat: "QA and design" },
  { n: "ui-ux-qa", c: 1 },
  { n: 120 },
  { n: 96 },
  { n: 108 },
];

/** Skills: library, the skill with its rules on top, then the document. */
export function Skills() {
  return (
    <Frame>
      <Window sidebar={<Sidebar place="skills" counts={{ skills: "19" }} />} title="memwal-review" toolbar={<><Button icon={<History size={14} strokeWidth={1.75} />}>History</Button>
                <Button icon={<Play size={14} strokeWidth={1.75} />}>Try it</Button>
                <Button>Edit</Button></>} sidebarWidth={212} className="mx-window">
        <div className="mx-split">
          <div className="mx-lib">
            <div className="mx-search"><Search size={14} strokeWidth={1.75} /> <span>Search 19 skills</span></div>
            {LIBRARY.map((s, i) =>
              "cat" in s ? (
                <div className="mx-lib__cat" key={i}>{s.cat}</div>
              ) : typeof s.n === "number" ? (
                <div className="mx-lib__row" key={i}><Bar w={s.n} /></div>
              ) : (
                <div className="mx-lib__row" key={i} data-on={s.on || undefined}>
                  <span className="mx-lib__name">{s.n}</span>
                  {s.c && <span className="mx-lib__count">{s.c}</span>}
                </div>
              ),
            )}
          </div>
          <div className="mx-doc">
            <div className="mx-intro">Saved 2h ago by harrymove-ctrl · revision 4</div>
            <Card title="Team rules" meta="2 of 3 on">
              {[
                { t: "Staging is retired, so promote directly from dev to main.", by: "teammate-qa", age: "1h", on: true },
                { t: "Require 100% green CI and deploy checks before approving any PR.", by: "harrymove-ctrl", age: "3d", on: true },
                { t: "Post in #release before promoting to main.", by: "mysten-dev", age: "6d", on: false },
              ].map((r) => (
                <div className="mx-rule" key={r.t} data-off={!r.on || undefined}>
                  <div className="mx-rule__body">
                    <div className="mx-rule__t">{r.t}</div>
                    <div className="mx-rule__m">{r.by} · {r.age}</div>
                  </div>
                  <Toggle on={r.on} />
                </div>
              ))}
              <div className="mx-addrule">
                <span className="mx-addrule__field">Add something the team learned</span>
                <Button primary>Add rule</Button>
              </div>
            </Card>
            <div className="mx-docbody">
              <div className="mx-h2">MemWal environment review</div>
              <div className="mx-para">Review the latest merged PRs through code review, automated checks, real user flows and Railway logs.</div>
              <Bar w={520} tone={2} />
              <Bar w={460} tone={2} />
              <div className="mx-h3">Workflow for every PR</div>
              <div className="mx-para">1. Identify the environment from the branch: dev, or main for production.</div>
              <div className="mx-para">2. Check that the merge commit is deployed on Railway.</div>
              <Bar w={480} tone={2} />
              <Bar w={430} tone={2} />
            </div>
          </div>
        </div>
      </Window>
    </Frame>
  );
}

/** Team: invite, members verified on Sui through the Tatum Sui RPC. */
export function Team() {
  return (
    <Frame>
      <Window sidebar={<Sidebar place="team" counts={{ skills: "19" }} />} title="Team" toolbar={<><Button icon={<Link2 size={14} strokeWidth={1.75} />}>Copy invite link</Button></>} sidebarWidth={212} className="mx-window">
        <div className="mx-main">
          <div className="mx-intro">Who can read and teach in this space</div>
          <Card>
            <div className="mx-invite">
              <span className="mx-input">Sui address or name.sui</span>
              <span className="mx-select">Editor</span>
              <Button primary icon={<UserPlus size={14} strokeWidth={1.75} />}>Add</Button>
            </div>
          </Card>
          <Card title="Members" meta="3">
            {[
              { h: "harrymove-ctrl", id: "0x649e…4be1", role: "Owner", v: "Key on account, verified via Tatum Sui RPC", ok: true },
              { h: "mysten-dev", id: "0x8a25…e124", role: "Editor", v: "Key on account, verified via Tatum Sui RPC", ok: true },
              { h: "teammate-qa", id: "0x58db…29f1", role: "Viewer", v: "Address check clean, waiting for their key", ok: false },
            ].map((m) => (
              <div className="mx-member" key={m.h}>
                <Avatar name={m.h} size={32} />
                <div className="mx-member__who">
                  <div className="mx-member__name">{m.h} <IdPill>{m.id}</IdPill></div>
                  <div className="mx-member__v" data-ok={m.ok || undefined}>
                    {m.ok ? <ShieldCheck size={13} strokeWidth={2} /> : <span className="mx-pending" />}
                    {m.v}
                  </div>
                </div>
                <span className="mx-role">{m.role}</span>
              </div>
            ))}
          </Card>
          <Card title="Access changes" meta="Last 7 days">
            <Row lead={<AgentGlyph><ShieldCheck size={15} strokeWidth={1.75} /></AgentGlyph>} title={<span><b>harrymove-ctrl</b> rotated their key</span>} subtitle={<span>Old key removed on Sui <IdPill>AhjZ…d4F1</IdPill></span>} meta="1d" />
            <Row lead={<Avatar name="teammate-qa" size={28} />} title={<span><b>teammate-qa</b> added as Viewer</span>} subtitle="Tatum address check: clean" meta="2d" />
          </Card>
          <div className="mx-proofnote">
            Account <IdPill>0x463e…eb1d</IdPill> has 3 keys · read through the Tatum Sui RPC 1 minute ago
            <ArrowUpRight size={13} strokeWidth={1.9} />
          </div>
        </div>
      </Window>
    </Frame>
  );
}

const AGENTS = [
  { n: "Claude Code", s: "Connected", on: true, sel: true },
  { n: "Cursor", s: "Connected", on: true },
  { n: "Codex", s: "Not set up" },
  { n: "Antigravity", s: "Not set up" },
  { n: "Tatum AI", s: "Not set up" },
];

/** Agents: pick a tool, copy one setup, see it connect. */
export function Agents() {
  return (
    <Frame>
      <Window sidebar={<Sidebar place="agents" counts={{ skills: "19" }} />} title="Agents" sidebarWidth={212} className="mx-window">
        <div className="mx-main">
          <div className="mx-intro">Coding tools that recall this space's rules</div>
          <div className="mx-tiles">
            {AGENTS.map((a) => (
              <div className="mx-tile" key={a.n} data-on={a.sel || undefined}>
                <AgentGlyph size={30}><Bot size={16} strokeWidth={1.75} /></AgentGlyph>
                <div className="mx-tile__n">{a.n}</div>
                <div className="mx-tile__s" data-ok={a.on || undefined}>{a.s}</div>
              </div>
            ))}
          </div>
          <Card title="Set up Claude Code" meta="Run once in your terminal">
            <div className="mx-code">
              <div><span className="mx-code__p">$</span> claude mcp add memwal \</div>
              <div>    -e MEMWAL_NAMESPACE=memwal-team-skills \</div>
              <div>    -e MEMWAL_PRIVATE_KEY=<span className="mx-code__mask">your key</span> \</div>
              <div>    -- npx -y @mysten-incubation/memwal-mcp</div>
            </div>
            <div className="mx-setupfoot">
              <div className="mx-connected"><Check on size={18} /> Connected · last recall 2 min ago from memwal-qa</div>
              <Button primary icon={<Copy size={14} strokeWidth={1.75} />}>Copy setup</Button>
            </div>
          </Card>
          <Card title="Connected to this space" meta="2">
            <Row lead={<AgentGlyph><Bot size={15} strokeWidth={1.75} /></AgentGlyph>} title="Claude Code · harrymove-ctrl" subtitle="Last recall 2 min ago from memwal-qa" meta={<span className="mx-dot" data-on />} />
            <Row lead={<AgentGlyph><Bot size={15} strokeWidth={1.75} /></AgentGlyph>} title="Cursor · mysten-dev" subtitle="Last recall 12 min ago from memwal-review" meta={<span className="mx-dot" data-on />} />
          </Card>
        </div>
      </Window>
    </Frame>
  );
}

/** Try it: one task, two outcomes, the rule that made the difference. */
export function TryIt() {
  return (
    <Frame>
      <Window sidebar={<Sidebar place="try" counts={{ skills: "19" }} />} title="Try it" sidebarWidth={212} className="mx-window">
        <div className="mx-main">
          <div className="mx-intro">Run one task with and without the team's rules</div>
          <Card>
            <div className="mx-task">
              <span className="mx-select">memwal-qa</span>
              <span className="mx-task__text">A contributor opened PR #942 fixing a markdown bug in apps/chatbot. All 8 checks pass. Should we merge it into dev?</span>
              <Button primary icon={<Play size={14} strokeWidth={2} />}>Run</Button>
            </div>
          </Card>
          <div className="mx-grid mx-grid--even">
            <Card title="Without the team's rules">
              <div className="mx-out" data-tone="bad"><CircleX size={18} strokeWidth={1.9} /> Approves and merges</div>
              <div className="mx-plan">
                <div>1. Build apps/chatbot and run the UI check</div>
                <div>2. All 8 checks are green</div>
                <div>3. Approve PR #942 and merge into dev</div>
              </div>
            </Card>
            <Card title="With the team's rules">
              <div className="mx-out" data-tone="good"><CircleCheck size={18} strokeWidth={1.9} /> Closes it as not planned</div>
              <div className="mx-plan">
                <div>1. Recall memwal-qa rules: 2 found</div>
                <div>2. apps/chatbot is a retired demo app</div>
                <div>3. Close PR #942 with a note, no QA run</div>
              </div>
            </Card>
          </div>
          <Card title="Rule that changed the outcome">
            <div className="mx-rule">
              <div className="mx-rule__body">
                <div className="mx-rule__t">Skip retired demo apps (chatbot, noter, researcher) during QA and close their PRs as not planned.</div>
                <div className="mx-rule__m">harrymove-ctrl · stored in Walrus Memory</div>
              </div>
              <Text className="mx-link">Open in Skills</Text>
            </div>
          </Card>
          <Card title="Recent runs" meta="This week">
            <Row title="memwal-review · Promote release 1.4 to main" subtitle="With rules: promotes from dev, skips staging" meta="1d" />
            <Row title="memwal-qa · PR #951 in apps/app" subtitle="Same outcome with and without rules" meta="2d" />
            <Row title={<Bar w={280} />} subtitle={<Bar w={200} />} meta={<Bar w={18} />} />
          </Card>
        </div>
      </Window>
    </Frame>
  );
}

export const CONCEPTS = {
  "home-calm": HomeCalm,
  "home-command": HomeCommand,
  landing: Landing,
  skills: Skills,
  "try-it": TryIt,
  team: Team,
  agents: Agents,
} as const;

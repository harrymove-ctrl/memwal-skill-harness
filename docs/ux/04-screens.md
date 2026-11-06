# 4. Information architecture and screen specs

## New navigation

Five places, in a left sidebar on desktop and a bottom bar on mobile. The header keeps only the space switcher and the user menu.

| Place | Replaces | Primary question it answers |
| :--- | :--- | :--- |
| **Home** | nothing (new) | Is my team's playbook healthy, and what changed? |
| **Skills** | Skills | What do our agents know, and how do I change it? |
| **Try it** | Playground | Does a rule actually change what an agent does? |
| **Team** | half of Connect | Who is in this space, and are they verified? |
| **Agents** | the other half of Connect | Which coding tools use this space, and are they working? |

Proof (bucket, blobs, transactions, mainnet count) moves into a drawer opened from a small "Proof" button on Home and from any item's menu. Raw hashes never appear in the main scan path.

## Global rules for every screen

1. One primary button per view, filled emerald with dark text (`on-accent`). Everything else is secondary or a text button.
2. Dark first: every screen is designed on the dark tokens in `05-design-system.md` and checked in light afterwards.
3. Sans serif (Inter) for all UI text. Monospace only for code, file names, commands and identifiers.
4. Sentence case labels. No tracked uppercase except one optional section eyebrow per view.
5. Type scale: 12, 14, 16, 20, 28 and 40px. At most 4 sizes on one screen. Body text 14px on desktop, 16px on mobile.
6. Controls at least 32px tall on desktop; the primary action at least 44px on mobile.
7. Identifiers are single line pills: `0x463e…eb1d` with a copy button and the full value in a tooltip.
8. 0px horizontal overflow at 390px wide.

## Home

**Purpose:** drive activation, then show the team's agents at work.
**Primary action:** before activation, the next unchecked step (for example "Connect your agent"); after activation, none (Home is a view, and each card opens its place).

Home has two states in the dark command center direction.

### Before activation (concept: `concepts/stills-dark/home-calm.png`)

1. Window title: the space name, member avatars and a "Proof" button in the bar; one intro line under it.
2. Getting started checklist: create space, import skills, add a rule, invite a teammate, connect an agent. Each row has its own button and ticks from real events.
3. Last check card: the before and after verdicts from Try it and the rule that changed them, so a first visitor sees the value.
4. Activity: the last events with actor, verb, object and time.

### After activation, the Live view (concept: `concepts/stills-dark/home-command.png`)

1. Window title "Live" with a live pill ("2 agents active") in the bar.
2. Rules applied today: one big number, the change from yesterday, and a bar chart of the last 12 hours.
3. Agents now: each connected agent with a status dot and what it is doing ("Recalling memwal-qa", "Idle, last recall 12m ago", "Offline for 2 days").
4. Stream: every use of a rule, newest first ("Claude Code used Skip retired demo apps during QA on PR #942"), each row opening its proof.
5. The checklist collapses to a single "Activated" line at the top of Live, with a link to reopen it.

Empty state: before any agent connects, the Live view never shows; the checklist stays.

## Skills

Concept: `concepts/stills-dark/skills.png`.

**Purpose:** read and change what agents know.
**Primary action:** "Save" while editing, otherwise "Add rule".

Layout: library column (search, category filter, skill list with a rule count), document column, right rail.

1. Document header: skill name, category, "Saved 2h ago by @harrymove-ctrl", and Edit, Try it and a menu (copy, download, proof, delete).
2. Rules block above the document: each rule is one row with its text, author, age, an on/off toggle and a menu (edit, bake, proof, delete). An inline field adds a rule.
3. The SKILL.md document, rendered. Edit switches the column to a split editor with a live preview.
4. Right rail tabs: History (revisions with author and a diff) and Used by (agents that recalled this skill recently).

Empty state: "This space has no skills yet" with Import and Start from template.

## Try it

Concept: `concepts/stills-dark/try-it.png`.

**Purpose:** prove a rule changes an outcome.
**Primary action:** "Run".

Layout: a single task card at the top (skill picker, task text with a preset, Run), then two result columns, "Without the team's rules" and "With the team's rules", each with a verdict pill and the agent's plan. Below, "Rules that changed the outcome" lists the rules with links back to Skills.

States: running streams the plan in each column; a failed live run falls back to the recorded run with a "Recorded" label.

## Team

Concept: `concepts/stills-dark/team.png`.

**Purpose:** control access and show it is real.
**Primary action:** "Invite".

Layout: invite bar (link copy, or an address or SuiNS name with a role picker and an Add button), then the member list. Each row shows avatar, handle, a short address pill, role, and a verification line: "Key on account, verified via Tatum Sui RPC" or "Pending" or "Flagged by address check".

Rules: only the owner sees role changes and remove; adding an address runs the Tatum address check first; nobody is auto registered.

## Agents

Concept: `concepts/stills-dark/agents.png`.

**Purpose:** connect coding tools and confirm they work.
**Primary action:** "Copy setup" for the selected agent.

Layout: agent picker as large tiles (Claude Code, Cursor, Codex, Antigravity, Tatum AI) with their real logos. Selecting one shows a single setup command or config, a "Copy setup" button and a live status: "Waiting for first recall" then "Connected, last recall 2 min ago from memwal-qa". Below, a table of every connected agent with member, last seen and a disconnect action.

## Proof drawer

Opened from Home or any item. Shows, each with a copy button and an external link: Console bucket and file ids, Walrus blob ids, the Sui account and its delegate keys, recent transaction digests (read through the Tatum Sui RPC), and the space's mainnet memory count.

## Landing (signed out)

Concept: `concepts/stills-dark/landing.png`.

**Purpose:** explain and convert.
**Primary action:** "Try the demo".

One sentence headline ("Teach your agents once. Every teammate's IDE remembers it."), the before and after card, three short value points (team rules in Walrus Memory, skills in a Walrus Console bucket, access checked on Sui), and "Try the demo" plus "Sign in". Wallet and Google options appear only after "Sign in".

## Acceptance checks per screen

Each screen ships only when all of these pass, measured by `node video/scripts/audit-ui.mjs` (extended to the new routes) and a Playwright pass:

| Check | Target |
| :--- | :--- |
| Horizontal overflow at 390px | 0px |
| Text elements under 12px | 0 |
| Distinct font sizes | 4 or fewer |
| Primary buttons in view | exactly 1 |
| Controls under 32px (desktop) | 0, icon buttons excepted when 28px with a 32px hit area |
| Loading, empty, error, offline and read only states | each reachable with a query flag (`?state=empty`) and screenshotted |
| Longest realistic values (66 character address, 80 character skill name, 400 character rule) | no clipping, no overflow |

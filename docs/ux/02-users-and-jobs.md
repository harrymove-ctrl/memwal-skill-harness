# 2. Users, vocabulary and the full job checklist

## The product in one sentence

**MemWal Skill Harness is your team's playbook for coding agents: teach a rule once, and every teammate's agent follows it.**

The SKILL.md files live in a Walrus Console bucket. The team rules live in Walrus Memory. Access is checked on Sui, and member and transaction checks read the chain through Tatum.

## Who uses it

| Role | Who | What they come to do | What they must never be able to do |
| :--- | :--- | :--- | :--- |
| **Visitor** | A judge, a curious developer, a teammate before sign in | Understand the value in 10 seconds and try the demo without a wallet | Write anything, see any key |
| **Owner** | The person who created the team space | Set up the space, import skills, invite people, connect agents, review what changed | Lose control of the space when a teammate leaves |
| **Editor** | A teammate with read and write access | Read skills, teach rules, edit SKILL.md files, connect their own agent | Remove the owner, change roles |
| **Viewer** | A teammate or contractor with read only access | Read skills and rules, connect an agent that only recalls | Teach rules, edit files |
| **Agent** | Claude Code, Cursor, Codex, Antigravity, Tatum AI through MCP | Recall the rules for the skill it is running, remember a new rule it learned, report what it used | Act outside its namespace |

## Vocabulary (use these words in the UI)

| Say this | Instead of | Meaning |
| :--- | :--- | :--- |
| **Space** | namespace, bucket, folder, vault | One team's playbook: its skills, rules, members and agents |
| **Skill** | SKILL.md node, `[SKILL:id]` | A playbook file an agent loads for one kind of job |
| **Rule** | flow memory, fact, plan gate, `[FLOW:id]`, team rule | One line the team has learned, attached to a skill, newest wins |
| **Member** | delegate, signer, ACL entry | A person in the space with a role |
| **Agent** | MCP client, harness, IDE | A coding tool connected to the space |
| **Activity** | receipts, agent log, `[AGENT_LOG]` | Who taught, edited or recalled what, and when |
| **Try it** | Playground, trajectory eval, Check Facts and Plan | Run one task with and without the space's rules |
| **Proof** | blob id, tx digest, bucket id, seal policy | The on chain and storage evidence behind an item, shown on demand |

## Status legend

| Status | Meaning |
| :--- | :--- |
| **Works** | Seen working end to end in the current app |
| **Built** | Code exists (UI or API) but was not verified end to end in this audit |
| **Partial** | Part of the job works; the rest is missing or confusing |
| **Simulated** | Looks real on screen but does not do the real thing |
| **Missing** | Not in the product |

Priority: **P0** is needed for the hackathon demo on 10 Nov 2026, **P1** soon after, **P2** later.

## The full checklist of what a user can do

### A. First visit and sign in

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| A1 | See what the product does and why it matters, before signing in | Visitor | Missing | P0 |
| A2 | Watch or step through a 30 second before and after example | Visitor | Partial (the comparison exists after sign in) | P0 |
| A3 | Explore a demo space read only, without a wallet | Visitor | Partial ("Preview (read only)" exists, buried in a card) | P0 |
| A4 | Sign in with Google | Owner, Editor | Simulated (the dev server mints its own signed token) | P1 |
| A5 | Sign in with a Sui wallet | Owner, Editor | Built | P0 |
| A6 | Use an existing delegate key (advanced) | Owner, Editor | Built | P1 |
| A7 | See who I am signed in as, and sign out | All signed in | Works | P0 |

### B. Space

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| B1 | See the space at a glance: skills, rules, members, connected agents, last change | All | Missing | P0 |
| B2 | Follow a getting started checklist until the first agent recall | Owner | Missing | P0 |
| B3 | Create a new space from a template (QA, Review, Release, Frontend) | Owner | Partial (onboarding block, local only) | P1 |
| B4 | Switch between spaces | All | Works | P0 |
| B5 | Open the proof drawer: Console bucket, Walrus blobs, Sui objects, mainnet memory count | All | Partial (a hash chip in the header) | P0 |
| B6 | Rename or archive a space | Owner | Missing | P2 |

### C. Skills

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| C1 | Browse, search and filter skills by category | All | Works | P0 |
| C2 | Read a skill with its active rules shown on top | All | Works | P0 |
| C3 | Edit a SKILL.md with a live preview and save it as a new revision in the Console bucket | Owner, Editor | Built (Console gateway) | P0 |
| C4 | See the revision history of a skill, who saved each one, and a diff | All | Partial (revision number and a Diff button) | P1 |
| C5 | Get a clear conflict message when someone saved first, and merge | Owner, Editor | Built (API returns a conflict) | P1 |
| C6 | Create a skill from a template | Owner, Editor | Partial | P1 |
| C7 | Import SKILL.md files or a folder by drag and drop | Owner, Editor | Missing | P1 |
| C8 | Delete a skill | Owner | Built (API only) | P2 |
| C9 | Copy or download a skill, compiled with its active rules | All | Works | P0 |
| C10 | See which agents used this skill recently | All | Missing | P1 |
| C11 | Keep personal skills out of the team library | Owner | Missing | P1 |

### D. Rules

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| D1 | Add a rule to a skill in one line | Owner, Editor | Works | P0 |
| D2 | Edit a rule; the newer revision replaces the old one everywhere | Owner, Editor | Built (event log) | P0 |
| D3 | Turn a rule off or on, and have that stick after reload and for every agent | Owner, Editor | Built (event log); UI persistence needs a check | P0 |
| D4 | Delete a rule so it never comes back | Owner, Editor | Built (event log) | P0 |
| D5 | See who wrote a rule, when, and its proof on Walrus | All | Partial | P0 |
| D6 | Move a rule into the SKILL.md text for good ("Bake") | Owner, Editor | Built | P1 |
| D7 | Review rules an agent proposed before they go live | Owner | Missing | P2 |

### E. Try it

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| E1 | Pick a skill and a task, then run it with and without the space's rules | All | Works (preset scenario) | P0 |
| E2 | See which rules changed the outcome, with the verdict for each side | All | Works | P0 |
| E3 | Write my own task instead of the preset | All | Partial ("Custom" tab) | P1 |
| E4 | Copy the exact prompt an agent would receive | All | Works | P1 |

### F. Team

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| F1 | Invite a teammate with a link | Owner | Works | P0 |
| F2 | Add a teammate by Sui address or SuiNS name, with a role | Owner | Works | P0 |
| F3 | Change a member's role, or remove them | Owner | Partial (remove only) | P1 |
| F4 | See each member verified on Sui: their delegate key is on the account, read through the Tatum Sui RPC | All | Missing | P0 |
| F5 | See a risk check on an address before adding it (Tatum address security) | Owner | Built (server proxy) | P0 |
| F6 | Stop anyone from joining a space just by asking (no auto registration) | Owner | Simulated (the server adds any address) | P0 |

### G. Connect agents

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| G1 | Pick my coding agent and copy a one line setup | All signed in | Works | P0 |
| G2 | See that my agent is connected: last recall and from which skill | All signed in | Missing | P0 |
| G3 | See every agent connected to the space and when each was last seen | Owner | Missing | P1 |
| G4 | Disconnect an agent or revoke its key | Owner | Missing | P2 |

### H. Activity and proof

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| H1 | Read a feed of what changed: rules taught, skills edited, members added, agents recalling | All | Built (a panel exists, not in the main navigation) | P0 |
| H2 | Filter the feed by member, agent or skill | All | Missing | P1 |
| H3 | Open any item's proof: Walrus blob, Console file, Sui transaction | All | Partial | P0 |
| H4 | See the mainnet memory count for the space (the hackathon asks for at least 10) | All | Partial (a count in the status API) | P0 |

### I. Settings

| # | Job | Role | Status | Priority |
| ---: | :--- | :--- | :--- | :--- |
| I1 | Switch light and dark theme | All | Works | P1 |
| I2 | See which network the space runs on (mainnet or dev) | All | Partial | P1 |
| I3 | Manage keys: see which delegate keys exist and revoke one | Owner | Missing (done by script today) | P2 |

## Activation, in one line

A space is **activated** when its owner has invited one teammate, connected one agent, and that agent has recalled at least one rule. Every screen should push toward that moment, and Home should show it as the getting started checklist.

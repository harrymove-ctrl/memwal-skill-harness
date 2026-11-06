# 3. User flows and state machines

Each flow names its goal, its happy path, and where it can fail. The diagrams are the target behavior, not today's.

## Flow 1. A visitor understands the product and tries it

Goal: in under 30 seconds, a visitor sees a real decision change because of a team rule, without signing in.

```mermaid
flowchart LR
  A["Landing: one sentence and the before and after card"] --> B{"Try the demo or sign in?"}
  B -->|"Try the demo"| C["Demo space, read only, banner says Demo"]
  C --> D["Try it: memwal-qa on PR #942"]
  D --> E["Verdict: without rules approves, with rules closes"]
  E --> F["Call to action: create your own space"]
  B -->|"Sign in"| G["Wallet or Google"]
  F --> G
  G --> H{"Has a space?"}
  H -->|"Yes"| I["Home of that space"]
  H -->|"No"| J["Create a space (Flow 2)"]
```

Failure points: the demo must never ask for a wallet; a failed relayer call shows the recorded result with a "recorded" label instead of an error wall.

## Flow 2. An owner sets up a space until the first recall

Goal: reach activation (one teammate, one agent, one recall) in under 5 minutes.

```mermaid
flowchart TD
  S["Create space: name and template"] --> I["Import skills: drop SKILL.md files or pick a template set"]
  I --> R["Add the first rule to one skill"]
  R --> T["Invite a teammate by link or address"]
  T --> C["Connect an agent: copy the one line setup"]
  C --> W["Waiting for the agent's first recall"]
  W -->|"Recall arrives"| D["Done: checklist complete, activity shows the recall"]
  W -->|"No recall after 2 minutes"| H["Troubleshoot: check the command, the key, the namespace"]
  H --> W
```

The Home checklist mirrors these five steps, each with its own button, and ticks itself from real events.

## Flow 3. Teach once, every agent follows

Goal: a rule written by one person (or learned by one agent) changes the next run of every teammate's agent.

```mermaid
sequenceDiagram
  participant E as Editor
  participant App as Harness
  participant Mem as Walrus Memory
  participant A as Teammate's agent
  E->>App: Add rule to memwal-review
  App->>Mem: remember RULE event
  Mem-->>App: blob id
  App-->>E: Rule saved, proof link
  A->>Mem: recall rules for memwal-review
  Mem-->>A: folded rules, newest wins
  A->>App: activity: recalled 2 rules
  App-->>E: Activity: Claude Code used your rule
```

The last arrow is what makes the product feel alive: the author sees their rule being used.

## Flow 4. A teammate joins

```mermaid
flowchart LR
  L["Open invite link"] --> W["Connect wallet"]
  W --> V["Check: address risk (Tatum security) and role"]
  V -->|"Clean"| K["Register delegate key on the account"]
  K --> P["Verified on Sui through the Tatum Sui RPC"]
  P --> C["Connect my agent"]
  V -->|"Flagged"| X["Owner must approve manually"]
```

## Flow 5. Edit a skill

```mermaid
flowchart LR
  O["Open skill"] --> E["Edit with live preview"]
  E --> S["Save"]
  S -->|"rev matches"| U["Upload revision to Console, move the index, revision n+1"]
  S -->|"someone saved first"| M["Conflict: show their change and mine, merge"]
  U --> H["History shows who saved and the diff"]
  M --> E
```

## State machine: saving a skill

```mermaid
stateDiagram-v2
  [*] --> Viewing
  Viewing --> Editing: Edit
  Editing --> Viewing: Discard (asks if there are changes)
  Editing --> Saving: Save
  Saving --> Saved: Console file completed and index moved
  Saving --> Conflict: newer revision exists
  Saving --> Failed: upload or network error
  Saving --> Offline: no connection
  Conflict --> Editing: Merge or take theirs
  Failed --> Saving: Retry (draft kept)
  Offline --> Saving: Connection back (draft kept)
  Saved --> Viewing
```

Rules for this machine: the Save button is disabled while saving; the draft survives a reload until it is saved; "Saved" appears only after the Console reports completed; every failure keeps the draft and offers Retry.

## State machine: a rule's life

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Active: Add (remember RULE)
  Active --> Active: Edit (new revision, newest wins)
  Active --> Off: Turn off (RULE_STATE off)
  Off --> Active: Turn on (RULE_STATE on)
  Active --> Baked: Bake into SKILL.md (new skill revision, rule off)
  Active --> Deleted: Delete (RULE_STATE deleted)
  Off --> Deleted: Delete
  Deleted --> [*]
```

Every transition is a new event in Walrus Memory, because the store cannot delete. The UI shows the folded state; the history shows the events.

## Screen states every view must handle

| State | What the user sees |
| :--- | :--- |
| Loading | Skeletons in the content's own shape, never a spinner over a blank page |
| Empty | One sentence on what goes here and one button to fill it (for example "No rules yet. Add the first thing your team learned.") |
| Error | What failed in plain words, what was kept, and a Retry button |
| Offline | A banner; edits keep working as drafts and sync when back |
| Read only | Edit controls hidden, a small "Viewer" pill in the header |
| Demo | A persistent "Demo space" banner with "Create your own" |

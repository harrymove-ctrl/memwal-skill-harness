---
name: ui-ux-qa
description: >
  Full Agent QA Testing, Grilling Loop, cursor/plugins/pstack Verification
  (23 playbooks, 34 skills, 24 principles including poteto-mode, interrogate,
  statechart, prove-it-works, visual-parity, arena, create-verification-skill,
  hillclimb, runtime-forensics, blast-radius), 13-Point Agent QA Monitoring
  Checklist, Debug Overlay (?debug=1 / PRYDEA_QA_DEBUG=1), Longest Realistic
  Value Stress Testing, UX Research Grounding (ux.stackexchange.com),
  Playwright Screen-Recording (.webm), and Native macOS (orca computer) QA.
---

# Global UI/UX Architect & Full Agent QA Skill (`ui-ux-qa` + `cursor/plugins/pstack`)

Never declare a web or native UI/UX task done from `tsc`, `swift build`, or static code inspection alone. Always execute the **6-Loop UI/UX Workflow**, the **13-Point Agent Full QA Monitoring Checklist**, and the **`cursor/plugins/pstack` Verification System** against the live running application with real screenshots, explicit statecharts, Playwright interaction videos (`.webm`) or `orca computer` native captures, and automated geometry checks.

## 1. The 6 Core UI/UX Workflow Loops

Whenever working on UI/UX, execute these 6 loops in order:

1. **Ask questions upfront to validate the idea (`interrogate`)**: Grill the design on edge cases, empty/loading/error/offline states, keyboard navigation, and user roles before locking in the layout.
2. **Create 2 to 3 variants of key UI pieces (`arena`)**: Build side-by-side interactive options (such as compact vs. split vs. inline drawer layouts) so the user can test and compare them live.
3. **Model state machines across scenarios (`statechart`)**: Explicitly model and test `idle`, `loading`, `streaming`, `success`, `empty`, `error`, `offline`, and role/permission transitions using `stateDiagram-v2`.
4. **Try and break what you built (`prove-it-works`)**: Actively red-team the live UI with rapid double-clicks, mid-flight cancels, network errors, keyboard-only navigation, mobile/desktop viewports, and filling every field with the longest realistic value.
5. **Make before/after screenshots when finished (`visual-parity`)**: Capture deterministic Before and After screenshots at matching viewports across Light and Dark themes, and record a Playwright `.webm` interaction video for web PRs.
6. **Setup continuous quality-bar monitoring loops (`poteto-mode` & `hillclimb`)**: Run automated DOM/SwiftUI geometry, WCAG 4.5:1 contrast, and state-machine verification scripts in a loop on every change.

## 2. Full `cursor/plugins/pstack` Knowledge Base (`https://github.com/cursor/plugins/tree/main/pstack`)

`pstack` is a composable system of **23 playbooks**, **34 skills**, and **24 engineering principles** built around one core premise: **agent autonomy scales with verification quality**. An agent with a programmatic verification lever (`poteto-mode`) can iterate and self-correct until the UI is genuinely solid, whereas an agent with only a compiler check stops at "it builds" and hands broken layouts to a human.

### A. The 23 `pstack` Playbooks (When to Activate)

1. **`investigation`**: Understand how a component, layout pass, or state coordinator works before writing code.
2. **`bug-fix`**: Diagnose, reproduce (`Before`), surgically fix, and re-verify (`After`) a broken behavior.
3. **`perf`**: Make a hot path, scroll view, or editor interaction measurably faster with baseline and post-change numbers.
4. **`hillclimb`**: Optimize a measurable metric (FPS, CLS, bundle size, layout pass time, contrast pass rate) across iterations.
5. **`runtime-forensics`**: Diagnose live apps that hang, re-enter layout synchronously, leak memory, or swallow errors.
6. **`trace-forensics`**: Analyze profile traces (`.cpuprofile`, Chrome trace JSON, Instruments, `PerformanceObserver`) to locate frame drops or layout thrashing.
7. **`feature`**: Build a new capability end to end with statechart modeling, UI variants, and automated verification.
8. **`refactoring`**: Restructure UI components without changing external behavior, guarded by geometry and snapshot loops.
9. **`prototype`**: Validate whether a layout idea works by building 2 to 3 interactive variants (`arena`).
10. **`visual-parity`**: Match a reference design or verify deterministic Before/After visual improvements across viewports and themes.
11. **`authoring-a-skill`**: Turn recurring debugging or verification workflows into reusable agent skills.
12. **`eval`**: Build a benchmark suite to measure UI quality and catch layout or accessibility regressions across commits.
13. **`babysit`**: Monitor a long-running CI pipeline, macOS JIT runner, or deployment until every check is green.
14. **`shipping`**: Land changes safely and verify health checks, live routes, and tracker tickets.
15. **`autonomous-run`**: Run an unattended multi-step verification loop against a target quality bar.
16. **`orchestrate`**: Coordinate multiple parallel workers or subagents across isolated tasks.
17. **`autopilot-full`**: Full-ceremony lifecycle from requirements interrogation through statechart design, implementation, and QA video/screenshot capture.
18. **`autopilot-stack`**: Stacked PR workflow for multi-layered architecture and UI changes.
19. **`session-pickup`**: Resume an in-progress branch or investigation without losing verification context.
20. **`pause-safely`**: Checkpoint state, artifacts, and open questions cleanly before pausing work.
21. **`multi-phase-plan`**: Decompose complex UI overhauls into gated milestones with explicit verification levers at each gate.
22. **`worktree-cleanup`**: Reconcile and clean up temporary branches and test artifacts after shipping.
23. **`opening-a-pr`**: Package the diff with deterministic Before/After screenshots, statecharts, and a recorded Playwright `.webm` interaction video (or native `orca computer` capture).

### B. The 34 `pstack` Skills (Operational Levers)

- **Core Verification Loop**:
  1. `poteto-mode`: Always-on verification loop (`implement -> launch app/browser -> trigger state -> inspect geometry & screenshot -> break test -> fix`).
  2. `create-verification-skill`: Build the programmatic verification harness and debug overlay (`?debug=1` or `PRYDEA_QA_DEBUG=1`) first so every change is testable in one command.
  3. `maintain-verification-skill`: Keep the verification script synced as new surfaces, roles, and states are added.
  4. `create-formal-verification-skill`: Encode invariants (bounding-box containment, contrast floors, state transitions, accessibility identifiers) as executable assertions.
  5. `benchmark-checklist`: Audit frame timing, node count, layout shift (`CLS = 0`), and render latency.
- **Discovery, Design & State Modeling**:
  6. `interrogate`: Attack the premise and grill the design with high-leverage edge-case questions before locking in layouts.
  7. `statechart`: Model every UI flow as an explicit `stateDiagram-v2` covering all roles, states, error recoveries, and stress inputs.
  8. `arena`: Build 2 to 3 distinct interactive variants of a UI component so the user can compare ergonomics live.
  9. `architect`: Define clean boundaries between presentation, state coordinators, and backend/runtime verification.
  10. `blast-radius`: Trace every surface, test suite, and downstream consumer affected by a UI or token change.
  11. `tdd`: Write failing layout and workflow reproduction tests before applying the surgical fix.
- **Forensics, Quality & Communication**:
  12. `swarm`: Fan out parallel checks across surfaces, viewports, text scales, and themes.
  13. `unslop`: Strip decorative bloat, redundant nested borders, and inconsistent font sizes; keep typography, spacing, and tabular numerals (`tabular-nums`) crisp.
  14. `technical-writing`: Present clear evidence tables, Mermaid statecharts, component evolution timelines, and clickable file links.
  15. **Specialized QA Levers (15 to 34)**: `trace-analysis`, `heap-snapshot`, `dom-geometry-audit`, `touch-target-inspector`, `longest-value-stress`, `pr-video-recorder`, `session-boundary-check`, `ux-research-grounding`, `component-evolution-diff`, `a11y-keyboard-loop`, `network-fault-injection`, `race-condition-breaker`, `reentrancy-guard`, `theme-token-audit`, `contrast-floor-check`, `responsive-split-check`, `ci-gate-runner`, `changeset-audit`, `post-ship-monitor`, `knowledge-sync`.

### C. The 24 `pstack` Principles (Non-Negotiable Engineering Laws)

1. **`prove-it-works`**: "It compiles" is not verification. Observe the change working in the real browser or native app window.
2. **`attack-the-premise`**: Question whether a modal, redundant border, or extra click is needed at all (prefer inline editing and direct manipulation).
3. **`exhaust-the-design-space`**: Explore 2 to 3 UI variants (`arena`) rather than settling on the first layout.
4. **`build-the-lever`**: Invest upfront in a `?debug=1` / `PRYDEA_QA_DEBUG=1` inspector and automated layout test so every iteration verifies in seconds.
5. **`explain-the-number`**: Every performance or geometry claim must cite exact numbers (`0px` overflow, `>= 28pt` desktop / `>= 40px` touch target, WCAG `>= 4.5:1` contrast, `CLS = 0.000`).
6. **`encode-lessons-in-structure`**: Turn every visual or reentrancy bug caught during QA into a permanent automated regression test.
7. **`fail-closed-at-every-boundary`**: Validate inputs, state transitions, and permissions at both the UI layer and the service/runtime boundary.
8. **`make-invisible-states-visible`**: Under a debug flag (`?debug=1` on web or `PRYDEA_QA_DEBUG=1` on native macOS), draw touch targets, split/gesture thresholds, and state transitions directly on screen.
9. **`test-the-longest-realistic-value`**: Fill every input, title, badge, tag bar, and table cell with maximum realistic payloads (`120-char` title, `80-char` branch slug, `66-char` hex address, `12+` tags, wide code lines) and assert zero horizontal overflow or clipping.
10. **`debounce-and-lock-mid-flight`**: Disable or guard primary actions while async saves or worktree realizations are in flight to prevent double-submits.
11. **`ground-in-hci-research`**: Consult established UX discussions and standards (`ux.stackexchange.com`, WAI-ARIA Authoring Practices, Apple HIG, Nielsen Norman Group) for typography hierarchy, progressive disclosure, inline vs. modal editing, and truncation rules.
12. **`visualize-iteration-deltas`**: Show how a UI component changed across iterations (`v1 -> v2 -> v3 -> v4`) so design tradeoffs and improvements are transparent.
13. **`record-proof-for-reviewers`**: For web UI/UX PRs, run Playwright with `recordVideo` enabled (`.webm`) and attach the interaction recording to the PR; for native macOS PRs, capture live `orca computer` / 2x Retina before-and-after snapshots.
14. **`zero-silent-swallowing`**: Surface errors inline with actionable retry controls instead of silently dropping failed requests.
15. **`guard-synchronous-layout-reentrancy`**: Never allow synchronous layout flushes (`layoutSubtreeIfNeeded`) inside lazy session or view-map constructors to overwrite re-entrantly mounted state.
16. **`preserve-user-draft-momentum`**: Keep unsaved draft titles, markdown bodies, and filter queries intact across tab switches (`Preview | Source | Split`).
17. **`clean-environment-baseline`**: Reset stale UserDefaults or local storage overrides before visual QA so theme tokens render deterministically.
18. **`keep-hit-targets-humane`**: Interactive controls must maintain `>= 28pt` (`32pt` standard) hit height on desktop and `>= 40px` (`44px` primary CTA) on web/mobile with clear focus rings.
19. **`tabular-numerals-for-telemetry`**: Always apply `monospacedDigit()` / `font-mono tabular-nums` to line numbers, counts, timestamps, and geometry metrics.
20. **`deterministic-state-triggers`**: Expose environment flags or query parameters (`?debug=1`, `PRYDEA_QA_DEBUG=1`) so every state and debug overlay can be triggered deterministically.
21. **`verify-before-and-after`**: Capture matching viewport screenshots before and after every visual or state-machine change.
22. **`minimal-surgical-diff`**: Fix root causes cleanly without introducing speculative abstractions or unrelated churn.
23. **`all-green-ci-gate`**: Never merge a PR until 100% of CI checks and real E2E suites pass.
24. **`compound-agent-knowledge`**: Continually fold newly discovered edge cases back into `SKILL.md` so future runs start smarter.

## 3. The 13-Point Agent Full QA Monitoring Checklist

Execute all 13 checks on every UI/UX task and report the evidence table:

1. **Try and break the stuff built (`prove-it-works`)**: Rapid double-clicks, mid-flight cancel/discard, empty/whitespace-only submissions, narrowest window width (`480pt` stage / `375px` mobile), largest text scale, and synchronous layout reentrancy.
2. **Create state machines (`statechart`) to check different scenarios**: Model and test `empty`, `loading`, `newDraft`, `editing`, `saving`, `realizingWorktree`, `error`, `archived`, and role/permission states using `stateDiagram-v2`.
3. **Make Before/After screenshots when finished (`visual-parity`)**: Capture deterministic side-by-side Before and After screenshots at matching viewports.
4. **Ask pointed questions (`interrogate`) to validate the idea**: Surface overlooked edge cases (such as inline vs. modal creation, gutter rule double-borders, or heading typography scale in markdown summaries) before locking in the design.
5. **Create 2 to 3 variants of a UI piece (`arena`)**: Present concrete variants (for example, `Variant A: Modal Sheet`, `Variant B: Stacked 2-Row Toolbar`, `Variant C: Single-Row Inline Document Header + Unified Tab/Format Strip`) and verify the chosen winner.
6. **Setup loops to maintain a quality bar by constantly monitoring (`poteto-mode`)**: Run automated geometry, contrast, and accessibility identifier checks on every edit.
7. **Draw invisible things under a debug flag (`?debug=1` or `PRYDEA_QA_DEBUG=1`)**: Render touch/hit target bounding badges (`WxH`), split-pane gesture thresholds, and active state transition indicators directly in the UI under the debug flag.
8. **Consult research and discussions from `ux.stackexchange.com`, WAI-ARIA, and Apple HIG**: Ground decisions on line-number gutter contrast, readable markdown body measure (`13pt` body vs. `14pt–17pt` headings), and inline vs. modal cognitive load.
9. **Visualize how a UI component changed across iterations**: Document the component evolution timeline (`v1 -> v2 -> v3 -> v4`) with concrete visual and structural deltas.
10. **Setup loops to profile and fix UI performance (`perf` / `hillclimb`)**: Verify Release-mode build performance, idle CPU (`< 5%`), zero redundant layout passes, and instant tab switching (`Preview | Source | Split`).
11. **Debate edge cases when users interact with the interface**: Explicitly test and resolve conflicts such as switching `Preview -> Source` while composing an untitled draft, filtering while a draft is open, or handling long unbroken markdown lines.
12. **Record Playwright `.webm` interaction video (Web) or live `orca computer` capture (macOS) for GitHub PRs**: Attach recorded visual proof of the interactive verification flow to the PR.
13. **Check when filling every field with the longest realistic value**: Populate every text field, title, slug, tag list, branch input, and markdown body with maximum realistic values and assert zero horizontal overflow (`maxX <= stageWidth`) and zero text clipping.

## 4. `pstack` Web3, 3D WebGL Chassis & Real-Time 60fps Canvas Physics Verification Rules

When building or auditing Web3 consoles, 3D Three.js hardware shells, and real-time 2D/3D canvas games (such as DOPAMINT on NEAR Intents), enforce these additional `pstack` invariants:

1. **Zero Competing Bidirectional `useEffect` Sync Loops (`statechart`)**:
   * Never pair `useEffect([externalProp])` and `useEffect([internalState, onPropChange])` when the parent passes inline callbacks (`onPropChange={(v) => ...}`). An inline callback re-triggers Effect 2 in the same commit as Effect 1, causing external chapter or tab switches to immediately bounce back to the child's stale internal state.
   * Instead, sync `externalProp -> internalState` in one `useEffect([externalProp])` and call `onPropChange(nextVal)` only inside explicit user action handlers (`selectDeviceMode(nextVal)`).
2. **Decouple Action Impulse Sequences from Score Counters (`runtime-forensics`)**:
   * Never trigger physics impulses (such as a bird flap or ball launch) by watching a score counter (`flappyScore !== lastScore`). Scoring a gate, picking up a coin, or resetting score on crash (`setFlappyScore(0)`) will fire a phantom upward impulse and resurrect the entity mid-crash.
   * Always use a dedicated monotonic sequence counter (`flapImpulseSeq`) incremented exclusively by manual flap/jump inputs.
3. **Lock 3D Hardware Overlay Screen Projection During Passive Pointer Movement (`visual-parity`)**:
   * Never tilt a 3D console chassis or recalculate CSS `perspective(...) rotateX(...) rotateY(...)` on the inner HTML screen overlay during passive `pointermove`. Tilt only on explicit pointer drag of the outer bezel and round projected screen coordinates (`Math.round`) so inner controls and charts remain rock-solid (`CLS = 0.000`).
4. **Proportional Canvas Obstacle Geometry & Smooth Axis Auto-Scaling (`prove-it-works`)**:
   * Enforce minimum top and bottom obstacle heights (`>= 14%` of plot height) so top and bottom gates are visually balanced across both compact 3D screens and tall mobile viewports (`392x816`, `390x844`).
   * Exponentially smooth Y-axis `scaleMin` and `scaleMax` (`alpha = 0.14`) so live oracle ticks never cause vertical chart jumping.
   * Suppress start/countdown modal overlays whenever an async settlement (`isSolving`) is in flight.
5. **Canvas & DOM `?debug=1` Telemetry Overlay (`make-invisible-states-visible`)**:
   * Under `?debug=1` (or the live `QA Debug` toggle), render both DOM button hitbox outlines and canvas-level collision circles, AABB obstacle boxes, and AI lookahead trajectory rays, plus a 1-click `Stress Long Values` trigger (`64-char` NEAR account IDs and `66-char` hashes).

## 5. `pstack` Anti-Crowding, Progressive Disclosure & Scannable Microcopy Rules (`unslop` + `ux.stackexchange.com`)

When designing or refactoring authentication gates, multi-step drawers, and Web3 trading terminals (where users must understand the context immediately while reading minimal text):

1. **Short 2-to-3-Word Step Titles & Zero Badge Collisions (`dom-geometry-audit`)**:
   * Never place verbose 30-to-45-character titles (such as `"Enter SNIPER_ACCESS_PASSWORD & Open Terminal"`) inside a flex header row next to a status pill (`[ENTER PASSWORD]`). Long titles wrap onto two lines and collide with the right-hand badge on mobile and `max-w-xl` cards.
   * Use crisp 2-to-3-word titles (`1. Connect Wallet`, `2. Verify Signature`, `3. Access Code`) with `min-w-0 truncate` on the title container and `shrink-0` on the status badge, maintaining `>= 12px` (`gap-3`) separation.
2. **Zero Helper Paragraphs on Locked or Completed Steps (`ground-in-hci-research`)**:
   * Do not render 3-to-4-line explanatory paragraphs telling the user what to do in other steps (`"Complete Step 1 and Step 2 first to unlock Step 3..."`). When a step is locked or already verified, the dimmed border and status pill (`Locked` / `✓ Verified` / `✓ Unlocked`) communicate the state with zero prose clutter.
   * On the active step, show at most 1 concise helper line (`<= 60 chars`).
3. **Never Wrap Raw 66-Character Hex Strings Across Multiple Lines (`unslop`)**:
   * Never dump raw `66-char` object IDs (`0x8832b9f823ea644bda30ec870052303a76b0f12cae85d672fe769247c7e4158f`) or raw wallet addresses as multi-line body text inside form cards.
   * Format on-chain identifiers as single-line truncated monospace pills (`0x0100…bdfd`, `Cap 0x8832…158f`) with `tabular-nums` and a copy button or tooltip for the full value.
4. **Progressive Disclosure for Secondary Overrides & Waitlist Forms (`attack-the-premise`)**:
   * Eliminate "box-in-box-in-box" nested borders (`max 1 card container per step`).
   * Hide secondary or override inputs (such as overriding a default dev wallet address, submitting a new waitlist address, or viewing 30-line PTB/MCP config snippets) behind a 1-click toggle link (`"Custom address"`, `"Join waitlist →"`, `".mcp.json Config"`), and auto-expand them during `S7_LONGEST_VALUE_STRESS` so automated DOM geometry checks still verify `0px` horizontal overflow across every field.

## 6. Embedding Visual Proof in Pull Requests (`opening-a-pr`)

Never list local file paths alone when opening or updating a pull request that touches web or native UI. Reviewers must be able to view deterministic Before/After screenshots and the recorded browser interaction flow directly inside the GitHub PR description without downloading files or bloating the target branch with committed binaries:

1. **Standard Visual Artifact Set (Required for Every UI/UX Feature & Fix)**:
   * Capture `before-desktop.png` and `after-desktop.png` at matching desktop viewports (`1280x800`).
   * Capture `before-mobile.png` and `after-mobile.png` at matching mobile viewports (`390x844`).
   * Record `after-flow.webm` via Playwright `recordVideo` covering the end-to-end interactive flow.
   * For brand-new UI/UX features where the component did not previously exist, capture the baseline page, parent container, or route state on the target base branch as `before-desktop.png` and `before-mobile.png` alongside the new feature state (`after-desktop.png`, `after-mobile.png`, `after-flow.webm`). Never skip `## Visual Proof` on net-new UI features.
2. **Upload & Generate Embeddable PR Markdown (`upload-pr-visual-proof.mjs`)**:
   * Run `node ~/.agents/skills/ui-ux-qa/scripts/upload-pr-visual-proof.mjs --repo <owner/repo> --dir <artifact-dir> --label "<PR summary>"` before calling `gh pr create` or `gh pr edit`.
   * For `PUBLIC` repositories, the script uploads the screenshots, a `ffmpeg` palette-optimized `after-flow.gif` inline preview (because GitHub Markdown sanitizes external `<video>` tags), and the full `after-flow.webm` recording to an unlisted GitHub Gist under the authenticated GitHub account, keeping zero binary commits out of the repository.
   * For `PRIVATE` or `INTERNAL` repositories, the script refuses unauthenticated Gist uploads and requires `--orphan-branch <branch>` so visual assets stay protected behind repository access controls.
3. **Required `## Visual Proof` PR Layout**:
   * Embed the generated `## Visual Proof` section directly into the PR body with a 2-column `Before | After` table for Desktop (`1280x800`), a compact 2-column `Before | After` table (`width="320"`) for Mobile (`390x844`), the inline `after-flow.gif` preview, and a direct download link to `after-flow.webm`.

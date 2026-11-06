# Handoff to Antigravity: wiring the dark command center into `src/App.tsx`

Antigravity owns `src/App.tsx` for the whole build (decided 3 Nov 2026). Claude builds every new screen as a component driven only by props, in new files, and never edits `App.tsx`. This file is the contract between the two: what Claude ships, and what Antigravity wires.

Read first: `04-screens.md` (what each screen does), `05-design-system.md` (dark tokens), `07-build-plan.md` (steps, owners, days).

## Files each agent may change

| Agent | Owns | Never edits |
| :--- | :--- | :--- |
| Antigravity | `src/App.tsx` | `src/shell/`, `src/parts/`, `src/places/` (ask Claude for changes) |
| Claude | `src/shell/`, `src/parts/`, `src/places/`, `src/hooks/`, `server/tatumSuiGateway.mjs` | `src/App.tsx` |
| Claimed per step | `src/index.css`, `vite.config.ts`, `server/*.mjs` | Whoever the Owner column in `07-build-plan.md` names |

## How a handoff works

1. Claude finishes a component, runs `npm run build` (which includes the secret scan) and the UI audit, then adds a dated entry under "Ready to wire" below with the import line and its props.
2. Antigravity wires it in `App.tsx`, passing data from existing state and handlers, and moves the entry to "Wired" with what it connected.
3. If wiring needs a prop that does not exist, Antigravity writes it under "Requests" instead of editing Claude's files.

## The shell contract (step 2 and 3)

`src/shell/places.ts` exports the routes. Old paths keep working through redirects.

```ts
export type Place = "home" | "skills" | "try" | "team" | "agents";
export const PLACE_PATHS: Record<Place, string> = {
  home: "/home", skills: "/skills", try: "/try", team: "/team", agents: "/agents",
};
export const LEGACY_REDIRECTS: Record<string, string> = {
  "/graph": "/skills", "/eval": "/try", "/cad": "/agents",
};
```

`src/shell/AppShell.tsx` takes everything from props and holds no data of its own:

```ts
export interface AppShellProps {
  place: Place;
  onNavigate: (place: Place) => void;
  space: { name: string; skillCount: number };
  spaces: { name: string; skillCount: number }[];
  onSwitchSpace: (name: string) => void;
  onNewSpace?: () => void;           // hidden for read only members
  member: { handle: string; role: "Owner" | "Editor" | "Viewer" } | null;
  onSignOut: () => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  title: string;                      // the title bar text for the current place
  toolbar?: React.ReactNode;          // the current place's tools (at most one primary)
  children: React.ReactNode;          // the current place
}
```

What Antigravity does in step 3:

1. Map `currentPath` to a `Place` (using `LEGACY_REDIRECTS` for old links) and render the app inside `<AppShell>`.
2. Remove the old header block (the `<header data-testid="clean-workspace-header">` section) once the shell renders the same controls.
3. Keep today's views as the `children` until each new place replaces them in steps 5 to 10.
4. Make dark the default theme with one line in `src/main.tsx` (see "Three things to get right" below).

## Places Claude will hand over (steps 5 to 11)

| Place | Component | Data Antigravity passes from `App.tsx` |
| :--- | :--- | :--- |
| Home and Live | `HomePlace` in `src/places/Home.tsx` | Shipped; see "Ready to wire". It picks Live by itself once activated |
| Skills | `SkillsPlace` in `src/places/Skills.tsx` | Shipped; see "Ready to wire". It loads and saves skills and rules itself |
| Try it | `src/places/TryIt.tsx` | namespace, skills, the existing run handler and its result |
| Team | `src/places/Team.tsx` | namespace, current member and role; members and Tatum checks load through `server/tatumSuiGateway.mjs` |
| Agents | `src/places/Agents.tsx` | namespace, the existing per agent config builders |
| Landing | `src/places/Landing.tsx` | sign in handler, demo space handler |

Exact props for each are written in "Ready to wire" when the component ships.

## Ready to wire

### 4 Nov 2026: `AppShell` and dark tokens (steps 1 and 2)

```ts
import { AppShell, applyTheme, initialTheme, placeFromPath, resolvePath, PLACE_PATHS, PLACE_LABELS, Button } from "./shell";
```

The tokens already load through one import line in `src/index.css`. The live app looks the same until you wire the shell, because nothing uses the `--cc-*` tokens yet.

To see the shell by itself, run `npm run dev` and open `http://localhost:5188/src/shell/preview/index.html?state=normal`. The states are `normal`, `long`, `viewer`, `signedout`, `signedoutnosignin`, `nospace` and `tall`. This preview is not part of the production build.

**What changed from the contract above.** All of it is additive, and each change exists so that wiring drops nothing:

| Prop | Change | Why |
| :--- | :--- | :--- |
| `place` | Now `Place \| null` | `/bento` stays outside the five places, so nothing is selected there |
| `space` | Now nullable | A member with no space yet sees "No space yet" and can still create one |
| `actions` | New, optional | Tools on every place, such as Share and Pull latest |
| `sidebarExtra` | New, optional | Quiet desktop links above the account row, such as 3D Lab |
| `onSignIn` | New, optional | Shown when `member` is null |

**Where each old header control goes:**

| Old control in `clean-workspace-header` | New home |
| :--- | :--- |
| Brand | Built into the sidebar; pass nothing |
| Bucket chip | `toolbar` on Home for now; the Proof drawer replaces it in step 11 |
| Route tabs | The five places in the sidebar and bottom bar |
| `SmoothDropdown` namespace switcher | `space`, `spaces`, `onSwitchSpace` |
| New Skill Folder | `onNewSpace`; leave it out for read only members |
| Share button and popover, Pull Latest | `actions`, using your existing popover as it is |
| `header-lock-vault-btn` | `member` and `onSignOut` |
| `ThemeToggle` | `theme` and `onToggleTheme` |
| 3D Lab chip | `sidebarExtra` |
| `qa-debug-bar` | Keep it at the top of `children`; the shell needs no slot for it |

**Three things to get right when wiring:**

1. **Dark before the first paint.** Add one line to `src/main.tsx` before `createRoot`: `applyTheme(initialTheme());`. That alone makes dark the default, and the `isDark` code in `App.tsx` needs no change: it reads the class this line sets, and a stored light choice or `?theme=light` still wins. Changing only the `useState` default would flash light on every load, because `App.tsx` applies its class in `useEffect`. `qa-shell.mjs` proves this line against the real app.
2. **Scrolling moves into main.** The shell fills the window, and `[data-testid="shell-main"]` is the scroll container. Any code that reads or sets window scroll, or relies on `min-h-screen`, needs a look. Today's views overflow by 51px at 390px wide, and that overflow now hides inside main, so the audit reports it separately as `mainOverflowX`. Both numbers must reach 0.
3. **Stacking.** Shell menus sit at `z-index: 1000`. A modal rendered inside `children` must sit above that, or it will open beneath a shell menu.

**Verified on the preview only, not inside the real app.** `node video/scripts/qa-shell.mjs` passes 966 checks: seven states in two themes at six window sizes (overflow, contrast, type scale, control height, and the layout switch at 768px), plus keyboard, touch, double click, storage blocked and resize tests. Results and screenshots are in `docs/ux/qa/shell/`. Before screenshots are in `docs/ux/audit/`.

### 4 Nov 2026: Home, Live and Skills (steps 5 to 7, and Claude's half of step 4)

```ts
import { HomePlace, SkillsPlace } from "./places";
```

Both fetch their own data, so wiring adds no hooks to `App.tsx`. To see them alone, open `http://localhost:5188/src/places/preview/index.html?place=home&scene=live` or `?place=skills&skill=sample-review`. Add `&api=real` for real reads from the dev server; that mode refuses every write. The file header lists the other states.

**`HomePlace`** on `/home`. Pass the space name as the shell `title`.

| Prop | Value from `App.tsx` |
| :--- | :--- |
| `namespace` | `config.namespace` |
| `skillCount` | Skills in this space, or `undefined` while loading |
| `memberCount` | Members in this space, or `undefined` while loading |
| `readOnly` | `true` for a Viewer |
| `lastCheck` | The last real Try it result, or `null`. Never pass a sample |
| `onImportSkills`, `onAddRule`, `onInvite`, `onConnect`, `onTry` | Your existing handlers |

**`SkillsPlace`** on `/skills`. Pass `"Skills"` as the shell `title`.

| Prop | Value from `App.tsx` |
| :--- | :--- |
| `namespace` | `config.namespace` |
| `selectedSkillId`, `onSelectSkill` | Your selection state. Null shows the library on a phone |
| `caller` | The signed in address or handle. Without it the server skips its allowlist check |
| `readOnly`, `canDelete` | `true` for a Viewer; `true` for an Owner |
| `onImport`, `onStartFromTemplate`, `onTry` | Your existing handlers |
| `onSkillsChanged` | Re-run your `fetchNamespaceSkills`, so the old views stay in step during the move |

**Changed from the plan.** The document tools sit at the top of the document column, not in the title bar, because editing state lives inside `SkillsPlace`. History and Used by open as a panel above the rules, since a third column does not fit beside the sidebar at 1280px. History lists revisions without a diff for now, and a skill keeps only its last three revisions on the server.

**Your half of step 4.** The old views in `App.tsx` still say Bucket, Fact and Bake. `BANNED_PRIMARY_WORDS` in `src/shell/copy.ts` lists the words, and `qa-places.mjs` fails on them in the new screens.

**Verified on the preview, with sample data.** `node video/scripts/qa-places.mjs` covers 17 screen states in two themes at five window sizes, plus rule and save flows: optimistic switch and rollback, double clicks, draft after reload, failure, conflict, offline and role limits. Real reads were checked too: real skills, rules and activity render, with no tracker ids and no raw memory headers. Real writes were not exercised, because they reach Walrus mainnet. Results are in `docs/ux/qa/places/`.

### 6 Nov 2026: the logo

```ts
import { LogoMark, PRODUCT_NAME } from "./shell";
```

Replace `<WalrusLogo3D size="md" />` and `<WalrusLogo3D size="sm" />` in `src/App.tsx` (near lines 1321 and 1670) with `<LogoMark size={32} className="cc-brand__mark" />` and `<LogoMark size={24} className="cc-brand__mark" />`, then drop the import. `src/components/blocks/onboarding-7.tsx` needs the same swap. `AppShell` already draws the logo, so the header one goes away with the old header in step 3. Rules and files are in `docs/brand/README.md`.

## Wired

Nothing yet.

## Requests

Nothing yet.

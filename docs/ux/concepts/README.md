# Concept stills

Faux product stills of the proposed screens, built with the [Stageshow](https://github.com/benjitaylor/skills) kit (copied into `kit/`, MIT, see `kit/LICENSE-stageshow`). They show layout, hierarchy and words, not final pixels.

The chosen direction is B, the dark command center: every screen below is also shot dark in `stills-dark/` (same file names).

| Still | Screen | Direction |
| :--- | :--- | :--- |
| `stills/home-calm.png` | Home with getting started, last check and activity | A. Calm workspace (recommended) |
| `stills/home-command.png` | Live view with rules applied today and agents now | B. Command center |
| `stills/landing.png` | Signed out landing built around the before and after | C. Guided story |
| `stills/skills.png` | Skills: library, team rules on top, the SKILL.md document | A |
| `stills/try-it.png` | Try it: one task, two outcomes, the rule that changed it | A |
| `stills/team.png` | Team: invite, members verified through the Tatum Sui RPC, access changes | A |
| `stills/agents.png` | Agents: pick a tool, copy one setup, see it connected | A |

## Edit and re-shoot

```bash
cd docs/ux/concepts && npm install && npm run dev
```

Open `http://localhost:5199/?c=home-calm` (or any id above). Add `&t=dark` for the dark look. To re-shoot every still at 2x:

```bash
node video/scripts/shoot-concepts.mjs
CONCEPT_THEME=dark node video/scripts/shoot-concepts.mjs
```

Run the shoot from a normal terminal; the Claude Code sandbox blocks Chromium.

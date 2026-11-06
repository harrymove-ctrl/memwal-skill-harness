import React from "react";
import { Footage } from "../take/Footage";

/**
 * Live Act 1 (S5, 315f, global f=660..975):
 * - Plays real `public/take/take.mp4` from `t=6.02s` at `rate=0.918` (`6.02s -> 15.66s`).
 * - Exact Playwright click on `Run Live Recall` (`t=8.90s`) lands on global `f=754` (`local=94`).
 * - Exact recalled banner (`t=10.95s`) lands on global `f=821` (`local=161`).
 * - Callout held `128 frames` (`4.27s >= 120f`), camera relaxes `9deg -> 0deg` flat!
 */
export const LiveAct1EvalRecall: React.FC = () => (
  <Footage
    from={6.02}
    rate={0.918}
    frames={315}
    tilt={9}
    camera={[
      { t: 6.02, zoom: 1.18, u: 0.42, v: 0.28 },
      { t: 8.4, zoom: 1.52, u: 0.68, v: 0.48 },
      { t: 9.4, zoom: 1.48, u: 0.66, v: 0.5 },
      { t: 10.85, zoom: 1.18, u: 0.5, v: 0.52 },
      { t: 15.4, zoom: 1.18, u: 0.5, v: 0.52 },
    ]}
    callouts={[
      {
        from: 168,
        to: 296,
        box: { x: 223, y: 740, w: 1474, h: 98 },
        card: { x: 1090, y: 185 },
        what: "Team rule recalled",
        why: "Fetched live from Walrus before acting",
        side: "above",
      },
    ]}
  />
);

/**
 * Live Act 2 (S7, 315f, global f=1080..1395):
 * - Plays real `public/take/take.mp4` from `t=14.0s` at `rate=0.80` (`14.0s -> 22.4s`).
 * - Side-by-side comparison: `Without memory` vs `With Walrus Memory`.
 * - Callout held `140 frames` (`4.67s >= 120f`), camera relaxes `9deg -> 0deg` flat!
 */
export const LiveAct2CompareVerdict: React.FC = () => (
  <Footage
    from={14.0}
    rate={0.8}
    frames={315}
    tilt={9}
    camera={[
      { t: 14.0, zoom: 1.06, u: 0.5, v: 0.5 },
      { t: 19.8, zoom: 1.08, u: 0.5, v: 0.5 },
      { t: 22.3, zoom: 1.12, u: 0.5, v: 0.54 },
    ]}
    callouts={[
      {
        from: 30,
        to: 170,
        box: { x: 1000, y: 156, w: 712, h: 52 },
        card: { x: 1015, y: 848 },
        what: "With Walrus Memory",
        why: "Closes retired-app PR as not planned",
        side: "below",
      },
    ]}
  />
);

/**
 * Live Act 3 (S9, 315f, global f=1500..1815):
 * - Plays real `public/take/take.mp4` from `t=28.90s` at `rate=0.97` (`28.90s -> 39.08s`).
 * - Shows `memwal-review` (`SKILL.md` + team rules), then clicks `Skill Graph` tab
 *   (`t=35.30s`) on exact global `f=1698` (`local=198`).
 * - Callout held `140 frames` (`4.67s >= 120f`), camera relaxes `9deg -> 0deg` flat!
 */
export const LiveAct3SkillGraph: React.FC = () => (
  <Footage
    from={28.9}
    rate={0.97}
    frames={315}
    tilt={9}
    camera={[
      { t: 28.9, zoom: 1.16, u: 0.56, v: 0.38 },
      { t: 34.4, zoom: 1.18, u: 0.56, v: 0.38 },
      { t: 35.8, zoom: 1.1, u: 0.55, v: 0.54 },
      { t: 39.0, zoom: 1.15, u: 0.53, v: 0.58 },
    ]}
    callouts={[
      {
        from: 34,
        to: 174,
        box: { x: 578, y: 348, w: 1022, h: 60 },
        what: "Rules live with skills",
        why: "Update once and every agent follows",
        side: "below",
      },
    ]}
  />
);

/**
 * Live Act 4 (S11, 300f, global f=1920..2220):
 * - Plays real `public/take/take.mp4` from `t=43.65s` at `rate=0.855` (`43.65s -> 52.20s`).
 * - Exact Playwright clicks on IDE tabs:
 *   - `Cursor` (`t=45.42s`) -> global `f=1982` (`local=62`)
 *   - `Codex` (`t=47.53s`) -> global `f=2056` (`local=136`)
 *   - `Antigravity` (`t=49.81s`) -> global `f=2136` (`local=216`)
 * - Callout held `140 frames` (`4.67s >= 120f`), camera relaxes `9deg -> 0deg` flat!
 */
export const LiveAct4ConnectIdes: React.FC = () => (
  <Footage
    from={43.65}
    rate={0.855}
    frames={300}
    tilt={9}
    camera={[
      { t: 43.65, zoom: 1.18, u: 0.5, v: 0.48 },
      { t: 52.0, zoom: 1.22, u: 0.5, v: 0.5 },
    ]}
    callouts={[
      {
        from: 74,
        to: 214,
        box: { x: 555, y: 367, w: 511, h: 56 },
        card: { x: 930, y: 560 },
        what: "Every coding agent",
        why: "One MCP config shares team memory",
        side: "right",
      },
    ]}
  />
);

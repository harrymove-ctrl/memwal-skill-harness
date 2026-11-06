#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out/qa-stills-v2");
fs.mkdirSync(OUT, { recursive: true });

const FRAMES = [
  [18, "01-opening-logo-cloudsky"],
  [70, "02-wordgather-lead"],
  [104, "03-wordgather-mid-drop-a"],
  [111, "04-wordgather-mid-drop-b"],
  [152, "05-wordgather-settled"],
  [212, "06-logocollapse-shot"],
  [280, "07-logocollapse-lockup"],
  [410, "08-promptroll-pill"],
  [526, "09-promptroll-halo-send"],
  [585, "10-clicktype-cursor"],
  [688, "11-clicktype-typed-end"],
  [768, "12-appreveal-3d-flight"],
  [870, "13-live1-flow-graph-callout"],
  [1015, "14-live2-ab-verdict-callout"],
  [1092, "15-live3-connect-ide-callout"],
  [1200, "16-final-cloudsky-lockup"],
];

const serveUrl = await bundle({
  entryPoint: path.join(ROOT, "src/index.ts"),
  webpackOverride: (cfg) => ({
    ...cfg,
    resolve: {
      ...cfg.resolve,
      alias: {
        ...(cfg.resolve?.alias ?? {}),
        "@": path.join(ROOT, "src"),
      },
    },
  }),
});

const comp = await selectComposition({
  serveUrl,
  id: "MemWalSkillsPromo",
  chromiumOptions: { gl: "angle" },
});

for (const [frame, slug] of FRAMES) {
  const output = path.join(OUT, `${slug}-f${frame}.png`);
  await renderStill({
    composition: comp,
    serveUrl,
    frame,
    output,
    imageFormat: "png",
    chromiumOptions: { gl: "angle" },
  });
  console.log(`rendered ${path.basename(output)}`);
}

const inputs = FRAMES.map(
  ([f, s]) => `-i "${path.join(OUT, `${s}-f${f}.png`)}"`,
).join(" ");
execSync(
  `ffmpeg -y ${inputs} -filter_complex "hstack=inputs=4[r0];[4:v][5:v][6:v][7:v]hstack=inputs=4[r1];[8:v][9:v][10:v][11:v]hstack=inputs=4[r2];[12:v][13:v][14:v][15:v]hstack=inputs=4[r3];[r0][r1][r2][r3]vstack=inputs=4,scale=3840:-1" -frames:v 1 -update 1 "${path.join(OUT, "contact-sheet.png")}"`,
  { stdio: "inherit" },
);
console.log("wrote out/qa-stills-v2/contact-sheet.png");

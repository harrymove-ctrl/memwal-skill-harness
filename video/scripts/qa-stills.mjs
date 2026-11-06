import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const root = "/Volumes/Dev/memwal-skill-harness/video";
const out = process.argv[2];
const jobs = JSON.parse(process.argv[3]); // [[compId, frame], ...]
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), rootDir: root,
  webpackOverride: (c) => ({ ...c, resolve: { ...c.resolve, alias: { ...(c.resolve?.alias ?? {}), "@": path.join(root, "src") } } }) });
const cache = {};
for (const [id, frame] of jobs) {
  cache[id] ??= await selectComposition({ serveUrl, id });
  const file = path.join(out, `${id}_${String(frame).padStart(4, "0")}.png`);
  await renderStill({ composition: cache[id], serveUrl, output: file, frame, scale: 0.5 });
  console.log("ok", file);
}

#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requireFromVideo = createRequire("/Volumes/Dev/memwal-skill-harness/video/package.json");
const { chromium } = requireFromVideo("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://memwal-skill-harness-production.up.railway.app";
const SHOTS_DIR = path.join(ROOT, "public", "shots");
const TAKE_DIR = path.join(ROOT, "public", "take");
const TMP_DIR = path.join(ROOT, ".render-tmp", "flow-only");

rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });

const INIT_SCRIPT = `
(() => {
  try {
    localStorage.setItem("memwal_skill_harness_authed_v8", "1");
    localStorage.setItem("memwal_skill_harness_theme_v1", "dark");
    localStorage.setItem("memwal_skill_harness_tour_seen_v1", "1");
    localStorage.setItem("memwal_tour_completed", "1");
  } catch {}
  const SECRET = /(suiprivkey1[0-9a-z]{16,}|(?:0x)?[0-9a-fA-F]{36,})/g;
  const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const WALM = /\\bWALM(?:-[0-9]+)?\\b/gi;
  const scrub = (root) => {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      let v = n.nodeValue || "";
      if (SECRET.test(v)) v = v.replace(SECRET, (m) => m.slice(0, 6) + "••••••••••••");
      SECRET.lastIndex = 0;
      if (UUID.test(v)) v = v.replace(UUID, (m) => m.slice(0, 8) + "••••");
      UUID.lastIndex = 0;
      if (WALM.test(v)) v = v.replace(WALM, "tracker");
      WALM.lastIndex = 0;
      if (v !== n.nodeValue) n.nodeValue = v;
    }
  };
  const installCursor = () => {
    if (document.getElementById("__dir_cursor")) return;
    const c = document.createElement("div");
    c.id = "__dir_cursor";
    c.innerHTML = '<svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z" fill="#f8fafc" stroke="#080c0b" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {
      position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
      transform: "translate(960px, 540px)", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.55))"
    });
    const ring = document.createElement("div");
    Object.assign(ring.style, {
      position: "fixed", width: "46px", height: "46px", borderRadius: "50%",
      border: "2.5px solid #34d996", boxShadow: "0 0 18px rgba(52,217,150,0.65)",
      zIndex: "2147483646", pointerEvents: "none", opacity: "0", left: "0", top: "0"
    });
    document.body.append(ring, c);
    let mx = 960, my = 540;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      c.style.transform = "translate(" + (mx - 6) + "px," + (my - 3) + "px)";
    }, true);
    window.addEventListener("mousedown", () => {
      ring.animate([
        { transform: "translate(" + (mx - 23) + "px," + (my - 23) + "px) scale(0.35)", opacity: 1 },
        { transform: "translate(" + (mx - 23) + "px," + (my - 23) + "px) scale(1.65)", opacity: 0 }
      ], { duration: 450, easing: "ease-out" });
    }, true);
  };
  const boot = () => {
    scrub(document.body);
    installCursor();
    new MutationObserver(() => scrub(document.body)).observe(document.body, {
      subtree: true, childList: true, characterData: true
    });
  };
  if (document.body) boot(); else window.addEventListener("DOMContentLoaded", boot);
})();
`;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function glide(page, state, tx, ty, ms = 650) {
  const steps = Math.max(8, Math.round(ms / 30));
  const fx = state.x, fy = state.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.mouse.move(fx + (tx - fx) * e, fy + (ty - fy) * e);
    await pause(ms / steps);
  }
  state.x = tx; state.y = ty;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  recordVideo: { dir: TMP_DIR, size: { width: 1920, height: 1080 } },
});
await ctx.addInitScript(INIT_SCRIPT);
const page = await ctx.newPage();
const mouse = { x: 960, y: 540 };
const t0 = Date.now();
const beats = [];
const mark = (name, extra = {}) => {
  const at = +((Date.now() - t0) / 1000).toFixed(2);
  beats.push({ name, at, ...extra });
  console.log("beat", name, at, extra);
};

await page.goto(`${BASE}/graph?authed=1`, { waitUntil: "networkidle", timeout: 30000 });
await pause(700);

// Click "Graph" tab first
const graphBtn = page.getByRole("button", { name: "Graph", exact: true }).first();
if (await graphBtn.isVisible().catch(() => false)) {
  const b = await graphBtn.boundingBox();
  if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await pause(700);
}

// Then click "Flow View" inside Graph
const flowBtn = page.getByRole("button", { name: /Flow View/i }).first();
if (await flowBtn.isVisible().catch(() => false)) {
  const b = await flowBtn.boundingBox();
  if (b) await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  await pause(900);
}

// Dismiss any tour modal
await page.evaluate(() => {
  for (const btn of document.querySelectorAll("button")) {
    const t = (btn.textContent || "").trim();
    if (/^(Skip|Close|Dismiss|Got it)$/i.test(t)) btn.click();
  }
});
await pause(400);

// Screenshot clean dark Flow View without cursor
await page.evaluate(() => {
  const c = document.getElementById("__dir_cursor");
  if (c) c.style.opacity = "0";
});
await page.screenshot({ path: path.join(SHOTS_DIR, "clean-1-flow-graph-dark.png") });
await page.evaluate(() => {
  const c = document.getElementById("__dir_cursor");
  if (c) c.style.opacity = "1";
});

await page.mouse.move(780, 420);
mouse.x = 780; mouse.y = 420;
await pause(300);
mark("flow-start");

for (const label of ["memwal-review", "rules/GEMINI.md", "memwal-skill-hub"]) {
  const loc = page.getByText(label, { exact: false }).first();
  const b = await loc.boundingBox().catch(() => null);
  if (b && b.y > 140 && b.y < 950) {
    await glide(page, mouse, b.x + b.width / 2, b.y + b.height / 2, 700);
    await pause(100);
    await page.mouse.down();
    await pause(70);
    await page.mouse.up();
    mark(`click-${label}`, { box: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } });
    await pause(1100);
  }
}

await glide(page, mouse, 1280, 520, 800);
await pause(1100);
mark("flow-done");

const vid = page.video();
await ctx.close();
await browser.close();

const rawWebm = await vid.path();
const webmOut = path.join(TMP_DIR, "flow.webm");
renameSync(rawWebm, webmOut);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-i", webmOut, "-r", "30",
  "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p",
  path.join(TAKE_DIR, "take-flow-dark.mp4"),
]);
writeFileSync(path.join(TAKE_DIR, "flow-beats.json"), JSON.stringify(beats, null, 2));
console.log("Updated take-flow-dark.mp4 and clean-1-flow-graph-dark.png");

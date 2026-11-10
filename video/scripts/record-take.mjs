#!/usr/bin/env node
// Records the real Skillbook app (dev server on :5188) for the promo video.
//   pnpm dev                      # in the repo root, one terminal
//   node scripts/record-take.mjs  # in video/, another terminal (not inside the Claude Code sandbox)
// Writes public/take/take.mp4 (1920 x 1080, 30 fps) and src/take/beats.json:
//   [{ beat, at, targets: { name: { x, y, w, h } } }]  seconds since the recording started,
//   boxes in CSS px of the 1280 x 720 viewport.
// The page draws its own cursor (an injected arrow) so clicks read on camera.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.HARNESS_URL ?? "http://localhost:5188";
const TMP = path.join(ROOT, ".render-tmp", "take");
const OUT_DIR = path.join(ROOT, "public", "take");
const BEATS = path.join(ROOT, "src", "take", "beats.json");
const W = 1920;
const H = 1080;
/** The app lays out as if the window were 1280 x 720 and paints at 1920 x 1080: sharp, and the UI fills the frame. */
const ZOOM = 1.5;

let t0 = 0;
const marks = [];
const missing = [];
const mark = (beat) => {
  marks.push({ beat, at: +((Date.now() - t0) / 1000).toFixed(2), targets: {} });
  console.log("beat", beat, marks.at(-1).at);
};
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const CURSOR = `
(() => {
  const Z = __ZOOM__;
  const zoomCss = () => {
    if (document.getElementById("__take_zoom")) return;
    const st = document.createElement("style");
    st.id = "__take_zoom";
    st.textContent = "html { zoom: " + Z + " !important; }";
    const host = document.head || document.documentElement;
    if (host) host.appendChild(st);
  };
  const install = () => {
    zoomCss();
    if (document.getElementById("__take_cursor")) return;
    const c = document.createElement("div");
    c.id = "__take_cursor";
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z" fill="#141413" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, { position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
      transform: "translate(640px, 420px)", filter: "drop-shadow(0 3px 5px rgba(0,0,0,.25))", transition: "none" });
    const ring = document.createElement("div");
    Object.assign(ring.style, { position: "fixed", width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #10b981",
      zIndex: "2147483646", pointerEvents: "none", opacity: "0", left: "0", top: "0" });
    document.body.append(ring, c);
    let x = 960, y = 630;
    addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; c.style.transform = "translate(" + (x / Z - 5) + "px," + (y / Z - 3) + "px)"; }, true);
    addEventListener("mousedown", () => {
      c.firstChild.style.transform = "scale(.86)";
      ring.animate([{ transform: "translate(" + (x / Z - 17) + "px," + (y / Z - 17) + "px) scale(.4)", opacity: 1 },
                    { transform: "translate(" + (x / Z - 17) + "px," + (y / Z - 17) + "px) scale(1.5)", opacity: 0 }], { duration: 450, easing: "ease-out" });
    }, true);
    addEventListener("mouseup", () => { c.firstChild.style.transform = ""; }, true);
  };
  // Redact secrets on screen: the Connect panel prints the real delegate key and account id.
  const SECRET = /(suiprivkey1[0-9a-z]{20,}|(?:0x)?[0-9a-fA-F]{40,})/g;
  const TICKET = /WALM-[0-9]+/gi;
  const scrub = (root) => {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (SECRET.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(SECRET, (m) => m.slice(0, m.startsWith("0x") ? 6 : 4) + "••••••••••••");
      SECRET.lastIndex = 0;
      // internal tracker ids stay out of public material
      if (TICKET.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(TICKET, "•••");
      TICKET.lastIndex = 0;
    }
  };
  const watch = () => {
    scrub(document.body);
    new MutationObserver((ms) => { for (const m of ms) { if (m.type === "characterData") scrub(m.target.parentNode || document.body); else m.addedNodes.forEach((a) => scrub(a.nodeType === 3 ? a.parentNode : a)); } })
      .observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  const start = () => { zoomCss(); install(); watch(); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();`;

let mouse = { x: 960, y: 630 };
async function glide(page, x, y, ms = 700) {
  const steps = Math.max(6, Math.round(ms / 50));
  const from = { ...mouse };
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const st = Date.now();
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await pause(Math.max(0, ms / steps - (Date.now() - st)));
  }
  mouse = { x, y };
}
async function center(loc) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("no box");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function clickOn(page, loc, ms = 700) {
  await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  const c = await center(loc);
  await glide(page, c.x, c.y, ms);
  await pause(120);
  await page.mouse.down();
  await pause(70);
  await page.mouse.up();
}
async function smoothScroll(page, top, ms = 1000) {
  await page.evaluate(
    ({ top, ms }) =>
      new Promise((done) => {
        const from = window.scrollY;
        const s = performance.now();
        const step = (n) => {
          const t = Math.min(1, (n - s) / ms);
          const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          window.scrollTo(0, from + (top - from) * e);
          t < 1 ? requestAnimationFrame(step) : done();
        };
        requestAnimationFrame(step);
      }),
    { top, ms },
  );
}
/** Boxes of the card that holds `text` (the nearest ancestor at least `minW` wide). */
async function cardBox(page, text, minW = 300) {
  return page.evaluate(
    ({ text, minW }) => {
      const leaf = [...document.querySelectorAll("body *")].find(
        (e) => e.childElementCount === 0 && e.textContent && e.textContent.trim() === text && e.getBoundingClientRect().width > 0,
      );
      let p = leaf;
      while (p && p.getBoundingClientRect().width < minW) p = p.parentElement;
      if (!p) return null;
      const r = p.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    },
    { text, minW },
  );
}
async function targets(page, named) {
  const beat = marks.at(-1);
  for (const [name, get] of Object.entries(named)) {
    const b = await get().catch(() => null);
    const box = b && ("w" in b ? b : { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) });
    if (box && box.w > 0 && box.h > 0) beat.targets[name] = box;
    else missing.push(`${beat.beat}:${name}`);
  }
}
const box = (loc) => () => loc.boundingBox({ timeout: 1500 });
const stamp = (label) => console.log("  t", label, ((Date.now() - t0) / 1000).toFixed(2));

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(path.dirname(BEATS), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  colorScheme: "light",
  recordVideo: { dir: TMP, size: { width: W, height: H } },
});
await context.addInitScript(CURSOR.replace("__ZOOM__", String(ZOOM)));
const page = await context.newPage();
t0 = Date.now();
await page.goto(`${BASE}/eval?authed=1`, { waitUntil: "networkidle" });
// the page runs one recall on load; let it finish so the on-camera run starts clean
await page.getByText(/Team Rules? Recalled/).first().waitFor({ timeout: 20000 }).catch(() => {});
await page.addStyleTag({ content: `html { zoom: ${ZOOM} !important; }` });
await pause(400);
await page.mouse.move(mouse.x, mouse.y);
const zoomNow = await page.evaluate(() => getComputedStyle(document.documentElement).zoom);
console.log("html zoom", zoomNow);
if (String(zoomNow) !== "1.5") throw new Error("page zoom not applied: " + zoomNow);
await pause(800);

stamp("loaded");
// 1. Hero
mark("hero");
await targets(page, {
  hero: box(page.getByText("Teach your AI once.", { exact: false }).first()),
  question: () => cardBox(page, "Question asked to AI agent", 700),
  run: box(page.getByRole("button", { name: /Run Live Recall/ })),
});
stamp("targets");
await glide(page, 1140, 450, 900);
stamp("glide");
await pause(900);

// 2. Run live recall
const run = page.getByRole("button", { name: /Run Live Recall/ });
await clickOn(page, run, 800);
mark("run");
await targets(page, { run: box(run) });
await page.getByText(/Recalling Team Rules/).first().waitFor({ timeout: 5000 }).catch(() => {});
await page.getByText(/Team Rules? Recalled/).first().waitFor({ timeout: 20000 });
mark("recalled");
await targets(page, {
  banner: box(page.getByText(/Team Rules? Recalled/).first().locator("xpath=ancestor::div[contains(@class,'rounded-xl')][1]")),
  ruleApplied: box(page.getByText(/Rule applied/).first()),
});
await pause(1700);

// 3. Without vs With
const without = page.getByText("Without MemWal", { exact: true }).first();
const wb = await without.boundingBox();
await smoothScroll(page, (await page.evaluate(() => window.scrollY)) + (wb ? wb.y - 105 : 570), 1100);
mark("compare");
if (await page.evaluate(() => /WALM-[0-9]+/i.test(document.body.innerText))) throw new Error("tracker id visible");
await targets(page, {
  withoutCard: () => cardBox(page, "Without MemWal", 380),
  withCard: () => cardBox(page, "With MemWal", 380),
  withoutTitle: box(page.getByText(/Approves and runs QA on retired/).first()),
  withTitle: box(page.getByText(/Skips retired demo app/).first()),
});
await glide(page, 540, 345, 900);
await pause(1300);
await glide(page, 1470, 345, 1100);
await pause(1600);

// 4. Team rules
const rulesHead = page.getByText(/Team Rules for/).first();
const rb = await rulesHead.boundingBox();
await smoothScroll(page, (await page.evaluate(() => window.scrollY)) + (rb ? rb.y - 180 : 540), 1000);
mark("rules");
const rulesText = ((await rulesHead.textContent().catch(() => "")) ?? "").trim();
await targets(page, { rules: () => cardBox(page, rulesText, 700) });
await pause(1800);

// 5. Skills
await smoothScroll(page, 0, 700);
const skillsTab = page.getByText(/^Skills \(\d+\)$/).filter({ visible: true }).first();
await clickOn(page, skillsTab, 800);
mark("skills");
await page.waitForTimeout(900);
const review = page.getByText("memwal-review", { exact: true }).first();
await targets(page, { list: () => cardBox(page, "Search skills...", 200).catch(() => null) });
await clickOn(page, review, 800);
mark("skill-open");
await page.waitForTimeout(700);
await targets(page, {
  list: box(page.locator("aside").first()),
  teamRules: () => cardBox(page, "TEAM RULES", 600),
  doc: box(page.getByText(/SKILL\.md$/).first()),
});
await glide(page, 1350, 375, 900);
await pause(1600);

// 6. Graph
await clickOn(page, page.getByRole("button", { name: "Graph", exact: true }).first(), 700);
mark("graph");
await pause(1200);
await targets(page, { canvas: () => cardBox(page, "LIVE CANVAS", 600) });
await glide(page, 1140, 630, 1000);
await pause(1500);

// 7. Connect
await clickOn(page, page.getByText(/^Connect$/).filter({ visible: true }).first(), 800);
mark("connect");
await pause(900);
await targets(page, {
  agents: () => cardBox(page, "Add to Your Coding Agent", 700),
});
for (const ide of ["Claude Code", "Cursor", "Codex", "Antigravity"]) {
  const tab = page.getByRole("button", { name: ide, exact: true }).first();
  await clickOn(page, tab, 520);
  mark(`ide-${ide.toLowerCase().replace(/\s+/g, "-")}`);
  await targets(page, { tab: box(tab), agents: () => cardBox(page, "Add to Your Coding Agent", 700), code: box(page.locator("pre").filter({ visible: true }).first()) });
  const leaked = await page.evaluate(() => /(suiprivkey1[0-9a-z]{20,}|(?:0x)?[0-9a-fA-F]{40,})/.test(document.body.innerText));
  if (leaked) throw new Error("secret visible on " + ide);
  await pause(650);
}
await pause(1200);
mark("end");

const video = page.video();
await context.close();
await browser.close();
const raw = await video.path();
const webm = path.join(OUT_DIR, "take.webm");
renameSync(raw, webm);
writeFileSync(BEATS, JSON.stringify({ viewport: { w: W, h: H }, marks, missing }, null, 2));
console.log("missing targets:", missing.join(", ") || "none");
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", webm, "-r", "30", "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", path.join(OUT_DIR, "take.mp4")]);
console.log("wrote", path.join(OUT_DIR, "take.mp4"), readdirSync(OUT_DIR));

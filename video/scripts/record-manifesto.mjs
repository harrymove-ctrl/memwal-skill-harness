#!/usr/bin/env node
// Records the real Skillbook app for the full demo, sharply, through the browser's own screencast.
// Run with the dev server up, from video/: node scripts/record-demo.mjs
//
// Read only by construction: every non GET request to the app's API stops in this script and never
// reaches the server or Walrus. The sign in and the one "Add rule" save are answered here, so the
// footage can show the editing UI without writing anything to mainnet. All other data is real, including
// the recall in Live, which scripts/log-one-recall.mjs logged to mainnet.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.HARNESS_URL ?? "http://localhost:5188";
const TMP = path.join(ROOT, ".render-tmp", "manifesto");
const OUT = path.join(ROOT, "public", "take", "manifesto.mp4");
const BEATS = path.join(ROOT, "src", "take", "manifesto-beats.json");
const W = 1920;
const H = 1080;
const ZOOM = 1.5;
const SPACE = "memwal-team-skills";
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

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: "light" });
// The film's one card style, on the real app: frosted glass over the same sky as the fly-through.
const GLASS = `
  :root, html, [data-theme] { --cc-bg: transparent !important; --cc-surface: rgba(255,255,255,.44) !important; --cc-surface-2: rgba(255,255,255,.36) !important; --cc-raised: rgba(255,255,255,.55) !important; --cc-line: rgba(16,44,66,.12) !important; --cc-ink-2: #33414a !important; --cc-ink-3: #46545e !important; }
  html { background: url(/__sky.png) center / cover fixed no-repeat !important; }
  body, #root, .cc-shell, .cc-main, .cc-titlebar, .cc-place { background: transparent !important; }
  .cc-page { background: rgba(255,255,255,.66) !important; backdrop-filter: blur(34px) saturate(1.25) !important; }
  .cc-sidebar { background: rgba(255,255,255,.55) !important; backdrop-filter: blur(34px) saturate(1.25) !important; }
  .cc-card, .cc-trycol, .cc-rule, .cc-member, .cc-activity, .cc-proof__panel, .cc-agent-tile { backdrop-filter: blur(22px) saturate(1.2) !important; border-radius: 20px !important; }
  .cc-proof__panel { background: rgba(255,255,255,.82) !important; backdrop-filter: blur(38px) saturate(1.3) !important; box-shadow: 0 30px 70px rgba(12,48,96,.22) !important; }
  .cc-proof__scrim { background: rgba(255,255,255,.08) !important; }
  .cc-demo-note { display: none !important; }
`;
await context.addInitScript((css) => {
  localStorage.setItem("memwal-theme", "light");
  const put = () => { const st = document.createElement("style"); st.textContent = css; (document.head || document.documentElement).appendChild(st); };
  if (document.head) put(); else document.addEventListener("DOMContentLoaded", put);
}, GLASS);
await context.addInitScript(CURSOR.replace("__ZOOM__", String(ZOOM)));
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
await page.route("**/__sky.png", (route) => route.fulfill({ path: path.join(ROOT, "public", "take", "sky.png"), contentType: "image/png" }));

const realMembers = await (await fetch(`${BASE}/api/ns/${SPACE}/members`)).json();
const owner = realMembers.members.find((m) => m.verification === "owner") ?? realMembers.members.find((m) => m.handle === "mysten-dev") ?? realMembers.members[0];
const stopped = [];
await page.route("**/api/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (body) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  if (url.pathname === "/api/auth/session") return json({ ok: true, address: owner.suiAddress });
  if (url.pathname.endsWith("/members") && request.method() === "GET") {
    const real = await (await route.fetch()).json();
    return json({ ...real, you: { address: owner.suiAddress, handle: owner.handle, role: "owner" } });
  }
  if (request.method() === "GET") return route.continue();
  stopped.push(`${request.method()} ${url.pathname}`);
  if (url.pathname.endsWith("/rules")) {
    const posted = JSON.parse(request.postData() ?? "{}");
    const rule = { ruleId: `take-${Date.now()}`, skillId: posted.skillId ?? posted.skill ?? "memwal-qa", text: posted.text ?? posted.rule ?? "", state: "on", author: owner.handle, updatedAt: new Date().toISOString(), rev: 1, blobId: "take" };
    return json({ ok: true, rule, ...rule });
  }
  return json({ ok: true });
});

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const cdp = await context.newCDPSession(page);
const frames = [];
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const name = `f${String(frames.length).padStart(6, "0")}.jpg`;
  writeFileSync(path.join(TMP, name), Buffer.from(data, "base64"));
  frames.push({ name, at: metadata.timestamp });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

const beats = [];
let t0 = 0;
const id = (testid) => page.locator(`[data-testid="${testid}"]:visible`).first();
const box = async (loc) => {
  const b = await loc.boundingBox().catch(() => null);
  return b ? { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } : null;
};
const mark = async (beat, named = {}) => {
  const targets = {};
  for (const [k, loc] of Object.entries(named)) targets[k] = await box(loc);
  beats.push({ beat, at: +((Date.now() - t0) / 1000).toFixed(2), targets });
  console.log("beat", beat, beats.at(-1).at, JSON.stringify(targets));
};
const nav = (label) => page.locator('[data-testid="shell-sidebar"]').getByRole("link", { name: new RegExp(`^${label}`) }).first();
const go = async (label) => {
  await clickOn(page, nav(label), 650);
  await pause(1100);
};

await page.goto(`${BASE}/skills?skill=concise-ui-copy&theme=light`, { waitUntil: "domcontentloaded" });
await page.locator(".cc-rule").first().waitFor({ timeout: 30000 });
// The skill's body can name internal trackers, and the chapter is about the rules above it.
await page.addStyleTag({ content: ".cc-doc { visibility: hidden !important; }" });
await pause(1500);
await page.mouse.move(mouse.x, mouse.y);
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
t0 = Date.now();

/* Teach, on a skill whose real rule reads plainly. The save is answered above and writes nothing. */
await mark("skills", { rules: page.locator(".cc-rule").first() });
await pause(1200);
const add = id("rule-add-input");
await clickOn(page, add, 800);
await pause(200);
await mark("typing", { field: id("rule-add") });
await page.keyboard.type("Keep button labels to two words.", { delay: 46 });
await pause(450);
await clickOn(page, page.locator('[data-testid="rule-add"] button').first(), 550);
await pause(900);
await mark("ruleAdded", { rules: page.locator(".cc-divided").first() });
await pause(2200);

/* The real recall, in Live. */
await go("Home");
await page.locator('[data-testid="live-view"]').waitFor({ timeout: 40000 });
await pause(700);
await mark("live", { metric: id("live-metric"), stream: page.locator(".cc-activity").first() });
await pause(2600);

/* Real proof. */
await clickOn(page, id("open-proof"), 800);
await id("proof-count").waitFor({ timeout: 30000 });
await glide(page, 620, 980, 500);
await pause(500);
await mark("proof", { count: id("proof-count") });
await pause(2600);
await page.keyboard.press("Escape");
await pause(400);

/* Try it, plain rule. */
await go("Try it");
await page.goto(`${BASE}/try?skill=concise-ui-copy&theme=light`, { waitUntil: "domcontentloaded" });
await id("try-run").waitFor();
await pause(800);
await mark("try", {});
await clickOn(page, id("try-run"), 700);
await id("try-with-verdict").waitFor({ timeout: 30000 });
await pause(800);
await mark("verdict", { without: id("try-without"), with: id("try-with") });
await pause(3200);

await cdp.send("Page.stopScreencast");
await pause(400);
await browser.close();

// Frames arrive only when the picture changes, so each one holds until the next.
const list = frames.map((f, i) => {
  const next = frames[i + 1]?.at ?? f.at + 0.5;
  return `file '${f.name}'\nduration ${Math.max(0.001, next - f.at).toFixed(5)}`;
}).join("\n");
writeFileSync(path.join(TMP, "list.txt"), `${list}\nfile '${frames.at(-1).name}'\n`);
mkdirSync(path.dirname(OUT), { recursive: true });
execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(TMP, "list.txt"), "-vf", "fps=60,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-movflags", "+faststart", OUT]);
writeFileSync(BEATS, JSON.stringify(beats, null, 2));
console.log("frames", frames.length, "first at", frames[0]?.at, "started", t0 / 1000);
console.log("stopped before the server:", JSON.stringify(stopped));
rmSync(TMP, { recursive: true, force: true });

/* Tatum AI's public page, no account involved. The prompt is typed but never sent. */
const TATUM_TMP = path.join(ROOT, ".render-tmp", "tatum");
rmSync(TATUM_TMP, { recursive: true, force: true });
mkdirSync(TATUM_TMP, { recursive: true });
const tb = await chromium.launch();
const tc = await tb.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, colorScheme: "dark" });
const tp = await tc.newPage();
await tp.goto("https://ai.tatum.io/", { waitUntil: "load", timeout: 60000 });
await pause(2500);
const tcdp = await tc.newCDPSession(tp);
const tf = [];
tcdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  const name = `f${String(tf.length).padStart(6, "0")}.jpg`;
  writeFileSync(path.join(TATUM_TMP, name), Buffer.from(data, "base64"));
  tf.push({ name, at: metadata.timestamp });
  await tcdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});
await tcdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W * 2, maxHeight: H * 2, everyNthFrame: 1 });
await pause(600);
const box2 = tp.locator("textarea").first();
await box2.click();
await box2.fill("");
await tp.keyboard.type("Build a dashboard of my team's agent rules, stored on Walrus.", { delay: 40 });
await pause(1500);
await tp.mouse.wheel(0, 900);
await pause(1500);
await tp.mouse.wheel(0, 900);
await pause(2500);
await tcdp.send("Page.stopScreencast");
await pause(300);
await tb.close();
const tl = tf.map((f, i) => `file '${f.name}'\nduration ${Math.max(0.001, (tf[i + 1]?.at ?? f.at + 0.5) - f.at).toFixed(5)}`).join("\n");
writeFileSync(path.join(TATUM_TMP, "list.txt"), `${tl}\nfile '${tf.at(-1).name}'\n`);
execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(TATUM_TMP, "list.txt"), "-vf", "fps=60,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-movflags", "+faststart", path.join(ROOT, "public", "take", "tatum.mp4")]);
console.log("tatum frames", tf.length);
rmSync(TATUM_TMP, { recursive: true, force: true });
console.log("RECORD_OK");
process.exit(0);

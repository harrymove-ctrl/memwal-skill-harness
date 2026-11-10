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
const TMP = path.join(ROOT, ".render-tmp", "demo");
const OUT = path.join(ROOT, "public", "take", "demo.mp4");
const BEATS = path.join(ROOT, "src", "take", "demo-beats.json");
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
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: "dark" });
await context.addInitScript(CURSOR.replace("__ZOOM__", String(ZOOM)));
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));

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

await page.goto(`${BASE}/skills?skill=memwal-qa&theme=dark`, { waitUntil: "domcontentloaded" });
await page.locator(".cc-rule").first().waitFor({ timeout: 30000 });
// The skill's body can name internal trackers, and the chapter is about the rules above it.
await page.addStyleTag({ content: ".cc-doc { visibility: hidden !important; }" });
await pause(1500);
await page.mouse.move(mouse.x, mouse.y);
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
t0 = Date.now();

/* Chapter 1: Teach */
await mark("skills", { rules: page.locator(".cc-rule").first() });
await pause(1800);
const add = id("rule-add-input");
await clickOn(page, add, 900);
await pause(300);
await mark("typing", { field: id("rule-add") });
await page.keyboard.type("Staging is retired, promote from dev to main", { delay: 42 });
await pause(600);
await clickOn(page, page.locator('[data-testid="rule-add"] button').first(), 600);
await pause(1200);
await mark("ruleAdded", { rules: page.locator(".cc-divided").first() });
await pause(3200);

/* Chapter 2: Recall */
await go("Home");
await page.locator('[data-testid="live-view"]').waitFor();
await pause(800);
await mark("live", { metric: id("live-metric"), agents: id("live-agents"), stream: page.locator(".cc-activity").first() });
await pause(2500);
await glide(page, 900, 720, 1100);
await pause(1600);
await go("Agents");
await id("agent-setup").waitFor();
await pause(900);
await mark("agents", { tiles: page.locator(".cc-agent-tiles").first(), setup: id("agent-setup") });
await pause(800);
await clickOn(page, id("agent-tile-cursor"), 700);
await pause(1100);
await clickOn(page, id("agent-tile-codex"), 600);
await pause(1100);
await clickOn(page, id("agent-tile-claude-code"), 600);
await pause(1500);

/* Chapter 3: Change */
await go("Try it");
await id("try-run").waitFor();
await pause(1000);
await mark("try", { task: id("try-task") });
await clickOn(page, id("try-run"), 800);
await id("try-with-verdict").waitFor({ timeout: 30000 });
await pause(900);
await mark("verdict", { without: id("try-without"), with: id("try-with"), rule: id("try-rule") });
await pause(4500);

/* Chapter 4: Team and Proof */
await go("Team");
await page.locator('[data-testid="member-row"]').first().waitFor();
await pause(900);
await mark("team", { member: page.locator('[data-testid="member-row"]').first(), invite: id("team-invite") });
await pause(3000);
await go("Home");
await clickOn(page, id("open-proof"), 800);
await id("proof-count").waitFor({ timeout: 30000 });
await pause(1000);
await mark("proof", { panel: page.locator(".cc-proof__panel").first(), count: id("proof-count") });
await pause(2600);
await page.evaluate(() => {
  const body = document.querySelector(".cc-proof__body");
  if (!body) return;
  const start = performance.now();
  const from = body.scrollTop;
  const to = Math.min(body.scrollHeight - body.clientHeight, 460);
  const step = (n) => {
    const t = Math.min(1, (n - start) / 1600);
    body.scrollTop = from + (to - from) * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
await pause(2000);
await mark("proofRules", { panel: page.locator(".cc-proof__panel").first() });
await pause(2500);

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
console.log("RECORD_OK");
process.exit(0);

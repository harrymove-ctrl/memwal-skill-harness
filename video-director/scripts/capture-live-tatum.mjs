#!/usr/bin/env node
/**
 * Captures scrubbed 1920x1080 stills + a live 30fps dark Flow View take from
 * https://memwal-skill-harness-production.up.railway.app with:
 * - Zero browser chrome
 * - Automatic DOM scrubbing of suiprivkey1..., >=36-hex strings, and internal tracker IDs
 * - Injected crisp cursor + emerald click ripple for live video takes
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const requireFromVideo = createRequire("/Volumes/Dev/memwal-skill-harness/video/package.json");
const { chromium } = requireFromVideo("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.HARNESS_URL ?? "https://memwal-skill-harness-production.up.railway.app";
const SHOTS_DIR = path.join(ROOT, "public", "shots");
const TAKE_DIR = path.join(ROOT, "public", "take");
const TMP_DIR = path.join(ROOT, ".render-tmp", "capture-live");

mkdirSync(SHOTS_DIR, { recursive: true });
mkdirSync(TAKE_DIR, { recursive: true });
rmSync(TMP_DIR, { recursive: true, force: true });
mkdirSync(TMP_DIR, { recursive: true });

// Copy existing verified Playground/Compare/Connect take.mp4 into video-director/public/take/
const existingTake = "/Volumes/Dev/memwal-skill-harness/video/public/take/take.mp4";
if (existsSync(existingTake)) {
  copyFileSync(existingTake, path.join(TAKE_DIR, "take.mp4"));
  console.log("Copied verified take.mp4 to public/take/take.mp4");
}

const INIT_SCRUB_AND_CURSOR = `
(() => {
  try {
    localStorage.setItem("memwal_skill_harness_authed_v8", "1");
    localStorage.setItem("memwal_skill_harness_tour_seen_v1", "1");
    localStorage.setItem("memwal_tour_completed", "1");
  } catch {}

  const SECRET = /(suiprivkey1[0-9a-z]{16,}|(?:0x)?[0-9a-fA-F]{36,})/g;
  const TRACKER = /WALM-[0-9]+/gi;

  const scrubText = (val) => {
    if (!val) return val;
    let next = val;
    if (SECRET.test(next)) {
      next = next.replace(SECRET, (m) => m.slice(0, m.startsWith("0x") ? 6 : 6) + "••••••••••••");
    }
    SECRET.lastIndex = 0;
    if (TRACKER.test(next)) {
      next = next.replace(TRACKER, "core");
    }
    TRACKER.lastIndex = 0;
    return next;
  };

  const scrubNode = (root) => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const cleaned = scrubText(node.nodeValue);
      if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
    }
  };

  const installCursor = () => {
    if (document.getElementById("__dir_cursor")) return;
    const c = document.createElement("div");
    c.id = "__dir_cursor";
    c.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z" fill="#f8fafc" stroke="#080c0b" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {
      position: "fixed",
      left: "0",
      top: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transform: "translate(960px, 540px)",
      filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
      transition: "none",
    });
    const ring = document.createElement("div");
    Object.assign(ring.style, {
      position: "fixed",
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      border: "2.5px solid #34d996",
      boxShadow: "0 0 18px rgba(52,217,150,0.55)",
      zIndex: "2147483646",
      pointerEvents: "none",
      opacity: "0",
      left: "0",
      top: "0",
    });
    document.body.append(ring, c);
    let mx = 960, my = 540;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      c.style.transform = "translate(" + (mx - 6) + "px," + (my - 3) + "px)";
    }, true);
    window.addEventListener("mousedown", () => {
      if (c.firstChild) c.firstChild.style.transform = "scale(0.85)";
      ring.animate([
        { transform: "translate(" + (mx - 22) + "px," + (my - 22) + "px) scale(0.35)", opacity: 1 },
        { transform: "translate(" + (mx - 22) + "px," + (my - 22) + "px) scale(1.65)", opacity: 0 }
      ], { duration: 460, easing: " ease-out".trim() });
    }, true);
    window.addEventListener("mouseup", () => {
      if (c.firstChild) c.firstChild.style.transform = "";
    }, true);
  };

  const boot = () => {
    scrubNode(document.body);
    installCursor();
    new MutationObserver(() => scrubNode(document.body)).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  };
  if (document.body) boot();
  else window.addEventListener("DOMContentLoaded", boot);
})();
`;

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function glide(page, state, tx, ty, ms = 680) {
  const steps = Math.max(8, Math.round(ms / 32));
  const fx = state.x;
  const fy = state.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    await page.mouse.move(fx + (tx - fx) * e, fy + (ty - fy) * e);
    await pause(ms / steps);
  }
  state.x = tx;
  state.y = ty;
}

async function dismissTourIfAny(page) {
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll("button")) {
      const txt = (btn.textContent || "").trim();
      if (/^(Skip|Close tour|Dismiss|Got it)$/i.test(txt)) btn.click();
    }
  });
}

async function assertCleanDom(page, label) {
  const leak = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const hasSecret = /(suiprivkey1[0-9a-z]{16,}|(?:0x)?[0-9a-fA-F]{36,})/.test(text);
    const hasWalm = /WALM-[0-9]+/i.test(text);
    return { hasSecret, hasWalm };
  });
  if (leak.hasSecret || leak.hasWalm) {
    throw new Error(`Privacy check failed on ${label}: ${JSON.stringify(leak)}`);
  }
}

const browser = await chromium.launch();

// ---- PART 1: Record dark Flow View live video + clean dark Flow View still ----
{
  const flowTmp = path.join(TMP_DIR, "flow-dark");
  mkdirSync(flowTmp, { recursive: true });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
    recordVideo: { dir: flowTmp, size: { width: 1920, height: 1080 } },
  });
  await ctx.addInitScript(`try { localStorage.setItem("memwal_skill_harness_theme_v1", "dark"); } catch {}`);
  await ctx.addInitScript(INIT_SCRUB_AND_CURSOR);
  const page = await ctx.newPage();
  const mouse = { x: 960, y: 540 };
  const t0 = Date.now();
  const flowBeats = [];
  const stamp = (name) => {
    const at = +((Date.now() - t0) / 1000).toFixed(2);
    flowBeats.push({ name, at });
    console.log("flow beat:", name, at);
  };

  await page.goto(`${BASE}/graph?authed=1`, { waitUntil: "networkidle", timeout: 30000 });
  await pause(900);
  await dismissTourIfAny(page);

  // Switch to Flow View if Notes Map is active
  const flowBtn = page.getByRole("button", { name: /Flow View/i }).first();
  if (await flowBtn.isVisible().catch(() => false)) {
    const b = await flowBtn.boundingBox();
    if (b) {
      await glide(page, mouse, b.x + b.width / 2, b.y + b.height / 2, 450);
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
      await pause(700);
    }
  }
  await assertCleanDom(page, "dark-flow-initial");

  // Save ultra-clean still (hide injected cursor briefly for the static print)
  await page.evaluate(() => {
    const c = document.getElementById("__dir_cursor");
    if (c) c.style.opacity = "0";
  });
  await page.screenshot({ path: path.join(SHOTS_DIR, "clean-1-flow-graph-dark.png") });
  await page.evaluate(() => {
    const c = document.getElementById("__dir_cursor");
    if (c) c.style.opacity = "1";
  });

  stamp("flow-ready");
  await pause(600);

  // Glide across skill nodes so the live graph responds organically
  for (const label of ["memwal-review", "memwal-qa", "rules/GEMINI.md"]) {
    const loc = page.getByText(label, { exact: false }).first();
    const b = await loc.boundingBox().catch(() => null);
    if (b && b.y > 120 && b.y < 920) {
      await glide(page, mouse, b.x + b.width / 2, b.y + b.height / 2, 720);
      await pause(120);
      await page.mouse.down();
      await pause(70);
      await page.mouse.up();
      stamp(`click-${label}`);
      await pause(1100);
    }
  }
  await glide(page, mouse, 1180, 480, 800);
  await pause(1200);
  stamp("flow-end");

  const vid = page.video();
  await ctx.close();
  const rawWebm = await vid.path();
  const webmOut = path.join(TMP_DIR, "take-flow-dark.webm");
  renameSync(rawWebm, webmOut);
  execFileSync("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    webmOut,
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "16",
    "-pix_fmt",
    "yuv420p",
    path.join(TAKE_DIR, "take-flow-dark.mp4"),
  ]);
  writeFileSync(path.join(TAKE_DIR, "flow-beats.json"), JSON.stringify(flowBeats, null, 2));
  console.log("Wrote public/take/take-flow-dark.mp4");
}

// ---- PART 2: Capture clean scrubbed light-mode stills for LogoCollapse ----
{
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  await ctx.addInitScript(`try { localStorage.setItem("memwal_skill_harness_theme_v1", "light"); } catch {}`);
  await ctx.addInitScript(INIT_SCRUB_AND_CURSOR);
  const page = await ctx.newPage();

  await page.goto(`${BASE}/eval?authed=1`, { waitUntil: "networkidle", timeout: 30000 });
  await pause(1200);
  await dismissTourIfAny(page);
  await page.evaluate(() => {
    const c = document.getElementById("__dir_cursor");
    if (c) c.style.display = "none";
  });
  await assertCleanDom(page, "playground");
  await page.screenshot({ path: path.join(SHOTS_DIR, "clean-2-tatum-playground.png") });

  // Scroll to Without vs With comparison
  await page.evaluate(() => window.scrollTo(0, 460));
  await pause(500);
  await assertCleanDom(page, "ab-verdict");
  await page.screenshot({ path: path.join(SHOTS_DIR, "clean-3-ab-verdict.png") });

  // Open Activity drawer & scrub
  await page.evaluate(() => window.scrollTo(0, 0));
  await pause(300);
  const actBtn = page.getByRole("button", { name: /Activity/i }).first();
  if (await actBtn.isVisible().catch(() => false)) {
    await actBtn.click();
    await pause(1200);
    await assertCleanDom(page, "activity-drawer");
    await page.screenshot({ path: path.join(SHOTS_DIR, "clean-6-activity-recall.png") });
    await page.keyboard.press("Escape");
    await pause(400);
  }

  // Open + New modal and click tatum-treasury-ops preset
  const newBtn = page.getByRole("button", { name: /\+\s*New/i }).first();
  if (await newBtn.isVisible().catch(() => false)) {
    await newBtn.click();
    await pause(600);
    const tatumPreset = page.getByRole("button", { name: /tatum-treasury-ops/i }).first();
    if (await tatumPreset.isVisible().catch(() => false)) {
      await tatumPreset.click();
      await pause(600);
    }
    await assertCleanDom(page, "new-collection-tatum");
    await page.screenshot({ path: path.join(SHOTS_DIR, "clean-5-new-collection-tatum.png") });
    await page.keyboard.press("Escape");
    await pause(400);
  }

  // Navigate to Connect & Team -> Tatum AI (ai.tatum.io)
  await page.goto(`${BASE}/cad?authed=1`, { waitUntil: "networkidle", timeout: 30000 });
  await pause(900);
  await dismissTourIfAny(page);
  await page.evaluate(() => {
    const c = document.getElementById("__dir_cursor");
    if (c) c.style.display = "none";
  });
  const tatumTab = page.getByRole("button", { name: /Tatum AI/i }).first();
  if (await tatumTab.isVisible().catch(() => false)) {
    await tatumTab.click();
    await pause(500);
  }
  await assertCleanDom(page, "connect-tatum");
  await page.screenshot({ path: path.join(SHOTS_DIR, "clean-4-connect-tatum-mcp.png") });

  await ctx.close();
  console.log("Wrote clean-1..clean-6 scrubbed 1920x1080 shots");
}

await browser.close();

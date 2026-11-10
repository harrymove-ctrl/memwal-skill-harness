#!/usr/bin/env node
// Records the complete 5-act Skillbook showcase screencast (1920x1080, 30fps, dark theme)
// including the clean signed-out auth gate, Slush + Google (Mysten Enoki zkLogin) sign-in,
// WebGL ChromaCurrent + BlueprintDitherBackground, animated 3D Bayer-dithered SignerOrb3D avatars,
// 5 3D AgentBrandLogo tiles, side-by-side Try verdict, Team verification, and Mainnet Proof drawer.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.HARNESS_URL ?? "http://localhost:5188";
const TMP = path.join(ROOT, ".render-tmp", "showcase");
const OUT = path.join(ROOT, "public", "take", "showcase.mp4");
const CARDS_DIR = path.join(ROOT, "public", "take", "cards");
const BEATS = path.join(ROOT, "src", "take", "showcase-beats.json");
const W = 1920;
const H = 1080;
const ZOOM = 1.5;
const SPACE = "memwal-team-skills";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const SLUSH_ICON =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#38bdf8"/></linearGradient></defs><circle cx="12" cy="12" r="10.5" fill="url(#g)"/><path d="M15.2 8.2c-1.4-1.1-3.8-1-5 .3-1 1.1-.6 2.6 1.2 3.2l1.6.5c1.9.6 2.3 2.2 1.2 3.4-1.3 1.4-3.8 1.4-5.4.1" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"/></svg>'
  );

const INIT_SCRIPT = `
(() => {
  const Z = __ZOOM__;
  const OWNER_ADDR = __OWNER_ADDR__;
  const SLUSH_SVG = __SLUSH_ICON__;

  // Keep Google zkLogin inside the single window via the built-in session fallback
  window.open = () => null;

  // Register Wallet Standard Slush wallet so Sign in modal displays BOTH Slush and Google (Enoki zkLogin)
  const slushAccount = {
    address: OWNER_ADDR,
    publicKey: new Uint8Array(32),
    chains: ["sui:mainnet", "sui:testnet"],
    features: ["sui:signPersonalMessage", "sui:signTransaction"]
  };
  const slushWallet = {
    version: "1.0.0",
    name: "Slush",
    icon: SLUSH_SVG,
    chains: ["sui:mainnet", "sui:testnet"],
    accounts: [slushAccount],
    features: {
      "standard:connect": {
        version: "1.0.0",
        connect: async () => ({ accounts: [slushAccount] })
      },
      "sui:signPersonalMessage": {
        version: "1.1.0",
        signPersonalMessage: async () => ({ bytes: "", signature: "AA==" })
      }
    }
  };
  try {
    (window.navigator.wallets = window.navigator.wallets || []).push(({ register }) => register(slushWallet));
    window.addEventListener("wallet-standard:app-ready", (e) => {
      try { e.detail?.register?.(slushWallet); } catch {}
    });
  } catch {}

  const zoomCss = () => {
    if (document.getElementById("__take_zoom")) return;
    const st = document.createElement("style");
    st.id = "__take_zoom";
    st.textContent = "html { zoom: " + Z + " !important; } .cc-shell { height: calc(100vh / " + Z + ") !important; }";
    const host = document.head || document.documentElement;
    if (host) host.appendChild(st);
  };
  const install = () => {
    zoomCss();
    if (document.getElementById("__take_cursor")) return;
    const c = document.createElement("div");
    c.id = "__take_cursor";
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z" fill="#141413" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {
      position: "fixed", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
      transform: "translate(640px, 420px)", filter: "drop-shadow(0 3px 6px rgba(0,0,0,.45))", transition: "none"
    });
    const ring = document.createElement("div");
    Object.assign(ring.style, {
      position: "fixed", width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #34d399",
      boxShadow: "0 0 14px rgba(52,211,153,0.45)",
      zIndex: "2147483646", pointerEvents: "none", opacity: "0", left: "0", top: "0"
    });
    document.body.append(ring, c);
    let x = 960, y = 630;
    addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY;
      c.style.transform = "translate(" + (x / Z - 5) + "px," + (y / Z - 3) + "px)";
    }, true);
    addEventListener("mousedown", () => {
      c.firstChild.style.transform = "scale(.86)";
      ring.animate([
        { transform: "translate(" + (x / Z - 18) + "px," + (y / Z - 18) + "px) scale(.4)", opacity: 1 },
        { transform: "translate(" + (x / Z - 18) + "px," + (y / Z - 18) + "px) scale(1.55)", opacity: 0 }
      ], { duration: 460, easing: "ease-out" });
    }, true);
    addEventListener("mouseup", () => { c.firstChild.style.transform = ""; }, true);
  };

  // Scrub any long keys/hex or internal tracker IDs from live DOM text
  const SECRET = /(suiprivkey1[0-9a-z]{20,}|(?:0x)?[0-9a-fA-F]{40,})/g;
  const TICKET = /WALM-[0-9]+/gi;
  const scrub = (root) => {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = w.nextNode())) {
      if (SECRET.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(SECRET, (m) => m.slice(0, m.startsWith("0x") ? 6 : 4) + "••••••••••••");
      }
      SECRET.lastIndex = 0;
      if (TICKET.test(n.nodeValue)) {
        n.nodeValue = n.nodeValue.replace(TICKET, "•••");
      }
      TICKET.lastIndex = 0;
    }
  };
  const watch = () => {
    scrub(document.body);
    new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") scrub(m.target.parentNode || document.body);
        else m.addedNodes.forEach((a) => scrub(a.nodeType === 3 ? a.parentNode : a));
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  const start = () => { zoomCss(); install(); watch(); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();`;

let mouse = { x: 960, y: 630 };
async function glide(page, x, y, ms = 680) {
  const steps = Math.max(6, Math.round(ms / 45));
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
  if (!b) throw new Error("no boundingBox for locator");
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}
async function clickOn(page, loc, ms = 680) {
  await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
  const c = await center(loc);
  await glide(page, c.x, c.y, ms);
  await pause(110);
  await page.mouse.down();
  await pause(70);
  await page.mouse.up();
}

const realMembers = await (await fetch(`${BASE}/api/ns/${SPACE}/members`)).json();
const owner =
  realMembers.members.find((m) => m.verification === "owner") ??
  realMembers.members.find((m) => m.handle === "mysten-dev") ??
  realMembers.members[0];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  colorScheme: "dark",
});
await context.addInitScript(
  INIT_SCRIPT.replace("__ZOOM__", String(ZOOM))
    .replace("__OWNER_ADDR__", JSON.stringify(owner.suiAddress))
    .replace("__SLUSH_ICON__", JSON.stringify(SLUSH_ICON))
);
const page = await context.newPage();
page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));

let isSignedIn = false;
const stopped = [];
await page.route("**/enoki-api/**", async (route) => {
  const url = new URL(route.request().url());
  const json = (body) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  if (url.pathname.endsWith("/nonce")) {
    return json({
      data: {
        nonce: "showcase_zklogin_nonce",
        randomness: "123456",
        epoch: 710,
        maxEpoch: 712,
        estimatedExpiration: Date.now() + 3600_000,
      },
    });
  }
  if (url.pathname.endsWith("/session")) {
    await pause(340);
    return json({
      jwt: "showcase.jwt.token",
      data: { address: owner.suiAddress },
    });
  }
  return route.continue();
});

await page.route("**/api/**", async (route) => {
  const request = route.request();
  const url = new URL(request.url());
  const json = (body) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
  if (url.pathname === "/api/auth/challenge") {
    return json({ ok: true, message: "Sign in to Skillbook" });
  }
  if (url.pathname === "/api/auth/session") {
    if (request.method() === "POST") {
      isSignedIn = true;
      return json({ ok: true, address: owner.suiAddress });
    }
    return json({ ok: true, address: isSignedIn ? owner.suiAddress : null });
  }
  if (url.pathname.endsWith("/members") && request.method() === "GET") {
    const real = await (await route.fetch()).json();
    return json({
      ...real,
      you: isSignedIn ? { address: owner.suiAddress, handle: owner.handle, role: "owner" } : null,
    });
  }
  if (request.method() === "GET" || url.pathname === "/api/tatum-memwal/recall") return route.continue();
  stopped.push(`${request.method()} ${url.pathname}`);
  if (url.pathname.endsWith("/rules")) {
    const posted = JSON.parse(request.postData() ?? "{}");
    const rule = {
      ruleId: `take-${Date.now()}`,
      skillId: posted.skillId ?? posted.skill ?? "rust-async-patterns",
      text: posted.text ?? posted.rule ?? "",
      state: "on",
      author: owner.handle,
      updatedAt: new Date().toISOString(),
      rev: 1,
      blobId: "take",
    };
    return json({ ok: true, rule, ...rule });
  }
  return json({ ok: true });
});

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(CARDS_DIR, { recursive: true });

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
const saveCard = async (num) => {
  const p = path.join(CARDS_DIR, `card-0${num}.png`);
  await page.screenshot({ path: p });
};
const nav = (label) =>
  page.locator('[data-testid="shell-sidebar"]').getByRole("link", { name: new RegExp(`^${label}`) }).first();
const go = async (label) => {
  await clickOn(page, nav(label), 620);
  await pause(950);
};

// Start clean signed-out on /home?theme=dark
await page.goto(`${BASE}/home?theme=dark`, { waitUntil: "domcontentloaded" });
await id("auth-gate").waitFor({ timeout: 25000 });
await page.addStyleTag({ content: ".cc-doc { visibility: hidden !important; }" });
await pause(1200);
await page.mouse.move(mouse.x, mouse.y);
await saveCard(1);

await cdp.send("Page.startScreencast", {
  format: "jpeg",
  quality: 93,
  maxWidth: W,
  maxHeight: H,
  everyNthFrame: 1,
});
t0 = Date.now();

/* Act 1: Clean Signed-Out Gate -> Sign In (Slush + Enoki zkLogin) -> Live Space Unlocks */
await mark("signedOut", {
  gate: page.locator('[data-testid="auth-gate"] .cc-card').first(),
  signInBtn: id("auth-gate-signin"),
});
await pause(1600);
await clickOn(page, id("auth-gate-signin"), 720);
await id("signin-enoki").waitFor({ timeout: 10000 });
await pause(550);
await saveCard(2);
await mark("signInModal", {
  panel: page.locator(".cc-signin__panel").first(),
  slush: id("signin-wallet"),
  enoki: id("signin-enoki"),
});
await pause(1200);
const enokiCenter = await center(id("signin-enoki"));
await glide(page, enokiCenter.x, enokiCenter.y, 580);
await pause(900);
await clickOn(page, id("signin-wallet"), 520);
await page.locator('[data-testid="live-view"]').waitFor({ timeout: 25000 });
await pause(1100);
await saveCard(3);
await mark("liveUnlocked", {
  metric: id("live-metric"),
  agents: id("live-agents"),
  stream: page.locator(".cc-activity").first(),
});
await pause(1800);
await glide(page, 860, 740, 950);
await pause(1600);
await saveCard(4);

/* Act 2: Teach a Production Concurrency Rule Once on /skills?skill=rust-async-patterns */
await go("Skills");
const rustBtn = id("skill-item-rust-async-patterns");
await rustBtn.waitFor({ timeout: 25000 });
await clickOn(page, rustBtn, 560);
await pause(800);
await page.locator(".cc-rule").first().waitFor({ timeout: 20000 });
await pause(700);
await mark("skills", { rules: page.locator(".cc-rule").first() });
await pause(1400);
await clickOn(page, id("rule-add-input"), 780);
await pause(260);
await mark("typing", { field: id("rule-add") });
await page.keyboard.type("Bound spawned Tokio tasks with a Semaphore and CancellationToken", { delay: 34 });
await pause(500);
await clickOn(page, page.locator('[data-testid="rule-add"] button').first(), 580);
await pause(1100);
await saveCard(5);
await mark("ruleAdded", { rules: page.locator(".cc-rule").first() });
await pause(2600);

/* Act 3: Connect Every Coding Agent on /agents (5 3D Brand Logos) */
await go("Agents");
await id("agent-setup").waitFor({ timeout: 15000 });
await pause(750);
await saveCard(6);
await mark("agents", {
  tiles: page.locator(".cc-agent-tiles").first(),
  setup: id("agent-setup"),
  connected: id("agents-connected"),
});
await pause(750);
for (const tileId of [
  "agent-tile-cursor",
  "agent-tile-codex",
  "agent-tile-antigravity",
  "agent-tile-tatum-ai",
  "agent-tile-claude-code",
]) {
  const tile = id(tileId);
  if (await tile.isVisible().catch(() => false)) {
    await clickOn(page, tile, 540);
    await pause(760);
  }
}
await pause(1100);

/* Act 4: Real Engineering Scenarios on /try (rust-async-patterns & ui-ux-qa) */
await go("Try it");
await id("try-run").waitFor({ timeout: 15000 });
await pause(800);
await mark("try", { task: id("try-task"), runBtn: id("try-run") });
await clickOn(page, id("try-run"), 700);
await id("try-with-verdict").waitFor({ timeout: 30000 });
await pause(850);
await saveCard(7);
await mark("verdict", {
  without: id("try-without"),
  with: id("try-with"),
  rule: id("try-rule"),
});
await pause(2400);
await clickOn(page, id("try-skill"), 520);
await page.locator('[data-testid="try-skill"]').selectOption("ui-ux-qa");
await pause(450);
await clickOn(page, id("try-run"), 580);
await id("try-with-verdict").waitFor({ timeout: 30000 });
await pause(900);
await mark("verdictUi", {
  without: id("try-without"),
  with: id("try-with"),
  rule: id("try-rule"),
});
await pause(2400);

/* Act 5: Team 3D Orbs & Mainnet Proof Drawer */
await go("Team");
await page.locator('[data-testid="member-row"]').first().waitFor({ timeout: 15000 });
await pause(850);
await saveCard(8);
await mark("team", {
  card: page.locator(".cc-card").first(),
  member0: page.locator('[data-testid="member-row"]').nth(0),
  member1: page.locator('[data-testid="member-row"]').nth(1),
});
await pause(2600);

await go("Home");
await clickOn(page, id("open-proof"), 720);
await id("proof-count").waitFor({ timeout: 30000 });
await pause(900);
await mark("proof", {
  panel: page.locator(".cc-proof__panel").first(),
  count: id("proof-count"),
});
await pause(2000);
await page.evaluate(() => {
  const body = document.querySelector(".cc-proof__body");
  if (!body) return;
  const start = performance.now();
  const from = body.scrollTop;
  const to = Math.min(body.scrollHeight - body.clientHeight, 440);
  const step = (n) => {
    const t = Math.min(1, (n - start) / 1400);
    body.scrollTop = from + (to - from) * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
await pause(1800);
await mark("proofRules", { panel: page.locator(".cc-proof__panel").first() });
await pause(2200);

await cdp.send("Page.stopScreencast");
await pause(350);
await browser.close();

const list = frames
  .map((f, i) => {
    const next = frames[i + 1]?.at ?? f.at + 0.5;
    return `file '${f.name}'\nduration ${Math.max(0.001, next - f.at).toFixed(5)}`;
  })
  .join("\n");
writeFileSync(path.join(TMP, "list.txt"), `${list}\nfile '${frames.at(-1).name}'\n`);
mkdirSync(path.dirname(OUT), { recursive: true });
execFileSync("ffmpeg", [
  "-y",
  "-hide_banner",
  "-loglevel",
  "error",
  "-f",
  "concat",
  "-safe",
  "0",
  "-i",
  path.join(TMP, "list.txt"),
  "-vf",
  "fps=30,format=yuv420p",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "15",
  "-movflags",
  "+faststart",
  OUT,
]);
writeFileSync(BEATS, JSON.stringify(beats, null, 2));
console.log("frames", frames.length, "duration ~", beats.at(-1)?.at, "s");
console.log("stopped before the server:", JSON.stringify(stopped));
rmSync(TMP, { recursive: true, force: true });
console.log("RECORD_SHOWCASE_OK");
process.exit(0);

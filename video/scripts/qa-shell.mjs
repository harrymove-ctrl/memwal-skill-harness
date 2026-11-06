// QA for src/shell: geometry, contrast, type scale, state coverage and break tests.
// Run from a normal terminal with the dev server up (npm run dev):
//   node video/scripts/qa-shell.mjs
// Writes screenshots, after-flow.webm and results.json into docs/ux/qa/shell/.
import { chromium } from "playwright";
import { measure } from "./qa-measure.mjs";
import { mkdirSync, renameSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/shell");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const PREVIEW = `${ORIGIN}/src/shell/preview/index.html`;
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  if (!ok) console.log(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const VIEWPORTS = [
  [1280, 800],
  [1280, 400],
  [768, 1024],
  [767, 1024],
  [390, 844],
  [320, 568],
];
const STATES = ["normal", "long", "viewer", "signedout", "signedoutnosignin", "nospace", "tall"];
const THEMES = ["dark", "light"];
const SCALE = new Set([12, 14, 16, 20, 28, 40]);

const TOKENS = {
  dark: {
    "--cc-bg": "#0b0f0e", "--cc-surface": "#121816", "--cc-surface-2": "#18201e", "--cc-raised": "#1d2624",
    "--cc-ink": "#f4f6f5", "--cc-ink-2": "#a7b0ad", "--cc-ink-3": "#8f9996", "--cc-accent": "#34d399",
    "--cc-on-accent": "#04140d", "--cc-warn": "#f59e0b", "--cc-danger": "#f87171",
  },
  light: {
    "--cc-bg": "#f7f7f4", "--cc-surface": "#ffffff", "--cc-surface-2": "#f1f2ee", "--cc-raised": "#ffffff",
    "--cc-ink": "#141413", "--cc-ink-2": "#52525b", "--cc-ink-3": "#6b6b74", "--cc-accent": "#047857",
    "--cc-on-accent": "#ffffff", "--cc-warn": "#a84e07", "--cc-danger": "#dc2626",
  },
};

function checkMeasure(label, m, width) {
  const mobile = width < 768;
  check(`${label}: no page overflow`, m.docOverflow <= 0 && m.bodyOverflow <= 0, `doc ${m.docOverflow}, body ${m.bodyOverflow}`);
  check(`${label}: no overflow inside main`, m.mainOverflow <= 0, `${m.mainOverflow}px`);
  check(`${label}: right chrome`, mobile ? !m.sidebar && !!m.topbar && !!m.bottombar : !!m.sidebar && !m.topbar && !m.bottombar);
  const weak = m.contrast.filter((c) => c.ratio < 4.5);
  check(`${label}: text contrast at least 4.5`, weak.length === 0, JSON.stringify(weak.slice(0, 4)));
  const offScale = m.sizes.filter((s) => !SCALE.has(s));
  check(`${label}: type on scale`, offScale.length === 0, offScale.join(","));
  check(`${label}: at most 4 sizes`, m.sizes.length <= 4, m.sizes.join(","));
  const wrongFont = m.fonts.filter((f) => (f.mono ? !/JetBrains/.test(f.family) : !/^Inter/.test(f.family)));
  check(`${label}: Inter for UI, mono for ids`, wrongFont.length === 0, JSON.stringify(wrongFont.slice(0, 2)));
  const min = mobile ? 44 : 32;
  const small = m.controls.filter((c) => c.h < min);
  check(`${label}: controls at least ${min}px tall`, small.length === 0, JSON.stringify(small.slice(0, 4)));
  check(`${label}: place labels not clipped`, m.clipped.length === 0, m.clipped.join(","));
  if (m.bottombar) {
    check(`${label}: main clears the bottom bar`, m.mainBox.bottom <= m.bottombar.top + 0.5);
    check(`${label}: bottom bar on screen`, Math.abs(m.bottombar.bottom - m.viewport[1]) < 1);
  }
  if (m.sidebar) check(`${label}: sidebar fills height`, Math.abs(m.sidebar.height - m.viewport[1]) < 1);
}

const url = (state, theme, extra = "") => `${PREVIEW}?state=${state}&theme=${theme}${extra}`;
const events = (page) => page.evaluate(() => window.__shellEvents.slice());
const ready = (page) => page.waitForSelector('[data-testid="app-shell"]');
const vis = (page, testid) => page.locator(`[data-testid="${testid}"]:visible`);
const focusId = (page) => page.evaluate(() => document.activeElement?.dataset?.testid || document.activeElement?.id || document.activeElement?.tagName);

const browser = await chromium.launch();

// Matrix: every state, viewport and theme.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/Failed to load resource|fonts\.g/.test(msg.text())) errors.push(msg.text());
  });
  for (const [w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h });
    for (const state of STATES) {
      for (const theme of THEMES) {
        await page.goto(url(state, theme));
        await ready(page);
        checkMeasure(`${state} ${theme} ${w}x${h}`, await page.evaluate(measure), w);
      }
    }
  }
  check("no console or page errors across the matrix", errors.length === 0, errors.slice(0, 3).join(" | "));

  // Tokens match the design system.
  for (const theme of THEMES) {
    await page.goto(url("normal", theme));
    await ready(page);
    const live = await page.evaluate((names) => {
      const s = getComputedStyle(document.documentElement);
      return Object.fromEntries(names.map((n) => [n, s.getPropertyValue(n).trim()]));
    }, Object.keys(TOKENS[theme]));
    const off = Object.entries(TOKENS[theme]).filter(([k, v]) => live[k] !== v);
    check(`${theme} tokens match 05-design-system.md`, off.length === 0, JSON.stringify(off));
  }

  // Open menus stay on screen, and a long list scrolls inside the menu.
  for (const [w, h] of [[1280, 800], [1280, 400], [768, 1024], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const trigger of ["shell-space-trigger", "shell-account-trigger"]) {
      await page.goto(url("long", "dark"));
      await ready(page);
      await vis(page, trigger).click();
      const m = await page.evaluate(measure);
      const label = `long menu ${trigger} ${w}x${h}`;
      check(`${label}: on screen`, !!m.menu && m.menu.left >= 0 && m.menu.right <= w && m.menu.top >= 0 && m.menu.bottom <= h, JSON.stringify(m.menu));
      check(`${label}: no page overflow`, m.docOverflow <= 0 && m.bodyOverflow <= 0);
    }
  }
  await context.close();
}

// Behavior on desktop.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await page.goto(url("normal", "dark"));
  await ready(page);
  for (const target of ["skills", "try", "team", "agents", "home"]) {
    await vis(page, `shell-place-${target}`).click();
    const current = await page.locator('[aria-current="page"]:visible').getAttribute("data-testid");
    check(`nav selects ${target}`, current === `shell-place-${target}`, current);
  }
  check("nav fires once per click", (await events(page)).filter((e) => e.startsWith("navigate")).length === 5);

  await page.evaluate(() => (window.__shellEvents.length = 0));
  await vis(page, "shell-place-home").click();
  check("clicking the current place does nothing", (await events(page)).length === 0);

  await vis(page, "shell-place-skills").dblclick();
  check("double click on a place navigates once", (await events(page)).filter((e) => e === "navigate:skills").length === 1);

  await page.evaluate(() => (window.__shellEvents.length = 0));
  const [popup] = await Promise.all([
    context.waitForEvent("page"),
    vis(page, "shell-place-team").click({ modifiers: [process.platform === "darwin" ? "Meta" : "Control"] }),
  ]);
  await popup.close();
  check("modifier click opens a tab and leaves the app alone", (await events(page)).length === 0);

  check("place links have real hrefs", (await vis(page, "shell-place-team").getAttribute("href")) === "/team");

  // Keyboard only.
  await page.goto(url("normal", "dark"));
  await ready(page);
  const order = [];
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab");
    order.push(await focusId(page));
  }
  const expected = ["A", "shell-space-trigger", "shell-place-home", "shell-place-skills", "shell-place-try", "shell-place-team", "shell-place-agents", "shell-account-trigger", "shell-theme-toggle"];
  check("tab order follows the layout", expected.every((id, i) => order[i] === id), order.join(" > "));

  const ring = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="shell-place-home"]');
    el.focus();
    return true;
  });
  await page.goto(url("normal", "dark"));
  await ready(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset };
  });
  check("focus ring is 2px with a 2px offset", ring && outline.style === "solid" && outline.width === "2px" && outline.offset === "2px", JSON.stringify(outline));

  // Skip link.
  await page.goto(url("normal", "dark"));
  await ready(page);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  check("skip link moves focus to main", (await focusId(page)) === "shell-main", await focusId(page));

  // Space menu by keyboard.
  await page.goto(url("normal", "dark"));
  await ready(page);
  await vis(page, "shell-space-trigger").focus();
  await page.keyboard.press("Enter");
  check("menu focuses the selected space", (await page.evaluate(() => document.activeElement.getAttribute("aria-checked"))) === "true");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  check("arrow and Enter switch the space", (await events(page)).includes("switch:sample-space"), (await events(page)).join());
  check("focus returns after choosing", (await focusId(page)) === "shell-space-trigger");
  check("the trigger shows the new space", (await vis(page, "shell-space-trigger").textContent()).includes("sample-space"));
  check("one skill reads singular", (await vis(page, "shell-space-trigger").textContent()).includes("1 skill") && !(await vis(page, "shell-space-trigger").textContent()).includes("1 skills"));

  await page.keyboard.press("Enter");
  await page.keyboard.press("End");
  check("End reaches New space", (await focusId(page)) === "shell-new-space");
  await page.keyboard.press("ArrowDown");
  check("arrows wrap around", (await page.evaluate(() => document.activeElement.getAttribute("role"))) === "menuitemradio");
  await page.keyboard.press("Escape");
  check("Escape closes and returns focus", (await vis(page, "shell-space-menu").count()) === 0 && (await focusId(page)) === "shell-space-trigger");

  await page.keyboard.press("ArrowDown");
  check("ArrowDown opens the menu", (await vis(page, "shell-space-menu").count()) === 1);
  await page.keyboard.press("Tab");
  check("Tab closes the menu", (await vis(page, "shell-space-menu").count()) === 0 && (await focusId(page)) === "shell-space-trigger");

  // Choosing the current space fires nothing.
  await page.goto(url("normal", "dark"));
  await ready(page);
  await vis(page, "shell-space-trigger").click();
  await page.locator('[aria-checked="true"]:visible').click();
  check("choosing the current space does nothing", (await events(page)).length === 0);

  // Dismiss paths.
  await vis(page, "shell-space-trigger").dblclick();
  check("double click on the trigger ends closed", (await vis(page, "shell-space-menu").count()) === 0);
  await vis(page, "shell-space-trigger").click();
  await page.mouse.click(900, 500);
  check("outside click closes", (await vis(page, "shell-space-menu").count()) === 0);
  await vis(page, "shell-space-trigger").click();
  await vis(page, "shell-account-trigger").click();
  check("opening one menu closes the other", (await vis(page, "shell-space-menu").count()) === 0 && (await vis(page, "shell-account-menu").count()) === 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  check("resize closes the menu", (await page.locator('[data-testid="shell-account-menu"]').count()) === 0);
  await page.setViewportSize({ width: 1280, height: 800 });

  // Sign out.
  await vis(page, "shell-account-trigger").click();
  await vis(page, "shell-sign-out").click();
  check("sign out fires", (await events(page)).includes("sign-out"));
  check("signed out row shows", (await vis(page, "shell-signed-out").count()) === 1);

  // Roles and empty states.
  await page.goto(url("viewer", "dark"));
  await ready(page);
  await vis(page, "shell-space-trigger").click();
  check("read only member has no New space", (await vis(page, "shell-new-space").count()) === 0);
  await page.goto(url("nospace", "dark"));
  await ready(page);
  check("no space state reads plainly", (await vis(page, "shell-space-trigger").textContent()).includes("No space yet"));
  await vis(page, "shell-space-trigger").click();
  check("no space still offers New space", (await vis(page, "shell-new-space").count()) === 1);
  await page.goto(url("signedout", "dark"));
  await ready(page);
  await vis(page, "shell-sign-in").click();
  check("sign in fires", (await events(page)).includes("sign-in"));
  await page.goto(url("normal", "dark", "&place=none"));
  await ready(page);
  check("a page outside the five selects nothing", (await page.locator('[aria-current="page"]').count()) === 0);

  // Longest values.
  await page.goto(url("long", "dark"));
  await ready(page);
  const account = await vis(page, "shell-account-trigger").textContent();
  check("a wallet address is shortened", /0x463e…eb1d/.test(account), account);
  check("the full address is in the tooltip", (await vis(page, "shell-account-trigger").getAttribute("title")).length === 66);
  check("skill count caps in the nav", (await vis(page, "shell-place-skills").textContent()).includes("999+"));

  // Tall content scrolls in main, and the chrome stays put.
  await page.goto(url("tall", "dark"));
  await ready(page);
  const scroll = await page.evaluate(() => {
    const main = document.querySelector('[data-testid="shell-main"]');
    main.scrollTop = 800;
    return { main: main.scrollTop, doc: document.documentElement.scrollHeight - innerHeight };
  });
  check("tall content scrolls inside main only", scroll.main > 0 && scroll.doc <= 0, JSON.stringify(scroll));

  // Short window: the account row stays reachable.
  await page.setViewportSize({ width: 1280, height: 300 });
  await page.goto(url("normal", "dark"));
  await ready(page);
  const foot = await vis(page, "shell-theme-toggle").boundingBox();
  check("short window keeps the account row on screen", foot.y + foot.height <= 300, JSON.stringify(foot));
  const reach = await page.evaluate(() => {
    const nav = document.querySelector(".cc-nav");
    return { scrollable: nav.scrollHeight > nav.clientHeight };
  });
  await vis(page, "shell-place-agents").scrollIntoViewIfNeeded();
  check("short window: nav scrolls to the last place", (await vis(page, "shell-place-agents").isVisible()) && reach.scrollable, JSON.stringify(reach));
  await page.setViewportSize({ width: 1280, height: 800 });

  // Theme.
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${PREVIEW}?state=normal`);
  await ready(page);
  check("dark is the default with nothing stored", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  await vis(page, "shell-theme-toggle").click();
  check("the toggle switches to light", !(await page.evaluate(() => document.documentElement.classList.contains("dark"))));
  await page.reload();
  await ready(page);
  check("light survives a reload", !(await page.evaluate(() => document.documentElement.classList.contains("dark"))));
  await vis(page, "shell-theme-toggle").dblclick();
  check("double toggle lands back on light", !(await page.evaluate(() => document.documentElement.classList.contains("dark"))));
  await page.goto(`${PREVIEW}?state=normal&theme=dark`);
  await ready(page);
  check("?theme= overrides storage", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  await context.close();

  // Storage blocked, as in some private windows.
  const locked = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await locked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  const lockedPage = await locked.newPage();
  const lockedErrors = [];
  lockedPage.on("pageerror", (e) => lockedErrors.push(e.message));
  await lockedPage.goto(`${PREVIEW}?state=normal`);
  await ready(lockedPage);
  await vis(lockedPage, "shell-theme-toggle").click();
  check("blocked storage still renders and toggles", lockedErrors.length === 0 && !(await lockedPage.evaluate(() => document.documentElement.classList.contains("dark"))), lockedErrors.join());
  await locked.close();
}

// Behavior on mobile, with touch.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(url("normal", "dark"));
  await ready(page);
  for (const target of ["skills", "try", "team", "agents", "home"]) {
    await vis(page, `shell-place-${target}`).tap();
    check(`bottom bar selects ${target}`, (await page.locator('[aria-current="page"]:visible').getAttribute("data-testid")) === `shell-place-${target}`);
  }
  await vis(page, "shell-space-trigger").tap();
  const options = page.locator('[data-testid="shell-space-option"]:visible');
  const optionBox = await options.first().boundingBox();
  check("mobile menu items are at least 44px", optionBox.height >= 44, String(optionBox.height));
  await options.nth(1).tap();
  check("mobile space switch works", (await events(page)).includes("switch:sample-space"));
  await vis(page, "shell-account-trigger").tap();
  await vis(page, "shell-sign-out").tap();
  check("mobile sign out works", (await events(page)).includes("sign-out"));
  check("signed out mobile bar stays clean", (await vis(page, "shell-signed-out").count()) === 0);
  await context.close();
}

// The real app still loads with the token import.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${ORIGIN}/`);
  await page.waitForSelector("#root *");
  const paper = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--paper").trim());
  check("the live app still renders with its old tokens", errors.length === 0 && paper.length > 0, errors.join() || `paper ${paper}`);
  await context.close();
}

// The one line the handoff asks for in src/main.tsx, run against the real App.tsx.
{
  const line = `<script>(() => {
    const q = new URLSearchParams(location.search).get("theme");
    const key = "memwal_skill_harness_theme_v1";
    const theme = q === "dark" || q === "light" ? q : localStorage.getItem(key) === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(key, theme);
  })()</script>`;
  const cases = [
    ["nothing stored", null, "", true],
    ["stored light", "light", "", false],
    ["stored dark", "dark", "", true],
    ["?theme=light over stored dark", "dark", "?theme=light", false],
  ];
  for (const [label, stored, query, dark] of cases) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    await page.route(`${ORIGIN}/${query}`, async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, body: (await response.text()).replace("<head>", `<head>${line}`) });
    });
    await page.addInitScript((value) => {
      if (value && !sessionStorage.getItem("seeded")) {
        localStorage.setItem("memwal_skill_harness_theme_v1", value);
        sessionStorage.setItem("seeded", "1");
      }
    }, stored);
    await page.goto(`${ORIGIN}/${query}`);
    await page.waitForSelector("#root *");
    await page.waitForTimeout(200);
    const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    check(`real app with the main.tsx line: ${label}`, isDark === dark, `dark=${isDark}`);
    await context.close();
  }
}

// Screenshots.
{
  const shots = [
    ["after-desktop", 1280, 800, url("normal", "dark"), null],
    ["after-mobile", 390, 844, url("normal", "dark"), null],
    ["after-desktop-light", 1280, 800, url("normal", "light"), null],
    ["after-mobile-light", 390, 844, url("normal", "light"), null],
    ["after-desktop-long", 1280, 800, url("long", "dark"), null],
    ["after-mobile-long", 390, 844, url("long", "dark"), null],
    ["after-desktop-space-menu", 1280, 800, url("normal", "dark"), "shell-space-trigger"],
    ["after-mobile-space-menu", 390, 844, url("normal", "dark"), "shell-space-trigger"],
    ["after-desktop-account-menu", 1280, 800, url("normal", "dark"), "shell-account-trigger"],
  ];
  for (const [name, width, height, target, open] of shots) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(target);
    await ready(page);
    await page.evaluate(() => document.fonts.ready);
    if (open) await vis(page, open).click();
    await page.screenshot({ path: join(OUT, `${name}.png`) });
    await context.close();
  }
}

// Flow video.
{
  const tmp = join(OUT, ".video");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: tmp, size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  await page.goto(url("normal", "dark"));
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  for (const target of ["skills", "try", "team", "agents", "home"]) {
    await vis(page, `shell-place-${target}`).click();
    await page.waitForTimeout(500);
  }
  await vis(page, "shell-space-trigger").click();
  await page.waitForTimeout(700);
  await page.locator('[data-testid="shell-space-option"]:visible').nth(1).click();
  await page.waitForTimeout(700);
  await vis(page, "shell-account-trigger").click();
  await page.waitForTimeout(700);
  await page.keyboard.press("Escape");
  await vis(page, "shell-theme-toggle").click();
  await page.waitForTimeout(800);
  await vis(page, "shell-theme-toggle").click();
  await page.waitForTimeout(500);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(800);
  await vis(page, "shell-place-team").click();
  await page.waitForTimeout(700);
  await context.close();
  const file = readdirSync(tmp).find((f) => f.endsWith(".webm"));
  renameSync(join(tmp, file), join(OUT, "after-flow.webm"));
  rmSync(tmp, { recursive: true, force: true });
}

await browser.close();

const failed = results.filter((r) => !r.ok);
writeFileSync(join(OUT, "results.json"), JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

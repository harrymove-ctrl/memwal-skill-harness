// QA for the logo glint: it really plays inside the mark, stays inside the mark,
// and steps aside for reduced motion and missing WebGL.
// Run with the dev server up: node video/scripts/qa-glint.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/brand");
const FRAMES = join(ROOT, ".tmp/brand/frames");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const LOGO = `${ORIGIN}/src/shell/preview/logo.html`;
const SHELL = `${ORIGIN}/src/shell/preview/index.html?state=normal`;
mkdirSync(OUT, { recursive: true });
mkdirSync(FRAMES, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail: String(detail) });
  if (!ok) console.log(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const WEBGL = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const browser = await chromium.launch({ args: WEBGL });
const glintState = (locator) => locator.getAttribute("data-glint");
const waitPlaying = (page, selector) =>
  page.waitForFunction((s) => document.querySelector(s)?.dataset.glint === "playing", selector, { timeout: 5000, polling: 20 });
const waitIdle = (page, selector) =>
  page.waitForFunction((s) => document.querySelector(s)?.dataset.glint === "idle", selector, { timeout: 5000, polling: 50 });

// Read the screen, so this proves what a person sees rather than what the code says.
async function pixels(page, box) {
  const png = await page.screenshot({ clip: box, type: "png" });
  return page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return { width: image.width, height: image.height, data: [...ctx.getImageData(0, 0, image.width, image.height).data] };
  }, png.toString("base64"));
}

// The real effect at a large size.
for (const theme of ["dark", "light"]) {
  const context = await browser.newContext({ viewport: { width: 500, height: 320 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource|fonts\.g/.test(m.text())) errors.push(m.text());
  });
  await page.goto(`${LOGO}?theme=${theme}&sizes=128`);
  const selector = '[data-testid="logo-glint"]';
  const glint = page.locator(selector);
  await glint.waitFor();
  await waitPlaying(page, selector);
  check(`${theme}: plays on its own after mount`, true);
  const box = await glint.boundingBox();

  await waitIdle(page, selector);
  const rest = await pixels(page, box);

  await page.locator('[data-testid="glint-replay"]').click();
  await waitPlaying(page, selector);
  let bestInside = 0;
  let worstOutside = 0;
  const sampleCount = 26;
  for (let i = 0; i < sampleCount; i += 1) {
    const frame = await pixels(page, box);
    let inside = 0;
    let outside = 0;
    for (let p = 0; p < frame.data.length; p += 4) {
      const diff = Math.abs(frame.data[p] - rest.data[p]) + Math.abs(frame.data[p + 1] - rest.data[p + 1]) + Math.abs(frame.data[p + 2] - rest.data[p + 2]);
      if (diff <= 24) continue;
      // Pixels that were background at rest are outside the mark.
      const bg = rest.data[0] === rest.data[p] && rest.data[1] === rest.data[p + 1] && rest.data[2] === rest.data[p + 2];
      if (bg) outside += 1;
      else inside += 1;
    }
    bestInside = Math.max(bestInside, inside);
    worstOutside = Math.max(worstOutside, outside);
    if (theme === "dark") {
      await page.screenshot({ path: join(FRAMES, `frame-${String(i).padStart(2, "0")}.png`), clip: { x: box.x - 16, y: box.y - 16, width: box.width + 32, height: box.height + 32 } });
    }
    if ((await glintState(glint)) !== "playing") break;
  }
  check(`${theme}: the light visibly crosses the mark`, bestInside > 400, `${bestInside} changed pixels`);
  check(`${theme}: the light stays inside the mark`, worstOutside === 0, `${worstOutside} pixels outside`);

  await waitIdle(page, selector);
  const after = await pixels(page, box);
  const leftover = after.data.reduce((sum, value, index) => sum + (Math.abs(value - rest.data[index]) > 12 ? 1 : 0), 0);
  // A pixel or two on the curve's edge can round differently between two screenshots.
  check(`${theme}: the mark returns to rest`, leftover <= 12, `${leftover} channels differ`);

  // Rapid replays must not stack or error.
  const replay = page.locator('[data-testid="glint-replay"]');
  for (let i = 0; i < 6; i += 1) await replay.click({ delay: 0 });
  await page.waitForTimeout(150);
  await waitIdle(page, selector);
  await glint.hover();
  await waitPlaying(page, selector);
  check(`${theme}: hover plays it`, true);
  await waitIdle(page, selector);
  check(`${theme}: no errors after rapid replays`, errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

// Every size at once is a real load: one canvas and one context per logo.
{
  const context = await browser.newContext({ viewport: { width: 700, height: 300 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${LOGO}?theme=dark`);
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="logo-glint"]')].some((el) => el.dataset.glint === "playing"), null, { timeout: 5000, polling: 20 });
  await page.waitForFunction(() => [...document.querySelectorAll('[data-testid="logo-glint"]')].every((el) => el.dataset.glint === "idle"), null, { timeout: 5000 });
  const count = await page.locator('[data-testid="logo-glint"]').count();
  check("all seven sizes play and settle", count === 7 && errors.length === 0, errors.join());
  const smallCut = await page.evaluate(() => [...document.querySelectorAll('[data-testid="logo-mark"]')].map((el) => el.dataset.cut).join());
  check("glint keeps the small cut at 24px and under", smallCut === "full,full,full,full,full,small,small", smallCut);
  await context.close();
}

// In the shell.
for (const [label, width, height, visibleBar] of [["desktop", 1280, 800, "shell-sidebar"], ["mobile", 390, 844, "shell-topbar"]]) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.goto(`${SHELL}&theme=dark`);
  const selector = `[data-testid="${visibleBar}"] [data-testid="logo-glint"]`;
  await page.locator(selector).waitFor();
  await waitPlaying(page, selector);
  check(`${label}: the visible logo plays`, true);
  const hiddenBar = visibleBar === "shell-sidebar" ? "shell-topbar" : "shell-sidebar";
  const hiddenState = await page.locator(`[data-testid="${hiddenBar}"] [data-testid="logo-glint"]`).getAttribute("data-glint");
  check(`${label}: the hidden logo stays idle and spends no WebGL`, hiddenState === "idle", hiddenState);
  await waitIdle(page, selector);
  await page.locator('[data-testid="shell-place-skills"]:visible').click();
  await waitPlaying(page, selector);
  check(`${label}: moving to another place plays it again`, true);
  await waitIdle(page, selector);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`${label}: no overflow`, overflow <= 0, overflow);
  const blocks = await page.locator(`${selector} canvas`).evaluate((el) => getComputedStyle(el).pointerEvents);
  check(`${label}: the canvas never takes a click`, blocks === "none", blocks);
  const hidden = await page.locator(`${selector} canvas`).getAttribute("aria-hidden");
  check(`${label}: the canvas stays out of the accessibility tree`, hidden === "true", hidden);
  await context.close();
}

// Reduced motion: no effect at all, and Glimm is not even loaded.
{
  const context = await browser.newContext({ viewport: { width: 500, height: 320 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const loaded = [];
  page.on("request", (request) => {
    if (/glimm/i.test(request.url()) && !/preview/.test(request.url())) loaded.push(request.url());
  });
  await page.goto(`${LOGO}?theme=dark&sizes=128`);
  await page.locator('[data-testid="logo-glint"]').waitFor();
  await page.waitForTimeout(900);
  await page.locator('[data-testid="logo-glint"]').hover();
  await page.waitForTimeout(500);
  check("reduced motion: nothing plays", (await glintState(page.locator('[data-testid="logo-glint"]'))) === "idle");
  check("reduced motion: Glimm is never downloaded", loaded.length === 0, loaded.join());
  check("reduced motion: the plain mark still shows", await page.locator('[data-testid="logo-mark"]').isVisible());
  await context.close();
}

// No WebGL: the plain mark, no errors.
{
  const noGl = await chromium.launch({ args: ["--disable-gpu", "--disable-webgl", "--disable-webgl2", "--disable-software-rasterizer"] });
  const context = await noGl.newContext({ viewport: { width: 500, height: 320 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return /webgl/i.test(type) ? null : original.call(this, type, ...rest);
    };
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${LOGO}?theme=dark&sizes=128`);
  const glint = page.locator('[data-testid="logo-glint"]');
  await glint.waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="logo-glint"]').dataset.glint === "off", null, { timeout: 5000 });
  check("no WebGL: it turns itself off", true);
  check("no WebGL: the plain mark still shows", await page.locator('[data-testid="logo-mark"]').isVisible());
  check("no WebGL: no page errors", errors.length === 0, errors.join());
  await noGl.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
writeFileSync(join(OUT, "glint-results.json"), JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length} of ${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

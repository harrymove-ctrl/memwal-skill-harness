// QA for the logo: file integrity, geometry, contrast, real rendering in the shell
// and in the browser tab tags. Writes proof into docs/ux/qa/brand/.
// Run with the dev server up: node video/scripts/qa-brand.mjs
import { chromium } from "playwright";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BRAND = join(ROOT, "public/brand");
const OUT = join(ROOT, "docs/ux/qa/brand");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const PREVIEW = `${ORIGIN}/src/shell/preview/index.html?state=normal`;
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: !!ok, detail: String(detail) });
  if (!ok) console.log(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (c) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(hex(a)), lum(hex(b))].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const pngSize = (file) => {
  const data = readFileSync(file);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

// Files.
const SVGS = readdirSync(BRAND).filter((f) => f.endsWith(".svg"));
check("every documented file exists", [
  "mark-emerald.svg", "mark-deep.svg", "mark-ink.svg", "mark-white.svg", "mark-small-emerald.svg", "mark-small-deep.svg",
  "lockup-on-dark.svg", "lockup-on-light.svg", "lockup-full-on-dark.svg", "lockup-full-on-light.svg",
  "app-icon.svg", "app-icon-dark.svg", "favicon.svg", "og-image.svg", "site.webmanifest",
  "favicon-16.png", "favicon-32.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "og-image.png",
].every((f) => existsSync(join(BRAND, f))));
for (const file of SVGS) {
  const svg = readFileSync(join(BRAND, file), "utf8");
  check(`${file}: no live text or font dependency`, !/<text|font-family|<image|href=/.test(svg));
  check(`${file}: has an accessible name`, /<title>Skillbook<\/title>/.test(svg));
  check(`${file}: under 40 KB`, svg.length < 40_000, svg.length);
}
for (const [file, w, h] of [
  ["favicon-16.png", 16, 16], ["favicon-32.png", 32, 32], ["apple-touch-icon.png", 180, 180], ["icon-192.png", 192, 192],
  ["icon-512.png", 512, 512], ["icon-maskable-512.png", 512, 512], ["og-image.png", 1200, 630],
]) {
  const [pw, ph] = pngSize(join(BRAND, file));
  check(`${file}: is ${w}x${h}`, pw === w && ph === h, `${pw}x${ph}`);
}
const manifest = JSON.parse(readFileSync(join(BRAND, "site.webmanifest"), "utf8"));
check("manifest icons all exist", manifest.icons.every((icon) => existsSync(join(ROOT, "public", icon.src))));
check("manifest offers a maskable icon", manifest.icons.some((icon) => icon.purpose === "maskable"));

// Contrast. A logo is a graphic, so 3:1 is the floor; names are text, so 4.5:1.
for (const [label, fg, bg, floor] of [
  ["emerald mark on dark bg", "#34d399", "#0b0f0e", 3],
  ["emerald mark on dark surface", "#34d399", "#121816", 3],
  ["deep mark on light bg", "#047857", "#f7f7f4", 3],
  ["deep mark on white", "#047857", "#ffffff", 3],
  ["mark on emerald tile", "#04140d", "#34d399", 3],
  ["name on dark bg", "#f4f6f5", "#0b0f0e", 4.5],
  ["name on light bg", "#141413", "#f7f7f4", 4.5],
]) {
  const value = ratio(fg, bg);
  check(`${label}: at least ${floor}:1`, value >= floor, value.toFixed(2));
}

const browser = await chromium.launch();

// Geometry, read from the rendered shape.
{
  const page = await browser.newPage({ viewport: { width: 700, height: 700 } });
  for (const file of ["mark-emerald.svg", "mark-small-emerald.svg"]) {
    const svg = readFileSync(join(BRAND, file), "utf8").replace(/ width="64" height="64"/, ' width="640" height="640"');
    await page.setContent(`<!doctype html><body style="margin:0;background:#000">${svg}</body>`);
    const m = await page.evaluate(() => {
      const box = document.querySelector("g").getBBox();
      const paths = [...document.querySelectorAll("path")];
      const left = paths[1].getBBox();
      const right = paths[2].getBBox();
      return { box: [box.x, box.y, box.width, box.height], left: [left.x, left.width], right: [right.x, right.width], book: paths[0].getBBox().y + paths[0].getBBox().height, tusk: left.y };
    });
    check(`${file}: the tusks mirror on the center`, Math.abs(m.left[0] + m.right[0] + m.right[1] - 64) < 0.25, JSON.stringify(m));
    check(`${file}: stays inside the 64 unit grid`, m.box[0] >= 0 && m.box[1] >= 0 && m.box[0] + m.box[2] <= 64 && m.box[1] + m.box[3] <= 64, JSON.stringify(m.box));
    const center = await page.screenshot({ type: "png" });
    check(`${file}: renders`, center.length > 1000);
  }
  await page.close();
}

// In the shell.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const theme of ["dark", "light"]) {
    await page.goto(`${PREVIEW}&theme=${theme}`);
    await page.waitForSelector('[data-testid="app-shell"]');
    const sidebar = page.locator('[data-testid="shell-sidebar"] [data-testid="logo-mark"]');
    check(`${theme}: sidebar shows the mark`, await sidebar.isVisible());
    check(`${theme}: 24px uses the small cut`, (await sidebar.getAttribute("data-cut")) === "small");
    check(`${theme}: sidebar names the product`, (await page.locator(".cc-brand:visible").textContent()).trim() === "Skillbook");
    const color = await sidebar.evaluate((el) => getComputedStyle(el).color);
    check(`${theme}: the mark follows the theme`, color === (theme === "dark" ? "rgb(52, 211, 153)" : "rgb(4, 120, 87)"), color);
    check(`${theme}: decorative beside its name`, (await sidebar.getAttribute("aria-hidden")) === "true");
    await page.locator(".cc-brand:visible").screenshot({ path: join(OUT, `brand-row-${theme}.png`) });
  }
  check("no page errors", errors.length === 0, errors.join());

  // Tab tags on the real entry page, and each one resolves.
  await page.goto(`${ORIGIN}/`);
  await page.waitForSelector("#root *");
  check("the live page title is the product name", (await page.title()) === "Skillbook", await page.title());
  const links = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')].map((el) => el.getAttribute("href")),
  );
  check("favicon, touch icon and manifest are linked", links.length === 4, links.join());
  for (const href of links) {
    const response = await page.request.get(`${ORIGIN}${href}`);
    check(`${href}: serves`, response.ok(), response.status());
  }
  const og = await page.evaluate(() => document.querySelector('meta[property="og:image"]').content);
  check("link preview image is an absolute URL", og.startsWith("https://"), og);
  await context.close();
}

// Mobile: the mark fits without squeezing the bar.
for (const width of [390, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 700 } });
  const page = await context.newPage();
  await page.goto(`${PREVIEW}&theme=dark`);
  await page.waitForSelector('[data-testid="app-shell"]');
  const mark = page.locator('[data-testid="shell-topbar"] [data-testid="logo-mark"]');
  check(`${width}px: top bar shows the mark`, await mark.isVisible());
  check(`${width}px: alone in the bar it carries a name`, (await mark.getAttribute("aria-label")) === "Skillbook");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(`${width}px: no overflow`, overflow <= 0, overflow);
  const space = await page.locator('[data-testid="shell-space-trigger"]:visible').boundingBox();
  check(`${width}px: the space switcher keeps usable room`, space.width >= 120, space.width);
  await context.close();
}

// Proof. The earlier shell screenshots show the old logo, so they are the before.
const OLD = join(ROOT, "docs/ux/qa/shell");
for (const [from, to] of [["after-desktop.png", "before-desktop.png"], ["after-mobile.png", "before-mobile.png"]]) {
  if (!existsSync(join(OUT, to)) && existsSync(join(OLD, from))) copyFileSync(join(OLD, from), join(OUT, to));
}
for (const [name, width, height] of [["after-desktop", 1280, 800], ["after-mobile", 390, 844]]) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${PREVIEW}&theme=dark`);
  await page.waitForSelector('[data-testid="app-shell"]');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  await context.close();
}

// The size ladder and every surface, on one sheet.
{
  const mark = (file, size) => `<img src="${ORIGIN}/brand/${file}" width="${size}" height="${size}" alt="">`;
  const panel = (bg, ink, cells) => `<div style="background:${bg};color:${ink};padding:32px;border-radius:16px;display:flex;gap:28px;align-items:center;flex-wrap:wrap">${cells}</div>`;
  const ladder = (full, small) => [96, 64, 48, 32].map((s) => mark(full, s)).concat([24, 20, 16].map((s) => mark(small, s))).join("");
  const html = `<!doctype html><body style="margin:0;background:#0b0f0e;padding:32px;display:grid;gap:20px;width:1216px;box-sizing:border-box">
  ${panel("#0b0f0e;border:1px solid rgba(255,255,255,.09)", "#fff", `<img src="${ORIGIN}/brand/lockup-full-on-dark.svg" height="72" alt="">`)}
  ${panel("#f7f7f4", "#000", `<img src="${ORIGIN}/brand/lockup-full-on-light.svg" height="72" alt="">`)}
  ${panel("#121816", "#fff", ladder("mark-emerald.svg", "mark-small-emerald.svg"))}
  ${panel("#ffffff", "#000", ladder("mark-deep.svg", "mark-small-deep.svg"))}
  ${panel("#18201e", "#fff", [mark("app-icon.svg", 128), mark("app-icon-dark.svg", 128), mark("icon-maskable-512.png", 128), mark("apple-touch-icon.png", 96), `<img src="${ORIGIN}/brand/favicon-32.png" width="32" height="32" alt="">`, `<img src="${ORIGIN}/brand/favicon-16.png" width="16" height="16" alt="">`].join(""))}
  <img src="${ORIGIN}/brand/og-image.png" width="1152" alt="" style="border-radius:16px">
  </body>`;
  const context = await browser.newContext({ viewport: { width: 1216, height: 900 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}/brand/site.webmanifest`).catch(() => {});
  await page.setContent(html, { waitUntil: "networkidle" });
  const broken = await page.evaluate(() => [...document.images].filter((img) => !img.naturalWidth).map((img) => img.src));
  check("the logo sheet loads every file", broken.length === 0, broken.join());
  await page.screenshot({ path: join(OUT, "logo-sheet.png"), fullPage: true });
  await context.close();
}

// Flow video: the logo through navigation, theme and the phone layout.
{
  const tmp = join(OUT, ".video");
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  const page = await context.newPage();
  await page.goto(`${PREVIEW}&theme=dark`);
  await page.waitForSelector('[data-testid="app-shell"]');
  await page.waitForTimeout(800);
  await page.locator('[data-testid="shell-place-skills"]:visible').click();
  await page.waitForTimeout(600);
  await page.locator('[data-testid="shell-theme-toggle"]:visible').click();
  await page.waitForTimeout(900);
  await page.locator('[data-testid="shell-theme-toggle"]:visible').click();
  await page.waitForTimeout(600);
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(1000);
  await page.goto(`${ORIGIN}/brand/og-image.png`);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(1200);
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

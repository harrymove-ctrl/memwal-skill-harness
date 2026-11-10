// Builds every logo file in public/brand from src/shell/logoPaths.ts and the
// outlined type in scripts/brand/outlines.json, so no file depends on a font.
// Run from a normal terminal: node video/scripts/build-brand.mjs
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "public/brand");
mkdirSync(OUT, { recursive: true });

const { MARK_PATHS, MARK_SMALL_PATHS } = await import(pathToFileURL(join(ROOT, "src/shell/logoPaths.ts")).href);
const TYPE = JSON.parse(readFileSync(join(ROOT, "scripts/brand/outlines.json"), "utf8"));

const COLOR = {
  emerald: "#34d399",
  deep: "#047857",
  onEmerald: "#04140d",
  bg: "#0b0f0e",
  surface: "#121816",
  paper: "#f7f7f4",
  inkDark: "#f4f6f5",
  inkDark2: "#a7b0ad",
  inkLight: "#141413",
};

const fills = (paths, color) => `<g fill="${color}">${paths.map((d) => `<path d="${d}"/>`).join("")}</g>`;
const doc = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;

/** The mark inside a square. `scale` leaves the padding around it. */
function tile(size, { bg, color, radius, scale, paths = MARK_PATHS }) {
  const k = (size / 64) * scale;
  const offset = (size - 64 * k) / 2;
  const rect = bg ? `<rect width="${size}" height="${size}" rx="${radius}" fill="${bg}"/>` : "";
  return `${rect}<g transform="translate(${offset} ${offset}) scale(${k})">${fills(paths, color)}</g>`;
}

/** Mark and name on one line. The cap height centers on the mark's visual middle. */
function lockup(word, markColor, inkColor) {
  const gap = 16;
  const width = Math.ceil(64 + gap + word.width);
  const baseline = (64 + word.capHeight) / 2;
  return {
    width,
    height: 64,
    body: `${fills(MARK_PATHS, markColor)}<path fill="${inkColor}" transform="translate(${64 + gap} ${baseline})" d="${word.d}"/>`,
  };
}

const files = {};
const NAME = "Skillbook";

// The mark, for any surface.
files["mark-emerald.svg"] = doc(64, 64, fills(MARK_PATHS, COLOR.emerald), NAME);
files["mark-deep.svg"] = doc(64, 64, fills(MARK_PATHS, COLOR.deep), NAME);
files["mark-ink.svg"] = doc(64, 64, fills(MARK_PATHS, COLOR.inkLight), NAME);
files["mark-white.svg"] = doc(64, 64, fills(MARK_PATHS, "#ffffff"), NAME);
files["mark-small-emerald.svg"] = doc(64, 64, fills(MARK_SMALL_PATHS, COLOR.emerald), NAME);
files["mark-small-deep.svg"] = doc(64, 64, fills(MARK_SMALL_PATHS, COLOR.deep), NAME);

// Mark and name.
for (const [file, word] of [["lockup", TYPE.short], ["lockup-full", TYPE.full]]) {
  const dark = lockup(word, COLOR.emerald, COLOR.inkDark);
  const light = lockup(word, COLOR.deep, COLOR.inkLight);
  files[`${file}-on-dark.svg`] = doc(dark.width, dark.height, dark.body, NAME);
  files[`${file}-on-light.svg`] = doc(light.width, light.height, light.body, NAME);
}

// App icons. The emerald tile stays visible on any tab bar or home screen.
const ICON = { bg: COLOR.emerald, color: COLOR.onEmerald };
files["app-icon.svg"] = doc(512, 512, tile(512, { ...ICON, radius: 112, scale: 0.72 }), NAME);
files["app-icon-dark.svg"] = doc(512, 512, tile(512, { bg: COLOR.surface, color: COLOR.emerald, radius: 112, scale: 0.72 }), NAME);
files["favicon.svg"] = doc(64, 64, tile(64, { ...ICON, radius: 14, scale: 0.84, paths: MARK_SMALL_PATHS }), NAME);

// Link preview.
{
  const logo = lockup(TYPE.full, COLOR.emerald, COLOR.inkDark);
  const body = [
    `<rect width="1200" height="630" fill="${COLOR.bg}"/>`,
    `<g transform="translate(830 36) scale(5.6)" opacity="0.1">${fills(MARK_PATHS, COLOR.emerald)}</g>`,
    `<g transform="translate(80 96) scale(1.15)">${logo.body}</g>`,
    `<path fill="${COLOR.inkDark}" transform="translate(80 ${630 - 170}) scale(1.42)" d="${TYPE.tagline1.d}"/>`,
    `<path fill="${COLOR.inkDark2}" transform="translate(80 ${630 - 92}) scale(1.42)" d="${TYPE.tagline2.d}"/>`,
  ].join("");
  files["og-image.svg"] = doc(1200, 630, body, NAME);
}

for (const [name, content] of Object.entries(files)) writeFileSync(join(OUT, name), content);

writeFileSync(
  join(OUT, "site.webmanifest"),
  `${JSON.stringify(
    {
      name: NAME,
      short_name: "Skillbook",
      description: "Your team's playbook for coding agents: teach a rule once, and every teammate's agent follows it.",
      start_url: "/",
      display: "standalone",
      background_color: COLOR.bg,
      theme_color: COLOR.bg,
      icons: [
        { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
        { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/brand/app-icon.svg", sizes: "any", type: "image/svg+xml" },
      ],
    },
    null,
    2,
  )}\n`,
);

// Bitmaps, drawn by a real browser from the same geometry.
const PNGS = [
  ["favicon-16.png", 16, doc(64, 64, tile(64, { ...ICON, radius: 14, scale: 0.84, paths: MARK_SMALL_PATHS }), NAME), true],
  ["favicon-32.png", 32, doc(64, 64, tile(64, { ...ICON, radius: 14, scale: 0.84, paths: MARK_SMALL_PATHS }), NAME), true],
  ["icon-192.png", 192, files["app-icon.svg"], true],
  ["icon-512.png", 512, files["app-icon.svg"], true],
  // Full bleed: iOS and Android cut their own corners. Maskable keeps the mark in the safe zone.
  ["apple-touch-icon.png", 180, doc(512, 512, tile(512, { ...ICON, radius: 0, scale: 0.68 }), NAME), false],
  ["icon-maskable-512.png", 512, doc(512, 512, tile(512, { ...ICON, radius: 0, scale: 0.58 }), NAME), false],
];

const browser = await chromium.launch();
const render = async (name, width, height, svg, transparent) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const inner = svg.replace(/ width="\d+" height="\d+"/, ` width="${width}" height="${height}"`);
  await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${inner}</body></html>`);
  await page.screenshot({ path: join(OUT, name), omitBackground: transparent });
  await page.close();
};
for (const [name, size, svg, transparent] of PNGS) await render(name, size, size, svg, transparent);
await render("og-image.png", 1200, 630, files["og-image.svg"], false);
await browser.close();

console.log(`Built ${Object.keys(files).length + PNGS.length + 2} files in public/brand`);

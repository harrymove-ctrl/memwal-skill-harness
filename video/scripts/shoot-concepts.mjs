// Shoots each UX concept still from the concepts dev server (docs/ux/concepts, `npm run dev` on :5199).
// node video/scripts/shoot-concepts.mjs [concept ...]
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.CONCEPTS_URL ?? "http://localhost:5199";
const THEME = process.env.CONCEPT_THEME ?? "";
const OUT = new URL(THEME === "dark" ? "../../docs/ux/concepts/stills-dark" : "../../docs/ux/concepts/stills", import.meta.url).pathname;
const ALL = ["home-calm", "home-command", "landing", "skills", "try-it", "team", "agents"];
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: 2 });
for (const id of ids) {
  await page.goto(`${BASE}/?c=${id}${THEME ? `&t=${THEME}` : ""}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.locator("#example").screenshot({ path: `${OUT}/${id}.png` });
  console.log("shot", id);
}
await browser.close();

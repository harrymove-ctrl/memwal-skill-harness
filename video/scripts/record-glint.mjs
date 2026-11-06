// Records the logo glint at a large size for review and for the PR.
// Run with the dev server up, then see the ffmpeg line printed at the end.
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/brand");
const TMP = join(ROOT, ".tmp/brand/glint-video");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
mkdirSync(OUT, { recursive: true });
rmSync(TMP, { recursive: true, force: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const context = await browser.newContext({ viewport: { width: 360, height: 220 }, recordVideo: { dir: TMP, size: { width: 360, height: 220 } } });
const page = await context.newPage();
await page.goto(`${ORIGIN}/src/shell/preview/logo.html?theme=dark&sizes=128`);
const glint = page.locator('[data-testid="logo-glint"]');
await glint.waitFor();
await page.waitForFunction(() => document.querySelector('[data-testid="logo-glint"]').dataset.glint === "idle", null, { polling: 50 });
for (let i = 0; i < 3; i += 1) {
  await page.waitForFunction(() => document.querySelector('[data-testid="logo-glint"]').dataset.glint === "idle", null, { polling: 50 });
  await page.waitForTimeout(500);
  await page.locator('[data-testid="glint-replay"]').click();
  await page.waitForFunction(() => document.querySelector('[data-testid="logo-glint"]').dataset.glint === "playing", null, { polling: 20 });
}
await page.waitForFunction(() => document.querySelector('[data-testid="logo-glint"]').dataset.glint === "idle", null, { polling: 50 });
await page.waitForTimeout(300);
await context.close();
await browser.close();
const file = readdirSync(TMP).find((name) => name.endsWith(".webm"));
renameSync(join(TMP, file), join(OUT, "logo-glint.webm"));
console.log("RECORDED");

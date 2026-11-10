// Before and after screenshots and a walkthrough of the real app, for the pull request.
// "Before" is the older app, which still serves ?legacy=1 and is what `/` showed until now.
// It only reads. Run with the dev server up: node video/scripts/record-app.mjs
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/app");
const VIDEO_TMP = join(OUT, ".video");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const NAV_ROLE = "link";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

for (const [name, width, height] of [["desktop", 1280, 800], ["mobile", 390, 844]]) {
  // Separate contexts: ?theme=light is remembered, and "after" must show the real default.
  const beforeContext = await browser.newContext({ viewport: { width, height } });
  const before = await beforeContext.newPage();
  await before.goto(`${ORIGIN}/?legacy=1&theme=light`);
  await before.waitForTimeout(4000);
  await before.screenshot({ path: join(OUT, `before-${name}.png`) });
  await beforeContext.close();

  const afterContext = await browser.newContext({ viewport: { width, height } });
  const after = await afterContext.newPage();
  await after.goto(`${ORIGIN}/`);
  await after.locator('[data-testid="landing-view"]').waitFor();
  await after.waitForTimeout(2200);
  await after.screenshot({ path: join(OUT, `after-${name}.png`) });
  await afterContext.close();
}

rmSync(VIDEO_TMP, { recursive: true, force: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: VIDEO_TMP, size: { width: 1280, height: 800 } },
});
const page = await context.newPage();
const id = (testid) => page.locator(`[data-testid="${testid}"]:visible`);
const nav = (label) => page.locator('[data-testid="shell-sidebar"]').getByRole(NAV_ROLE, { name: new RegExp(`^${label}`) }).click();
await page.goto(`${ORIGIN}/`);
await id("landing-view").waitFor();
await page.waitForTimeout(1800);
await id("landing-demo").click();
await id("try-run").waitFor({ timeout: 30000 });
await page.waitForTimeout(1000);
await id("try-run").click();
await id("try-with-verdict").waitFor({ timeout: 30000 });
await page.waitForTimeout(2500);
await nav("Team");
await id("member-row").first().waitFor({ timeout: 30000 });
await page.waitForTimeout(2000);
await nav("Agents");
await id("agents-view").waitFor();
await page.waitForTimeout(800);
await id("agent-tile-cursor").click();
await page.waitForTimeout(1500);
await nav("Home");
await id("open-proof").waitFor();
await page.waitForTimeout(800);
await id("open-proof").click();
await id("proof-count").waitFor({ timeout: 45000 });
await page.waitForTimeout(2500);
const video = page.video();
await page.close();
await video.saveAs(join(OUT, "after-flow.webm"));
await context.close();
await browser.close();
rmSync(VIDEO_TMP, { recursive: true, force: true });
console.log("RECORD_OK");

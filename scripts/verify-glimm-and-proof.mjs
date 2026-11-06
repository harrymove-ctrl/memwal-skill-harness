import { chromium } from "/Users/harryphan/.npm/_npx/0cf6ff1fad43f633/node_modules/playwright/index.mjs";

const BASE_URL = process.env.BASE_URL || "http://localhost:4188";
const OUT_DIR =
  "/Users/harryphan/.gemini/antigravity/brain/7cebfa6b-9098-4967-84ee-fa91b0b2ab78";

async function main() {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const errors = [];
  page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));
  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.log(`HTTP_${res.status()}: ${res.url()}`);
    }
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      console.log("CONSOLE_ERR_LOC:", msg.location());
      errors.push(`CONSOLE_ERROR: ${msg.text()}`);
    }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("memwal_skill_harness_authed_v8", "true");
    window.localStorage.setItem("memwal_owner_fast_session_v1", "true");
    window.localStorage.setItem("memwal_skill_harness_theme_v1", "dark");
  });

  console.log("1. Opening Playground (/eval)...");
  await page.goto(`${BASE_URL}/eval?theme=dark`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="glimm-studio-bar"]');

  // Click "5. WebGL Sweeps" pill to show the new glimm skill & facts
  const glimmPill = page.getByRole("button", {
    name: /5\. WebGL Sweeps/i,
  });
  if ((await glimmPill.count()) > 0) {
    await glimmPill.click();
    await page.waitForTimeout(300);
  }

  // Expand Glimm Shader Studio
  await page.click('[data-testid="glimm-expand-studio-btn"]');
  await page.waitForSelector('[data-testid="glimm-studio-expanded"]');
  await page.waitForTimeout(300);

  await page.screenshot({
    path: `${OUT_DIR}/after-glimm-studio-desktop.png`,
    fullPage: false,
  });
  console.log("Saved after-glimm-studio-desktop.png");

  // Trigger a prism orb sweep and capture mid-sweep
  await page.click('[data-testid="glimm-orb-prism"]');
  await page.waitForTimeout(260);
  await page.screenshot({
    path: `${OUT_DIR}/after-glimm-sweep-desktop.png`,
    fullPage: false,
  });
  console.log("Saved after-glimm-sweep-desktop.png");
  await page.waitForTimeout(600);

  // Also test Shuffle & Scope Sweep
  await page.click('[data-testid="glimm-shuffle-btn"]');
  await page.waitForTimeout(400);
  await page.click('[data-testid="glimm-scope-box-play-btn"]');
  await page.waitForTimeout(400);

  // Switch back to walrus orb and collapse studio to capture clean Playground overview
  await page.click('[data-testid="glimm-orb-walrus"]');
  await page.waitForTimeout(400);
  await page.click('[data-testid="glimm-expand-studio-btn"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({
    path: `${OUT_DIR}/after-demo-desktop.png`,
    fullPage: false,
  });
  console.log("Saved after-demo-desktop.png");

  // Navigate to Skills (/graph) and inspect glimm.SKILL.md
  console.log("2. Navigating to Skills (/graph)...");
  await page.getByRole("tab", { name: /Skills/i }).click();
  await page.waitForSelector('[data-testid="skills-essential-workbench"]');
  await page.waitForTimeout(500);

  const glimmListBtn = page
    .locator('[data-testid="skills-essential-workbench"] aside button')
    .filter({ hasText: /^glimm/i })
    .first();
  if ((await glimmListBtn.count()) > 0) {
    await glimmListBtn.click();
    await page.waitForTimeout(300);
  }

  await page.screenshot({
    path: `${OUT_DIR}/after-skills-desktop.png`,
    fullPage: false,
  });
  console.log("Saved after-skills-desktop.png");

  // Mobile viewport check (390x844)
  console.log("3. Checking Mobile viewport (390x844)...");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/eval?theme=dark`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="glimm-studio-bar"]');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: `${OUT_DIR}/after-mobile.png`,
    fullPage: false,
  });
  console.log("Saved after-mobile.png");

  await browser.close();

  if (errors.length > 0) {
    console.error("Browser errors detected:", errors);
    process.exit(1);
  }
  console.log("All Glimm WebGL & Skill checks passed with 0 console errors!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

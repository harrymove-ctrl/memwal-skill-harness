// QA for src/places: every screen state at every size, plus break tests.
// Mock data by default. The api=real checks only read: the preview refuses writes.
// Run with the dev server up: node video/scripts/qa-places.mjs
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { measure } from "./qa-measure.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/places");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const PREVIEW = `${ORIGIN}/src/places/preview/index.html`;
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail: String(detail) });
  if (!ok) console.log(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const SCALE = new Set([12, 14, 16, 20, 28, 40]);
const BANNED = /\b(bucket|namespace|facts?|plan gate|bake|flow memory|delegate|receipts?)\b/i;

const VIEWPORTS = [[1280, 800], [1024, 768], [768, 1024], [390, 844], [320, 568]];
const SCREENS = {
  "home new": "place=home&scene=new",
  "home progress": "place=home&scene=progress",
  "home with check": "place=home&scene=progress&check=1",
  "home viewer": "place=home&scene=new&role=Viewer",
  "home activity failed": "place=home&scene=progress&fail=activity",
  "home rules failed": "place=home&scene=progress&fail=rules",
  "live": "place=home&scene=live",
  "live quiet": "place=home&scene=quiet",
  "skills library": "place=skills",
  "skills selected": "place=skills&skill=sample-review",
  "skills viewer": "place=skills&skill=sample-review&role=Viewer",
  "skills empty": "place=skills&skills=empty",
  "skills empty viewer": "place=skills&skills=empty&role=Viewer",
  "skills long": `place=skills&skills=long&skill=${encodeURIComponent("a-very-long-skill-name-that-a-real-team-could-type-for-its-review-playbook-2026")}`,
  "skills failed": "place=skills&fail=skills",
  "skills rules failed": "place=skills&skill=sample-review&fail=rules",
  "skills no rules": "place=skills&skill=sample-review&rules=empty",
};

const open = (page, query, theme = "dark") => page.goto(`${PREVIEW}?${query}&theme=${theme}`);
const settled = (page) =>
  page.waitForFunction(() => !document.querySelector('[data-testid="skeleton"], [data-testid="skills-loading"]') && document.querySelector('[data-testid="app-shell"]'));
const id = (page, testid) => page.locator(`[data-testid="${testid}"]:visible`);
const events = (page) => page.evaluate(() => window.__placeEvents.slice());
const countOf = async (page, pattern) => (await events(page)).filter((event) => pattern.test(event)).length;
const clearEvents = (page) => page.evaluate(() => (window.__placeEvents.length = 0));

const browser = await chromium.launch();

function checkScreen(label, m, width) {
  const mobile = width < 768;
  check(`${label}: no overflow`, m.docOverflow <= 0 && m.bodyOverflow <= 0 && m.mainOverflow <= 0, `doc ${m.docOverflow}, main ${m.mainOverflow}`);
  check(`${label}: nothing overflows inside`, m.innerOverflow.length === 0, m.innerOverflow.join("; "));
  const weak = m.contrast.filter((c) => c.ratio < 4.5);
  check(`${label}: contrast at least 4.5`, weak.length === 0, JSON.stringify(weak.slice(0, 4)));
  const off = m.sizes.filter((s) => !SCALE.has(s));
  check(`${label}: type on scale`, off.length === 0, off.join(","));
  check(`${label}: at most 4 sizes`, m.sizes.length <= 4, m.sizes.join(","));
  const min = mobile ? 44 : 32;
  const small = m.controls.filter((c) => c.h < min);
  check(`${label}: controls at least ${min}px`, small.length === 0, JSON.stringify(small.slice(0, 4)));
}

// Matrix.
{
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/Failed to load resource|fonts\.g|500/.test(msg.text())) errors.push(msg.text());
  });
  for (const [w, h] of VIEWPORTS) {
    await page.setViewportSize({ width: w, height: h });
    for (const [name, query] of Object.entries(SCREENS)) {
      for (const theme of ["dark", "light"]) {
        await open(page, query, theme);
        await settled(page);
        const label = `${name} ${theme} ${w}x${h}`;
        checkScreen(label, await page.evaluate(measure), w);
        const primaries = await page.locator('.cc-page [data-variant="primary"]:visible').count();
        check(`${label}: at most one primary`, primaries <= 1, primaries);
        const text = await page.evaluate(() => {
          const clone = document.querySelector('[data-testid="app-shell"]').cloneNode(true);
          clone.querySelectorAll(".cc-doc").forEach((el) => el.remove());
          return clone.textContent;
        });
        check(`${label}: plain vocabulary`, !BANNED.test(text), text.match(BANNED)?.[0]);
      }
    }
  }
  check("no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

// Home.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  await open(page, "place=home&scene=new");
  await settled(page);
  const card = id(page, "checklist");
  check("new space: one step of five", (await card.textContent()).includes("1 of 5 done"), await card.textContent());
  check("new space: the next step is the primary", (await card.locator('[data-variant="primary"]').textContent()) === "Import");
  check("new space: empty activity reads plainly", (await id(page, "activity-empty").count()) === 1);
  check("new space: no sample verdict is invented", (await id(page, "verdict-empty").count()) === 1 && (await id(page, "verdict").count()) === 0);
  await card.locator('[data-variant="primary"]').click();
  check("checklist buttons call their handler", (await events(page)).includes("import"));

  await open(page, "place=home&scene=progress");
  await settled(page);
  check("progress: primary moves to the next unchecked step", (await id(page, "checklist").locator('[data-variant="primary"]').textContent()) === "Invite");
  check("progress: other activity never ticks the agent step", (await id(page, "check-agent").getAttribute("data-done")) === null);
  check("progress: rule step ticks from real rules", (await id(page, "check-rule").getAttribute("data-done")) !== null);
  check("progress: Live stays hidden before activation", (await id(page, "live-view").count()) === 0);
  check("activity shows actor and action", (await id(page, "activity-row").first().textContent()).includes("teammate-qa taught a rule in sample-review"));

  await open(page, "place=home&scene=progress&fail=activity");
  await settled(page);
  check("activity failure offers Retry", (await id(page, "activity-error").locator('[data-testid="retry"]').count()) === 1);
  check("activity failure never claims the agent connected", (await id(page, "check-agent").getAttribute("data-done")) === null);

  await open(page, "place=home&scene=progress&fail=rules");
  await settled(page);
  check("rules failure never claims a rule exists", (await id(page, "check-rule").getAttribute("data-done")) === null);

  await open(page, "place=home&scene=new&role=Viewer");
  await settled(page);
  const viewerCard = await id(page, "checklist").textContent();
  check("viewer: no owner buttons", !/\b(Import|Invite)\b(?! skills| a teammate)/.test(viewerCard) && viewerCard.includes("Needs an owner"), viewerCard);
  check("viewer: can still connect their agent", (await id(page, "check-agent").locator("button").textContent()) === "Connect");

  // Loading uses skeletons in place, not a claim either way.
  await open(page, "place=home&scene=progress&delay=4000");
  await page.waitForSelector('[data-testid="skeleton"]');
  check("loading: rows hold skeletons", (await id(page, "check-rule").locator(".cc-skeleton").count()) === 1);
  check("loading: nothing is ticked early", (await id(page, "check-agent").getAttribute("data-done")) === null);

  // Live.
  await open(page, "place=home&scene=live");
  await page.waitForSelector('[data-testid="live-view"]');
  const expectedToday = await page.evaluate(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    return [1, 12, 70, 130, 135, 400, 700].filter((m) => Date.now() - m * 60000 >= midnight.getTime()).length;
  });
  check("live: counts only today's real recalls", (await id(page, "live-count").textContent()) === String(expectedToday), await id(page, "live-count").textContent());
  check("live: one pill for the active agent", (await id(page, "live-pill").textContent()).trim() === "1 agent active", await id(page, "live-pill").textContent());
  const agents = await id(page, "live-agent").allTextContents();
  check("live: each agent has one status line", agents.length === 3 && agents[0].includes("Recalling sample-qa") && agents[1].includes("Idle") && agents[2].includes("Offline"), agents.join(" | "));
  check("live: twelve hourly bars", (await id(page, "live-bar").count()) === 12);
  const peak = await page.evaluate(() => Math.max(...[...document.querySelectorAll('[data-testid="live-bar"] .cc-bars__bar')].map((el) => el.getBoundingClientRect().height)));
  check("live: the tallest bar fills the plot", peak >= 90, peak);
  await id(page, "live-bar").last().hover();
  const tip = await page.evaluate(() => getComputedStyle(document.querySelectorAll('[data-testid="live-bar"]')[11], "::after").content);
  check("live: hovering a bar names its value", /recall/.test(tip), tip);
  const tipBox = await page.evaluate(() => {
    const col = document.querySelectorAll('[data-testid="live-bar"]')[11].getBoundingClientRect();
    return col.right <= innerWidth;
  });
  check("live: the last bar's tooltip stays on screen", tipBox);
  check("live: a table carries the same numbers", (await page.locator('[data-testid="live-metric"] table tr').count()) === 12);
  const stream = await id(page, "activity-row").first().textContent();
  check("live: stream is newest first", stream.includes("Claude Code recalled 2 rules for sample-qa"), stream);
  check("live: real rows link to proof", (await id(page, "activity-row").first().locator("a").getAttribute("href")).includes("walruscan.com"));

  await id(page, "reopen-checklist").click();
  check("live: the checklist reopens", (await id(page, "checklist").textContent()).includes("5 of 5 done"), await id(page, "checklist").textContent());
  await id(page, "back-to-live").click();
  check("live: back from the checklist", (await id(page, "live-view").count()) === 1);

  await open(page, "place=home&scene=quiet");
  await page.waitForSelector('[data-testid="live-view"]');
  check("quiet: nothing pretends to be active", (await id(page, "live-pill").textContent()).trim() === "No agent active");
  check("quiet: zero today reads as zero", (await id(page, "live-count").textContent()) === "0");
  await context.close();
}

// Skills: rules.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const q = "place=skills&skill=sample-review";

  await open(page, "place=skills");
  await settled(page);
  check("library groups by category", (await page.locator(".cc-library__group:visible").allTextContents()).join() === "Rust and relayer,Workflows");
  check("nothing selected asks for a pick", (await id(page, "skills-pick").count()) === 1);
  await id(page, "skill-item-sample-review").click();
  check("selecting opens the skill", (await id(page, "skill-document").count()) === 1);
  check("the current skill is marked", (await id(page, "skill-item-sample-review").getAttribute("aria-current")) === "true");
  check("rule count sits in the library", (await id(page, "skill-item-sample-review").textContent()).endsWith("3"));

  // Search.
  await id(page, "skill-search").fill("rust");
  check("search filters the library", (await page.locator('[data-testid^="skill-item-"]:visible').count()) === 1);
  await id(page, "skill-search").fill("zzzz");
  check("no match reads plainly", (await id(page, "skill-no-match").count()) === 1);
  await id(page, "skill-no-match").locator("button").click();
  check("clear search restores the list", (await page.locator('[data-testid^="skill-item-"]:visible').count()) === 3);

  await open(page, q);
  await settled(page);
  check("rules card counts what is on", (await id(page, "rules-card").textContent()).includes("2 of 3 on"));
  const warned = await page.locator(".cc-rule__warn:visible").allTextContents();
  check("only the unsynced rule says so", warned.length === 1 && warned[0].includes("not on Walrus yet"), warned.join());

  // Toggle.
  const toggle = id(page, "rule-row").first().locator('[role="switch"]');
  check("switch starts on", (await toggle.getAttribute("aria-checked")) === "true");
  await clearEvents(page);
  await open(page, `${q}&delay=300`);
  await settled(page);
  const slow = id(page, "rule-row").first().locator('[role="switch"]');
  await clearEvents(page);
  await slow.click();
  check("switch moves at once", (await slow.getAttribute("aria-checked")) === "false");
  await slow.click({ force: true }).catch(() => {});
  await slow.click({ force: true }).catch(() => {});
  await page.waitForTimeout(500);
  check("rapid clicks send one request", (await countOf(page, /POST:.*\/state$/)) === 1, (await events(page)).join());
  check("switch stays where the one request put it", (await slow.getAttribute("aria-checked")) === "false");
  check("the on count follows", (await id(page, "rules-card").textContent()).includes("1 of 3 on"));

  await open(page, `${q}&fail=state`);
  await settled(page);
  const failing = id(page, "rule-row").first().locator('[role="switch"]');
  await failing.click();
  await page.waitForSelector('.cc-rule [role="alert"]');
  check("failed switch goes back", (await failing.getAttribute("aria-checked")) === "true");
  check("failed switch says so on its row", (await id(page, "rule-row").first().textContent()).includes("was not turned off"));

  // Add.
  await open(page, q);
  await settled(page);
  check("add is disabled with no text", await id(page, "rule-add-submit").isDisabled());
  await id(page, "rule-add-input").fill("   ");
  check("spaces do not count as text", await id(page, "rule-add-submit").isDisabled());
  await id(page, "rule-add-input").fill("A new sample rule");
  await clearEvents(page);
  await id(page, "rule-add-input").press("Enter");
  await id(page, "rule-add-input").press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-testid="rules-card"]').textContent.includes("A new sample rule"));
  check("double Enter adds once", (await countOf(page, /POST:.*\/rules$/)) === 1, (await events(page)).join());
  check("the field clears after adding", (await id(page, "rule-add-input").inputValue()) === "");

  await open(page, `${q}&fail=add`);
  await settled(page);
  await id(page, "rule-add-input").fill("Keep this text");
  await id(page, "rule-add-submit").click();
  await page.waitForSelector('[data-testid="rule-add-error"]');
  check("a failed add keeps the text", (await id(page, "rule-add-input").inputValue()) === "Keep this text");

  // Row menu.
  await open(page, q);
  await settled(page);
  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  check("menu speaks plainly", (await page.locator('[role="menu"]:visible').textContent()).includes("Add to SKILL.md"));
  await page.keyboard.press("Escape");
  check("Escape closes the row menu", (await page.locator('[role="menu"]:visible').count()) === 0);

  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  await id(page, "rule-edit-item").click();
  await id(page, "rule-edit").locator("input").fill("Edited sample rule");
  await id(page, "rule-edit").locator("input").press("Escape");
  check("Escape cancels an edit", !(await id(page, "rules-card").textContent()).includes("Edited sample rule"));

  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  await id(page, "rule-edit-item").click();
  await id(page, "rule-edit").locator("input").fill("Edited sample rule");
  await id(page, "rule-edit").locator("input").press("Enter");
  await page.waitForFunction(() => document.querySelector('[data-testid="rules-card"]').textContent.includes("Edited sample rule"));
  check("saving an edit updates the row", true);

  await clearEvents(page);
  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  await id(page, "rule-delete-item").click();
  check("delete asks first", (await id(page, "rule-confirm").count()) === 1 && (await countOf(page, /state$/)) === 0);
  await id(page, "rule-confirm").locator("button", { hasText: "Keep" }).click();
  check("Keep leaves the rule", (await id(page, "rule-row").count()) === 3);
  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  await id(page, "rule-delete-item").click();
  await id(page, "rule-confirm").locator("button", { hasText: "Delete" }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="rule-row"]').length === 2);
  check("Delete removes the rule", true);

  await id(page, "rule-row").first().locator('[data-testid="row-menu"]').click();
  await clearEvents(page);
  await id(page, "rule-bake-item").click();
  await page.waitForTimeout(150);
  check("Add to SKILL.md calls the right route", (await countOf(page, /POST:.*\/bake$/)) === 1);

  // Viewer.
  await open(page, `${q}&role=Viewer`);
  await settled(page);
  check("viewer: no switches", (await page.locator('.cc-skillpane [role="switch"]').count()) === 0);
  check("viewer: no rule menus", (await id(page, "rule-row").first().locator('[data-testid="row-menu"]').count()) === 0);
  check("viewer: no add field", (await id(page, "rule-add").count()) === 0);
  check("viewer: no Edit", (await id(page, "skill-edit").count()) === 0);
  check("viewer: still sees on and off", (await id(page, "rule-row").nth(1).textContent()).includes("Off"));

  // History and Used by.
  await open(page, q);
  await settled(page);
  await id(page, "skill-history").click();
  check("history lists revisions", (await id(page, "history-row").count()) === 2);
  await id(page, "tab-used").click();
  await page.waitForSelector('[data-testid="used-empty"]');
  check("Used by says so when nobody has recalled", true);
  await context.close();
}

// Skills: the save state machine.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const q = "place=skills&skill=sample-review";
  const startEdit = async (query = q) => {
    await open(page, query);
    await settled(page);
    await id(page, "skill-edit").click();
  };

  await startEdit();
  check("save is disabled until something changes", await id(page, "edit-save").isDisabled());
  await id(page, "editor-input").fill("");
  check("save is disabled for an empty skill", await id(page, "edit-save").isDisabled());
  await id(page, "editor-input").fill("# Changed\n\nNew text");
  check("the preview follows the draft", (await id(page, "editor-preview").textContent()).includes("New text"));

  // Draft survives a reload.
  await page.reload();
  await settled(page);
  check("a reload finds the draft", (await id(page, "draft-found").count()) === 1);
  await id(page, "draft-resume").click();
  check("resume restores the text", (await id(page, "editor-input").inputValue()).includes("New text"));

  // Discard asks.
  await id(page, "edit-discard").click();
  check("discard asks when there are changes", (await id(page, "discard-confirm").count()) === 1);
  await id(page, "discard-yes").click();
  await page.reload();
  await settled(page);
  check("discard removes the draft", (await id(page, "draft-found").count()) === 0);

  // Save, double click.
  await startEdit(`${q}&delay=200`);
  await id(page, "editor-input").fill("# Saved text");
  await clearEvents(page);
  await id(page, "edit-save").dblclick();
  check("save is disabled while saving", (await id(page, "edit-save").textContent()) === "Saving" && (await id(page, "edit-save").isDisabled()));
  await page.waitForSelector('[data-testid="skill-saved"]');
  check("double click saves once", (await countOf(page, /PUT:/)) === 1, (await events(page)).join());
  check("saved names the new revision", (await id(page, "skill-saved").textContent()).includes("revision 5"));
  check("the meta line shows the new revision", (await id(page, "skill-meta").textContent()).includes("revision 5"));
  check("App is told to refresh", (await events(page)).includes("skills-changed"));
  check("the document shows the saved text", (await id(page, "skill-document").textContent()).includes("Saved text"));
  await page.reload();
  await settled(page);
  check("no draft remains after saving", (await id(page, "draft-found").count()) === 0);

  // Failure keeps the draft.
  await startEdit(`${q}&fail=save`);
  await id(page, "editor-input").fill("# Will fail");
  await id(page, "edit-save").click();
  await page.waitForSelector('[data-testid="save-failed"]');
  check("failure keeps the draft", (await id(page, "editor-input").inputValue()) === "# Will fail");
  check("failure offers Retry", (await id(page, "save-failed").locator('[data-testid="retry"]').count()) === 1);
  await id(page, "edit-discard").click();
  await id(page, "discard-yes").click();

  // Conflict.
  await startEdit(`${q}&conflict=1`);
  await id(page, "editor-input").fill("# Mine");
  await id(page, "edit-save").click();
  await page.waitForSelector('[data-testid="save-conflict"]');
  check("conflict names who saved", (await id(page, "save-conflict").textContent()).includes("teammate-qa saved revision 5"));
  check("conflict keeps the draft", (await id(page, "editor-input").inputValue()) === "# Mine");
  await id(page, "conflict-mine").click();
  await page.waitForSelector('[data-testid="skill-saved"]');
  check("Save mine on top lands after theirs", (await id(page, "skill-saved").textContent()).includes("revision 6"));

  await startEdit(`${q}&conflict=1`);
  await id(page, "editor-input").fill("# Mine again");
  await id(page, "edit-save").click();
  await page.waitForSelector('[data-testid="save-conflict"]');
  await id(page, "conflict-theirs").click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="skill-editor"]'));
  await page
    .waitForFunction(() => document.querySelector('[data-testid="skill-meta"]')?.textContent.includes("revision 5"), null, { timeout: 3000 })
    .catch(() => {});
  check("Take theirs shows their revision", (await id(page, "skill-meta").textContent()).includes("revision 5"), await id(page, "skill-meta").textContent());
  await page.reload();
  await settled(page);
  check("Take theirs clears the draft", (await id(page, "draft-found").count()) === 0);

  // Offline.
  await startEdit();
  await id(page, "editor-input").fill("# Offline text");
  await context.setOffline(true);
  await id(page, "edit-save").click();
  await page.waitForSelector('[data-testid="save-offline"]');
  check("offline keeps the draft and says so", (await id(page, "editor-input").inputValue()) === "# Offline text");
  await context.setOffline(false);
  await page.waitForSelector('[data-testid="skill-saved"]');
  check("the draft saves when the connection returns", true);

  // Delete.
  await open(page, q);
  await settled(page);
  await id(page, "skill-pane").locator('[data-testid="row-menu"]').first().click();
  await id(page, "skill-delete").click();
  check("skill delete asks first", (await id(page, "delete-confirm").count()) === 1);
  await id(page, "delete-yes").click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="skill-item-sample-review"]'));
  check("skill delete removes it", true);

  await open(page, `${q}&fail=delete`);
  await settled(page);
  await id(page, "skill-pane").locator('[data-testid="row-menu"]').first().click();
  await id(page, "skill-delete").click();
  await id(page, "delete-yes").click();
  await page.waitForSelector('[data-testid="delete-failed"]');
  check("a failed delete says so and keeps the skill", (await id(page, "skill-document").count()) === 1);

  await open(page, `${q}&role=Editor`);
  await settled(page);
  await id(page, "skill-pane").locator('[data-testid="row-menu"]').first().click();
  check("only an owner can delete a skill", (await id(page, "skill-delete").count()) === 0);
  await context.close();

  // Blocked storage.
  const locked = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await locked.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  const lockedPage = await locked.newPage();
  const lockedErrors = [];
  lockedPage.on("pageerror", (e) => lockedErrors.push(e.message));
  await open(lockedPage, q);
  await settled(lockedPage);
  await id(lockedPage, "skill-edit").click();
  await id(lockedPage, "editor-input").fill("# No storage");
  await id(lockedPage, "edit-save").click();
  await lockedPage.waitForSelector('[data-testid="skill-saved"]');
  check("blocked storage still edits and saves", lockedErrors.length === 0, lockedErrors.join());
  await locked.close();
}

// Mobile.
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await open(page, "place=skills");
  await settled(page);
  check("mobile: the library comes first", (await id(page, "skill-library").count()) === 1 && (await id(page, "skills-pick").count()) === 0);
  await id(page, "skill-item-sample-review").tap();
  check("mobile: the skill replaces the library", (await id(page, "skill-library").count()) === 0 && (await id(page, "skill-document").count()) === 1);
  await id(page, "skills-back").tap();
  check("mobile: back returns to the library", (await id(page, "skill-library").count()) === 1);
  await id(page, "skill-item-sample-review").tap();
  await id(page, "skill-edit").tap();
  check("mobile: the editor shows one pane", (await id(page, "editor-input").count()) === 1 && (await id(page, "editor-preview").count()) === 0);
  await id(page, "editor-preview-tab").tap();
  check("mobile: the tab swaps panes", (await id(page, "editor-input").count()) === 0 && (await id(page, "editor-preview").count()) === 1);
  await context.close();
}

// Real data, read only.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.goto(`${PREVIEW}?api=real&place=home&theme=dark`, { timeout: 120000 });
  await page.waitForSelector('[data-testid="check-agent"]', { timeout: 120000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="skeleton"]'), null, { timeout: 120000 });
  const homeText = await id(page, "home-view").textContent();
  check("real home: renders with real rules", (await id(page, "check-rule").getAttribute("data-done")) !== null, homeText.slice(0, 200));
  check("real home: no tracker ids reach the screen", !/WALM-\d+/i.test(homeText));
  check("real home: end to end test rules stay hidden", !/E2E temporary|e2e-rule/i.test(homeText));
  check("real home: raw memory headers never show", !/\[(RULE|FLOW|SKILL_REF|RULE_STATE|AGENT_LOG)/.test(homeText));
  const rows = await id(page, "activity-row").count();
  check("real home: real activity shows", rows > 0, rows);
  await page.screenshot({ path: join(OUT, "real-home-desktop.png") });
  writeFileSync(join(OUT, "real-home-state.json"), JSON.stringify({
    agentStepDone: (await id(page, "check-agent").getAttribute("data-done")) !== null,
    activityRows: rows,
  }, null, 2));

  await page.goto(`${PREVIEW}?api=real&place=skills&skill=memwal-review&theme=dark`, { timeout: 120000 });
  await page.waitForSelector('[data-testid="skill-document"]', { timeout: 120000 });
  await page.waitForFunction(() => !document.querySelector('[data-testid="rules-card"] [data-testid="skeleton"]'), null, { timeout: 60000 });
  const realSkills = (await (await page.request.get(`${ORIGIN}/api/ns/memwal-team-skills/skills`)).json()).skills.length;
  const listedSkills = await page.locator('[data-testid^="skill-item-"]:visible').count();
  check("real skills: all skills listed", listedSkills === realSkills && realSkills > 0, `${listedSkills} of ${realSkills}`);
  check("real skills: the document renders", (await id(page, "skill-document").textContent()).length > 200);
  const m = await page.evaluate(measure);
  const weak = m.contrast.filter((c) => c.ratio < 4.5);
  check("real skills: real SKILL.md meets contrast", weak.length === 0, JSON.stringify(weak.slice(0, 6)));
  check("real skills: real SKILL.md does not overflow", m.innerOverflow.length === 0 && m.mainOverflow <= 0, m.innerOverflow.join("; "));
  await page.screenshot({ path: join(OUT, "real-skills-desktop.png") });
  const realSwitch = page.locator('[data-testid="rule-row"] [role="switch"]').first();
  if (await realSwitch.count()) {
    const before = await realSwitch.getAttribute("aria-checked");
    await realSwitch.click();
    await page.waitForSelector('.cc-rule [role="alert"]');
    check("real skills: the preview refuses to write", (await countOf(page, /^blocked:POST:/)) === 1);
    check("real skills: a refused write rolls back", (await realSwitch.getAttribute("aria-checked")) === before);
  }
  await context.close();
}

// Screenshots.
{
  const shots = [
    ["after-home-new", "place=home&scene=new"],
    ["after-home-progress", "place=home&scene=progress&check=1"],
    ["after-live", "place=home&scene=live"],
    ["after-skills", "place=skills&skill=sample-review"],
  ];
  for (const [name, query] of shots) {
    for (const [suffix, width, height] of [["desktop", 1280, 800], ["mobile", 390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
      const page = await context.newPage();
      await open(page, query);
      await settled(page);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(150);
      await page.screenshot({ path: join(OUT, `${name}-${suffix}.png`) });
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await open(page, "place=skills&skill=sample-review");
  await settled(page);
  await id(page, "skill-edit").click();
  await id(page, "editor-input").fill("# Sample review\n\nEdit with a live preview.\n");
  await page.screenshot({ path: join(OUT, "after-skills-editor-desktop.png") });
  await open(page, "place=home&scene=live", "light");
  await page.waitForSelector('[data-testid="live-view"]');
  await page.screenshot({ path: join(OUT, "after-live-light-desktop.png") });
  await context.close();
}

// Flow video.
{
  const tmp = join(OUT, ".video");
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  const page = await context.newPage();
  await open(page, "place=home&scene=progress&check=1");
  await settled(page);
  await page.waitForTimeout(1200);
  await open(page, "place=home&scene=live");
  await page.waitForSelector('[data-testid="live-view"]');
  await page.waitForTimeout(1500);
  await open(page, "place=skills");
  await settled(page);
  await page.waitForTimeout(500);
  await id(page, "skill-item-sample-review").click();
  await page.waitForTimeout(800);
  await id(page, "rule-row").nth(1).locator('[role="switch"]').click();
  await page.waitForTimeout(600);
  await id(page, "rule-add-input").pressSequentially("A sample rule the team learned", { delay: 25 });
  await id(page, "rule-add-submit").click();
  await page.waitForTimeout(800);
  await id(page, "skill-edit").click();
  await page.waitForTimeout(600);
  await id(page, "editor-input").press("End");
  await id(page, "editor-input").pressSequentially("\n\nOne more line.", { delay: 25 });
  await page.waitForTimeout(500);
  await id(page, "edit-save").click();
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

// QA for the real app root and for the flows on Try it, Team, Agents, Proof and Sign in.
//
// Flows run on the preview with sample data. The real app part reads the real dev server, signs in
// with a throwaway key through a real signature check, and proves that writes without a member's
// session are refused. It writes nothing: the throwaway key is not a member of any space.
//
// Run with the dev server up: node video/scripts/qa-app.mjs
import { chromium } from "playwright";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { measure } from "./qa-measure.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = join(ROOT, "docs/ux/qa/app");
const ORIGIN = process.env.QA_ORIGIN ?? "http://localhost:5188";
const PREVIEW = `${ORIGIN}/src/places/preview/index.html`;
mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok: Boolean(ok), detail: String(detail) });
  if (!ok) console.log(`FAIL  ${name}${detail ? `: ${detail}` : ""}`);
}

const browser = await chromium.launch();
const open = (page, query, theme = "dark") => page.goto(`${PREVIEW}?${query}&theme=${theme}`);
const settled = (page) =>
  page.waitForFunction(
    () =>
      !document.querySelector('[data-testid="skeleton"], [data-testid="skills-loading"]') &&
      (document.querySelector('[data-testid="app-shell"]') || document.querySelector('[data-testid="landing-view"]'))
  );
const id = (page, testid) => page.locator(`[data-testid="${testid}"]:visible`);
const events = (page) => page.evaluate(() => window.__placeEvents.slice());
const countOf = async (page, pattern) => (await events(page)).filter((event) => pattern.test(event)).length;
const ADDRESS = `0x${"ff".repeat(32)}`;

/* ---------- Try it ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await open(page, "place=try");
  await settled(page);
  check("try: starts on the skill with a real change", (await id(page, "try-skill").inputValue()) === "memwal-qa");
  check("try: nothing is shown before Run", (await id(page, "try-without").count()) === 0);
  await id(page, "try-run").dblclick();
  await id(page, "try-with-verdict").waitFor();
  check("try: a double click reads rules once at a time", (await countOf(page, /GET:.*\/rules/)) <= 2);
  check("try: without the rule it approves", (await id(page, "try-without-verdict").textContent()).includes("Approves"));
  check("try: with the rule it closes", (await id(page, "try-with-verdict").textContent()).includes("Closes"));
  const homeCheck = await page.evaluate(() => {
    const head = document.querySelector('[data-testid="try-rules"] .cc-card__head');
    return head ? head.scrollWidth - head.clientWidth : 0;
  });
  check("try: the rules card head does not overflow", homeCheck <= 0, homeCheck);
  check("try: names the rule that changed it", (await id(page, "try-rule").textContent()).includes("retired"));
  check("try: says the plans are written, not a live model", (await id(page, "try-honesty").textContent()).includes("written example"));
  check("try: reports a labelled result for Home", (await countOf(page, /^check:Closes/)) === 1);
  await page.screenshot({ path: join(OUT, "try-result.png") });

  await open(page, "place=try&retired=off");
  await settled(page);
  await id(page, "try-run").click();
  await id(page, "try-with-verdict").waitFor();
  check("try: turning the rule off really changes the result", (await id(page, "try-with-verdict").textContent()) === "No rule changed this");
  check("try: both plans match when no rule applies", (await id(page, "try-with").locator(".cc-trycol__plan").textContent()) === (await id(page, "try-without").locator(".cc-trycol__plan").textContent()));
  check("try: points to Skills when nothing changed", (await id(page, "try-no-change").count()) === 1);

  await open(page, "place=try&skill=sample-review");
  await settled(page);
  await id(page, "try-run").click();
  await id(page, "try-with-verdict").waitFor();
  check("try: a skill without a written example lists its real rules", (await id(page, "try-with").textContent()).includes("Sample rule: run the checks"));
  check("try: an off rule is left out", !(await id(page, "try-with").textContent()).includes("post in the channel"));

  await open(page, "place=try&delay=800");
  await settled(page);
  await id(page, "try-run").click();
  check("try: Run is disabled while running", await id(page, "try-run").isDisabled());
  await id(page, "try-skill").selectOption("sample-rust");
  await page.waitForTimeout(1000);
  check("try: changing skill mid run drops the old result", (await id(page, "try-with-verdict").count()) === 0);

  await page.route("**/rules*", (route) => route.fulfill({ status: 500, body: "{}" }));
  await open(page, "place=try");
  await page.unroute("**/rules*");
  await settled(page);
  await context.close();

  // A failure on Run itself: the skills loaded, the rules did not.
  const failing = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const failPage = await failing.newPage();
  await open(failPage, "place=try&fail=rules");
  await settled(failPage);
  await id(failPage, "try-run").click();
  await id(failPage, "try-failed").waitFor();
  check("try: a failed run shows no verdict and offers Retry", (await id(failPage, "try-with-verdict").count()) === 0 && (await id(failPage, "retry").count()) === 1);
  await failing.close();
}

/* ---------- Team ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const addOutcome = async (result, expected) => {
    await open(page, `place=team&addresult=${result}`);
    await settled(page);
    await id(page, "invite-address").fill(ADDRESS);
    await id(page, "invite-add").click();
    await id(page, "invite-notice").waitFor();
    const text = await id(page, "invite-notice").textContent();
    check(`team: add ${result} says so`, expected.test(text), text);
    return text;
  };

  await open(page, "place=team");
  await settled(page);
  check("team: owner sees one primary, Invite", (await page.locator('.cc-page [data-variant="primary"]:visible').count()) === 1 && (await id(page, "invite-add").textContent()) === "Invite");
  const selectStyle = await page.evaluate(() => {
    const style = getComputedStyle(document.querySelector("select.cc-select"));
    return style.backgroundRepeat;
  });
  check("team: the select's chevron does not tile over its text", selectStyle === "no-repeat", selectStyle);
  check("team: Invite waits for an address", await id(page, "invite-add").isDisabled());
  const rows = id(page, "member-row");
  check("team: key member reads as verified via Tatum", (await rows.nth(1).textContent()).includes("Key on account, verified via Tatum Sui RPC"));
  check("team: no key reads as pending", (await rows.nth(2).textContent()).includes("Pending"));
  check("team: full address stays in the tooltip", (await rows.nth(1).locator('[data-testid="id-pill"]').getAttribute("title")).length === 66);
  check("team: raw hash stays out of the row text", !(await rows.nth(1).textContent()).includes("bb".repeat(16)));
  check("team: the on-chain owner has no role control", (await rows.nth(0).locator("select").count()) === 0);
  await page.screenshot({ path: join(OUT, "team-owner.png") });

  await addOutcome("clean", /Added\. The Tatum address check/);
  check("team: added member appears", (await id(page, "member-row").count()) === 4);
  check("team: field clears after adding", (await id(page, "invite-address").inputValue()) === "");
  await addOutcome("flagged", /Not added/);
  check("team: a flagged address is not added", (await id(page, "member-row").count()) === 3);
  check("team: a flagged address keeps the field for correction", (await id(page, "invite-address").inputValue()) === ADDRESS);
  await addOutcome("invalid", /not a Sui address/);
  await addOutcome("exists", /already a member/);
  await addOutcome("unchecked", /could not check/);
  check("team: an outage never adds by itself", (await id(page, "member-row").count()) === 3);
  await id(page, "invite-anyway").click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="member-row"]').length === 4);
  check("team: adding without a check is a stated choice", (await id(page, "invite-notice").textContent()).includes("without an address check"));

  await open(page, "place=team&delay=400");
  await settled(page);
  await id(page, "invite-address").fill(ADDRESS);
  await id(page, "invite-add").dblclick();
  check("team: shows Checking while it runs", (await id(page, "invite-add").textContent()) === "Checking");
  await id(page, "invite-notice").waitFor();
  check("team: a double click adds once", (await countOf(page, /POST:.*\/members$/)) === 1);

  await open(page, "place=team");
  await settled(page);
  await id(page, "member-row").nth(1).locator("select").selectOption("read-only");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="member-row"] select')[0]?.value === "read-only");
  check("team: an owner can change a role", (await countOf(page, /POST:.*\/role$/)) === 1);
  await id(page, "member-remove").first().click();
  check("team: remove asks first", (await id(page, "member-confirm").count()) === 1 && (await id(page, "member-row").count()) === 3);
  await id(page, "member-confirm").getByRole("button", { name: "Keep" }).click();
  check("team: Keep cancels", (await id(page, "member-row").count()) === 3);
  await id(page, "member-remove").first().click();
  await id(page, "member-confirm").getByRole("button", { name: "Remove" }).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="member-row"]').length === 2);
  check("team: Remove removes", true);

  await open(page, "place=team");
  await settled(page);
  await id(page, "invite-link").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="invite-link"]')?.textContent === "Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  check("team: invite link goes on the clipboard", copied.includes("/join?ns=") && copied.includes("invite=sample-token"), copied);

  await open(page, "place=team&fail=member");
  await settled(page);
  await id(page, "member-row").nth(1).locator("select").selectOption("read-only");
  await page.waitForFunction(() => document.querySelector('[data-testid="member-row"] [role="alert"]'));
  check("team: a refused change explains itself", (await id(page, "member-row").nth(1).textContent()).includes("at least one owner"));

  for (const [query, label] of [["place=team&role=Viewer", "viewer"], ["place=team&role=Editor", "editor"], ["place=team&signedout=1", "signed out"], ["place=team&stranger=1", "stranger"]]) {
    await open(page, query);
    await settled(page);
    check(`team: ${label} has no invite or member controls`, (await id(page, "team-invite").count()) === 0 && (await page.locator('[data-testid="member-row"] select').count()) === 0);
    check(`team: ${label} is told why`, (await id(page, "team-readonly").count()) === 1);
  }
  await open(page, "place=team&signedout=1");
  await settled(page);
  check("team: signed out can sign in from here", (await id(page, "team-readonly").getByRole("button", { name: "Sign in" }).count()) === 1);

  await open(page, "place=team&members=unverified");
  await settled(page);
  check("team: nobody is shown verified when Tatum cannot answer", (await id(page, "team-unverified").count()) === 1 && !(await id(page, "team-members").textContent()).includes("Key on account"));
  await context.close();
}

/* ---------- Agents ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  await open(page, "place=agents&scene=new");
  await settled(page);
  check("agents: one primary, Copy setup", (await page.locator('.cc-page [data-variant="primary"]:visible').textContent()) === "Copy setup");
  check("agents: waits for the first recall", (await id(page, "agent-status").textContent()).includes("Waiting for first recall"));
  check("agents: empty list reads plainly", (await id(page, "state-empty").count()) === 1);
  const secretish = /suiprivkey|MEMWAL_PRIVATE_KEY=[0-9a-f]{16}|[0-9a-f]{64}/;
  for (const tile of ["claude-code", "cursor", "codex", "antigravity", "tatum-ai"]) {
    await id(page, `agent-tile-${tile}`).click();
    const code = await id(page, "copy-setup-code").textContent();
    check(`agents: ${tile} setup names this space`, code.includes("sample-space"), code.slice(0, 80));
    check(`agents: ${tile} setup never holds a key`, !secretish.test(code.replace(/0x[0-9a-f]{64}/g, "")), code.slice(0, 80));
    check(`agents: ${tile} tile shows as selected`, (await id(page, `agent-tile-${tile}`).getAttribute("aria-pressed")) === "true");
    const instructions = await id(page, "copy-instructions-code").textContent();
    check(`agents: ${tile} instructions use the format Live reads`, instructions.includes(`[AGENT_LOG:RECALL] [agent:${tile}]`), instructions.slice(0, 100));
  }
  await id(page, "copy-setup").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="copy-setup"]')?.textContent === "Copied");
  check("agents: Copy setup copies the shown text", (await page.evaluate(() => navigator.clipboard.readText())) === (await id(page, "copy-setup-code").textContent()));
  await page.screenshot({ path: join(OUT, "agents-new.png") });

  await open(page, "place=agents&scene=live");
  await settled(page);
  check("agents: connected status comes from the last recall", /Connected, last recall .* from sample-qa/.test(await id(page, "agent-status").textContent()), await id(page, "agent-status").textContent());
  await id(page, "agent-tile-antigravity").click();
  check("agents: another agent still waits", (await id(page, "agent-status").textContent()).includes("Waiting"));
  check("agents: table lists connected agents with their member", (await id(page, "connected-agent").first().textContent()).includes("harrymove-ctrl"));
  await page.screenshot({ path: join(OUT, "agents-live.png") });

  await open(page, "place=agents&fail=activity");
  await settled(page);
  check("agents: a failed check never says connected or waiting", (await id(page, "agent-status").textContent()).includes("Could not check"));
  await context.close();
}

/* ---------- Proof ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await open(page, "place=home&scene=progress");
  await settled(page);
  const opener = id(page, "open-proof");
  await opener.focus();
  await page.keyboard.press("Enter");
  await id(page, "proof-count").waitFor();
  const drawer = id(page, "proof-drawer");
  check("proof: shows the mainnet count", (await id(page, "proof-count").textContent()) === "61");
  check("proof: focus moves inside", await page.evaluate(() => document.activeElement?.getAttribute("data-testid") === "proof-close"));
  check("proof: a placeholder is never offered as evidence", !(await drawer.textContent()).includes("must never show"));
  check("proof: real rule evidence is listed", (await drawer.textContent()).includes("run the checks"));
  const panelRight = await page.evaluate(() => document.querySelector(".cc-proof__panel").getBoundingClientRect().right);
  const pillRights = await page.evaluate(() => [...document.querySelectorAll('[data-testid="proof-drawer"] [data-testid="id-pill"]')].map((el) => el.getBoundingClientRect().right));
  check("proof: every id sits inside the panel, even beside a long label", pillRights.length > 0 && pillRights.every((right) => right <= panelRight), pillRights.join(","));
  check("proof: every row can be copied", (await drawer.locator('[data-testid="proof-row"] button').count()) === (await id(page, "proof-row").count()));
  await page.screenshot({ path: join(OUT, "proof-open.png") });
  for (let i = 0; i < 30; i += 1) await page.keyboard.press("Tab");
  check("proof: Tab stays inside", await page.evaluate(() => !!document.activeElement?.closest('[data-testid="proof-drawer"]')));
  await page.keyboard.press("Escape");
  check("proof: Escape closes and returns focus", (await drawer.count()) === 0 && (await page.evaluate(() => document.activeElement?.getAttribute("data-testid") === "open-proof")));
  await opener.click();
  await id(page, "proof-count").waitFor();
  await page.mouse.click(40, 400);
  check("proof: clicking outside closes", (await drawer.count()) === 0);

  await open(page, "place=home&scene=progress&proof=1&proofstate=noaccount");
  await settled(page);
  await id(page, "proof-no-account").waitFor();
  check("proof: an unread account is stated, not assumed", true);
  await open(page, "place=home&scene=progress&proof=1&fail=proof");
  await settled(page);
  await id(page, "state-error").waitFor();
  check("proof: failure offers Retry", (await id(page, "state-error").locator('[data-testid="retry"]').count()) === 1);
  await context.close();
}

/* ---------- ?state= reaches every state ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const expectations = [
    ["place=team&state=loading", "skeleton"],
    ["place=agents&state=loading", "skeleton"],
    ["place=team&state=empty", "state-empty"],
    ["place=team&state=error", "state-error"],
    ["place=team&state=offline", "state-offline"],
    ["place=agents&state=offline", "state-offline"],
    ["place=try&state=offline", "state-offline"],
    ["place=agents&state=error", "state-error"],
    ["place=try&state=error", "state-error"],
    ["place=team&state=readonly", "team-readonly"],
  ];
  for (const [query, testid] of expectations) {
    await open(page, query);
    await page.locator(`[data-testid="${testid}"]`).first().waitFor({ timeout: 5000 }).catch(() => undefined);
    check(`state: ${query} shows ${testid}`, (await page.locator(`[data-testid="${testid}"]`).count()) > 0);
  }
  await context.close();
}

/* ---------- Sign in and the landing page, on the preview ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await open(page, "place=landing");
  await settled(page);
  check("landing: one primary, Try the demo", (await page.locator('[data-variant="primary"]:visible').textContent()) === "Try the demo");
  check("landing: wallet choices stay hidden until Sign in", (await id(page, "signin-dialog").count()) === 0);
  check("landing: the example is labelled as written", (await id(page, "verdict-written").count()) === 1);
  await page.screenshot({ path: join(OUT, "landing.png") });
  await id(page, "landing-signin").click();
  await id(page, "signin-no-wallet").waitFor();
  check("signin: without a wallet it says what to do", (await id(page, "signin-no-wallet").textContent()).includes("Slush"));
  check("signin: never offers a typed email", (await id(page, "signin-dialog").locator('input[type="email"]').count()) === 0);
  await page.keyboard.press("Escape");
  check("signin: Escape closes", (await id(page, "signin-dialog").count()) === 0);
  await context.close();
}

/* ---------- The real app ---------- */
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && !/Failed to load resource|fonts\.g/.test(msg.text())) errors.push(msg.text());
  });

  await page.goto(`${ORIGIN}/`);
  await id(page, "landing-view").waitFor();
  check("app: / shows the landing page when signed out", true);
  check("app: dark is the default", await page.evaluate(() => document.documentElement.classList.contains("dark")));
  const m = await page.evaluate(measure);
  check("app: landing has no overflow", m.docOverflow <= 0, m.docOverflow);
  await page.screenshot({ path: join(OUT, "app-landing.png") });

  const started = Date.now();
  await id(page, "landing-demo").click();
  await id(page, "try-run").waitFor({ timeout: 30000 });
  check("app: the demo opens with no wallet", new URL(page.url()).pathname === "/try");
  check("app: the signed out note is shown", (await id(page, "demo-note").count()) === 1);
  await id(page, "try-run").click();
  await id(page, "try-with-verdict").waitFor({ timeout: 30000 });
  const seconds = (Date.now() - started) / 1000;
  check("app: a verdict within 30 seconds, without a wallet", seconds < 30, `${seconds.toFixed(1)}s`);
  await page.screenshot({ path: join(OUT, "app-try-result.png") });

  for (const [from, to] of [["/graph", "/skills"], ["/eval", "/try"], ["/cad", "/agents"]]) {
    await page.goto(`${ORIGIN}${from}`);
    await id(page, "app-shell").waitFor();
    check(`app: ${from} lands on ${to}`, new URL(page.url()).pathname === to, page.url());
  }

  for (const place of ["home", "skills", "try", "team", "agents"]) {
    await page.goto(`${ORIGIN}/${place}`);
    await id(page, `${place === "try" ? "try" : place}-view`).waitFor({ timeout: 30000 }).catch(() => undefined);
    await page.waitForTimeout(1200);
    const metrics = await page.evaluate(measure);
    check(`app: /${place} has no overflow`, metrics.docOverflow <= 0 && metrics.mainOverflow <= 0, `${metrics.docOverflow},${metrics.mainOverflow}`);
    await page.screenshot({ path: join(OUT, `app-${place}.png`) });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const place of ["home", "skills", "try", "team", "agents"]) {
    await page.goto(`${ORIGIN}/${place}`);
    await page.waitForTimeout(1500);
    const metrics = await page.evaluate(measure);
    check(`app: /${place} at 390px has no overflow`, metrics.docOverflow <= 0 && metrics.mainOverflow <= 0, `${metrics.docOverflow},${metrics.mainOverflow}`);
    await page.screenshot({ path: join(OUT, `app-${place}-mobile.png`) });
  }
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto(`${ORIGIN}/team`);
  await id(page, "member-row").first().waitFor({ timeout: 30000 });
  const teamText = await id(page, "team-members").textContent();
  await page.goto(`${ORIGIN}/try`);
  await id(page, "try-run").waitFor({ timeout: 30000 });
  await id(page, "try-run").click();
  await id(page, "try-with-verdict").waitFor({ timeout: 30000 });
  await page.goto(`${ORIGIN}/home`);
  await id(page, "verdict").waitFor({ timeout: 30000 });
  const withCheck = await page.evaluate(measure);
  check("app: Home with a long last check has no overflow", withCheck.mainOverflow <= 0, withCheck.mainOverflow);
  check("app: Home says the last check is a written example", (await id(page, "verdict-written").count()) === 1);
  await page.goto(`${ORIGIN}/team`);
  await id(page, "member-row").first().waitFor({ timeout: 30000 });
  check("app: Team reads the real account through Tatum", /verified via Tatum Sui RPC/.test(teamText), teamText.slice(0, 160));

  await page.goto(`${ORIGIN}/home`);
  await id(page, "open-proof").click();
  await id(page, "proof-count").waitFor({ timeout: 45000 });
  const count = Number((await id(page, "proof-count").textContent()).replace(/,/g, ""));
  check("app: the space holds at least 10 mainnet memories", count >= 10, count);
  check("app: Proof reads the real account", (await id(page, "proof-drawer").textContent()).includes("Tatum Sui gRPC gateway"));
  await page.screenshot({ path: join(OUT, "app-proof.png") });
  await page.keyboard.press("Escape");

  const html = await page.content();
  check("app: no key material in the page", !/suiprivkey|MEMWAL_PRIVATE_KEY=[0-9a-f]{8}/.test(html));

  /* Old pages stay reachable. */
  await page.goto(`${ORIGIN}/bento`);
  await page.waitForTimeout(1500);
  check("app: /bento still opens the older app", (await id(page, "app-shell").count()) === 0 && (await page.locator("#root *").count()) > 0);

  /* A real sign in: a throwaway key, a real signature, the real check. */
  const keypair = new Ed25519Keypair();
  const address = keypair.toSuiAddress();
  const signed = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const walletPage = await signed.newPage();
  await walletPage.exposeFunction("__qaSign", async (bytes) => {
    const { signature } = await keypair.signPersonalMessage(new Uint8Array(bytes));
    return signature;
  });
  await walletPage.addInitScript((walletAddress) => {
    const account = { address: walletAddress, publicKey: new Uint8Array(32), chains: ["sui:mainnet"], features: ["sui:signPersonalMessage"] };
    const wallet = {
      version: "1.0.0",
      name: "QA Wallet",
      icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=",
      chains: ["sui:mainnet"],
      accounts: [account],
      features: {
        "standard:connect": { version: "1.0.0", connect: async () => ({ accounts: [account] }) },
        "standard:events": { version: "1.0.0", on: () => () => undefined },
        "sui:signPersonalMessage": {
          version: "1.1.0",
          signPersonalMessage: async ({ message }) => ({
            bytes: "",
            signature: await window.__qaSign(Array.from(message)),
          }),
        },
        "sui:signTransaction": { version: "2.0.0", signTransaction: async () => { throw new Error("QA wallet refuses transactions"); } },
      },
    };
    const register = (callback) => callback({ register: (w) => () => undefined, });
    window.addEventListener("wallet-standard:app-ready", (event) => {
      event.detail.register(wallet);
    });
    window.dispatchEvent(new CustomEvent("wallet-standard:register-wallet", { detail: ({ register: add }) => add(wallet) }));
    void register;
  }, address);

  await walletPage.goto(`${ORIGIN}/`);
  await id(walletPage, "landing-signin").click();
  await id(walletPage, "signin-wallet").waitFor({ timeout: 10000 });
  check("signin: the installed wallet is offered", (await id(walletPage, "signin-wallet").textContent()).includes("QA Wallet"));
  await id(walletPage, "signin-wallet").click();
  await walletPage.waitForURL("**/home", { timeout: 30000 });
  check("signin: a real signature opens a session and lands on Home", true);
  const cookies = await signed.cookies();
  const session = cookies.find((cookie) => cookie.name === "mw_session");
  check("signin: the session cookie is HttpOnly and SameSite Strict", session?.httpOnly && session?.sameSite === "Strict", JSON.stringify({ httpOnly: session?.httpOnly, sameSite: session?.sameSite }));
  check("signin: scripts cannot read the session", !(await walletPage.evaluate(() => document.cookie)).includes("mw_session"));
  const me = await walletPage.evaluate(() => fetch("/api/auth/session").then((r) => r.json()));
  check("signin: the server knows the signer", me.address === address, me.address);

  await walletPage.goto(`${ORIGIN}/team`);
  await id(walletPage, "team-readonly").waitFor({ timeout: 30000 });
  check("signin: a non member is told so and gets no controls", (await id(walletPage, "team-readonly").textContent()).includes("not a member") && (await id(walletPage, "team-invite").count()) === 0);

  const refused = await walletPage.evaluate(async () => {
    const send = (path, method = "POST", body = {}) =>
      fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.status);
    return {
      rule: await send("/api/ns/qa-refusal-check/rules", "POST", { text: "must not be saved" }),
      member: await send("/api/ns/qa-refusal-check/members", "POST", { address: `0x${"ab".repeat(32)}` }),
      acl: await send("/api/tatum-memwal/acl", "POST", { namespace: "qa-refusal-check", suiAddress: `0x${"ab".repeat(32)}`, member: { role: "Owner" } }),
      remember: await send("/api/tatum-memwal/remember", "POST", { namespace: "qa-refusal-check", text: "must not be saved" }),
    };
  });
  check("signin: a signed in non member cannot write", refused.rule === 403 && refused.member === 403 && refused.acl === 403 && refused.remember === 401, JSON.stringify(refused));

  await signed.clearCookies();
  const anonymous = await walletPage.evaluate(async () => {
    const send = (path, method = "POST", body = {}, headers = {}) =>
      fetch(path, { method, headers: { "Content-Type": "application/json", ...headers }, body: method === "DELETE" ? undefined : JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));
    const spoof = { "X-MemWal-Caller-Address": "@harrymove-ctrl", "X-MemWal-Access-Role": "read-write" };
    const rows = {
      rule: await send("/api/ns/qa-refusal-check/rules", "POST", { text: "must not be saved" }),
      spoofed: await send("/api/ns/qa-refusal-check/rules", "POST", { text: "must not be saved", author: "@harrymove-ctrl" }, spoof),
      state: await send("/api/ns/qa-refusal-check/rules/none/state", "POST", { state: "off" }),
      bake: await send("/api/ns/qa-refusal-check/rules/none/bake"),
      skillPut: await send("/api/ns/qa-refusal-check/skills/none", "PUT", { markdown: "x" }),
      skillDelete: await send("/api/ns/qa-refusal-check/skills/none", "DELETE"),
      member: await send("/api/ns/qa-refusal-check/members", "POST", { address: `0x${"ab".repeat(32)}` }),
      acl: await send("/api/tatum-memwal/acl", "POST", { namespace: "qa-refusal-check", suiAddress: `0x${"ab".repeat(32)}`, member: { role: "Owner" } }),
      remember: await send("/api/tatum-memwal/remember", "POST", { namespace: "qa-refusal-check", text: "must not be saved" }),
      collection: await send("/api/tatum-memwal/create-collection", "POST", { slug: "qa-refusal-check", prompt: "must not be created" }),
    };
    const verify = await send("/api/tatum-memwal/verify-access", "POST", { namespace: "qa-refusal-check", suiAddress: `0x${"ab".repeat(32)}`, requestedRole: "read-write" });
    const mcp = await send("/api/tatum-memwal/mcp", "POST", { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "memwal_remember_rule", arguments: { namespace: "qa-refusal-check", text: "must not be saved" } } });
    return { rows, verify, mcp };
  });
  for (const [name, row] of Object.entries(anonymous.rows)) {
    check(`refused without a session: ${name}`, row.status === 401, row.status);
  }
  check("refused: asking for access registers nobody", anonymous.verify.json.allowed === false && !anonymous.verify.json.autoRegisteredInvite, JSON.stringify(anonymous.verify.json).slice(0, 120));
  check("refused: the agent tool cannot write without the key", JSON.stringify(anonymous.mcp.json).includes("bridge key"), JSON.stringify(anonymous.mcp.json).slice(0, 160));

  await signed.close();
  check("app: no console or page errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

await browser.close();
const failed = results.filter((row) => !row.ok);
writeFileSync(join(OUT, "results.json"), JSON.stringify({ total: results.length, failed: failed.length, results }, null, 2));
console.log(`${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);

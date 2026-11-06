// Read-only audit of the current UI: screenshots and DOM metrics per route and viewport.
// node .tmp/audit-ui.mjs  (dev server on :5188)
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.HARNESS_URL ?? "http://localhost:5188";
const OUT = new URL("../../docs/ux/audit", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const routes = [
  ["signin", "/eval?authed=0"],
  ["playground", "/eval?authed=1"],
  ["skills", "/graph?authed=1"],
  ["connect", "/cad?authed=1"],
];
const viewports = [
  ["desktop", { width: 1280, height: 800 }],
  ["mobile", { width: 390, height: 844 }],
];

const metrics = [];
const browser = await chromium.launch();
for (const [vpName, vp] of viewports) {
  const ctx = await browser.newContext({ viewport: vp, colorScheme: "light" });
  // Mask secrets the same way the video take does, in case a key is on screen.
  await ctx.addInitScript(() => {
    const SECRET = /(suiprivkey1[0-9a-z]{20,}|(?:0x)?[0-9a-fA-F]{40,})/g;
    const scrub = (root) => {
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) if (SECRET.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(SECRET, (m) => m.slice(0, 6) + "…");
    };
    document.addEventListener("DOMContentLoaded", () => {
      scrub(document.body);
      new MutationObserver(() => scrub(document.body)).observe(document.body, { subtree: true, childList: true, characterData: true });
    });
  });
  const page = await ctx.newPage();
  for (const [name, path] of routes) {
    await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `${OUT}/before-${name}-${vpName}.png` });
    await page.screenshot({ path: `${OUT}/before-${name}-${vpName}-full.png`, fullPage: true });
    const m = await page.evaluate(() => {
      const vis = (e) => {
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05;
      };
      const all = [...document.querySelectorAll("body *")].filter(vis);
      const interactive = all.filter((e) => e.matches("button, a[href], input, select, textarea, [role=button], [role=tab]"));
      const textNodes = all.filter((e) => [...e.childNodes].some((c) => c.nodeType === 3 && c.nodeValue.trim()));
      const sizes = textNodes.map((e) => parseFloat(getComputedStyle(e).fontSize));
      const tiny = sizes.filter((s) => s < 12).length;
      const fonts = new Set(textNodes.map((e) => getComputedStyle(e).fontSize));
      const smallTargets = interactive.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 32 || r.width < 32; }).length;
      const words = document.body.innerText.split(/\s+/).filter(Boolean).length;
      const aboveFold = document.body.innerText.length;
      return {
        docHeight: document.scrollingElement.scrollHeight,
        overflowX: document.scrollingElement.scrollWidth - innerWidth,
        // Once AppShell is wired, main is the scroll container and hides overflow from the line above.
        mainOverflowX: (() => {
          const main = document.querySelector('[data-testid="shell-main"]');
          return main ? main.scrollWidth - main.clientWidth : 0;
        })(),
        interactive: interactive.length,
        smallTargets,
        words,
        textElements: textNodes.length,
        tinyText: tiny,
        distinctFontSizes: fonts.size,
        h1: document.querySelector("h1")?.innerText?.slice(0, 80) ?? null,
        chars: aboveFold,
      };
    });
    metrics.push({ route: name, viewport: vpName, ...m });
    console.log(vpName, name, JSON.stringify(m));
  }
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/metrics.json`, JSON.stringify(metrics, null, 2));
console.log("done");

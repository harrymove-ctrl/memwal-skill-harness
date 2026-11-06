#!/usr/bin/env node
/**
 * Deterministically parses Walrus Memory (`memwal-skill-harness`) CSS and component
 * token sources to generate `video/src/palette.ts` with exact `file:line` provenance.
 *
 * Sources:
 *   - src/index.css
 *   - src/components/react-bits/fullscreen-shader-background.tsx
 *   - src/components/SkillsWorkspace.tsx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT_FILE = path.resolve(__dirname, "../src/palette.ts");

const INDEX_CSS_REL = "src/index.css";
const SHADER_BG_REL = "src/components/react-bits/fullscreen-shader-background.tsx";
const SKILLS_WS_REL = "src/components/SkillsWorkspace.tsx";

function readLines(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  const raw = fs.readFileSync(abs, "utf8");
  return raw.split(/\r?\n/);
}

/**
 * Parse `:root { ... }` custom properties from `src/index.css` (before `.dark`).
 */
function parseRootCssVars(lines) {
  const vars = new Map();
  let inRoot = false;
  let braceDepth = 0;
  let tailwindImportLine = null;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1;
    const line = lines[idx];

    if (tailwindImportLine === null && /@import\s+["']tailwindcss["']/.test(line)) {
      tailwindImportLine = lineNo;
    }

    if (!inRoot) {
      if (/^\s*:root\s*\{/.test(line)) {
        inRoot = true;
        braceDepth = 1;
      }
      continue;
    }

    for (const ch of line) {
      if (ch === "{") braceDepth++;
      else if (ch === "}") braceDepth--;
    }

    const match = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:\s*(.+?)\s*;\s*$/);
    if (match) {
      const [, name, value] = match;
      if (!vars.has(name)) {
        vars.set(name, { value: value.trim(), line: lineNo });
      }
    }

    if (braceDepth <= 0) {
      break;
    }
  }

  return { vars, tailwindImportLine };
}

/**
 * Parse `ChromaCurrent` light/dark stream colors and canvas backgrounds from
 * `src/components/react-bits/fullscreen-shader-background.tsx`.
 */
function parseShaderBackground(lines) {
  let colorsInfo = null;
  let bgInfo = null;

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1;
    const line = lines[idx];

    const colorsMatch = line.match(
      /colors=\{isDark\s*\?\s*\[\s*["'](#[0-9a-fA-F]{6})["']\s*,\s*["'](#[0-9a-fA-F]{6})["']\s*\]\s*:\s*\[\s*["'](#[0-9a-fA-F]{6})["']\s*,\s*["'](#[0-9a-fA-F]{6})["']\s*\]\}/
    );
    if (colorsMatch) {
      colorsInfo = {
        darkStreams: [colorsMatch[1].toLowerCase(), colorsMatch[2].toLowerCase()],
        lightStreams: [colorsMatch[3].toLowerCase(), colorsMatch[4].toLowerCase()],
        line: lineNo,
      };
    }

    const bgMatch = line.match(
      /backgroundColor=\{isDark\s*\?\s*["'](#[0-9a-fA-F]{6})["']\s*:\s*["'](#[0-9a-fA-F]{6})["']\}/
    );
    if (bgMatch) {
      bgInfo = {
        darkCanvas: bgMatch[1].toLowerCase(),
        lightCanvas: bgMatch[2].toLowerCase(),
        line: lineNo,
      };
    }
  }

  if (!colorsInfo || !bgInfo) {
    throw new Error(`Failed to parse ChromaCurrent colors/backgroundColor in ${SHADER_BG_REL}`);
  }
  return { colorsInfo, bgInfo };
}

/**
 * Parse `CATEGORY_COLORS` from `src/components/SkillsWorkspace.tsx`.
 */
function parseCategoryColors(lines) {
  let headerLine = null;
  let endLine = null;
  const entries = new Map();

  for (let idx = 0; idx < lines.length; idx++) {
    const lineNo = idx + 1;
    const line = lines[idx];

    if (headerLine === null && /const\s+CATEGORY_COLORS\b/.test(line)) {
      headerLine = lineNo;
      continue;
    }

    if (headerLine !== null) {
      if (/^\s*\];/.test(line)) {
        endLine = lineNo;
        break;
      }
      const itemMatch = line.match(
        /color:\s*["'](#[0-9a-fA-F]{6})["']\s*,\s*short:\s*["']([^"']+)["']/
      );
      if (itemMatch) {
        entries.set(itemMatch[2], {
          color: itemMatch[1].toLowerCase(),
          line: lineNo,
          short: itemMatch[2],
        });
      }
    }
  }

  if (headerLine === null || entries.size === 0) {
    throw new Error(`Failed to parse CATEGORY_COLORS in ${SKILLS_WS_REL}`);
  }
  return { headerLine, endLine: endLine ?? headerLine, entries };
}

function requireCssVar(vars, name) {
  const hit = vars.get(name);
  if (!hit) {
    throw new Error(`Missing required CSS variable ${name} in ${INDEX_CSS_REL}`);
  }
  return hit;
}

function requireMatchingPair(vars, nameA, nameB) {
  const a = requireCssVar(vars, nameA);
  const b = requireCssVar(vars, nameB);
  if (a.value.toLowerCase() !== b.value.toLowerCase()) {
    throw new Error(
      `Expected ${nameA} (${a.value}) and ${nameB} (${b.value}) in ${INDEX_CSS_REL} to match`
    );
  }
  return { value: a.value.toLowerCase(), lineA: a.line, lineB: b.line };
}

function requireCategory(entries, shortLabel) {
  const hit = entries.get(shortLabel);
  if (!hit) {
    throw new Error(`Missing CATEGORY_COLORS entry "${shortLabel}" in ${SKILLS_WS_REL}`);
  }
  return hit;
}

function escapeSingleQuotedTs(str) {
  return str.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

const cssLines = readLines(INDEX_CSS_REL);
const shaderLines = readLines(SHADER_BG_REL);
const skillsLines = readLines(SKILLS_WS_REL);

const { vars, tailwindImportLine } = parseRootCssVars(cssLines);
const { colorsInfo, bgInfo } = parseShaderBackground(shaderLines);
const { headerLine, endLine, entries } = parseCategoryColors(skillsLines);

const fontSans = requireCssVar(vars, "--rb-font-sans");
const fontMono = requireCssVar(vars, "--f-mono");
const paper = requireMatchingPair(vars, "--paper", "--background");
const card = requireMatchingPair(vars, "--card", "--sheet");
const fill = requireMatchingPair(vars, "--fill", "--secondary");
const border = requireCssVar(vars, "--border");
const ink = requireMatchingPair(vars, "--ink", "--foreground");
const ink2 = requireMatchingPair(vars, "--ink2", "--muted-foreground");
const ink3 = requireCssVar(vars, "--ink3");
const primary = requireCssVar(vars, "--primary");
const primaryFg = requireCssVar(vars, "--primary-foreground");
const ring = requireCssVar(vars, "--ring");
const mintDeep = requireCssVar(vars, "--note-tag-active");
const mintTint = requireCssVar(vars, "--note-card-selected-bg");
const destructive = requireCssVar(vars, "--destructive");

if (ring.value.toLowerCase() !== colorsInfo.lightStreams[0]) {
  throw new Error(
    `Mismatch between ${INDEX_CSS_REL}:${ring.line} --ring (${ring.value}) and ${SHADER_BG_REL}:${colorsInfo.line} stream[0] (${colorsInfo.lightStreams[0]})`
  );
}

const catQa = requireCategory(entries, "QA & Testing");
const catWorkflows = requireCategory(entries, "Workflows");
const catRust = requireCategory(entries, "Rust & Relayer");
const catDesign = requireCategory(entries, "Design System");
const catCore = requireCategory(entries, "Core & Hub");

// Scene 1 OriginKit CloudSky (preset=base) zenith uses Tailwind sky-200 (#bae6fd) imported in src/index.css
const bootSkyTopHex = "#bae6fd";
const bootSkyLine = tailwindImportLine ?? 2;

const output = `// Auto-generated by video/scripts/gen-palette.mjs: DO NOT EDIT MANUALLY.
// Re-generate via: node video/scripts/gen-palette.mjs

export const PALETTE = {
  fontSans: '${escapeSingleQuotedTs(fontSans.value)}', // ${INDEX_CSS_REL}:${fontSans.line} (--rb-font-sans)
  fontMono: '${escapeSingleQuotedTs(fontMono.value)}', // ${INDEX_CSS_REL}:${fontMono.line} (--f-mono)
  paper: '${paper.value}', // ${INDEX_CSS_REL}:${paper.lineA} (--paper) & ${INDEX_CSS_REL}:${paper.lineB} (--background)
  shaderCanvasLight: '${bgInfo.lightCanvas}', // ${SHADER_BG_REL}:${bgInfo.line} (light backgroundColor)
  shaderCanvasDark: '${bgInfo.darkCanvas}', // ${SHADER_BG_REL}:${bgInfo.line} (dark backgroundColor)
  card: '${card.value}', // ${INDEX_CSS_REL}:${card.lineA} (--card) & ${INDEX_CSS_REL}:${card.lineB} (--sheet)
  fill: '${fill.value}', // ${INDEX_CSS_REL}:${fill.lineA} (--fill) & ${INDEX_CSS_REL}:${fill.lineB} (--secondary)
  border: '${border.value.toLowerCase()}', // ${INDEX_CSS_REL}:${border.line} (--border)
  ink: '${ink.value}', // ${INDEX_CSS_REL}:${ink.lineA} (--ink) & ${INDEX_CSS_REL}:${ink.lineB} (--foreground)
  ink2: '${ink2.value}', // ${INDEX_CSS_REL}:${ink2.lineA} (--ink2) & ${INDEX_CSS_REL}:${ink2.lineB} (--muted-foreground)
  ink3: '${ink3.value.toLowerCase()}', // ${INDEX_CSS_REL}:${ink3.line} (--ink3)
  primary: '${primary.value.toLowerCase()}', // ${INDEX_CSS_REL}:${primary.line} (--primary)
  primaryFg: '${primaryFg.value.toLowerCase()}', // ${INDEX_CSS_REL}:${primaryFg.line} (--primary-foreground)
  mint: '${ring.value.toLowerCase()}', // ${INDEX_CSS_REL}:${ring.line} (--ring) & ${SHADER_BG_REL}:${colorsInfo.line} (ChromaCurrent stream[0])
  teal: '${colorsInfo.lightStreams[1]}', // ${SHADER_BG_REL}:${colorsInfo.line} (ChromaCurrent stream[1])
  mintDeep: '${mintDeep.value.toLowerCase()}', // ${INDEX_CSS_REL}:${mintDeep.line} (--note-tag-active)
  mintTint: '${mintTint.value.toLowerCase()}', // ${INDEX_CSS_REL}:${mintTint.line} (--note-card-selected-bg)
  destructive: '${destructive.value.toLowerCase()}', // ${INDEX_CSS_REL}:${destructive.line} (--destructive)
  bootSkyTop: '${bootSkyTopHex}', // ${INDEX_CSS_REL}:${bootSkyLine} (@import "tailwindcss" sky-200; Scene 1 OriginKit CloudSky preset=base only)
  bootSkyBottom: '${bgInfo.lightCanvas}', // ${SHADER_BG_REL}:${bgInfo.line} (blends into shaderCanvasLight)
  categories: { // ${SKILLS_WS_REL}:${headerLine}-${endLine} (CATEGORY_COLORS)
    qaTesting: '${catQa.color}', // ${SKILLS_WS_REL}:${catQa.line} ("${catQa.short}")
    workflows: '${catWorkflows.color}', // ${SKILLS_WS_REL}:${catWorkflows.line} ("${catWorkflows.short}")
    rustRelayer: '${catRust.color}', // ${SKILLS_WS_REL}:${catRust.line} ("${catRust.short}")
    designSystem: '${catDesign.color}', // ${SKILLS_WS_REL}:${catDesign.line} ("${catDesign.short}")
    coreHub: '${catCore.color}', // ${SKILLS_WS_REL}:${catCore.line} ("${catCore.short}")
  },
} as const;

export type Palette = typeof PALETTE;
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, output, "utf8");
console.log(`Generated ${path.relative(REPO_ROOT, OUT_FILE)} from ${INDEX_CSS_REL}, ${SHADER_BG_REL}, and ${SKILLS_WS_REL}`);

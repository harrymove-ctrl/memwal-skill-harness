#!/usr/bin/env node
// Fails the build when a secret reaches the client bundle in dist/.
//   node scripts/check-bundle-secrets.mjs [dir]
// Two checks:
//   1. Known secret shapes: Sui private keys, Walrus Console keys, Enoki private keys, Tatum keys, PEM keys.
//   2. The exact value of every secret-named variable from .env* files and process.env
//      (names containing PRIVATE, SECRET, TOKEN, LICENSE or ending in _KEY), minus known public ones.
// Prints names and file paths only, never a value.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, process.argv[2] ?? "dist");

const SHAPES = [
  ["sui private key", /suiprivkey1[0-9a-z]{50,}/],
  ["walrus console key", /hbr(?:adm)?_[A-Za-z0-9_-]{20,}/],
  ["enoki private key", /enoki_private_[A-Za-z0-9]{10,}/],
  ["tatum api key", /\bt-[0-9a-f]{24}-[0-9a-f]{24}\b/],
  ["pem private key", /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
];

const SECRET_NAME = /(PRIVATE|SECRET|TOKEN|LICENSE|BUNDLE|_KEY$)/;
// Values that are public by design and may ship to the browser.
const PUBLIC_NAMES = new Set(["VITE_MEMWAL_DELEGATE_PUBLIC_KEY", "VITE_ENOKI_API_KEY", "ENOKI_PUBLIC_API_KEY"]);

function parseEnvFile(file) {
  const out = {};
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const secrets = new Map(); // value -> name
const addSecret = (name, value) => {
  if (!value || value.length < 16 || !SECRET_NAME.test(name) || PUBLIC_NAMES.has(name)) return;
  if (name === "VITE_ENOKI_API_KEY" && value.startsWith("enoki_public_")) return;
  secrets.set(value, name);
};
for (const f of readdirSync(ROOT)) {
  if (/^\.env(\..+)?$/.test(f) && statSync(path.join(ROOT, f)).isFile()) {
    for (const [k, v] of Object.entries(parseEnvFile(path.join(ROOT, f)))) addSecret(k, v);
  }
}
for (const [k, v] of Object.entries(process.env)) addSecret(k, v ?? "");

function* walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(js|mjs|cjs|html|css|map|json|txt)$/.test(e.name)) yield p;
  }
}

if (!existsSync(DIST)) {
  console.error(`check-bundle-secrets: ${path.relative(ROOT, DIST)} does not exist; run the build first.`);
  process.exit(2);
}

const hits = [];
for (const file of walk(DIST)) {
  const text = readFileSync(file, "utf8");
  for (const [label, re] of SHAPES) if (re.test(text)) hits.push(`${label} in ${path.relative(ROOT, file)}`);
  for (const [value, name] of secrets) if (text.includes(value)) hits.push(`value of ${name} in ${path.relative(ROOT, file)}`);
}

if (hits.length) {
  console.error("check-bundle-secrets: secrets found in the client bundle:");
  for (const h of hits) console.error("  - " + h);
  process.exit(1);
}
console.log(`check-bundle-secrets: ${path.relative(ROOT, DIST)} is clean (${SHAPES.length} shapes, ${secrets.size} env values checked).`);

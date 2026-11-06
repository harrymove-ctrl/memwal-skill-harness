import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getCachedTatumSuiRate,
  handleTatumMemwalRequest,
  screenSuiAddressCached,
  setCorsHeaders,
} from "./server/tatumMemwalApi.mjs";
import { handleNamespaceSkillsRequest } from "./server/namespaceSkillsApi.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const PORT = Number(process.env.PORT || 8080);
const DEFAULT_TATUM_KEY =
  process.env.TATUM_API_KEY ||
  "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8",
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function proxyHttpRequest(req, res, targetBaseUrl, prefixToStrip, extraHeaders = {}) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const rawUrl = req.url || "/";
  const rewrittenPath = rawUrl.replace(new RegExp(`^${prefixToStrip}`), "") || "/";
  const targetUrl = `${targetBaseUrl.replace(/\/+$/, "")}${rewrittenPath.startsWith("/") ? rewrittenPath : `/${rewrittenPath}`}`;

  const forwardHeaders = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (!v) continue;
    const key = k.toLowerCase();
    if (
      key === "host" ||
      key === "connection" ||
      key === "content-length" ||
      key === "accept-encoding"
    ) {
      continue;
    }
    if (
      key.startsWith("x-") ||
      key === "content-type" ||
      key === "accept" ||
      key === "authorization" ||
      key === "user-agent"
    ) {
      forwardHeaders[key] = Array.isArray(v) ? v.join(", ") : String(v);
    }
  }
  Object.assign(forwardHeaders, extraHeaders);

  const method = req.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";
  const bodyBuf = hasBody ? await readRawBody(req) : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: bodyBuf && bodyBuf.length > 0 ? bodyBuf : undefined,
    });

    res.statusCode = upstream.status;
    const ct = upstream.headers.get("content-type");
    if (ct) {
      res.setHeader("Content-Type", ct);
    }
    const responseBuffer = Buffer.from(await upstream.arrayBuffer());
    res.end(responseBuffer);
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: false,
        error: `Upstream proxy failed: ${String(err?.message || err)}`,
      })
    );
  }
}

function serveStaticAsset(req, res, pathname) {
  if (pathname === "/favicon.ico") {
    const svgMark = path.join(DIST_DIR, "brand", "memwal-mark.svg");
    if (fs.existsSync(svgMark)) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(svgMark).pipe(res);
      return;
    }
    res.statusCode = 204;
    res.end();
    return;
  }
  const safeRel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const resolved = path.resolve(DIST_DIR, safeRel);
  if (!resolved.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  let targetFile = resolved;
  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isDirectory()) {
    targetFile = path.join(targetFile, "index.html");
  }

  if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
    const ext = path.extname(targetFile).toLowerCase();
    res.statusCode = 200;
    res.setHeader(
      "Content-Type",
      MIME_TYPES[ext] || "application/octet-stream"
    );
    if (pathname.startsWith("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(targetFile).pipe(res);
    return;
  }

  // SPA fallback to dist/index.html for client routes
  const indexHtml = path.join(DIST_DIR, "index.html");
  if (!path.extname(pathname) && fs.existsSync(indexHtml)) {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(indexHtml).pipe(res);
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || "/";
  const parsedUrl = new URL(rawUrl, "http://localhost");
  const pathname = parsedUrl.pathname;

  if (req.method === "GET" && pathname === "/health") {
    setCorsHeaders(res);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: true,
        service: "memwal-skill-harness",
        relayerUrl: "https://relayer.memory.walrus.xyz",
        distReady: fs.existsSync(path.join(DIST_DIR, "index.html")),
      })
    );
    return;
  }

  // 0. Namespace Skills & Rules API (/api/ns/:ns/skills, /api/ns/:ns/rules)
  if (pathname.startsWith("/api/ns/")) {
    const handledByNs = await handleNamespaceSkillsRequest(req, res);
    if (handledByNs) return;
  }

  // 1. Tatum x MemWal Cloud Bridge (/api/tatum-memwal/*, /mcp, /openapi.json)
  const handledByBridge = await handleTatumMemwalRequest(req, res);
  if (handledByBridge) return;

  // 2. Walrus Memory Mainnet & Dev Relayer Reverse Proxies
  if (pathname.startsWith("/relayer-prod")) {
    await proxyHttpRequest(
      req,
      res,
      "https://relayer.memory.walrus.xyz",
      "/relayer-prod"
    );
    return;
  }
  if (pathname.startsWith("/relayer-dev")) {
    await proxyHttpRequest(
      req,
      res,
      "https://relayer.dev.memwal.ai",
      "/relayer-dev"
    );
    return;
  }

  // 3. Tatum API Proxy with Server-Side 30m Credit Guard Cache
  if (pathname.startsWith("/tatum-api")) {
    setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (
      req.method === "GET" &&
      pathname.startsWith("/tatum-api/v4/data/rate/symbol")
    ) {
      const rate = await getCachedTatumSuiRate(false);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          value: rate.value,
          basePair: rate.basePair,
          timestamp: rate.timestamp,
          source: rate.source,
          fromServerCache: rate.fromCache,
        })
      );
      return;
    }
    if (
      req.method === "GET" &&
      pathname.startsWith("/tatum-api/v3/security/address/")
    ) {
      const addr = decodeURIComponent(
        pathname.replace("/tatum-api/v3/security/address/", "")
      );
      const screened = await screenSuiAddressCached(addr);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          status: screened.status === "malicious" ? "malicious" : "valid",
          fromServerCache: screened.fromCache,
        })
      );
      return;
    }
    await proxyHttpRequest(req, res, "https://api.tatum.io", "/tatum-api", {
      "x-api-key": req.headers["x-api-key"] || DEFAULT_TATUM_KEY,
    });
    return;
  }

  // 4. Static SPA Assets
  serveStaticAsset(req, res, pathname);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `[memwal-skill-harness] Listening on http://0.0.0.0:${PORT} (Relayer: https://relayer.memory.walrus.xyz)`
  );
});

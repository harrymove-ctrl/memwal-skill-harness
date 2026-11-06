#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../out");
const VIDEO_PATH = path.join(OUT_DIR, "memwal-skills-promo.mp4");
const PORT = Number(process.env.VIDEO_PREVIEW_PORT || 4321);

const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MemWal Skills x Tatum: 42s Promo Video Director Preview</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at 50% 0%, #0f2922 0%, #070b0a 62%);
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 20px 48px;
    }
    .header {
      max-width: 1120px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 16px;
      border-radius: 999px;
      background: rgba(52, 217, 150, 0.14);
      border: 1px solid rgba(52, 217, 150, 0.42);
      color: #6ee7b7;
      font-size: 13px;
      font-weight: 600;
    }
    h1 {
      margin: 6px 0 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .stage {
      max-width: 1120px;
      width: 100%;
      border-radius: 20px;
      overflow: hidden;
      background: #000;
      border: 1.5px solid rgba(52, 217, 150, 0.35);
      box-shadow: 0 32px 90px rgba(0, 0, 0, 0.72), 0 0 50px rgba(16, 185, 129, 0.16);
    }
    video {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #000;
    }
    .chapters {
      max-width: 1120px;
      width: 100%;
      margin-top: 18px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    button {
      cursor: pointer;
      padding: 10px 16px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(18, 25, 23, 0.92);
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    button:hover {
      border-color: #34d996;
      color: #6ee7b7;
      transform: translateY(-1px);
    }
    .dl {
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 999px;
      background: #34d996;
      color: #052e16;
      font-size: 14px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <span class="badge">Antigravity Demo Video Director · 1920×1080 · 30fps · 42.0s · Stereo Audio</span>
      <h1>MemWal Skills × Tatum Total Recall</h1>
    </div>
    <a class="dl" href="/memwal-skills-promo.mp4" download="memwal-skills-promo-42s.mp4">Download 1080p MP4</a>
  </div>
  <div class="stage">
    <video id="player" src="/memwal-skills-promo.mp4" controls playsinline preload="auto"></video>
  </div>
  <div class="chapters">
    <button onclick="jump(0)">00:00 · Logo + CloudSky + Word Gather</button>
    <button onclick="jump(6)">00:06 · Logo Collapse (Drop A)</button>
    <button onclick="jump(11)">00:11 · Prompt Roll + Halo Send</button>
    <button onclick="jump(18.5)">00:18 · Click Type Close-Up</button>
    <button onclick="jump(23.5)">00:23 · App Reveal 3D Flight (Drop B)</button>
    <button onclick="jump(27.5)">00:27 · Live Flow Graph</button>
    <button onclick="jump(31)">00:31 · Live Tatum Total Recall</button>
    <button onclick="jump(34.8)">00:35 · Live Tatum AI &amp; IDEs</button>
    <button onclick="jump(38)">00:38 · Emerald Dot Bloom + Lockup</button>
  </div>
  <script>
    const v = document.getElementById("player");
    function jump(sec) {
      v.currentTime = sec;
      v.play();
    }
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML);
    return;
  }
  if (url === "/memwal-skills-promo.mp4") {
    if (!fs.existsSync(VIDEO_PATH)) {
      res.writeHead(404);
      res.end("Video not rendered yet");
      return;
    }
    const stat = fs.statSync(VIDEO_PATH);
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = Number.parseInt(parts[0], 10);
      const end = parts[1] ? Number.parseInt(parts[1], 10) : stat.size - 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": end - start + 1,
        "Content-Type": "video/mp4",
      });
      fs.createReadStream(VIDEO_PATH, { start, end }).pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
      });
      fs.createReadStream(VIDEO_PATH).pipe(res);
    }
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Video preview server listening at http://localhost:${PORT}`);
});

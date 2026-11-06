#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP4 = path.resolve(__dirname, "../out/memwal-skills-promo.mp4");

if (!fs.existsSync(MP4)) {
  console.error("Missing MP4:", MP4);
  process.exit(1);
}

const probeJson = JSON.parse(
  execSync(`ffprobe -v quiet -print_format json -show_format -show_streams "${MP4}"`, {
    encoding: "utf8",
  })
);

const vStream = probeJson.streams.find((s) => s.codec_type === "video");
const aStream = probeJson.streams.find((s) => s.codec_type === "audio");

console.log("=== FFPROBE STREAM SUMMARY ===");
console.log({
  fileSizeMB: (Number(probeJson.format.size) / (1024 * 1024)).toFixed(2),
  durationSec: Number(probeJson.format.duration).toFixed(3),
  video: vStream
    ? `${vStream.codec_name} ${vStream.width}x${vStream.height} @ ${vStream.r_frame_rate} (${vStream.nb_frames} frames)`
    : "MISSING",
  audio: aStream
    ? `${aStream.codec_name} ${aStream.sample_rate}Hz ${aStream.channels}ch`
    : "MISSING",
});

// Check first 1.5s audio volume to prove music starts immediately on Frame 0!
const introVol = execSync(
  `ffmpeg -t 1.5 -i "${MP4}" -af volumedetect -f null - 2>&1 | grep -E "mean_volume|max_volume"`,
  { encoding: "utf8" }
);
console.log("=== FIRST 1.5s AUDIO CHECK (Frame 0 Music Start) ===");
console.log(introVol.trim());

// Check full 42.0s audio volume + blackdetect
const fullCheck = execSync(
  `ffmpeg -i "${MP4}" -vf "blackdetect=d=0.1:pix_th=0.05" -af volumedetect -f null - 2>&1 | grep -E "black_start|mean_volume|max_volume"`,
  { encoding: "utf8" }
);
console.log("=== FULL 42.0s AUDIO & BLACKDETECT CHECK ===");
console.log(fullCheck.trim());

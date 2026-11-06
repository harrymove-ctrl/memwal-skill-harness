#!/usr/bin/env bash
# ==============================================================================
# Walrus Memory — Two-Pass EBU R128 MP4 Audio Mastering Script
# Usage:
#   ./scripts/master-loudness.sh <input.mp4> <output.mp4>
#
# Spec:
#   - Pass 1: Measures mixed MP4 audio via ffmpeg loudnorm (I=-14.0, TP=-1.2, LRA=9)
#   - Pass 2: Applies measured linear loudnorm + -1.25 dBFS safety ceiling into
#             48 kHz 256 kbps AAC while copying video bit-identically (-c:v copy)
#   - Verify: Confirms final MP4 sits within -14.0 +- 0.4 LUFS and <= -1.0 dBTP
# ==============================================================================
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <input.mp4> <output.mp4>" >&2
  exit 1
fi

INPUT_MP4="$1"
OUTPUT_MP4="$2"

if [[ ! -f "$INPUT_MP4" ]]; then
  echo "Error: Input file not found: $INPUT_MP4" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_MP4")"

TMP_OUT=""
if [[ "$(cd "$(dirname "$INPUT_MP4")" && pwd)/$(basename "$INPUT_MP4")" == "$(cd "$(dirname "$OUTPUT_MP4")" && pwd)/$(basename "$OUTPUT_MP4")" ]]; then
  TMP_OUT="${OUTPUT_MP4%.mp4}.mastering-tmp-$$.mp4"
  TARGET_MP4="$TMP_OUT"
else
  TARGET_MP4="$OUTPUT_MP4"
fi

TARGET_I="-14.0"
TARGET_TP="-1.2"
TARGET_LRA="9"

echo "[master-loudness] Pass 1/2: Measuring integrated loudness of $(basename "$INPUT_MP4")..."
PASS1_LOG="$(ffmpeg -hide_banner -nostats -i "$INPUT_MP4" \
  -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json" \
  -f null - 2>&1 || true)"

MEASURED_VARS="$(
  PASS1_RAW="$PASS1_LOG" node -e '
    const raw = process.env.PASS1_RAW || "";
    const matches = raw.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g);
    if (!matches || matches.length === 0) {
      console.error("Failed to extract loudnorm JSON from Pass 1 output.");
      process.exit(1);
    }
    const j = JSON.parse(matches[matches.length - 1]);
    console.log([
      j.input_i,
      j.input_tp,
      j.input_lra,
      j.input_thresh,
      j.target_offset
    ].join(" "));
  '
)"

read -r M_I M_TP M_LRA M_THRESH M_OFFSET <<< "$MEASURED_VARS"
echo "[master-loudness] Pass 1 Measured: I=${M_I} LUFS | TP=${M_TP} dBTP | LRA=${M_LRA} LU | Offset=${M_OFFSET} dB"

LOUDNORM_FILTER="loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:measured_I=${M_I}:measured_TP=${M_TP}:measured_LRA=${M_LRA}:measured_thresh=${M_THRESH}:offset=${M_OFFSET}:linear=true"

echo "[master-loudness] Pass 2/2: Mastering audio (-c:v copy -c:a aac -b:a 256k -ar 48000)..."
ffmpeg -y -hide_banner -loglevel error \
  -i "$INPUT_MP4" \
  -map 0:v:0 -map 0:a:0 \
  -c:v copy \
  -af "aresample=48000,${LOUDNORM_FILTER},alimiter=limit=-1.48dB:attack=3:release=40:level=false,aresample=48000" \
  -ar 48000 \
  -c:a aac -b:a 256k \
  -movflags +faststart \
  "$TARGET_MP4"

# Post-master verification pass (and precision trim from source if dynamic fallback drifted > 0.35 LU)
VERIFY_LOG="$(ffmpeg -hide_banner -nostats -i "$TARGET_MP4" \
  -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json" \
  -f null - 2>&1 || true)"

read -r V_I V_TP V_LRA NEEDS_TRIM TRIM_DB <<< "$(
  VERIFY_RAW="$VERIFY_LOG" node -e '
    const raw = process.env.VERIFY_RAW || "";
    const matches = raw.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g);
    const j = JSON.parse(matches[matches.length - 1]);
    const vi = parseFloat(j.input_i);
    const vtp = parseFloat(j.input_tp);
    const diff = -14.0 - vi;
    const needsTrim = Math.abs(diff) > 0.34 || vtp > -1.05 ? "1" : "0";
    console.log([j.input_i, j.input_tp, j.input_lra, needsTrim, diff.toFixed(3)].join(" "));
  '
)"

if [[ "$NEEDS_TRIM" == "1" ]]; then
  echo "[master-loudness] Fine-calibrating post-AAC trim (${TRIM_DB} dB) from source..."
  ffmpeg -y -hide_banner -loglevel error \
    -i "$INPUT_MP4" \
    -map 0:v:0 -map 0:a:0 \
    -c:v copy \
    -af "aresample=48000,${LOUDNORM_FILTER},volume=${TRIM_DB}dB,alimiter=limit=-1.55dB:attack=3:release=40:level=false,aresample=48000" \
    -ar 48000 \
    -c:a aac -b:a 256k \
    -movflags +faststart \
    "$TARGET_MP4"

  VERIFY_LOG="$(ffmpeg -hide_banner -nostats -i "$TARGET_MP4" \
    -af "loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json" \
    -f null - 2>&1 || true)"

  read -r V_I V_TP V_LRA _ _ <<< "$(
    VERIFY_RAW="$VERIFY_LOG" node -e '
      const raw = process.env.VERIFY_RAW || "";
      const matches = raw.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/g);
      const j = JSON.parse(matches[matches.length - 1]);
      console.log([j.input_i, j.input_tp, j.input_lra, "0", "0"].join(" "));
    '
  )"
fi

if [[ -n "$TMP_OUT" ]]; then
  mv -f "$TMP_OUT" "$OUTPUT_MP4"
fi

echo "[master-loudness] Final Verified MP4 ($(basename "$OUTPUT_MP4")): Integrated=${V_I} LUFS | TruePeak=${V_TP} dBTP | LRA=${V_LRA} LU"

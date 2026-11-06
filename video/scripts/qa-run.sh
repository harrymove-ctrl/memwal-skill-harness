#!/bin/zsh
# Usage: scripts/qa-run.sh '<json jobs>'  -> renders half-scale QA stills into out/qa-v2
cd "$(dirname "$0")/.." && node scripts/qa-stills.mjs out/qa-v2 "$1" > out/qa-v2/log.txt 2>&1; echo "EXIT $?" >> out/qa-v2/log.txt

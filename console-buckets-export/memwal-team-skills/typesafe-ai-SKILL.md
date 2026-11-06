---
name: typesafe-ai
description: >-
  Use when building with TypeSafe/Jev structured decisions (Choice/Score/Noul)
  instead of LLM prompt-and-parse — routing, ranking, extraction, verification
  (including Walrus Memory WALM-654 spike).
---
# Build with TypeSafe (Jev)

Use when a feature needs programmable structured decisions (routing, ranking, extraction, verification) instead of LLM prompt-and-parse.

## Source of truth
Read live docs from https://docs.typesafe.ai/llms.txt and relevant `.md` pages before integrating.

## Core idea
System One / **Jev**: send `state` + typed questions → Choice / Score / Noul with probabilities. Code owns workflow; model supplies judgments. Endpoint `POST https://api.typesafe.ai/v1/systemone`. Pin model versions (e.g. `jev-1.13.0`). Auth: `TYPESAFE_API_KEY` Bearer. Input priced; output free.

## Design
- Keep rules, math, dates, lookups in code.
- One narrow judgment per question; many questions in one request (parallel).
- Choice = one of set; Noul = yes/no probability; Score = degree on rubric.
- Use confidence for thresholds; validate on user data.
- Never put API keys in client/browser.

## WM spike context
For Walrus Memory WALM-654: post-recall top-K rerank/routing only; synthetic data by default; fail closed if Jev unavailable.

Installed from typesafe-ai/skills.

## Live Flow Memories (Walrus Recalled)
- **[FLOW:typesafe-ai]** (workflow-update · blob `z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0` · by `@harrymove-ctrl`): Use structured Choice and Score schemas instead of free-form regex parsing when routing recall queries.
  - *Rationale*: Eliminates brittle prompt parsing in WALM-654 decision pipelines.

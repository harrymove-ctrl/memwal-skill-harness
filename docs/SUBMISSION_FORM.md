# Total Recall Submission Form: Skillbook (Harry Phan)

Every field of the submission form at [recall-tatum-walrus.vercel.app](https://recall-tatum-walrus.vercel.app) ("Submit Project"), ordered and labeled to match the live form for Harry Phan (`phanhoangvinhhien@gmail.com`). Copy each answer directly from its code block below.

## Submission Readiness Checklist

| # | Requirement | Status |
| :--- | :--- | :--- |
| 1 | At least 10 memories on Mainnet | 98+ of 10. 20 full `SKILL.md` playbooks, 12 active engineering rules, and live recall receipts stored on Walrus Mainnet |
| 2 | Published blog post | Complete ([submission-blog-post.md](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/submission-blog-post.md) and [SUBMISSION_BLOG_POST.md](file:///Volumes/Dev/memwal-skill-harness/docs/SUBMISSION_BLOG_POST.md)) with all 12 Mainnet Walrus blob links |
| 3 | Demo video (2 to 3 minutes) | Rendered (`2:56`, `1920x1080`, `30 fps` at [skillbook-demo-full.mp4](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/skillbook-demo-full.mp4), plus `0:44` X cut [skillbook-launch-x-44s.mp4](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/skillbook-launch-x-44s.mp4) and `0:34` Tatum AI Builder live capture [skillbook-tatum-ai-builder-live.mp4](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/skillbook-tatum-ai-builder-live.mp4)) |
| 4 | Dedicated Mainnet account fields | Verified on Sui Mainnet (`0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d`) |
| 5 | Live app & Tatum AI Builder app | Live on Railway (`https://memwal-skill-harness-production.up.railway.app`) and Tatum AI Builder (`https://dashboard.tatum.io/ai-builder/skillbook-mcp-rust-pattern-analyz-31177f`) |

## 01 Contact

| Field | Answer |
| :--- | :--- |
| Full Name | `Harry Phan` |
| Email \* | `phanhoangvinhhien@gmail.com` |
| Discord handle \* | `harryphan` (or your active Discord handle) |
| LinkedIn \* | `https://www.linkedin.com/in/harryphan` (or your LinkedIn URL) |
| Telegram ID *(optional)* | `@harryphan` |
| How did you hear about this event? \* | `Walrus Socials` (or `Tatum Socials`) |
| Which community or account did you hear about us through? *(optional)* | `@WalrusProtocol & @tatum_io` |
| Is this your first Web3 project? \* | `No` |

### Copy Blocks for 01 Contact

#### Email \*

```text
phanhoangvinhhien@gmail.com
```

#### How did you hear about this event? \*

```text
Walrus Socials
```

#### Which community or account did you hear about us through? *(optional)*

```text
@WalrusProtocol and @tatum_io
```

#### Is this your first Web3 project? \*

```text
No
```

## 02 Accounts

| Field | Answer |
| :--- | :--- |
| Tatum ID \* | `6a228875df9fc562405f2dff` |
| SUI address \* | `0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124` |
| Account ID (SUI) \* | `0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d` |
| MEMWAL_AGENT_ID \* | `649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1` |

### Copy Blocks for 02 Accounts

#### Tatum ID \*

```text
6a228875df9fc562405f2dff
```

#### SUI address \*

```text
0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124
```

#### Account ID (SUI) \*

```text
0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d
```

#### MEMWAL_AGENT_ID \*

```text
649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1
```

*(Note: If the form asks for the `0x`-prefixed agent ID, use `0x649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1`; if it asks for the raw Ed25519 public key hex, use `68423c5a909df878941fc363970172c05e13dfce583aed7ebab35b9390ce82f6`.)*

## 03 Project

### Project description \*

```text
Skillbook: Teach a rule once, and every coding agent on your team follows it. Track 2 (Smart Agents for Real Life) and Tatum AI Builder Bonus Track entry by Harry Phan (phanhoangvinhhien@gmail.com).

Engineering teams now use five or more coding agents at once: Claude Code, Cursor, Codex, Antigravity, and Tatum AI Builder (dashboard.tatum.io/ai-builder). When one engineer fixes a bug, like holding a Tokio Mutex lock across .await or swapping a Walrus BlobId with a Sui ObjectId, that lesson stays stuck in one local chat or .cursorrules file. Another teammate's agent repeats the same mistake the next day.

Skillbook gives every coding agent on your team one shared rulebook stored on Walrus Mainnet, gated on Sui, and verified with Tatum:

1. Check a Skill Before Release (/try): Before pushing a rule to the whole team, you test it in Skillbook's /try view (or inside Tatum AI Builder) against a real prompt. You see the before-and-after code diff side by side so you know the rule works before publishing it to Walrus Mainnet.
2. Fast Recall Over Immutable Walrus Blobs (98+ Mainnet Blobs): Our workspace stores 20 full SKILL.md playbooks, 12 active engineering rules, and live recall logs on Walrus Mainnet. Because Walrus blobs are immutable and take 4 to 8 seconds to seal, Skillbook treats Walrus like a version history and keeps an in-memory snapshot. Agents read active rules in 38 milliseconds, and every past version stays verifiable on Walruscan.
3. Local MCP + Cloud Tatum AI Builder Bridge: Local terminal agents connect with one MCP command so the delegate private key never leaves the developer's machine. Cloud tools like Tatum AI Builder connect through Skillbook's read-only HTTP and OpenAPI endpoint (/api/tatum-memwal/recall).
4. Sui Sign-In and Tatum Mainnet Verification: Visitors who are signed out see only the public landing page. Teammates sign in with Slush Wallet or Google (@mysten/enoki zkLogin on Sui Mainnet). Skillbook verifies the Sui account via Tatum RPC, screens member addresses with Tatum v3 Security, and caches live SUI/USD rates from Tatum v4 Data API for 30 minutes so agent calls never exhaust free-tier credits.

Live App: https://memwal-skill-harness-production.up.railway.app
Demo Video: https://youtu.be/65Ky7_SXOZ0
Tatum AI Builder App: https://dashboard.tatum.io/ai-builder/skillbook-mcp-rust-pattern-analyz-31177f?productId=6a228877df9fc562405f2e04&chat=ses_e3b4143bbffejlA8wivSsQKoJW
Blog Post: https://github.com/harrymove-ctrl/memwal-skill-harness/blob/main/docs/SUBMISSION_BLOG_POST.md
Code: https://github.com/harrymove-ctrl/memwal-skill-harness
```

### Short demo video (2 to 3 min) \*

```text
https://youtu.be/65Ky7_SXOZ0
```

### GitHub repo \*

```text
https://github.com/harrymove-ctrl/memwal-skill-harness
```

### Additional documentation *(optional)*

```text
https://github.com/harrymove-ctrl/memwal-skill-harness/blob/main/docs/SUBMISSION_BLOG_POST.md
```

## 04 Feedback

### How was your experience building with Walrus? \*

```text
Walrus Memory on Mainnet worked well as an append-only version history for shared engineering rules. Using @mysten-incubation/memwal with rememberBulk and namespaces (memwal-team-skills, design-skills, testing), we stored 98+ Mainnet blobs across 20 full SKILL.md playbooks, 12 active rules, and live recall logs.

Because Walrus blobs cannot be modified in place and sealing a new blob on Mainnet takes 4 to 8 seconds, we built a version-folding layer on top of Walrus. When a teammate edits a rule or toggles it off, Skillbook writes a new revision blob to Walrus Mainnet and updates an in-memory snapshot immediately. That cut agent recall time from 7.4 seconds on cold queries down to 38 milliseconds while keeping every historical blob receipt on Walruscan.
```

### How was your experience building with the Tatum AI Builder? \*

```text
We used Tatum in two places: we built our "Skillbook MCP Rust Pattern Analyzer" app inside Tatum AI Builder (dashboard.tatum.io/ai-builder), and we used Tatum's Sui Mainnet RPC, v3 Security API, and v4 SUI/USD Data API in Skillbook's backend.

Connecting Tatum AI Builder to our live recall endpoint (/api/tatum-memwal/recall) caught a real latency bug early. Our first uncached Walrus queries took 7.4 seconds on cold start, which caused Envoy inside the AI Builder preview to time out before the UI could parse the JSON response. Pre-warming the active rule snapshot and running the Tatum SUI/USD rate check in parallel brought the response down to 38 milliseconds. After that fix, Tatum AI Builder loaded all 12 Walrus rules, verified our Sui owner address with Tatum Security, and rendered the Tokio Mutex before-and-after code diff cleanly on every refresh.
```

### One bug or friction point with Walrus Memory *(optional)*

```text
Calling listMemories (/v1/owners/:owner/memories) returns blob metadata (blob_id, size, created_at) without the text content, while calling recall requires a search query and uses semantic filtering that can skip short state updates. To rebuild the exact state of all rules and skills in a namespace, we had to combine listMemories metadata with targeted recall queries and fold them by timestamp. Adding an option on listMemories to include the text payload for a namespace would make state reconstruction much simpler.
```

### Social post links *(optional, extra points)*

Ready-to-post X / LinkedIn copy (paste your published post URL into this field after posting with [skillbook-launch-x-44s.mp4](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/skillbook-launch-x-44s.mp4) or [skillbook-tatum-ai-builder-live.mp4](file:///Users/harryphan/.gemini/antigravity/brain/185b4df9-e07e-4cde-b7a1-0032f1986138/skillbook-tatum-ai-builder-live.mp4)):

```text
I built Skillbook for the @WalrusProtocol x @tatum_io Total Recall hackathon (Track 2: Smart Agents for Real Life + Tatum AI Builder):

Teach an engineering rule once, test the before/after diff in /try, and let every coding agent on your team (Claude Code, Cursor, Codex, Antigravity, and Tatum AI Builder) recall it from Walrus Mainnet in 38ms.

Live app: https://memwal-skill-harness-production.up.railway.app
Demo video: https://youtu.be/65Ky7_SXOZ0
Code & Blog: https://github.com/harrymove-ctrl/memwal-skill-harness
#Sui #Walrus #Tatum
```

## 05 Agreement Checkbox \*

Tick: *"I am 18+ and agree to the Event Rules, the Tatum Terms of Use, the Walrus General Terms of Service and the Walrus Privacy Policy"*.

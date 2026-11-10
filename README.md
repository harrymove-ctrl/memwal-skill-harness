<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/lockup-full-on-dark.svg">
  <img src="public/brand/lockup-full-on-light.svg" alt="Skillbook" height="56">
</picture>

# Skillbook

Teach a rule once, and every coding agent on your team follows it.

Built by Harry Phan (`phanhoangvinhhien@gmail.com`) for the Walrus and Tatum Total Recall Hackathon (Track 2: Smart Agents for Real Life and Tatum AI Builder Bonus Track).

1. Live App: https://memwal-skill-harness-production.up.railway.app
2. Demo Video (YouTube, 2:56): https://youtu.be/65Ky7_SXOZ0
3. Tatum AI Builder App: https://dashboard.tatum.io/ai-builder/skillbook-mcp-rust-pattern-analyz-31177f?productId=6a228877df9fc562405f2e04&chat=ses_e3b4143bbffejlA8wivSsQKoJW
4. Submission Blog Post: [docs/SUBMISSION_BLOG_POST.md](docs/SUBMISSION_BLOG_POST.md)
5. Submission Form Copy Blocks: [docs/SUBMISSION_FORM.md](docs/SUBMISSION_FORM.md)

![Skillbook Architecture](docs/assets/skillbook-stack-diagram-dark.png)

## How Skillbook Works

1. Check a Skill Before Release (`/try`): Draft a rule from a real bug fix, test it against a real prompt in `/try` (or in Tatum AI Builder), and inspect the before-and-after code diff before publishing it to the team.
2. Shared Rulebook on Walrus Mainnet (`/home`): Stores 20 full `SKILL.md` playbooks, 12 active engineering rules, and live recall logs (`98+` blobs) on Walrus Mainnet. Connected agents recall the active rules in 38 milliseconds, and every revision has a verifiable Walruscan blob receipt.
3. Universal Agent Connections (`/agents`): Connect Claude Code, Cursor, Codex, and Antigravity with one terminal MCP command while keeping `$MEMWAL_PRIVATE_KEY` on your machine, or connect Tatum AI Builder via `/api/tatum-memwal/recall`.
4. Sui Sign-In and Tatum Mainnet Verification (`/team`): Sign in with Slush Wallet or Google (`@mysten/enoki` Sui Mainnet zkLogin). Skillbook verifies the `MemWalAccount` on Sui Mainnet via Tatum RPC, screens member addresses with Tatum v3 Security, and caches live SUI/USD rates from Tatum v4 Data API for 30 minutes.

## Quick Start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5188` in your browser.

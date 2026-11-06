# 6. Hackathon plan: Walrus x Tatum "Total Recall"

Track: **Smart Agents for Real Life**. Submissions close **10 Nov 2026, 17:00 UTC**; judging 11 to 16 Nov; winners 17 Nov. Source: [recall-tatum-walrus.vercel.app](https://recall-tatum-walrus.vercel.app/).

## How we are judged, and where we stand

| Criterion | Weight | What judges look for | Where we stand today | What moves the score |
| :--- | ---: | :--- | :--- | :--- |
| Walrus and Tatum integration | 30% | Walrus Memory writing to mainnet; Tatum RPC for onchain data | Walrus Memory on mainnet: yes, 67 memories. Tatum: data APIs only (SUI price, address check), **no Tatum Sui RPC** | Read the account's delegate keys and transaction digests through the Tatum Sui RPC on Team and in the proof drawer |
| Technical quality | 30% | Clean code, a working Tatum Sui RPC integration | Console and Memory gateways exist; several screens still simulated | Remove simulated states (F6, A4), finish rule persistence (D3), Tatum Sui RPC |
| Creativity | 20% | A fresh idea | Team skills as shared agent memory is distinctive | Show "your rule was used by a teammate's agent" in Activity |
| Presentation | 20% | Clear docs and a working demo | UI audit failed on every screen; README is protocol heavy | The redesign in `04-screens.md`, a landing with a demo, a blog post, a 2 minute video |

## Submission requirements

| Requirement | Status | Action |
| :--- | :--- | :--- |
| Walrus Memory integrated and writing to mainnet | Done | Keep the proof drawer showing it |
| At least 10 memories on mainnet | Done (67 in this account) | Show the count on Home |
| Tatum RPC used for onchain data | **Missing** | Add the Tatum Sui RPC reads listed below |
| Working demo | Done (Railway) | Make the demo space usable without a wallet |
| Public repo | **Missing**: this folder is not a git repository yet | Create a public GitHub repo under `harrymove-ctrl`, push, check the secret scan first |
| Published blog post | **Missing** | Write it on day 6 (outline below) |
| Optional: Tatum AI Builder ($500 bonus) | Partial (Connect has a Tatum AI tab) | Record one run of the bridge from ai.tatum.io |

## Tatum Sui RPC: the smallest real integration

Use the Tatum Sui mainnet RPC gateway (with the server's `TATUM_API_KEY`) for every onchain read the app makes, so the integration is real and visible:

1. **Team verification:** read the MemWal account object and list its delegate keys; mark each member "Key on account, verified via Tatum Sui RPC".
2. **Proof drawer:** fetch the latest transactions for the account (key added, key removed) and show their status and time.
3. **Rotation proof:** the 2026-11-02 key rotation digests (`AFZNLNKPeb5nrhVCqi8qJKRrbxVXkEZUMwnK89LW1eLT` added, `AhjZxscsA8wZT38HYpNwH9M3VM1rtLvnZNddLzG3d4F1` removed) make a ready made example.

## Seven day plan

Direction B, the dark command center, was chosen on day 1. The engineering steps behind each day are in `07-build-plan.md`.

| Day | Date | Goal | Build plan steps | Done when |
| ---: | :--- | :--- | :--- | :--- |
| 1 | Tue 3 Nov | Plan approved, direction chosen | | Done: direction B |
| 2 | Wed 4 Nov | Git baseline, dark tokens, app shell, routes, vocabulary | 0 to 4 | Sidebar and mobile bar on dark; new labels; 0px overflow at 390px |
| 3 | Thu 5 Nov | Home (checklist and Live) and Skills | 5 to 7 | Checklist ticks from real data; Live counts real recalls; rule switches stick |
| 4 | Fri 6 Nov | Team, Agents and the Tatum Sui RPC | 8 and 9 | Members verified through Tatum; agent status from real recalls; no auto registration |
| 5 | Sat 7 Nov | Landing, demo space, Try it | 10 | A visitor reaches a verdict in 30 seconds without a wallet |
| 6 | Sun 8 Nov | Proof drawer, states, QA, blog post | 11 and 12 | Audit targets met on every screen; blog drafted |
| 7 | Mon 9 Nov | Video, public repo, submit | | Video recorded from the dark UI; repo public; submitted a day early |
| | Tue 10 Nov | Buffer | | Deadline 17:00 UTC |

## Demo script (2 minutes)

1. Landing: "Teach your agents once. Every teammate's IDE remembers it." Click Try the demo.
2. Try it: memwal-qa on PR #942. Without the team's rules the agent approves a PR for a retired app; with them it closes it as not planned. The rule that changed it is named.
3. Skills: open memwal-review; add the rule "Staging is retired, promote from dev to main"; it saves to Walrus Memory with a proof link.
4. Agents: Claude Code shows "Connected, last recall just now"; Activity shows the new rule being recalled.
5. Team: members verified on Sui through the Tatum Sui RPC; the address check runs on an invite.
6. Proof drawer: Console bucket, Walrus blobs, 67 mainnet memories, the rotation transactions.

## Blog post outline

1. The problem: every teammate's agent starts cold, and skill folders drift when they are sent around.
2. The idea: skills in a Walrus Console bucket, team rules in Walrus Memory, access on Sui.
3. How it learned over time: a rule taught on day one changed a decision on day three (the PR #942 story).
4. How we used Tatum: Sui RPC for account and transaction reads, address security on invites, SUI price for cost display.
5. What we would build next: agent proposed rules with owner review, the onchain teamspace contract.

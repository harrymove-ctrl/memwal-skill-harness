# Skillbook full demo: script and beat map

Status: approved for build on 2026-11-06.

Master: 1920x1080, 60fps, 2:42.5, no voiceover. Built in Remotion (`video/`) with the fly-through rendered by `out/flythrough/`. The old 80 second film stays in `docs/video/script.md` and is not changed.

## The story

Your team teaches a rule once, and every agent follows it. The film shows that three ways: as a feeling (the intro), as an idea (the loop), then as proof (the real app and what runs under it).

## Master timeline

| # | Time | Length | Scene | Source | What the viewer learns |
| :--- | :---: | :---: | :--- | :--- | :--- |
| 1 | 0:00 | 14.5s | Glass fly-through, ending "Teach your agents once." and "Here's how." | `out/flythrough/`, re-rendered at 16:9 | What the product is, and that it looks serious |
| 2 | 0:14.5 | 15s | The loop: one white ball, one world | `SkillbookLoopScene.tsx` (new) | Turn a rule on, agents follow, one asks, you teach, it saves |
| 3 | 0:29.5 | 3s | Logo sting | `StingScene`, after the old logo collapse | The name |
| 4 | 0:32.5 | 5s | The agent's question, then the laptop dive | `LaptopDiveScene`, after the old prompt dive | The question leads into the product |
| 5 | 0:37.5 | 17.9s | Chapter 1, Teach: card, then the real Skills screen | `Card1`, recorded footage | A rule sits beside the skill, with its author |
| 6 | 0:55.4 | 19.9s | Chapter 2, Recall: card, then the real Live and Agents screens | `Card2`, recorded footage | Every agent recalls it, and you can see it |
| 7 | 1:15.3 | 15.2s | Chapter 3, Change: card, then the real Try it screen | `Card3`, recorded footage | One rule changes the outcome |
| 8 | 1:30.5 | 22s | Chapter 4, Team and Proof: card, then the real Team screen and Proof drawer | `Card4`, recorded footage | Access and storage can be checked on chain |
| 9 | 1:52.5 | 40s | Under the hood: the motion graphics showreel | `SkillbookHoodScene` | How a rule travels through Walrus, Seal, Sui and Tatum |
| 10 | 2:32.5 | 10s | End card: install command and lockup | `EndCardScene` | What to do next |

Also exported on their own: the intro (done), the 15 second loop, and the 40 second showreel, for X.

## Intro changes still to make

The current intro does not yet follow the detailed fly-over brief. The build brings in the 56 degree tilt, focus that melts only near the lens, pieces that stand up as they lift, tiles that lift off beside the hero button and trail the camera, and a title that arrives word by word. The cloud sky stays in place of the studio floor, because that was the direct request and it has been approved twice.

## What happens to the old scenes

| Old scene | Decision | Reason |
| :--- | :--- | :--- |
| `OriginCloudHookScene` | Replaced by the fly-through | The cloud idea now lives in the intro |
| `MemWalLogoCollapseScene` | Reused with the new mark | The motion still works, the name does not |
| `PromptLaptopDiveScene` | Reused | It leads into the app well |
| Four chapter card scenes | Reused with new copy | Same chapter rhythm, new words |
| `LiveProductActs` and `take.mp4` | Camera and callouts reused, footage replaced | The take shows the old `/eval`, `/graph` and `/cad` screens, which the app no longer has |
| `TerminalEndLockupScene` | Reused and renamed | Same ending, new name |

## The loop, beat by beat (15s)

| Time | Beat | Picture |
| :---: | :--- | :--- |
| 0.0 to 1.0 | Toggle | The cursor reaches the switch on "Skip retired demo apps" and clicks |
| 1.0 to 2.0 | Release | The white knob springs free and the camera follows it |
| 2.0 to 4.0 | Slider | The ball rolls the knob, the fill follows, the bubble climbs to 100% |
| 4.0 to 5.5 | Notifications | Claude Code, Cursor, then Codex arrive, one per contact |
| 5.5 to 7.0 | Reply | The ball lands on Reply, the pill stretches, the keyboard rises |
| 7.0 to 10.0 | Keyboard | The ball strikes each key of "skip staging", then Return |
| 10.0 to 12.4 | Sent | The reply contracts into a small emerald message |
| 12.4 to 14.0 | Return | The camera pulls back to the whole world and the ball travels home |
| 14.0 to 15.0 | Loop | The knob is back in the switch, matching the first frame |

The slider's 100% is a picture of the idea, not a measured number.

## Under the hood, beat by beat (40s)

| Time | Beat | Picture |
| :---: | :--- | :--- |
| 0 to 6 | The rule | One typed line lifts off and becomes a solid block |
| 6 to 13 | Seal | The block locks, and its text turns to noise |
| 13 to 21 | Walrus | The block splits into slivers that spread across storage nodes |
| 21 to 29 | Sui | An agent's key reaches the contract, and a check passes or is refused |
| 29 to 35 | Tatum | The member list is read from the chain, row by row |
| 35 to 40 | Recall | The slivers return, the block opens, the agent reads the same rule |

The beats describe the design in `docs/ux/02-users-and-jobs.md`. Any line that names a technical claim gets checked against the code before it goes on screen.

## Copy rules

Address the viewer as "you". No invented people. On screen numbers in the real footage come from the real space, and sample data is only used where this file says so.

## What in the footage is not real

`video/scripts/record-demo.mjs` stops every non GET request, so recording writes nothing. One thing is simulated: the sign in and the one "Add rule" save in Chapter 1 are answered by the recorder. The recall in Chapter 2 is real, logged once to mainnet by `scripts/log-one-recall.mjs`.

## Sound

No voiceover. One new score at 96 BPM through the intro and loop, moving to the chapters on a shared bar line. The intro hit stays on 9.97s. Every contact in the loop gets a small UI sound.

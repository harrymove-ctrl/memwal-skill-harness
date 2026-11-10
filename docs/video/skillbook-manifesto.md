# Skillbook Manifesto: 60 second brand film

A film in two acts: the problem in a few plain lines, the turn, then the product as the answer. 1920x1080, 60fps, no voiceover. Source: `video/src/scenes/SkillbookManifesto.tsx`, sound from `out/flythrough/manifesto_score.py`, rendered by `out/flythrough/manifesto-render.sh`.

## Beat map

| Time | Beat | Picture | Words on screen |
| :---: | :--- | :--- | :--- |
| 0 to 5 | Opening line | A giant first word pulls back into a line that builds word by word | Every agent starts from zero |
| 5 to 12 | First problem | The full stop swells into a sphere, turns into a halftone globe, and the land fades away | Your team learned something today. Tomorrow's agent won't know it. |
| 12 to 18 | Second problem | A halftone laptop. A file flips edge on, changes its name twice, then crumbles to dust | So you copy the notes around. They go stale. |
| 18 to 23 | Three words | A marbled field of dots with three words circling | Teach, Share, Remember |
| 23 to 29 | The turn | Nested spheres burst and fold back to one dot | What if you only had to say it once? |
| 29 to 37 | Reveal | The dots open onto the glass page flying over the sky | The page's own headings |
| 37 to 42 | Reveal | The real Skills screen, a rule being taught | Teach a rule. Once. |
| 42 to 46 | Reveal | The real Live screen, with the real recall | Your agents recall it. |
| 46 to 50 | Reveal | The public ai.tatum.io page, a prompt being typed | Ready for Tatum AI. |
| 50 to 53 | Reveal | The real Proof drawer | Stored on Walrus. Checked on Sui. |
| 53 to 56 | Logo | The closing line on our colour | Teach your agents once. Every agent remembers. |
| 56 to 60 | Logo | The logo gathers from dots on white | Skillbook. Built on Walrus, Sui and Tatum. |

## Words

Plain language only. "Retired" and "not planned" are gone from the landing page, Try it and the film. Rule text that lives on mainnet still says "retired" in a few rules, so the film films skills whose real rules read plainly. Changing those rules would be a mainnet write.

## What is real

| Item | Status |
| :--- | :--- |
| Recall in Live | Real, logged once to mainnet by `scripts/log-one-recall.mjs` |
| 94 memories, account, keys and transactions in Proof | Real, read at recording time |
| Rule list | Real |
| Sign in and the one "Add rule" save | Answered by `video/scripts/record-manifesto.mjs`, nothing is written |
| Glass look on the app footage | Added for the film. The app's own look is the dark theme |
| ai.tatum.io | The real public page. The prompt is typed and not sent. A real AI Builder run was skipped by decision on 2026-11-06, so the film does not show one |

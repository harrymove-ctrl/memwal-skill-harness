# Logo

The MemWal Skill Harness logo, and how to use it. Every file here is built by `node video/scripts/build-brand.mjs` from one source of geometry, `src/shell/logoPaths.ts`.

## The idea

**The Playbook walrus.** An open book seen from the front doubles as a walrus's whiskers. The two tusks below it are what a team stores: skills and rules. It says the product in one shape: a team's playbook, on Walrus.

It is original artwork. It does not reuse the official Walrus or Walrus Memory marks, so the project can stand beside them without looking like an official product.

## Directions considered

| Direction | Verdict |
| :--- | :--- |
| A. Tusks: a rounded muzzle over two tusks | Reads as a mustache and fangs, with no link to the product |
| B. Node W: a W with a memory node at its center | Clean, but looks like a generic people or community logo, and it blurs at 16px |
| **C. Playbook walrus** | Chosen. The only one that says both "book" and "walrus", and it stays recognizable at 16px with the small cut |

## Files

All paths are under `public/brand/`, and the app serves them at `/brand/`.

| Use | File |
| :--- | :--- |
| Mark on a dark surface | `mark-emerald.svg` |
| Mark on a light surface | `mark-deep.svg` |
| One color print or stamps | `mark-ink.svg`, `mark-white.svg` |
| Mark at 24px and under | `mark-small-emerald.svg`, `mark-small-deep.svg` |
| Mark and short name | `lockup-on-dark.svg`, `lockup-on-light.svg` |
| Mark and full name | `lockup-full-on-dark.svg`, `lockup-full-on-light.svg` |
| App icon | `app-icon.svg`, `app-icon-dark.svg`, `icon-192.png`, `icon-512.png` |
| Home screens | `apple-touch-icon.png`, `icon-maskable-512.png`, `site.webmanifest` |
| Browser tab | `favicon.svg`, `favicon-32.png`, `favicon-16.png` |
| Link previews | `og-image.png`, `og-image.svg` |

Type is outlined, so no file needs a font installed. The name is set in Inter SemiBold (SIL Open Font License), and the outlines live in `scripts/brand/outlines.json`.

## In the app

```tsx
import { LogoMark, PRODUCT_NAME } from "./shell";

<LogoMark size={24} className="cc-brand__mark" />
```

`LogoMark` takes its color from CSS `color`, so it follows the theme, and it switches to the small cut at 24px and under. Pass `title` only when no text beside it says the name.

## Color

| Surface | Mark | Name | Contrast of the mark |
| :--- | :--- | :--- | :--- |
| Dark (`bg`, `surface`) | `#34d399` | `#f4f6f5` | 9.35:1 or better |
| Light (`bg`, `surface`) | `#047857` | `#141413` | 5.11:1 or better |
| Emerald tile | `#04140d` | none | 9.83:1 |

Emerald is the product's one lit color, so the logo adds no new one. The colors match `accent`, `on-accent` and `ink` in `src/shell/tokens.css`.

## Rules

1. **Minimum size:** 16px for the mark, 96px wide for the short lockup, 160px wide for the full lockup.
2. **Clear space:** leave at least one tusk width, a quarter of the mark's height, on every side.
3. **Small sizes:** use the small cut at 24px and under. The full cut's gaps close up below that.
4. **Tab and home screen icons:** use the emerald tile, which stays visible on any background.
5. **Name:** use the full name where the project is first introduced, and the short name inside the app.

Do not recolor the mark outside the table above, add effects or gradients, stretch it, separate the tusks from the book, or use the mark where the official Walrus logo belongs.

## Where it still needs to go

`src/App.tsx` and `src/components/blocks/onboarding-7.tsx` still draw the old `WalrusLogo3D`, and Antigravity owns `App.tsx`. The request is logged in `docs/ux/handoff-antigravity.md`. The promo video in `video/` also uses the old mark, and a render is needed to change it.

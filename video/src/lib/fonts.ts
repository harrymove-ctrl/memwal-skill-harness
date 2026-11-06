import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

// Load the faces every scene names in its font stack, so renders never fall
// back to whatever happens to be installed on the rendering machine.
export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
export const mono = loadMono("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

let ctx: CanvasRenderingContext2D | null = null;

/** Width of a run of text in px, measured with the real loaded face. */
export function textWidth(
  text: string,
  fontSize: number,
  fontWeight = 600,
  family = "Inter",
  letterSpacingEm = 0,
): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.56;
  if (!ctx) ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return text.length * fontSize * 0.56;
  ctx.font = `${fontWeight} ${fontSize}px "${family}"`;
  return ctx.measureText(text).width + letterSpacingEm * fontSize * text.length;
}

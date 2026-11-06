import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const inter = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const interTight = loadInterTight("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
});

export const mono = loadMono("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

let measureCtx: CanvasRenderingContext2D | null = null;

/** Deterministic width measurement in px using the loaded Google Font face. */
export function textWidth(
  text: string,
  fontSize: number,
  fontWeight = 600,
  family = inter.fontFamily,
  letterSpacingEm = 0,
): number {
  if (typeof document === "undefined") return text.length * fontSize * 0.56;
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) return text.length * fontSize * 0.56;
  measureCtx.font = `${fontWeight} ${fontSize}px ${family}`;
  return (
    measureCtx.measureText(text).width +
    letterSpacingEm * fontSize * text.length
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MARK_PATHS, MARK_SMALL_PATHS } from "./logoPaths";

export const PRODUCT_NAME = "Skill Harness";

/** The same colors as the page sweep (WALRUS_BRAND_PALETTE), so both read as one light. */
const GLINT_COLORS = ["#10b981", "#00e5d6", "#1fc8ff"];
const GLINT_DELAY_MS = 350;

export type GlintState = "idle" | "playing" | "off";

export interface LogoMarkProps {
  /** Rendered size in pixels. At 24 and under it switches to the small cut. */
  size?: number;
  /** Names the mark for screen readers. Leave out when text beside it says the name. */
  title?: string;
  className?: string;
  /** Plays a Glimm light band through the mark on mount and on hover. */
  glint?: boolean;
  /** With glint: a new value plays it again, such as the current place. */
  glintKey?: unknown;
}

type GlimmHandle = { cancel: () => void; done: Promise<void> };
type GlimmController = { destroy: () => void };

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Runs Glimm's shader on a canvas masked to the mark. The plain mark stays drawn
 * underneath, so reduced motion, a missing WebGL or a failed load all simply show
 * the logo. Glimm loads on the first play, and only a visible logo creates a context.
 */
function useGlint(enabled: boolean, playKey: unknown) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<GlimmController | null>(null);
  const handleRef = useRef<GlimmHandle | null>(null);
  const playingRef = useRef(false);
  const aliveRef = useRef(true);
  const [state, setState] = useState<GlintState>("idle");

  const play = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas || playingRef.current || document.hidden) return;
    if (canvas.getClientRects().length === 0 || prefersReducedMotion()) return;

    playingRef.current = true;
    try {
      const glimm = await import("glimm");
      if (!aliveRef.current) return;
      const palette = glimm.accentChain(GLINT_COLORS);
      if (!controllerRef.current) {
        controllerRef.current = glimm.createShader({ canvas, palette, direction: "ltr", feather: 0, swellAmount: 0.8 });
      }
      const controller = controllerRef.current;
      if (!controller) {
        setState("off");
        return;
      }
      setState("playing");
      const handle = glimm.playSweep(controller as Parameters<typeof glimm.playSweep>[0], {
        palette,
        direction: "ltr",
        sweepMs: 1200,
        outroMs: 200,
        easing: "linear",
        bandTight: 7,
        rippleAmount: 0.4,
        brightness: 1.15,
      });
      handleRef.current = handle;
      await handle.done;
      if (aliveRef.current) setState("idle");
    } catch {
      if (aliveRef.current) setState("off");
    } finally {
      playingRef.current = false;
      handleRef.current = null;
    }
  }, [enabled]);

  // A timer, so React's double mount in development never creates a context twice.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => void play(), GLINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [enabled, play, playKey]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      handleRef.current?.cancel();
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  return { canvasRef, play, state };
}

function maskFor(paths: readonly string[]): string {
  const shapes = paths.map((d) => `<path d="${d}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${shapes}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") center / 100% 100% no-repeat`;
}

/** The mark alone. It takes its color from `color`, so it follows the theme. */
export function LogoMark({ size = 24, title, className, glint = false, glintKey }: LogoMarkProps) {
  const small = size <= 24;
  const paths = small ? MARK_SMALL_PATHS : MARK_PATHS;
  const { canvasRef, play, state } = useGlint(glint, glintKey);
  const mask = useMemo(() => maskFor(paths), [paths]);

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={glint ? undefined : className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-testid="logo-mark"
      data-cut={small ? "small" : "full"}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );

  if (!glint) return mark;

  return (
    <span
      className={className ? `cc-logo ${className}` : "cc-logo"}
      style={{ width: size, height: size }}
      data-testid="logo-glint"
      data-glint={state}
      onMouseEnter={() => void play()}
    >
      {mark}
      <canvas ref={canvasRef} className="cc-logo__glint" style={{ mask, WebkitMask: mask }} aria-hidden="true" />
    </span>
  );
}

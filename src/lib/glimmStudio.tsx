import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  accentChain,
  createShader,
  PALETTES,
  playSweep,
  resolvePalette,
  shuffleAccentPalette,
  type Direction,
  type EasingName,
  type Palette,
  type PaletteName,
  type ShaderController,
  type SweepHandle,
  type SweepOptions,
} from "glimm";
import {
  GlimmProvider,
  supportsHtmlInCanvas,
  usePageEffect,
} from "glimm/react";

export type GlimmPresetId = "walrus" | PaletteName | "shuffled";

export interface GlimmOrbMeta {
  id: "walrus" | PaletteName;
  label: string;
  hues: string;
  orbBackground: string;
}

export const WALRUS_BRAND_PALETTE: Palette = accentChain([
  "#10B981",
  "#00E5D6",
  "#1FC8FF",
]);

export const GLIMM_ORB_PRESETS: readonly GlimmOrbMeta[] = [
  {
    id: "walrus",
    label: "walrus",
    hues: "emerald -> teal -> cyan (OKLCH brand)",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.58), transparent 42%), conic-gradient(from 200deg, #059669, #10B981, #00FFA8, #00E5D6, #1FC8FF, #059669)",
  },
  {
    id: "spectrum",
    label: "spectrum",
    hues: "full OKLCH hue cycle (0.4 default)",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 210deg, #ff6b9d, #ffa647, #ffe853, #66e594, #4fd1ff, #9b7bff, #ff6b9d)",
  },
  {
    id: "prism",
    label: "prism",
    hues: "cyan -> violet -> magenta",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #1FC8FF, #2E70FF, #7B4FFF, #D33CFF, #FF3DC0, #00E5D6, #1FC8FF)",
  },
  {
    id: "berry",
    label: "berry",
    hues: "red-pink -> magenta",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #FF3D7F, #FF3DC0, #D33CFF, #FF7A1A, #FF3D7F)",
  },
  {
    id: "lagoon",
    label: "lagoon",
    hues: "blue -> cyan -> green",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #2E70FF, #1FC8FF, #00E5D6, #00FFA8, #C2FF3D, #00E5D6, #2E70FF)",
  },
  {
    id: "citrus",
    label: "citrus",
    hues: "green -> yellow -> orange",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #00FFA8, #C2FF3D, #FFD600, #FF7A1A, #FFD600, #00FFA8)",
  },
  {
    id: "azure",
    label: "azure",
    hues: "cyan -> blue -> violet",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #00E5D6, #1FC8FF, #2E70FF, #7B4FFF, #2E70FF, #00E5D6)",
  },
  {
    id: "ember",
    label: "ember",
    hues: "yellow -> orange -> red-pink",
    orbBackground:
      "radial-gradient(circle at 30% 28%, rgba(255,255,255,0.55), transparent 42%), conic-gradient(from 200deg, #FFD600, #FF7A1A, #FF3D7F, #FF3DC0, #FF7A1A, #FFD600)",
  },
] as const;

export const GLIMM_EASING_OPTIONS: readonly {
  id: EasingName;
  label: string;
  desc: string;
}[] = [
  { id: "snap", label: "snap", desc: "Immediate launch · long settle" },
  { id: "ease", label: "ease", desc: "Balanced default curve" },
  { id: "easeOutQuart", label: "easeOutQuart", desc: "Fast start · smooth decel" },
  { id: "easeInOutCubic", label: "easeInOutCubic", desc: "Symmetric S-curve" },
  { id: "easeOutExpo", label: "easeOutExpo", desc: "Snappy exponential stop" },
  { id: "back", label: "back", desc: "Overshoot & rebound" },
  { id: "linear", label: "linear", desc: "Constant velocity" },
] as const;

export const GLIMM_DIRECTION_OPTIONS: readonly {
  id: Direction;
  label: string;
  arrow: string;
}[] = [
  { id: "ltr", label: "ltr", arrow: "→" },
  { id: "rtl", label: "rtl", arrow: "←" },
  { id: "ttb", label: "ttb", arrow: "↓" },
  { id: "btt", label: "btt", arrow: "↑" },
] as const;

export function cosinePaletteToCssGradient(palette: Palette): string {
  const sampleAt = (t: number) => {
    const rgb = [0, 1, 2].map((i) => {
      const v =
        palette.a[i] +
        palette.b[i] *
          Math.cos(2 * Math.PI * (palette.c[i] * t + palette.d[i]));
      return Math.round(Math.max(0, Math.min(1, v)) * 255);
    });
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  };
  const stops = [0, 0.2, 0.4, 0.6, 0.8, 1].map(
    (t) => `${sampleAt(t)} ${Math.round(t * 100)}%`
  );
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

interface GlimmStudioContextValue {
  preset: GlimmPresetId;
  activePalette: Palette;
  bandTight: number;
  easing: EasingName;
  direction: Direction;
  sweepMs: number;
  waveAmount: number;
  rippleAmount: number;
  swellAmount: number;
  brightness: number;
  pageEffect: boolean;
  htmlInCanvasSupported: boolean;
  lastSweepLabel: string;
  sweepCount: number;
  setPreset: (preset: "walrus" | PaletteName) => void;
  shufflePalette: () => Palette;
  setBandTight: (v: number) => void;
  setEasing: (e: EasingName) => void;
  setDirection: (d: Direction) => void;
  setSweepMs: (ms: number) => void;
  setWaveAmount: (v: number) => void;
  setRippleAmount: (v: number) => void;
  setPageEffect: (on: boolean) => void;
  triggerPageSweep: (
    action?: () => void | Promise<void>,
    overrides?: SweepOptions & { label?: string }
  ) => void;
}

const GlimmStudioContext = createContext<GlimmStudioContextValue | null>(null);

export function GlimmNavBridge({
  sweepRef,
}: {
  sweepRef: React.MutableRefObject<
    | ((
        action: () => void,
        opts?: { direction?: Direction; label?: string }
      ) => void)
    | null
  >;
}) {
  const { triggerPageSweep } = useGlimmStudio();
  useEffect(() => {
    sweepRef.current = (action, opts) => {
      triggerPageSweep(action, opts);
    };
    return () => {
      sweepRef.current = null;
    };
  }, [sweepRef, triggerPageSweep]);
  return null;
}

export function GlimmWorkspaceProvider({
  isDark,
  children,
}: {
  isDark: boolean;
  children: React.ReactNode;
}) {
  const [preset, setPresetState] = useState<GlimmPresetId>("walrus");
  const [customPalette, setCustomPalette] = useState<Palette>(
    WALRUS_BRAND_PALETTE
  );
  const [bandTight, setBandTight] = useState<number>(14);
  const [easing, setEasing] = useState<EasingName>("snap");
  const [direction, setDirection] = useState<Direction>("ltr");
  const [sweepMs, setSweepMs] = useState<number>(720);
  const [waveAmount, setWaveAmount] = useState<number>(0);
  const [rippleAmount, setRippleAmount] = useState<number>(1);
  const [swellAmount] = useState<number>(0.65);
  const [lastSweepLabel, setLastSweepLabel] = useState<string>(
    "walrus · ready (glimm@0.4.0)"
  );
  const [sweepCount, setSweepCount] = useState<number>(0);
  const [pageEffect, setPageEffect] = usePageEffect();

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shaderCtrlRef = useRef<ShaderController | null>(null);
  const activeSweepRef = useRef<SweepHandle | null>(null);

  const htmlInCanvasSupported = useMemo(() => {
    try {
      return supportsHtmlInCanvas();
    } catch {
      return false;
    }
  }, []);

  const activePalette = useMemo<Palette>(() => {
    if (preset === "walrus") return WALRUS_BRAND_PALETTE;
    if (preset === "shuffled") return customPalette;
    return PALETTES[preset] ?? resolvePalette("spectrum");
  }, [customPalette, preset]);

  const brightness = isDark ? 0.85 : 1;

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    try {
      const ctrl = createShader({
        canvas,
        palette: WALRUS_BRAND_PALETTE,
        bandTight: 14,
        direction: "ltr",
        brightness: isDark ? 0.85 : 1,
        swellAmount: 0.65,
      });
      shaderCtrlRef.current = ctrl;
      return () => {
        activeSweepRef.current?.cancel();
        ctrl?.destroy();
        shaderCtrlRef.current = null;
      };
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runShaderSweep = useCallback(
    (opts: SweepOptions) => {
      const ctrl = shaderCtrlRef.current;
      if (!ctrl) return;
      try {
        activeSweepRef.current?.cancel();
        activeSweepRef.current = playSweep(ctrl, {
          palette: activePalette,
          bandTight,
          easing,
          direction,
          sweepMs,
          outroMs: 180,
          waveAmount,
          rippleAmount,
          swellAmount,
          brightness,
          ...opts,
        });
      } catch {
        // ignore in non-webgl env
      }
    },
    [
      activePalette,
      bandTight,
      brightness,
      direction,
      easing,
      rippleAmount,
      sweepMs,
      swellAmount,
      waveAmount,
    ]
  );

  const triggerPageSweep = useCallback(
    (
      action?: () => void | Promise<void>,
      overrides?: SweepOptions & { label?: string }
    ) => {
      const { label, ...sweepOpts } = overrides || {};
      setLastSweepLabel(label || `${preset} · ${sweepOpts.direction || direction}`);
      setSweepCount((c) => c + 1);
      if (action) {
        void action();
      }
      runShaderSweep(sweepOpts);
    },
    [direction, preset, runShaderSweep]
  );

  const setPreset = useCallback(
    (next: "walrus" | PaletteName) => {
      const nextPal =
        next === "walrus" ? WALRUS_BRAND_PALETTE : PALETTES[next];
      setPresetState(next);
      setLastSweepLabel(`palette:${next}`);
      setSweepCount((c) => c + 1);
      runShaderSweep({ palette: nextPal, sweepMs: 680 });
    },
    [runShaderSweep]
  );

  const shufflePalette = useCallback(() => {
    const generated = shuffleAccentPalette();
    setCustomPalette(generated);
    setPresetState("shuffled");
    setLastSweepLabel("palette:shuffled");
    setSweepCount((c) => c + 1);
    runShaderSweep({ palette: generated, sweepMs: 680 });
    return generated;
  }, [runShaderSweep]);

  const value = useMemo<GlimmStudioContextValue>(
    () => ({
      preset,
      activePalette,
      bandTight,
      easing,
      direction,
      sweepMs,
      waveAmount,
      rippleAmount,
      swellAmount,
      brightness,
      pageEffect,
      htmlInCanvasSupported,
      lastSweepLabel,
      sweepCount,
      setPreset,
      shufflePalette,
      setBandTight,
      setEasing,
      setDirection,
      setSweepMs,
      setWaveAmount,
      setRippleAmount,
      setPageEffect,
      triggerPageSweep,
    }),
    [
      activePalette,
      bandTight,
      brightness,
      direction,
      easing,
      htmlInCanvasSupported,
      lastSweepLabel,
      pageEffect,
      preset,
      rippleAmount,
      setPageEffect,
      setPreset,
      shufflePalette,
      sweepCount,
      sweepMs,
      swellAmount,
      triggerPageSweep,
      waveAmount,
    ]
  );

  return (
    <GlimmProvider
      palette={activePalette}
      bandTight={bandTight}
      easing={easing}
      direction={direction}
      sweepMs={sweepMs}
      outroMs={180}
      waveAmount={waveAmount}
      rippleAmount={rippleAmount}
      swellAmount={swellAmount}
      brightness={brightness}
      zIndex={9998}
    >
      <GlimmStudioContext.Provider value={value}>
        {children}
        <canvas
          ref={overlayCanvasRef}
          data-testid="glimm-webgl-canvas"
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 9999,
            display: "block",
          }}
        />
      </GlimmStudioContext.Provider>
    </GlimmProvider>
  );
}

export function useGlimmStudio(): GlimmStudioContextValue {
  const ctx = useContext(GlimmStudioContext);
  if (!ctx) {
    throw new Error("useGlimmStudio must be used inside GlimmWorkspaceProvider");
  }
  return ctx;
}

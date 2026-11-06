import React, { useRef, useState } from "react";
import { Sparkles, Shuffle, Play, SlidersHorizontal, X } from "lucide-react";
import { GlimmScope, type GlimmScopeHandle } from "glimm/react";
import {
  cosinePaletteToCssGradient,
  GLIMM_DIRECTION_OPTIONS,
  GLIMM_EASING_OPTIONS,
  GLIMM_ORB_PRESETS,
  useGlimmStudio,
} from "../lib/glimmStudio";

interface GlimmStudioBarProps {
  onTriggerCardScope?: (at?: [number, number]) => void;
  onSelectGlimmSkill?: () => void;
  activeSkillId?: string;
}

const SCOPE_DEMO_SCENES = [
  {
    badge: "Scene 1 · Fact Gate",
    title: "Recalled 2 live Walrus Facts in 34ms",
    detail: "GlimmScope gathers toward the press point and reveals behind the WebGL band.",
  },
  {
    badge: "Scene 2 · Cosine Shader",
    title: "OKLCH accentChain(['#10B981', '#00E5D6', '#1FC8FF'])",
    detail: "Perceptually uniform hue interpolation with brightness=0.85 on dark theme.",
  },
  {
    badge: "Scene 3 · SEAL Revision",
    title: "Baked glimm.SKILL.md into Bucket 217e53fc…",
    detail: "Zero runtime dependencies · 60fps WebGL2 fragment shader transition.",
  },
] as const;

export const GlimmStudioBar: React.FC<GlimmStudioBarProps> = ({
  onTriggerCardScope,
}) => {
  const {
    preset,
    activePalette,
    bandTight,
    easing,
    direction,
    sweepMs,
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
    setPageEffect,
    triggerPageSweep,
  } = useGlimmStudio();

  const [expanded, setExpanded] = useState(false);
  const [demoSceneIndex, setDemoSceneIndex] = useState(0);
  const demoScopeRef = useRef<GlimmScopeHandle>(null);
  const demoBoxRef = useRef<HTMLDivElement>(null);

  const activeScene =
    SCOPE_DEMO_SCENES[demoSceneIndex % SCOPE_DEMO_SCENES.length];

  const handlePlayDemoScope = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btnRect = e.currentTarget.getBoundingClientRect();
    const boxRect = demoBoxRef.current?.getBoundingClientRect();
    const at: [number, number] | undefined = boxRect
      ? [
          btnRect.left - boxRect.left + btnRect.width / 2,
          btnRect.top - boxRect.top + btnRect.height / 2,
        ]
      : undefined;

    demoScopeRef.current?.play({
      at,
      change: () => {
        setDemoSceneIndex((i) => i + 1);
      },
    });
    if (onTriggerCardScope) {
      onTriggerCardScope(at);
    }
  };

  const formatVec3 = (v: [number, number, number]) =>
    `[${v.map((n) => n.toFixed(2)).join(", ")}]`;

  return (
    <div
      aria-label="Glimm WebGL Shader & Sweep Controls"
      data-testid="glimm-studio-bar"
      className="relative inline-flex flex-wrap items-center gap-1.5"
    >
      {/* Compact 3D Conic-Gradient Orbs Pill (https://glimm.dev/#glimm) */}
      <div
        role="radiogroup"
        aria-label="Glimm cosine shader palettes"
        className="inline-flex h-8 items-center gap-1 rounded-xl border border-neutral-200/90 bg-neutral-100/90 px-1.5 dark:border-white/10 dark:bg-black/45"
      >
        {GLIMM_ORB_PRESETS.map((orb, idx) => {
          const isSelected = preset === orb.id;
          // Show 5 core orbs on compact bar (<2xl) and all 8 on 2xl, while keeping all DOM nodes testable
          const hideOnCompact =
            !isSelected && idx > 4 ? "hidden 2xl:flex" : "flex";
          return (
            <button
              key={orb.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-testid={`glimm-orb-${orb.id}`}
              onClick={() => setPreset(orb.id)}
              title={`${orb.label} (${orb.hues})`}
              className={`relative ${hideOnCompact} size-4 cursor-pointer items-center justify-center rounded-full transition-transform duration-150 ${
                isSelected
                  ? "scale-115 ring-1.5 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-emerald-400 dark:ring-offset-[#111514]"
                  : "opacity-75 hover:scale-110 hover:opacity-100"
              }`}
            >
              <span
                className="block size-3.5 rounded-full"
                style={{
                  background: orb.orbBackground,
                  boxShadow:
                    "inset 0 1px 1.5px rgba(255,255,255,0.45), inset 0 -1.5px 3px rgba(0,0,0,0.35)",
                }}
              />
            </button>
          );
        })}
      </div>

      <button
        type="button"
        data-testid="glimm-shuffle-btn"
        onClick={() => shufflePalette()}
        className="inline-flex h-8 cursor-pointer items-center justify-center rounded-xl border border-neutral-200/90 bg-white px-2 font-mono text-[11px] font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/10"
        title="Shuffle OKLCH cosine palette (shuffleAccentPalette)"
      >
        <Shuffle className="size-3 text-emerald-500" />
      </button>

      <button
        type="button"
        data-testid="glimm-page-sweep-btn"
        onClick={() =>
          triggerPageSweep(undefined, {
            label: `manual:${preset}:${direction}`,
          })
        }
        className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/12 px-2 font-mono text-[11px] font-bold text-emerald-800 transition hover:bg-emerald-500/20 dark:text-emerald-300"
        title="Trigger full-viewport WebGL cosine sweep"
      >
        <Play className="size-3 fill-current" />
        <span>Sweep</span>
      </button>

      <button
        type="button"
        data-testid="glimm-expand-studio-btn"
        onClick={() => setExpanded((v) => !v)}
        className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border px-2 font-mono text-[11px] font-medium transition ${
          expanded
            ? "border-emerald-500 bg-emerald-500 text-neutral-950 font-bold"
            : "border-neutral-200/90 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300 dark:hover:bg-white/10"
        }`}
        title="Open Glimm 0.4 WebGL Shader Studio popover"
      >
        <SlidersHorizontal className="size-3" />
        <span className="hidden sm:inline">{expanded ? "Close" : "Tune"}</span>
      </button>

      {/* Centered Viewport Floating Popover: Zero horizontal clipping & zero vertical layout shift! */}
      {expanded && (
        <div
          data-testid="glimm-studio-expanded"
          className="fixed top-28 left-1/2 z-50 w-[min(860px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-emerald-500/35 bg-white/98 p-4 shadow-2xl backdrop-blur-xl dark:border-emerald-500/30 dark:bg-[#0e1413]/98"
        >
          <div className="mb-3 flex items-center justify-between border-b border-neutral-200/80 pb-2 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-emerald-500" />
              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                glimm 0.4 WebGL Shader Studio
              </span>
              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                palette: {preset} · brightness={brightness}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="space-y-2.5 lg:col-span-7">
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                    color(t) = a + b · cos(2π(c·t + d))
                  </span>
                  <span className="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-300">
                    sweeps={sweepCount} ({lastSweepLabel})
                  </span>
                </div>
                <div
                  className="mt-1.5 h-3 w-full rounded-full shadow-inner"
                  style={{
                    background: cosinePaletteToCssGradient(activePalette),
                  }}
                />
                <div className="mt-1.5 grid grid-cols-2 gap-1 font-mono text-[10px] text-neutral-500 sm:grid-cols-4 dark:text-neutral-400">
                  <span>a: {formatVec3(activePalette.a)}</span>
                  <span>b: {formatVec3(activePalette.b)}</span>
                  <span>c: {formatVec3(activePalette.c)}</span>
                  <span>d: {formatVec3(activePalette.d)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                      bandTight
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {bandTight}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={1}
                    aria-label="Band tightness"
                    value={bandTight}
                    onChange={(e) => setBandTight(Number(e.target.value))}
                    className="mt-1.5 w-full accent-emerald-500"
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    {[
                      { label: "Soft 8", val: 8 },
                      { label: "Def 20", val: 20 },
                      { label: "Razor 42", val: 42 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => {
                          setBandTight(item.val);
                          triggerPageSweep(undefined, {
                            bandTight: item.val,
                            label: `bandTight:${item.val}`,
                          });
                        }}
                        className={`cursor-pointer rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ${
                          bandTight === item.val
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-200/70 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                      easing
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {easing}
                    </span>
                  </div>
                  <select
                    aria-label="Glimm easing curve"
                    value={easing}
                    onChange={(e) => {
                      const next = e.target
                        .value as typeof GLIMM_EASING_OPTIONS[number]["id"];
                      setEasing(next);
                      triggerPageSweep(undefined, { label: `easing:${next}` });
                    }}
                    className="mt-1.5 h-7 w-full rounded-lg border border-neutral-200 bg-white px-2 font-mono text-[10.5px] text-neutral-800 outline-none dark:border-white/15 dark:bg-neutral-900 dark:text-neutral-100"
                  >
                    {GLIMM_EASING_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} ({opt.desc})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-neutral-500">
                    <span>sweepMs: {sweepMs}ms</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSweepMs(sweepMs === 720 ? 1100 : 720)
                      }
                      className="cursor-pointer rounded bg-neutral-200/70 px-1.5 py-0.5 text-[9.5px] font-semibold text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
                    >
                      {sweepMs === 720 ? "Snappy 720ms" : "Full 1100ms"}
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/90 p-2.5 dark:border-white/10 dark:bg-black/35">
                  <div className="flex items-center justify-between font-mono text-[10.5px]">
                    <span className="font-bold text-neutral-700 dark:text-neutral-200">
                      direction
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {direction}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {GLIMM_DIRECTION_OPTIONS.map((dir) => (
                      <button
                        key={dir.id}
                        type="button"
                        onClick={() => {
                          setDirection(dir.id);
                          triggerPageSweep(undefined, {
                            direction: dir.id,
                            label: `dir:${dir.id}`,
                          });
                        }}
                        className={`cursor-pointer rounded py-1 font-mono text-[10px] font-bold ${
                          direction === dir.id
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral-200/70 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
                        }`}
                      >
                        {dir.arrow} {dir.id}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between font-mono text-[10px] text-neutral-500">
                    <span>
                      {htmlInCanvasSupported
                        ? "HTML-in-Canvas"
                        : "Feathered Fallback"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPageEffect(!pageEffect)}
                      className={`cursor-pointer rounded px-1.5 py-0.5 text-[9.5px] font-semibold ${
                        pageEffect
                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : "bg-neutral-200 text-neutral-600 dark:bg-white/10 dark:text-neutral-400"
                      }`}
                    >
                      pageEffect: {pageEffect ? "ON" : "OFF"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5" ref={demoBoxRef}>
              <GlimmScope
                ref={demoScopeRef}
                palette={activePalette}
                bandTight={Math.max(16, bandTight)}
                direction={direction}
                curve={0.12}
                sweepMs={950}
                brightness={brightness}
                pageEffect={pageEffect}
                style={{
                  position: "relative",
                  height: "136px",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <div className="flex h-full flex-col justify-between rounded-xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-cyan-500/[0.08] p-3 dark:bg-[#0c1412]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 uppercase dark:text-emerald-300">
                      {activeScene.badge}
                    </span>
                    <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
                      &lt;GlimmScope curve=&#123;0.12&#125; /&gt;
                    </span>
                  </div>

                  <div>
                    <div className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {activeScene.title}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-neutral-600 dark:text-neutral-300">
                      {activeScene.detail}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                      Feathered container sweep
                    </span>
                    <button
                      type="button"
                      data-testid="glimm-scope-box-play-btn"
                      onClick={handlePlayDemoScope}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-mono text-[10.5px] font-bold text-white shadow-2xs hover:bg-emerald-500"
                    >
                      <Sparkles className="size-3" />
                      <span>Gather &amp; Sweep Card</span>
                    </button>
                  </div>
                </div>
              </GlimmScope>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default GlimmStudioBar;

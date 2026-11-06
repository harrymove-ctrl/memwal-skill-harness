import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  X,
  ZoomIn,
  ZoomOut,
  Eye,
  Focus,
  Play,
  Check,
  MousePointerClick,
} from "lucide-react";
import type { RoutePath } from "../App";

export interface SpotlightTargetSpec {
  id: string;
  route: RoutePath;
  stepNumber: number;
  badge: string;
  title: string;
  /** Quiet 1-line decision note shown as a tilted hand-drawn callout on the live project */
  quietDecisionNote: string;
  /** Visual gesture pill shown alongside the step */
  gestureHint: string;
  /** CSS selector to focus & zoom on the live page */
  selector: string;
  /** Preferred placement of the quiet curved-arrow callout relative to the live element */
  calloutAnchor: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** Tilt angle in degrees for the quiet hand-drawn note */
  noteTilt: number;
  /** Live action to demonstrate the project feature when user clicks "Try It Live" */
  liveActionType:
    | "open-cmd-palette"
    | "open-subnote"
    | "switch-orbit"
    | "select-node"
    | "zoom-canvas"
    | "navigate-route";
}

export const SPOTLIGHT_TARGETS: readonly SpotlightTargetSpec[] = [
  {
    id: "canvas-views",
    route: "/graph",
    stepNumber: 1,
    badge: "01 · Views",
    title: "Four Ways to See Your Notes",
    quietDecisionNote:
      "Switch layouts in place without losing your selected skill.",
    gestureHint: "Click a view tab",
    selector: '[aria-label="1. Dither Force Clusters"]',
    calloutAnchor: "bottom-left",
    noteTilt: -3,
    liveActionType: "switch-orbit",
  },
  {
    id: "canvas-node",
    route: "/graph",
    stepNumber: 2,
    badge: "02 · Skill Card",
    title: "Click to Expand & Read, Drag to Move",
    quietDecisionNote:
      "One click zooms and expands the skill card right on the canvas.",
    gestureHint: "Click or drag card",
    selector: '[data-node-id="memwal-qa"]',
    calloutAnchor: "top-right",
    noteTilt: -4,
    liveActionType: "select-node",
  },
  {
    id: "quick-read-cmdk",
    route: "/graph",
    stepNumber: 3,
    badge: "03 · Quick Read",
    title: "Command Palette Reader (⌘K)",
    quietDecisionNote:
      "Detail appears in the center only when asked, keeping the canvas calm.",
    gestureHint: "Press ⌘K anytime",
    selector: '[data-testid="open-command-palette-btn"]',
    calloutAnchor: "bottom-right",
    noteTilt: 3,
    liveActionType: "open-cmd-palette",
  },
  {
    id: "pin-subnote",
    route: "/graph",
    stepNumber: 4,
    badge: "04 · Team Tips",
    title: "Pin Walrus Memory Tips to Any Skill",
    quietDecisionNote:
      "Short learned rules travel with their parent skill across every view.",
    gestureHint: "Click + Add Tip",
    selector: '[data-testid="canvas-add-subnote-btn"]',
    calloutAnchor: "bottom-right",
    noteTilt: -3,
    liveActionType: "open-subnote",
  },
  {
    id: "minimap-zoom",
    route: "/graph",
    stepNumber: 5,
    badge: "05 · Canvas Map",
    title: "Zoom & Pan Like Obsidian Canvas",
    quietDecisionNote:
      "Scroll to zoom around your cursor or jump anywhere via the minimap.",
    gestureHint: "Scroll or click + / −",
    selector: '[data-testid="obsidian-minimap"]',
    calloutAnchor: "top-left",
    noteTilt: -3,
    liveActionType: "zoom-canvas",
  },
] as const;

/**
 * Hand-drawn directional curved SVG arrow for quiet project annotations
 */
export const QuietCurvedArrow: React.FC<{
  scale?: number;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  variant?: "curve" | "swoop";
  className?: string;
}> = ({
  scale = 1,
  rotate = -3,
  flipX = false,
  flipY = false,
  variant = "curve",
  className = "",
}) => {
  const sx = (flipX ? -1 : 1) * scale;
  const sy = (flipY ? -1 : 1) * scale;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-emerald-500 dark:text-emerald-300 ${className}`}
      style={{
        width: 34,
        height: 34,
        transform: `rotate(${rotate}deg) scale(${sx}, ${sy})`,
      }}
    >
      {variant === "curve" ? (
        <>
          <path d="M34 4c1 15-5 26-21 30" />
          <path d="m21 36-8-2 7-7" />
        </>
      ) : (
        <>
          <path d="M35 6C28 22 19 29 9 32" />
          <path d="M16 35 8 32l5-8" />
        </>
      )}
    </svg>
  );
};

interface PageQuickGuideBannerProps {
  currentPath: RoutePath;
  activeNamespace: string;
  skillsCount: number;
  flowsCount: number;
  onNavigate: (path: RoutePath) => void;
  onOpenFullTour: () => void;
}

export const PageQuickGuideBanner: React.FC<PageQuickGuideBannerProps> = ({
  activeNamespace,
  skillsCount,
  flowsCount,
  onOpenFullTour,
}) => {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-2 text-xs shadow-2xs backdrop-blur-xs dark:border-white/10 dark:bg-stone-900/85">
      <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
        <span className="inline-flex size-2 rounded-full bg-emerald-500" />
        <span className="font-medium text-stone-900 dark:text-stone-100">
          {activeNamespace}
        </span>
        <span className="opacity-40">·</span>
        <span>
          {skillsCount} notes · {flowsCount} sub-notes
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenFullTour}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-500/35 bg-emerald-500/12 px-3 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-500/20 dark:text-emerald-300"
      >
        <Focus className="size-3" />
        <span>Interactive Canvas Guide</span>
      </button>
    </div>
  );
};

interface MeasuredBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface InteractiveTourModalProps {
  open: boolean;
  currentPath: RoutePath;
  activeNamespace: string;
  onClose: () => void;
  onNavigate: (path: RoutePath) => void;
}

export const InteractiveTourModal: React.FC<InteractiveTourModalProps> = ({
  open,
  currentPath,
  onClose,
  onNavigate,
}) => {
  const [guideTab, setGuideTab] = useState<"spotlight" | "all-notes">(
    "spotlight"
  );
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [frameZoom, setFrameZoom] = useState<number>(1.08);
  const [liveTryUnblurred, setLiveTryUnblurred] = useState<boolean>(false);
  const [liveFeedbackText, setLiveFeedbackText] = useState<string | null>(null);
  const [demoNodeCycleIdx, setDemoNodeCycleIdx] = useState<number>(0);
  const [activeDemoNodeId, setActiveDemoNodeId] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<MeasuredBox | null>(null);
  const [allRects, setAllRects] = useState<Record<string, MeasuredBox>>({});

  const activeTarget = SPOTLIGHT_TARGETS[stepIdx] || SPOTLIGHT_TARGETS[0];
  const effectiveSelector =
    activeTarget.id === "canvas-node" && activeDemoNodeId
      ? `[data-node-id="${activeDemoNodeId}"]`
      : activeTarget.selector;

  const measureElementBySpec = useCallback(
    (spec: SpotlightTargetSpec): MeasuredBox | null => {
      const sel =
        spec.id === "canvas-node" && activeDemoNodeId
          ? `[data-node-id="${activeDemoNodeId}"]`
          : spec.selector;
      const rawEl =
        (document.querySelector(sel) as Element | null) ||
        (spec.id === "canvas-node"
          ? (document.querySelector("[data-node-id]") as Element | null)
          : null);
      if (!rawEl) return null;
      const el =
        spec.id === "canvas-views" && rawEl.parentElement
          ? rawEl.parentElement
          : rawEl;
      const r = el.getBoundingClientRect();
      return {
        top: r.top,
        left: r.left,
        width: Math.max(r.width, 84),
        height: Math.max(r.height, 36),
      };
    },
    [activeDemoNodeId]
  );

  // Measure active target & all 5 project targets on the live page
  const updateTargetMeasurement = useCallback(() => {
    if (!open) return;
    const focusedBox = measureElementBySpec(activeTarget);
    setTargetRect(focusedBox);

    const nextAll: Record<string, MeasuredBox> = {};
    for (const spec of SPOTLIGHT_TARGETS) {
      const box = measureElementBySpec(spec);
      if (box) {
        nextAll[spec.id] = box;
      }
    }
    setAllRects(nextAll);
  }, [open, activeTarget, measureElementBySpec]);

  useEffect(() => {
    if (!open) return;
    if (currentPath !== activeTarget.route) {
      onNavigate(activeTarget.route);
    }
    const timer = setTimeout(updateTargetMeasurement, 120);
    window.addEventListener("resize", updateTargetMeasurement);
    window.addEventListener("scroll", updateTargetMeasurement, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateTargetMeasurement);
      window.removeEventListener("scroll", updateTargetMeasurement, true);
    };
  }, [
    open,
    guideTab,
    activeTarget.route,
    currentPath,
    onNavigate,
    updateTargetMeasurement,
  ]);

  // Apply live CSS zoom transform to the focused element inside the spotlight cutout
  useEffect(() => {
    if (!open || guideTab !== "spotlight") return;
    const rawEl = document.querySelector(effectiveSelector) as Element | null;
    if (!rawEl) return;

    const zoomTarget = (
      rawEl instanceof SVGElement
        ? rawEl.querySelector(".graph-spring-pop") || rawEl
        : activeTarget.id === "canvas-views" && rawEl.parentElement
          ? rawEl.parentElement
          : rawEl
    ) as HTMLElement;

    const prevTransition = zoomTarget.style.transition;
    const prevTransform = zoomTarget.style.transform;
    const prevTransformOrigin = zoomTarget.style.transformOrigin;
    const prevTransformBox = zoomTarget.style.transformBox;
    const prevZIndex = zoomTarget.style.zIndex;
    const prevFilter = zoomTarget.style.filter;

    const baseRect = zoomTarget.getBoundingClientRect();
    const originX =
      baseRect.left < 180
        ? "left"
        : baseRect.right > window.innerWidth - 180
          ? "right"
          : "center";

    zoomTarget.style.transition =
      "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)";
    zoomTarget.style.transformBox = "fill-box";
    zoomTarget.style.transformOrigin = `${originX} center`;
    zoomTarget.style.transform = `scale(${frameZoom})`;
    zoomTarget.style.zIndex = "45";
    zoomTarget.style.filter =
      "drop-shadow(0 12px 28px rgba(107, 230, 189, 0.32))";

    const rectTimer = setTimeout(updateTargetMeasurement, 270);

    return () => {
      clearTimeout(rectTimer);
      zoomTarget.style.transition = prevTransition;
      zoomTarget.style.transform = prevTransform;
      zoomTarget.style.transformOrigin = prevTransformOrigin;
      zoomTarget.style.transformBox = prevTransformBox;
      zoomTarget.style.zIndex = prevZIndex;
      zoomTarget.style.filter = prevFilter;
    };
  }, [
    open,
    guideTab,
    effectiveSelector,
    activeTarget.id,
    frameZoom,
    updateTargetMeasurement,
  ]);

  // Trigger a live interactive action on the real project for a given target spec
  const executeSpecLiveAction = (spec: SpotlightTargetSpec) => {
    const type = spec.liveActionType;
    setLiveTryUnblurred(true);

    if (type === "open-cmd-palette") {
      onClose();
      window.dispatchEvent(new CustomEvent("open-note-command-palette"));
    } else if (type === "open-subnote") {
      const btn = document.querySelector(
        '[data-testid="canvas-add-subnote-btn"]'
      ) as HTMLButtonElement | null;
      onClose();
      btn?.click();
      setTimeout(() => {
        const input = document.querySelector(
          '[data-testid="canvas-subnote-input"]'
        ) as HTMLInputElement | null;
        input?.focus();
      }, 80);
    } else if (type === "switch-orbit") {
      const viewSpecs = [
        {
          selector: '[aria-label="1. Dither Force Clusters"]',
          label: "Notes Map",
        },
        {
          selector: '[aria-label="4. Dither Chord & Orbit"]',
          label: "Orbit View",
        },
        {
          selector: '[aria-label="2. Dither Sankey & DAG"]',
          label: "Flow View",
        },
        {
          selector: '[aria-label="3. DitherCN Charts & Matrix"]',
          label: "Insights",
        },
      ] as const;

      const activeIdx = viewSpecs.findIndex((v) => {
        const el = document.querySelector(v.selector);
        return el ? el.className.includes("rb-btn-primary") : false;
      });
      const nextIdx = (activeIdx + 1) % viewSpecs.length;
      const nextSpec = viewSpecs[nextIdx];
      const nextBtn = document.querySelector(
        nextSpec.selector
      ) as HTMLButtonElement | null;
      nextBtn?.click();
      setLiveFeedbackText(
        `Switched to ${nextSpec.label} (click Try It Live again to cycle views)`
      );
      setTimeout(updateTargetMeasurement, 180);
    } else if (type === "select-node") {
      const insightsBtn = document.querySelector(
        '[aria-label="3. DitherCN Charts & Matrix"]'
      );
      if (insightsBtn && insightsBtn.className.includes("rb-btn-primary")) {
        const notesMapBtn = document.querySelector(
          '[aria-label="1. Dither Force Clusters"]'
        ) as HTMLButtonElement | null;
        notesMapBtn?.click();
      }
      const demoNodes = [
        "rust-testing",
        "memwal-qa",
        "typesafe-ai",
        "linear-org-routing",
      ];
      const targetNodeId = demoNodes[demoNodeCycleIdx % demoNodes.length];
      setDemoNodeCycleIdx((n) => n + 1);
      setActiveDemoNodeId(targetNodeId);
      setTimeout(() => {
        const nodeEl =
          document.querySelector(`[data-node-id="${targetNodeId}"]`) ||
          document.querySelector("[data-node-id]");
        if (nodeEl) {
          nodeEl.dispatchEvent(
            new MouseEvent("click", { bubbles: true, cancelable: true })
          );
          setLiveFeedbackText(
            `Expanded "${targetNodeId}" on canvas (click again for next skill)`
          );
        }
        updateTargetMeasurement();
      }, 90);
    } else if (type === "zoom-canvas") {
      const readoutEl = document.querySelector(
        '[data-testid="canvas-zoom-readout"]'
      );
      const currentZoomNum = readoutEl
        ? parseInt(readoutEl.textContent || "100", 10)
        : 100;
      if (currentZoomNum >= 160) {
        const resetBtn = document.querySelector(
          '[data-testid="reset-canvas-layout"]'
        ) as HTMLButtonElement | null;
        resetBtn?.click();
        setLiveFeedbackText("Reset canvas zoom to 100%");
      } else {
        const zoomInBtn = (document.querySelector(
          '[data-testid="canvas-zoom-in"]'
        ) ||
          document.querySelector(
            '[aria-label="Zoom in"]'
          )) as HTMLButtonElement | null;
        zoomInBtn?.click();
        setLiveFeedbackText(
          `Zoomed canvas to ${currentZoomNum + 15}% (scroll or drag anytime)`
        );
      }
      setTimeout(updateTargetMeasurement, 180);
    }
  };

  const triggerLiveStepDemo = () => {
    executeSpecLiveAction(activeTarget);
  };

  // Compute cutout box with comfortable breathing padding
  const cutout = useMemo(() => {
    const pad = Math.round(14 * frameZoom);
    if (!targetRect) {
      return {
        top: Math.round(window.innerHeight * 0.28),
        left: Math.round(window.innerWidth * 0.28),
        width: Math.round(window.innerWidth * 0.44),
        height: 160,
      };
    }
    return {
      top: Math.max(8, Math.round(targetRect.top - pad)),
      left: Math.max(8, Math.round(targetRect.left - pad)),
      width: Math.round(targetRect.width + pad * 2),
      height: Math.round(targetRect.height + pad * 2),
    };
  }, [targetRect, frameZoom]);

  if (!open) return null;

  // Position the quiet annotation callout right beside the cutout frame
  const placeBelow = cutout.top + cutout.height + 225 < window.innerHeight;
  const calloutTop = placeBelow
    ? cutout.top + cutout.height + 12
    : Math.max(58, cutout.top - 195);
  const calloutLeft = Math.min(
    Math.max(16, cutout.left),
    Math.max(16, window.innerWidth - 390)
  );

  return (
    <div
      data-testid="tour-guide-overlay"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* ====================================================================
          TOP FLOATING GUIDE BAR (STEP-BY-STEP FOCUS vs ALL LIVE ANNOTATIONS)
         ==================================================================== */}
      <div className="pointer-events-auto fixed top-3.5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-stone-200/80 bg-white/95 p-1.5 text-xs shadow-2xl backdrop-blur-md dark:border-white/15 dark:bg-stone-900/95">
        <button
          type="button"
          onClick={() => setGuideTab("spotlight")}
          data-testid="tour-tab-spotlight"
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold transition ${
            guideTab === "spotlight"
              ? "rb-btn-primary"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
          }`}
        >
          <Focus className="size-3.5" />
          <span>1. Step-by-Step Focus</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setGuideTab("all-notes");
            setTimeout(updateTargetMeasurement, 60);
          }}
          data-testid="tour-tab-annotation-playground"
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-bold transition ${
            guideTab === "all-notes"
              ? "rb-btn-primary"
              : "text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
          }`}
        >
          <Eye className="size-3.5" />
          <span>2. All Live Notes on Canvas</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tour guide"
          className="ml-1 inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      {guideTab === "spotlight" ? (
        /* ==================================================================
           MODE 1: STEP-BY-STEP FOCUS + QUIET HAND-DRAWN ANNOTATION ON PROJECT
           ================================================================== */
        <>
          {/* 4 Surrounding Blur Panels (non-blocking & unblurred when Live Try is active) */}
          {!liveTryUnblurred && (
            <>
              <div
                className="pointer-events-none fixed right-0 left-0 top-0 bg-black/28 backdrop-blur-[1.5px] transition-all duration-300"
                style={{ height: cutout.top }}
              />
              <div
                className="pointer-events-none fixed right-0 bottom-0 left-0 bg-black/28 backdrop-blur-[1.5px] transition-all duration-300"
                style={{ top: cutout.top + cutout.height }}
              />
              <div
                className="pointer-events-none fixed left-0 bg-black/28 backdrop-blur-[1.5px] transition-all duration-300"
                style={{
                  top: cutout.top,
                  height: cutout.height,
                  width: cutout.left,
                }}
              />
              <div
                className="pointer-events-none fixed right-0 bg-black/28 backdrop-blur-[1.5px] transition-all duration-300"
                style={{
                  top: cutout.top,
                  height: cutout.height,
                  left: cutout.left + cutout.width,
                }}
              />
            </>
          )}

          {/* Focused Spotlight Frame Ring + Live Zoom Controls */}
          <div
            data-testid="spotlight-focus-frame"
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.1 : -0.1;
              setFrameZoom((z) =>
                Number(Math.min(1.6, Math.max(1.0, z + delta)).toFixed(2))
              );
            }}
            className="pointer-events-none fixed z-40 rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.22),0_0_40px_rgba(16,185,129,0.35)] transition-all duration-300"
            style={{
              top: cutout.top,
              left: cutout.left,
              width: cutout.width,
              height: cutout.height,
            }}
          >
            {/* Corner Zoom Pill attached to the Spotlight Frame */}
            <div className="pointer-events-auto absolute -top-9 right-0 flex items-center gap-1 rounded-full border border-emerald-500/45 bg-stone-950/95 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 shadow-lg">
              <button
                type="button"
                onClick={() =>
                  setFrameZoom((z) => Number(Math.max(1.0, z - 0.15).toFixed(2)))
                }
                title="Zoom out focused frame"
                className="cursor-pointer rounded p-0.5 hover:bg-white/10"
              >
                <ZoomOut className="size-3" />
              </button>
              <span className="min-w-10 text-center font-mono text-[10.5px]">
                {Math.round(frameZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() =>
                  setFrameZoom((z) => Number(Math.min(1.6, z + 0.15).toFixed(2)))
                }
                title="Zoom in focused frame"
                className="cursor-pointer rounded p-0.5 hover:bg-white/10"
              >
                <ZoomIn className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setFrameZoom(1.0)}
                title="Reset zoom"
                className="ml-0.5 cursor-pointer rounded px-1 text-[10px] text-stone-400 hover:text-white"
              >
                1x
              </button>
            </div>
          </div>

          {/* Quiet Tilted Hand-Drawn Annotation + Compact Action Bar on the Real Project */}
          <div
            data-testid="spotlight-quiet-card"
            style={{ top: calloutTop, left: calloutLeft }}
            className="pointer-events-auto fixed z-50 w-[92vw] max-w-[375px] transition-all duration-300"
          >
            {/* Floating Tilted Quiet Note + Curved Arrow pointing directly at the project element */}
            <div className="mb-2 flex items-center gap-2.5 px-1 drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
              <QuietCurvedArrow
                scale={1.05}
                rotate={activeTarget.noteTilt}
                flipY={placeBelow}
              />
              <div
                style={{ transform: `rotate(${activeTarget.noteTilt}deg)` }}
                className="max-w-[290px]"
              >
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                    {activeTarget.badge}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                    <MousePointerClick className="size-2.5" />
                    <span>{activeTarget.gestureHint}</span>
                  </span>
                </div>
                <p className="mt-1 font-sans text-[14.5px] font-bold leading-snug tracking-tight text-emerald-200">
                  {activeTarget.quietDecisionNote}
                </p>
              </div>
            </div>

            {/* Compact Control Pill (Step Navigation + Live Feedback + Try It Live) */}
            <div className="rounded-2xl border border-stone-200/90 bg-white/95 px-3.5 py-2.5 text-stone-900 shadow-2xl backdrop-blur-md dark:border-white/15 dark:bg-stone-900/95 dark:text-stone-100">
              {liveFeedbackText && (
                <div
                  data-testid="tour-live-feedback-pill"
                  className="mb-2 flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200"
                >
                  <Check className="size-3.5 shrink-0 text-emerald-500" />
                  <span>{liveFeedbackText}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLiveFeedbackText(null);
                      setStepIdx(
                        (i) =>
                          (i - 1 + SPOTLIGHT_TARGETS.length) %
                          SPOTLIGHT_TARGETS.length
                      );
                    }}
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-stone-200/80 p-1.5 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/10"
                    title="Previous focus frame"
                  >
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {SPOTLIGHT_TARGETS.map((t, idx) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setLiveFeedbackText(null);
                          setStepIdx(idx);
                        }}
                        aria-label={`Focus step ${idx + 1}`}
                        className={`h-1.5 cursor-pointer rounded-full transition-all ${
                          idx === stepIdx
                            ? "w-5 bg-emerald-500"
                            : "w-1.5 bg-stone-300 dark:bg-stone-700"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLiveFeedbackText(null);
                      setStepIdx((i) => (i + 1) % SPOTLIGHT_TARGETS.length);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-stone-200/80 p-1.5 text-stone-600 hover:bg-stone-100 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/10"
                    title="Next focus frame"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                  <span className="ml-1 font-mono text-[10.5px] text-stone-400">
                    {stepIdx + 1}/{SPOTLIGHT_TARGETS.length}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid="tour-try-it-live-btn"
                  onClick={triggerLiveStepDemo}
                  className="rb-btn-primary inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-xs"
                >
                  <Play className="size-3 fill-current" />
                  <span>Try It Live</span>
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================================
           MODE 2: ALL LIVE QUIET ANNOTATIONS DIRECTLY ON THE PROJECT CANVAS
           (No modal dialog, no fake DialKit controls: real tilted notes +
            hand-drawn curved arrows pointing at the live project controls!)
           ================================================================== */
        <div
          data-testid="live-canvas-annotations-layer"
          className="pointer-events-none fixed inset-0 z-40"
        >
          {SPOTLIGHT_TARGETS.map((spec, idx) => {
            const box = allRects[spec.id];
            if (!box) return null;

            const isBottomAnchor = spec.calloutAnchor.startsWith("bottom");
            const isRightAnchor = spec.calloutAnchor.endsWith("right");

            const rawTop =
              spec.id === "pin-subnote"
                ? box.top + box.height + 88
                : isBottomAnchor
                  ? box.top + box.height + 10
                  : box.top - 96;
            const rawLeft =
              spec.id === "quick-read-cmdk"
                ? box.left - 110
                : isRightAnchor
                  ? box.left + box.width - 230
                  : box.left + 6;

            const clampedTop = Math.min(
              Math.max(58, rawTop),
              window.innerHeight - 110
            );
            const clampedLeft = Math.min(
              Math.max(14, rawLeft),
              window.innerWidth - 260
            );

            return (
              <React.Fragment key={spec.id}>
                {/* Subtle Mint Highlight Ring on the real project control */}
                <div
                  className="pointer-events-none fixed rounded-xl border border-emerald-400/75 shadow-[0_0_0_2px_rgba(107,230,189,0.18)] transition-all duration-300"
                  style={{
                    top: box.top - 4,
                    left: box.left - 4,
                    width: box.width + 8,
                    height: box.height + 8,
                  }}
                />

                {/* Quiet Tilted Hand-Drawn Note + Curved Arrow pointing at the real control */}
                <button
                  type="button"
                  data-testid={`live-project-annotation-${spec.id}`}
                  onClick={() => {
                    setStepIdx(idx);
                    executeSpecLiveAction(spec);
                  }}
                  style={{
                    top: clampedTop,
                    left: clampedLeft,
                  }}
                  className="pointer-events-auto fixed flex max-w-[245px] cursor-pointer items-center gap-2 rounded-2xl border border-emerald-400/35 bg-stone-950/88 px-3 py-2 text-left shadow-xl backdrop-blur-md transition hover:scale-105 hover:border-emerald-400"
                >
                  <QuietCurvedArrow
                    scale={0.95}
                    rotate={spec.noteTilt}
                    flipX={isRightAnchor}
                    flipY={isBottomAnchor}
                  />
                  <div style={{ transform: `rotate(${spec.noteTilt}deg)` }}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-emerald-300">
                        {spec.badge}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-300">
                        · {spec.gestureHint}
                      </span>
                    </div>
                    <p className="mt-0.5 font-sans text-xs font-bold leading-snug text-emerald-100">
                      {spec.quietDecisionNote}
                    </p>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

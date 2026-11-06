"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 480,
  damping: 30,
  mass: 0.6,
} as const;

const SPRING_SOFT = {
  type: "spring",
  stiffness: 290,
  damping: 26,
  mass: 0.8,
} as const;

/* ============================================================================
 * 1. TEXT ANIMATIONS — 3D Word & Character Staggered Flip Reveal
 * ============================================================================ */
export function AmicroTextReveal({
  text,
  className = "",
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span";
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag
      className={`[perspective:600px] ${Tag === "span" ? "inline-block" : "block"} ${className}`}
    >
      {words.map((word, i) => (
        <React.Fragment key={`${word}-${i}`}>
          <motion.span
            initial={{ opacity: 0, y: 10, rotateX: -42, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
            transition={{
              ...SPRING_SNAPPY,
              delay: i * 0.035,
            }}
            className="inline-block origin-bottom [transform-style:preserve-3d]"
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/* ============================================================================
 * 2. BUTTONS — Fluid Padding, Micro-Bounce & State Morphing Button
 * ============================================================================ */
export function AmicroButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  const baseClass =
    variant === "primary"
      ? "bg-[linear-gradient(180deg,color-mix(in_oklab,oklch(84%_0.15_165)_90%,white)_0%,oklch(84%_0.15_165)_100%)] text-neutral-950 shadow-[0_2px_0_0_color-mix(in_oklab,oklch(84%_0.15_165)_68%,black),0_1px_0_0_rgb(255_255_255/0.45)_inset]"
      : "border border-neutral-900/12 bg-white text-neutral-900 shadow-2xs dark:border-neutral-100/14 dark:bg-neutral-900 dark:text-neutral-100";

  return (
    <motion.button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
      transition={SPRING_SNAPPY}
      className={`relative inline-flex h-11 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-[15px] font-bold select-none disabled:cursor-not-allowed disabled:opacity-50 ${baseClass} ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="loader"
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -8 }}
            transition={SPRING_SNAPPY}
            className="inline-flex items-center gap-2"
          >
            <AmicroLoader variant="bars" />
            <span>{children || "Working…"}</span>
          </motion.span>
        ) : (
          <motion.span
            key="label"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING_SNAPPY}
            className="inline-flex items-center gap-2"
          >
            <span>{children}</span>
            <motion.span
              aria-hidden
              animate={{ x: hovered ? 3 : 0 }}
              transition={SPRING_SNAPPY}
              className="text-[13px] opacity-75"
            >
              →
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ============================================================================
 * 3. MORPHING — Smooth Layout-Morphing Segmented Switcher & Expandable Pill
 * ============================================================================ */
export function AmicroMorphTabs<T extends string>({
  options,
  value,
  onChange,
  layoutId = "amicro-morph-tab",
}: {
  options: { value: T; label: string; badge?: string }[];
  value: T;
  onChange: (next: T) => void;
  layoutId?: string;
}) {
  return (
    <div
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
      className="grid h-9 w-full items-center gap-1 rounded-xl border border-neutral-900/10 bg-neutral-900/[0.04] p-1 dark:border-white/12 dark:bg-white/[0.05]"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className="relative flex h-full cursor-pointer items-center justify-center gap-1.5 rounded-[8px] px-2.5 text-xs font-semibold whitespace-nowrap transition-colors"
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-[8px] border border-emerald-500/45 bg-white shadow-2xs dark:border-emerald-400/40 dark:bg-neutral-900"
              />
            )}
            <span
              className={`relative z-10 whitespace-nowrap ${
                active
                  ? "text-neutral-950 dark:text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {opt.label}
            </span>
            {opt.badge && (
              <span className="relative z-10 rounded-full bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 4. CARD SPREADS — Interactive Fan-Out Skill Deck on Hover / Tap
 * ============================================================================ */
export interface SpreadSkillCard {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
}

const DEFAULT_SPREAD_CARDS: SpreadSkillCard[] = [
  {
    id: "sui-sdk",
    title: "sui-sdk/SKILL.md",
    subtitle: "SuiGrpcClient transport rules",
    tag: "CORE",
  },
  {
    id: "walrus-mcp",
    title: "walrus-console-mcp",
    subtitle: "Bucket upload & download tools",
    tag: "MCP",
  },
  {
    id: "agents-md",
    title: "AGENTS.md Loop",
    subtitle: "Ask before saving flow changes",
    tag: "SYNC",
  },
];

export function AmicroCardSpread({
  cards = DEFAULT_SPREAD_CARDS,
  onSelectCard,
}: {
  cards?: SpreadSkillCard[];
  onSelectCard?: (card: SpreadSkillCard) => void;
}) {
  const [fanned, setFanned] = useState(false);
  const [activeIdx, setActiveIdx] = useState(1);

  return (
    <div
      onMouseEnter={() => setFanned(true)}
      onMouseLeave={() => setFanned(false)}
      onClick={() => setFanned((v) => !v)}
      className="relative flex h-[112px] w-full cursor-pointer items-center justify-center overflow-visible rounded-[14px] border border-neutral-900/8 bg-neutral-900/[0.02] px-3 py-2 select-none dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]"
    >
      <span className="absolute top-2 left-3 font-mono text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
        {fanned ? "Click a skill card" : "Hover to spread skill cards"}
      </span>
      <div className="relative mt-3 flex h-[74px] w-full items-center justify-center">
        {cards.map((card, i) => {
          const offset = i - (cards.length - 1) / 2;
          const x = fanned ? offset * 118 : offset * 18;
          const rotate = fanned ? offset * 6 : offset * 2.5;
          const y = fanned ? Math.abs(offset) * 4 : Math.abs(offset) * 2;
          const isSelected = i === activeIdx;

          return (
            <motion.div
              key={card.id}
              animate={{
                x,
                y: isSelected && fanned ? y - 5 : y,
                rotate,
                scale: isSelected && fanned ? 1.04 : 1,
                zIndex: isSelected ? 20 : 10 - Math.abs(offset),
              }}
              transition={SPRING_SOFT}
              onClick={(e) => {
                e.stopPropagation();
                setActiveIdx(i);
                onSelectCard?.(card);
              }}
              className={`absolute w-[152px] rounded-[12px] border p-2.5 text-left shadow-sm backdrop-blur-md transition-colors ${
                isSelected
                  ? "border-emerald-500/55 bg-white dark:border-emerald-400/50 dark:bg-neutral-900"
                  : "border-neutral-900/12 bg-white/95 dark:border-neutral-100/14 dark:bg-neutral-900/95"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                  {card.tag}
                </span>
                <span className="font-mono text-[9px] text-neutral-400">
                  0{i + 1}
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
                {card.title}
              </p>
              <p className="truncate text-[10px] text-neutral-500 dark:text-neutral-400">
                {card.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * 5. 3D CAROUSELS — Perspective 3D Skill Ring Carousel
 * ============================================================================ */
export function Amicro3DCarousel({
  items = DEFAULT_SPREAD_CARDS,
}: {
  items?: SpreadSkillCard[];
}) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative flex flex-col items-center justify-between overflow-hidden rounded-[14px] border border-neutral-900/10 bg-neutral-900/[0.02] p-3 dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]">
      <div className="flex w-full items-center justify-between">
        <span className="font-mono text-[10px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
          3D Skill Carousel ({index + 1}/{items.length})
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setIndex((prev) => (prev - 1 + items.length) % items.length)
            }
            className="rounded-md border border-neutral-900/12 bg-white px-2 py-0.5 font-mono text-[11px] font-bold hover:bg-neutral-50 dark:border-neutral-100/15 dark:bg-neutral-900"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % items.length)}
            className="rounded-md border border-neutral-900/12 bg-white px-2 py-0.5 font-mono text-[11px] font-bold hover:bg-neutral-50 dark:border-neutral-100/15 dark:bg-neutral-900"
          >
            ›
          </button>
        </div>
      </div>

      <div className="relative my-2 flex h-[78px] w-full items-center justify-center [perspective:800px]">
        {items.map((item, i) => {
          const total = items.length;
          let diff = i - index;
          if (diff > total / 2) diff -= total;
          if (diff < -total / 2) diff += total;

          const active = diff === 0;
          const rotateY = diff * -34;
          const translateZ = active ? 24 : -40;
          const translateX = diff * 80;
          const opacity = Math.abs(diff) > 1 ? 0 : active ? 1 : 0.55;

          return (
            <motion.div
              key={item.id}
              animate={{
                x: translateX,
                z: translateZ,
                rotateY,
                scale: active ? 1 : 0.86,
                opacity,
                zIndex: active ? 10 : 5,
              }}
              transition={SPRING_SOFT}
              onClick={() => setIndex(i)}
              className={`absolute w-[156px] cursor-pointer rounded-[12px] border p-2.5 [transform-style:preserve-3d] ${
                active
                  ? "border-emerald-500/60 bg-white shadow-md dark:border-emerald-400/50 dark:bg-neutral-900"
                  : "border-neutral-900/10 bg-white/80 dark:border-neutral-100/10 dark:bg-neutral-900/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-emerald-700 dark:text-emerald-300">
                  {item.tag}
                </span>
                <span className="font-mono text-[9.5px] text-neutral-400">
                  3D
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[11.5px] font-bold text-neutral-950 dark:text-neutral-100">
                {item.title}
              </p>
              <p className="truncate text-[10.5px] text-neutral-500 dark:text-neutral-400">
                {item.subtitle}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. LOADERS — Kinetic Waveform & Dither Matrix Loaders
 * ============================================================================ */
export function AmicroLoader({
  variant = "bars",
  label,
}: {
  variant?: "bars" | "dots";
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {variant === "bars" ? (
        <span className="inline-flex h-3.5 items-end gap-[2.5px]">
          {[0, 1, 2, 3].map((i) => (
            <motion.span
              key={i}
              animate={{ height: ["35%", "100%", "45%"] }}
              transition={{
                duration: 0.75,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
              className="w-[2.5px] rounded-full bg-current"
            />
          ))}
        </span>
      ) : (
        <span className="grid grid-cols-3 gap-[2px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <motion.span
              key={i}
              animate={{ opacity: [0.2, 1, 0.2], scale: [0.85, 1.1, 0.85] }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: (i % 3) * 0.15 + Math.floor(i / 3) * 0.1,
              }}
              className="size-[3.5px] rounded-[1px] bg-emerald-500"
            />
          ))}
        </span>
      )}
      {label && (
        <span className="font-mono text-[11px] font-medium">{label}</span>
      )}
    </span>
  );
}

/* ============================================================================
 * 7. MONO CHARTS — High-Contrast Monochrome Telemetry Spark Bars
 * ============================================================================ */
export function AmicroMonoChart({
  title = "Bucket Activity",
  metric = "42ms recall",
  bars = [38, 56, 44, 72, 64, 88, 76, 95, 68, 84, 92, 100],
}: {
  title?: string;
  metric?: string;
  bars?: number[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="rounded-[14px] border border-neutral-900/10 bg-neutral-900/[0.02] p-3 dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]">
      <div className="flex items-center justify-between text-[11.5px]">
        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
          {title}
        </span>
        <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          {hoveredIdx !== null ? `Epoch #${hoveredIdx + 1}: ${bars[hoveredIdx]}%` : metric}
        </span>
      </div>
      <div className="mt-2 flex h-10 items-end gap-1">
        {bars.map((val, idx) => {
          const active = hoveredIdx === idx || idx === bars.length - 1;
          return (
            <motion.div
              key={idx}
              initial={{ height: 4 }}
              animate={{ height: `${Math.max(18, val)}%` }}
              transition={{
                ...SPRING_SNAPPY,
                delay: idx * 0.025,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex-1 cursor-pointer rounded-t-[3px] transition-colors ${
                active
                  ? "bg-emerald-600 dark:bg-emerald-400"
                  : "bg-neutral-900/20 hover:bg-neutral-900/45 dark:bg-neutral-100/20 dark:hover:bg-neutral-100/45"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================================
 * 8. INTERACTIVE AMICRO.DEV MOTION LAB MODAL (All 8 Categories in 1 Drawer)
 * ============================================================================ */
export function AmicroMotionModal({
  open,
  onClose,
  bucketId,
}: {
  open: boolean;
  onClose: () => void;
  bucketId: string;
}) {
  const [morphDemo, setMorphDemo] = useState<"compact" | "expanded">("compact");
  const [btnLoading, setBtnLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16, rotateX: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={SPRING_SNAPPY}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-[680px] overflow-y-auto rounded-[24px] border border-neutral-900/12 bg-white p-6 shadow-2xl dark:border-neutral-100/14 dark:bg-neutral-950"
          >
            <div className="flex items-start justify-between gap-4 border-b border-neutral-900/8 pb-4 dark:border-neutral-100/10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300">
                    AMICRO.DEV MOTION SUITE
                  </span>
                  <AmicroLoader variant="dots" label="Live 60fps" />
                </div>
                <AmicroTextReveal
                  text="Micro-Interactions & 3D Motion Primitives"
                  className="mt-1.5 text-[20px] font-extrabold text-neutral-950 dark:text-neutral-100"
                />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-neutral-900/12 px-3 py-1 text-[12px] font-semibold hover:bg-neutral-100 dark:border-neutral-100/15 dark:hover:bg-neutral-900"
              >
                Close (Esc)
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {/* 1. Card Spreads */}
              <div className="space-y-1.5">
                <p className="font-mono text-[11px] font-bold text-neutral-500 uppercase">
                  1 · Card Spreads
                </p>
                <AmicroCardSpread />
              </div>

              {/* 2. 3D Carousels */}
              <div className="space-y-1.5">
                <p className="font-mono text-[11px] font-bold text-neutral-500 uppercase">
                  2 · 3D Carousels
                </p>
                <Amicro3DCarousel />
              </div>

              {/* 3. Mono Charts */}
              <div className="space-y-1.5">
                <p className="font-mono text-[11px] font-bold text-neutral-500 uppercase">
                  3 · Mono Charts
                </p>
                <AmicroMonoChart
                  title={`Bucket ${bucketId}`}
                  metric="15 SKILL.md · 42ms"
                />
              </div>

              {/* 4. Morphing + Buttons + Loaders */}
              <div className="space-y-2 rounded-[14px] border border-neutral-900/10 bg-neutral-900/[0.02] p-3 dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]">
                <p className="font-mono text-[11px] font-bold text-neutral-500 uppercase">
                  4 · Morphing, Buttons &amp; Loaders
                </p>
                <AmicroMorphTabs
                  layoutId="modal-morph-demo"
                  value={morphDemo}
                  onChange={setMorphDemo}
                  options={[
                    { value: "compact", label: "Compact Morph" },
                    { value: "expanded", label: "Expanded", badge: "3D" },
                  ]}
                />
                <div className="flex items-center gap-2 pt-1">
                  <AmicroButton
                    loading={btnLoading}
                    onClick={() => {
                      setBtnLoading(true);
                      setTimeout(() => setBtnLoading(false), 1100);
                    }}
                    className="h-9 flex-1 text-[13px]"
                  >
                    Trigger Morph &amp; Loader
                  </AmicroButton>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

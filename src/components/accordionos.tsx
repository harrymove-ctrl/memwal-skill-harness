"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AccordionItem {
  id?: string | number;
  title: string;
  badge?: string;
  meta?: string;
  claim: string;
  image: string;
  alt?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export interface AccordionOSProps {
  items?: AccordionItem[];
  staticImage?: string;
  defaultActiveIndex?: number | null;
  className?: string;
  containerHeight?: number | string;
  containerWidth?: number | string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  pauseOnHover?: boolean;
  onItemChange?: (index: number | null) => void;
  rightOverlay?: React.ReactNode;
}

export const WALRUS_PLUSH_ITEMS: AccordionItem[] = [
  {
    id: 1,
    title: "01 · Tatum API & IDs",
    badge: "01",
    meta: "4.7K / 100K Credit Guard",
    claim:
      "Verified Tatum Mainnet key paired with a 30-minute TTL cache and 1-click copy for all 4 Total Recall judge verification IDs.",
    image: "/assets/plush/walrus-mascot-1-skill-hub.jpg",
    alt: "3D Plush Walrus mascot inside mint skill pavilion with floating SKILL.md books and Tatum key",
  },
  {
    id: 2,
    title: "02 · Tatum Docs & Vault",
    badge: "02",
    meta: "SUI $0.9485 · On-Chain Blobs",
    claim:
      "Combines Tatum v4 SUI/USD rate and v3 malicious address screening with encrypted SKILL.md and Flow Memory blobs on Sui Mainnet.",
    image: "/assets/plush/walrus-mascot-2-memory-vault.jpg",
    alt: "3D Plush Walrus mascot holding glowing memory orb inside mint geodesic vault dome",
  },
  {
    id: 3,
    title: "03 · $500 AI Builder",
    badge: "03",
    meta: "ai.tatum.io · Prompt Studio",
    claim:
      "Launch Tatum AI Builder pre-wired with our Walrus Memory Mainnet Account, MEMWAL_AGENT_ID, and CORS bridge endpoints.",
    image: "/assets/plush/walrus-mascot-3-ai-builder.jpg",
    alt: "3D Plush Walrus mascot in builder helmet with cute plush AI robots assembling glowing memory cubes",
  },
  {
    id: 4,
    title: "04 · MCP & Recall API",
    badge: "04",
    meta: "POST /api/tatum-memwal/recall",
    claim:
      "Let ai.tatum.io, Claude Code, Cursor, Codex, and Antigravity recall and update shared SKILL.md playbooks over HTTP JSON and MCP.",
    image: "/assets/plush/walrus-mascot-4-skill-recall.jpg",
    alt: "3D Plush Walrus mascot reading glowing mint SKILL.md playbook in stepped recall arena",
  },
  {
    id: 5,
    title: "05 · Scoring & SEAL Gate",
    badge: "05",
    meta: "30% + 30% + 20% + 20% + Bonus",
    claim:
      "Full Total Recall scoring coverage with Tatum v3 wallet screening before granting Ed25519 and SEAL Policy team vault access.",
    image: "/assets/plush/walrus-mascot-5-seal-guardian.jpg",
    alt: "3D Plush Walrus mascot guardian beside mint archway with three floating golden SEAL keys",
  },
];

const DEFAULT_STATIC_IMAGE = "/assets/plush/walrus-mascot-1-skill-hub.jpg";

const springPhysics = {
  type: "spring" as const,
  stiffness: 340,
  damping: 28,
  mass: 0.8,
};

const bouncySpring = {
  type: "spring" as const,
  stiffness: 400,
  damping: 22,
};

export function AccordionOS({
  items = WALRUS_PLUSH_ITEMS,
  staticImage = DEFAULT_STATIC_IMAGE,
  defaultActiveIndex = 0,
  className = "",
  containerHeight = 520,
  containerWidth = "100%",
  autoPlay = false,
  autoPlayInterval = 4500,
  pauseOnHover = true,
  onItemChange,
  rightOverlay,
}: AccordionOSProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(defaultActiveIndex);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleToggle = useCallback(
    (index: number) => {
      setActiveIndex(index);
      onItemChange?.(index);
    },
    [onItemChange]
  );

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => {
      const cur = prev ?? 0;
      const next = cur > 0 ? cur - 1 : items.length - 1;
      onItemChange?.(next);
      return next;
    });
  }, [items.length, onItemChange]);

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => {
      const cur = prev ?? 0;
      const next = cur < items.length - 1 ? cur + 1 : 0;
      onItemChange?.(next);
      return next;
    });
  }, [items.length, onItemChange]);

  useEffect(() => {
    if (!autoPlay || (pauseOnHover && isHovered)) return;

    const interval = setInterval(() => {
      handleNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, pauseOnHover, isHovered, handleNext]);

  return (
    <div
      data-testid="accordion-os-showcase"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`accordion-os-root ${className}`}
      style={{
        width: typeof containerWidth === "number" ? `${containerWidth}px` : containerWidth,
        maxWidth: "100%",
      }}
    >
      <motion.div
        className="accordion-os-card"
        style={{
          height: typeof containerHeight === "number" ? `${containerHeight}px` : containerHeight,
        }}
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Left Interactive Column */}
        <div className="accordion-os-sidebar">
          <div className="accordion-os-items-stack">
            {items.map((item, index) => {
              const isOpen = activeIndex === index;
              return (
                <motion.div
                  key={item.id ?? index}
                  layout
                  transition={springPhysics}
                  onClick={() => handleToggle(index)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isOpen}
                  data-testid={`accordion-os-item-${index}`}
                  whileHover={{ scale: isOpen ? 1.005 : 1.02, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className={`accordion-os-pill ${isOpen ? "accordion-os-pill-open" : "accordion-os-pill-closed"}`}
                >
                  <div className="accordion-os-title-stack">
                    <motion.div
                      className="accordion-os-icon-btn"
                      animate={{
                        backgroundColor: isOpen ? "#064e3b" : "rgba(255, 255, 255, 0.9)",
                        color: isOpen ? "#6ee7b7" : "#064e3b",
                        borderColor: isOpen ? "#064e3b" : "rgba(6, 78, 59, 0.25)",
                      }}
                      transition={bouncySpring}
                    >
                      <motion.svg
                        viewBox="0 0 24 24"
                        className="accordion-os-svg-icon"
                        animate={{ rotate: isOpen ? 135 : 0 }}
                        transition={bouncySpring}
                      >
                        <line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                        <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </motion.svg>
                    </motion.div>

                    <div className="accordion-os-title-wrapper">
                      <span className="accordion-os-title-text">{item.title}</span>
                      {item.badge ? (
                        <span
                          className={`accordion-os-pill-badge ${
                            isOpen ? "accordion-os-pill-badge-active" : ""
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="claim-content"
                        initial={{ opacity: 0, height: 0, marginTop: 0, filter: "blur(4px)" }}
                        animate={{
                          opacity: 1,
                          height: "auto",
                          marginTop: 9,
                          filter: "blur(0px)",
                          transition: {
                            height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.25, delay: 0.05 },
                            filter: { duration: 0.25 },
                          },
                        }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          marginTop: 0,
                          filter: "blur(4px)",
                          transition: {
                            height: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
                            opacity: { duration: 0.15 },
                          },
                        }}
                        className="accordion-os-claim-container"
                      >
                        {item.meta && (
                          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            <span>{item.meta}</span>
                          </div>
                        )}
                        <motion.p
                          initial={{ y: 6 }}
                          animate={{ y: 0 }}
                          transition={{ duration: 0.25, delay: 0.04 }}
                          className="accordion-os-claim-text"
                        >
                          {item.claim}
                        </motion.p>
                        {(item.actionLabel || item.secondaryLabel) && (
                          <div
                            className="mt-2.5 flex flex-wrap items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.actionLabel && item.onAction && (
                              <button
                                type="button"
                                onClick={item.onAction}
                                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full bg-emerald-950 px-3 font-sans text-[11px] font-bold text-emerald-300 shadow-sm transition hover:bg-emerald-900"
                              >
                                <span>{item.actionLabel}</span>
                              </button>
                            )}
                            {item.secondaryLabel && item.onSecondaryAction && (
                              <button
                                type="button"
                                onClick={item.onSecondaryAction}
                                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-emerald-950/20 bg-white/90 px-2.5 font-mono text-[10.5px] font-semibold text-emerald-950 transition hover:bg-white"
                              >
                                <span>{item.secondaryLabel}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Floating Navigation Deck */}
          <div className="accordion-os-bottom-deck">
            <AnimatePresence>
              {activeIndex !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.92 }}
                  transition={bouncySpring}
                  className="accordion-os-nav-stack"
                >
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous slide"
                    className="accordion-os-nav-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="accordion-os-nav-svg">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </button>

                  <div className="accordion-os-counter">
                    <span>{String((activeIndex ?? 0) + 1).padStart(2, "0")}</span>
                    <span className="accordion-os-counter-divider">/</span>
                    <span>{String(items.length).padStart(2, "0")}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next slide"
                    className="accordion-os-nav-btn"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="accordion-os-nav-svg">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Interactive Overlay Dock */}
        {rightOverlay && (
          <div className="accordion-os-right-dock">
            {rightOverlay}
          </div>
        )}

        {/* Persistent Pre-Decoded Instant GPU Layers */}
        <div className="accordion-os-visual-wrapper">
          <motion.div
            className="accordion-os-image-layer"
            initial={false}
            animate={{
              opacity: activeIndex === null ? 1 : 0,
              scale: activeIndex === null ? 1 : 1.04,
              zIndex: activeIndex === null ? 2 : 1,
            }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src={staticImage}
              alt="Walrus 3D Plush Mascot Skill Pavilion"
              className="accordion-os-image"
              loading="eager"
              decoding="async"
            />
          </motion.div>

          {items.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <motion.div
                key={item.id ?? idx}
                className="accordion-os-image-layer"
                initial={false}
                animate={{
                  opacity: isActive ? 1 : 0,
                  scale: isActive ? 1 : 1.04,
                  zIndex: isActive ? 3 : 1,
                }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <img
                  src={item.image}
                  alt={item.alt || item.title}
                  className="accordion-os-image"
                  loading="eager"
                  decoding="async"
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        .accordion-os-root {
          box-sizing: border-box;
          margin: 0 auto;
          font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
          user-select: none;
          perspective: 1200px;
          container-type: inline-size;
        }

        .accordion-os-card {
          position: relative;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: stretch;
          background-color: #064e3b;
          border-radius: 28px;
          padding: 20px;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
          box-shadow: 0 20px 48px -18px rgba(6, 78, 59, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.28);
        }

        .accordion-os-sidebar {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: flex-start;
          width: 310px;
          max-width: 100%;
          height: 100%;
          flex-shrink: 0;
          pointer-events: auto;
        }

        .accordion-os-right-dock {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-end;
          margin-left: auto;
          pointer-events: auto;
          width: 340px;
          max-width: 100%;
        }

        .accordion-os-items-stack {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          width: 100%;
          z-index: 10;
        }

        .accordion-os-pill {
          width: fit-content;
          max-width: 310px;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          background-color: rgba(255, 255, 255, 0.82);
          border-radius: 19px;
          padding: 10px 15px;
          cursor: pointer;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 24px -8px rgba(6, 78, 59, 0.25);
          transition: background-color 0.25s ease, border-color 0.25s ease;
          outline: none;
          box-sizing: border-box;
        }

        .accordion-os-pill:hover {
          border-color: rgba(255, 255, 255, 0.98);
          background-color: rgba(255, 255, 255, 0.95);
        }

        .accordion-os-pill-open {
          width: 310px;
          background-color: rgba(255, 255, 255, 0.96);
          border-color: rgba(255, 255, 255, 0.98);
          box-shadow: 0 14px 34px -10px rgba(6, 78, 59, 0.35);
        }

        .accordion-os-title-stack {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .accordion-os-icon-btn {
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          border: 1.5px solid rgba(6, 78, 59, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #064e3b;
          background: rgba(255, 255, 255, 0.88);
        }

        .accordion-os-svg-icon {
          width: 12px;
          height: 12px;
        }

        .accordion-os-title-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 8px;
        }

        .accordion-os-title-text {
          font-size: 13.5px;
          font-weight: 700;
          color: #064e3b;
          letter-spacing: -0.015em;
          white-space: nowrap;
        }

        .accordion-os-pill-badge {
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
          color: rgba(6, 78, 59, 0.5);
          font-variant-numeric: tabular-nums;
        }

        .accordion-os-pill-badge-active {
          color: #047857;
        }

        .accordion-os-claim-container {
          overflow: hidden;
          width: 100%;
        }

        .accordion-os-claim-text {
          margin: 0;
          font-size: 12px;
          line-height: 1.46;
          color: #1e293b;
          word-break: break-word;
        }

        .accordion-os-bottom-deck {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 100%;
          z-index: 10;
          margin-top: auto;
          padding-top: 12px;
        }

        .accordion-os-nav-stack {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.86);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 4px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 6px 18px -6px rgba(6, 78, 59, 0.25);
        }

        .accordion-os-nav-btn {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background-color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #064e3b;
          border: 1px solid rgba(6, 78, 59, 0.12);
        }

        .accordion-os-nav-svg {
          width: 13px;
          height: 13px;
          display: block;
        }

        .accordion-os-counter {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          gap: 4px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          color: #064e3b;
          font-variant-numeric: tabular-nums;
        }

        .accordion-os-counter-divider {
          opacity: 0.4;
        }

        .accordion-os-visual-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .accordion-os-image-layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          will-change: opacity, transform;
        }

        .accordion-os-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          border-radius: 28px;
          display: block;
        }

        @container (max-width: 720px) {
          .accordion-os-card {
            flex-direction: column;
            justify-content: flex-start;
            gap: 12px;
            height: auto !important;
            min-height: 540px;
            padding: 14px;
            border-radius: 22px;
          }

          .accordion-os-sidebar {
            width: 100%;
            height: auto;
          }

          .accordion-os-right-dock {
            width: 100%;
            max-width: 100%;
            align-items: stretch;
          }

          .accordion-os-pill {
            max-width: 100%;
            padding: 10px 14px;
            border-radius: 16px;
          }

          .accordion-os-pill-open {
            width: 100%;
            max-width: 100%;
          }

          .accordion-os-title-text {
            font-size: 13px;
            white-space: normal;
          }

          .accordion-os-bottom-deck {
            margin-top: 10px;
            padding-top: 4px;
          }

          .accordion-os-image {
            border-radius: 22px;
          }
        }
      ` }} />
    </div>
  );
}

export default AccordionOS;

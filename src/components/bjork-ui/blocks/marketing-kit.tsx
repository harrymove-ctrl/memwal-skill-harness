"use client";

import {
  useSyncExternalStore,
  type CSSProperties,
  type MouseEventHandler,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "../../../lib/utils";

export type BlockTone = "light" | "dark" | "auto";

const subscribeNoop = () => () => {};

/** `true` once hydrated and the visitor asked for reduced motion. */
export function useBlockReducedMotion(): boolean {
  const hydrated = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
  const prefers = useReducedMotion();
  return hydrated && prefers === true;
}

export function blockToneProps(tone: BlockTone): {
  className?: string;
  style?: CSSProperties;
} {
  if (tone === "auto") return {};
  return { className: tone, style: { colorScheme: tone } };
}

export const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bjork-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bjork-ring-offset)]";

export const blockFrame =
  "mx-auto w-full max-w-[1440px] px-4 @2xl:px-6 @5xl:px-8";

export interface BlockLink {
  label: string;
  href: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-mono text-[11px] uppercase leading-4 tracking-[0.12em] text-[color:var(--bjork-text-muted)]",
        className
      )}
    >
      <span
        aria-hidden
        className="size-1.5 rounded-full bg-[color:var(--bjork-accent)]"
      />
      {children}
    </p>
  );
}

export interface SectionHeaderProps {
  id: string;
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "start" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  children?: ReactNode;
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  align = "start",
  as: Heading = "h2",
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Heading
        id={id}
        className="max-w-[22ch] text-balance text-[30px] font-semibold leading-[1.04] tracking-[-0.03em] text-[color:var(--bjork-text)] sm:text-[38px] lg:text-[44px]"
      >
        {title}
      </Heading>
      {description ? (
        <p className="max-w-[58ch] text-pretty text-[15px] leading-6 text-[color:var(--bjork-text-medium)]">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

type CtaVariant = "primary" | "secondary" | "ghost";

const ctaBase =
  "group/cta relative inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-[16px] text-[13px] font-medium tracking-[-0.01em] transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100";

const ctaVariants: Record<CtaVariant, string> = {
  primary: "bjork-layered-button-accent text-white",
  secondary:
    "border border-[color:var(--bjork-border-strong)] bg-[var(--bjork-surface)] text-[color:var(--bjork-text)] shadow-[var(--bjork-shadow-soft)] hover:bg-[var(--bjork-surface-hover)]",
  ghost:
    "px-2 text-[color:var(--bjork-text-medium)] hover:text-[color:var(--bjork-text)]",
};

export function CtaLink({
  link,
  variant = "primary",
  arrow = false,
  className,
}: {
  link: BlockLink;
  variant?: CtaVariant;
  arrow?: boolean;
  className?: string;
}) {
  return (
    <a
      href={link.href}
      onClick={link.onClick}
      className={cn(ctaBase, ctaVariants[variant], focusRing, className)}
    >
      <span>{link.label}</span>
      {arrow ? (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform duration-200 ease-out group-hover/cta:translate-x-0.5 motion-reduce:transition-none"
        />
      ) : null}
    </a>
  );
}

export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = useBlockReducedMotion();
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        opacity: {
          duration: reduce ? 0.2 : 0.45,
          ease: [0.23, 1, 0.32, 1],
          delay: reduce ? 0 : delay,
        },
        y: reduce
          ? { duration: 0 }
          : {
              type: "spring",
              stiffness: 260,
              damping: 30,
              mass: 0.9,
              delay,
            },
      }}
    >
      {children}
    </Component>
  );
}

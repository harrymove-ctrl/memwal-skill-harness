"use client";

import React, {
  cloneElement,
  isValidElement,
  type ComponentProps,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";

import { bloomStyle, cssColor } from "../../lib/dither";
import type { Bloom, DitherColor, FillVariant } from "../../lib/dither";
import { cn } from "../../lib/utils";

export type DitherButtonVariant = "filled" | "outline";
export type DitherButtonSize = "sm" | "md" | "lg" | "icon";

const HEIGHT = { icon: 36, lg: 44, md: 36, sm: 32 } as const satisfies Record<
  DitherButtonSize,
  number
>;

const SIZE = {
  icon: "size-9 rounded-[9px]",
  lg: "h-11 gap-2 rounded-[11px] px-5 text-[15px] [&_svg:not([class*='size-'])]:size-4.5",
  md: "h-9 gap-2 rounded-[9px] px-4 text-sm",
  sm: "h-8 gap-1.5 rounded-[8px] px-3 text-[13px]",
} as const satisfies Record<DitherButtonSize, string>;

interface Shades {
  base: string;
  light: string;
  dark: string;
}

const shadesOf = (color: DitherColor): Shades => {
  const base = cssColor(color);
  return {
    base,
    dark: `color-mix(in oklab, ${base}, black 48%)`,
    light: `color-mix(in oklab, ${base}, white 42%)`,
  };
};

interface LayerOptions {
  fill: FillVariant;
  cell: number;
  /** Height of the button in cells. */
  rows: number;
}

type LayerStyle = CSSProperties & { "--dcn-btn-on"?: string };

interface Surface {
  base: CSSProperties;
  rest: readonly CSSProperties[];
  hover: LayerStyle;
  press: LayerStyle;
}

const filledSurface = (_options: LayerOptions, shades: Shades): Surface => ({
  base: {
    backgroundColor: shades.base,
    backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${shades.base}, white 10%) 0%, ${shades.base} 100%)`,
  },
  hover: {
    backgroundColor: `color-mix(in oklab, ${shades.base}, white 14%)`,
    "--dcn-btn-on": "0.35",
  },
  press: {
    backgroundColor: `color-mix(in oklab, ${shades.base}, black 18%)`,
    "--dcn-btn-on": "0.45",
  },
  rest: [],
});

const outlineSurface = (_options: LayerOptions, shades: Shades): Surface => ({
  base: {
    backgroundColor: "var(--fill)",
  },
  hover: {
    backgroundColor: "var(--fill2)",
    "--dcn-btn-on": "1",
  },
  press: {
    backgroundColor: `color-mix(in oklab, ${shades.base} 16%, transparent)`,
    "--dcn-btn-on": "1",
  },
  rest: [],
});

const STYLES = [
  ".dcn-btn-hover,.dcn-btn-press{opacity:0;transition:opacity 180ms cubic-bezier(0.23,1,0.32,1)}",
  "@media (hover:hover){.dcn-btn:hover .dcn-btn-hover{opacity:var(--dcn-btn-on,1)}}",
  ".dcn-btn:focus-visible .dcn-btn-hover{opacity:var(--dcn-btn-on,1)}",
  ".dcn-btn:active .dcn-btn-press{opacity:var(--dcn-btn-on,1);transition-duration:80ms}",
  ".dcn-btn:active .dcn-btn-hover{opacity:0;transition-duration:80ms}",
  "@keyframes dcn-btn-busy{from{opacity:0}to{opacity:var(--dcn-btn-on,1)}}",
  ".dcn-btn[data-loading] .dcn-btn-hover{animation:dcn-btn-busy 0.9s cubic-bezier(0.77,0,0.175,1) infinite alternate}",
  "@keyframes dcn-btn-step{0%,100%{opacity:0.25}33%{opacity:1}}",
  ".dcn-btn-dot{animation:dcn-btn-step 0.9s steps(1,end) infinite}",
  "@media (prefers-reduced-motion:reduce){.dcn-btn-hover,.dcn-btn-press{transition:none}.dcn-btn[data-loading] .dcn-btn-hover,.dcn-btn-dot{animation:none}}",
].join("");

const edgeStyle = (
  variant: DitherButtonVariant,
  color: DitherColor
): CSSProperties => {
  const ink = cssColor(color);
  if (variant === "outline") {
    return {
      boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${ink} 45%, transparent)`,
    };
  }
  return {
    boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${ink}, black 28%), inset 0 1px 0 color-mix(in oklab, ${ink}, white 30%)`,
  };
};

const LAYER = "absolute inset-0 rounded-[inherit]";

interface FillProps extends LayerOptions {
  variant: DitherButtonVariant;
  color: DitherColor;
  bloom: Bloom;
}

const Fill = ({ variant, color, bloom, ...options }: FillProps) => {
  const shades = shadesOf(color);
  const surface =
    variant === "filled"
      ? filledSurface(options, shades)
      : outlineSurface(options, shades);
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 rounded-[inherit]"
      style={variant === "filled" ? bloomStyle(color, bloom) : undefined}
    >
      <style href="dithercn-dither-button" precedence="dithercn">
        {STYLES}
      </style>
      <span className={LAYER} style={surface.base} />
      <span className={cn(LAYER, "dcn-btn-hover")} style={surface.hover} />
      <span className={cn(LAYER, "dcn-btn-press")} style={surface.press} />
      <span className={LAYER} style={edgeStyle(variant, color)} />
    </span>
  );
};

/** Three cells stepping in turn, shown before the label while loading. */
const Busy = () => (
  <span aria-hidden="true" className="inline-flex items-center gap-[3px]">
    {[0, 0.3, 0.6].map((delay) => (
      <span
        key={delay}
        className="dcn-btn-dot size-[3px] bg-current"
        style={{ animationDelay: `${delay}s` }}
      />
    ))}
  </span>
);

interface OwnProps {
  /** `filled` is the lit colour surface; `outline` is a faint tint that fills in on hover. Default `"filled"`. */
  variant?: DitherButtonVariant;
  /** Texture of the shade: a Bayer ramp, a dot lattice, diagonals, or a thin rim. Default `"gradient"`. */
  fill?: FillVariant;
  /** A palette name or any CSS colour. Default `"ink"`. */
  color?: DitherColor;
  /** Default `"md"`. `icon` is a square for a lone icon; give it an `aria-label`. */
  size?: DitherButtonSize;
  /** A soft glow in the button's colour. Default `"off"`. */
  bloom?: Bloom;
  /** Size of one dither cell in CSS pixels. Default 2. */
  cell?: number;
  /** Show a busy state: the label stays, the button ignores clicks and reports `aria-busy`. Default `false`. */
  loading?: boolean;
  /** Render your own element (a link) with the button's look, as shadcn's `asChild`. Default `false`. */
  asChild?: boolean;
  children?: ReactNode;
}

export type DitherButtonProps = OwnProps &
  Omit<ComponentProps<"button">, "children" | "color">;

const rootClass = (
  variant: DitherButtonVariant,
  size: DitherButtonSize,
  className: string | undefined
) =>
  cn(
    "dcn-btn group/button relative isolate inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap select-none",
    "transition-[scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:active:scale-[0.97]",
    variant === "filled"
      ? "text-white [text-shadow:0_1px_0_oklch(0_0_0/0.35)] dark:text-[oklch(0.13_0.02_268)] dark:[text-shadow:none]"
      : "bg-[var(--sheet)] text-[color:var(--ink)]",
    "outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--ink)] focus-visible:outline-solid",
    "disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45",
    "data-loading:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    SIZE[size],
    className
  );

/**
 * A real `<button>` with a lit, dithered surface in any palette colour: a
 * highlight dithered down from the top and a shade dithered up from the
 * bottom. Hover brightens it through the Bayer levels and press shades it
 * from the top. Four fills, two variants, four sizes, a loading state, and
 * `asChild` to put the look on a link.
 */
export const DitherButton = ({
  variant = "filled",
  fill = "gradient",
  color = "ink",
  size = "md",
  bloom = "off",
  cell = 2,
  loading = false,
  asChild = false,
  className,
  style,
  children,
  type,
  disabled,
  onClick,
  ...props
}: DitherButtonProps) => {
  const step = Math.max(1, Math.round(cell));
  const fillNode = (
    <Fill
      variant={variant}
      bloom={bloom}
      fill={fill}
      color={color}
      cell={step}
      rows={Math.round(HEIGHT[size] / step)}
    />
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<Record<string, any>>;
    return cloneElement(
      child,
      {
        "data-slot": "button",
        "data-variant": variant,
        "data-fill": fill,
        "data-loading": loading ? "" : undefined,
        "aria-busy": loading || undefined,
        "aria-disabled": loading || undefined,
        onClick: loading
          ? (event: React.MouseEvent) => event.preventDefault()
          : (onClick ?? child.props.onClick),
        ...props,
        className: cn(rootClass(variant, size, className), child.props.className),
        style: { ...style, ...child.props.style },
      },
      <>
        {fillNode}
        {loading ? <Busy /> : null}
        {child.props.children}
      </>
    );
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-fill={fill}
      data-loading={loading ? "" : undefined}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      type={type ?? "button"}
      disabled={disabled}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...props}
      className={rootClass(variant, size, className)}
      style={style}
    >
      {fillNode}
      {loading ? <Busy /> : null}
      {children}
    </button>
  );
};

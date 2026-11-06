import { MARK_PATHS, MARK_SMALL_PATHS } from "./logoPaths";

export const PRODUCT_NAME = "Skill Harness";

export interface LogoMarkProps {
  /** Rendered size in pixels. At 24 and under it switches to the small cut. */
  size?: number;
  /** Names the mark for screen readers. Leave out when text beside it says the name. */
  title?: string;
  className?: string;
}

/** The mark alone. It takes its color from `color`, so it follows the theme. */
export function LogoMark({ size = 24, title, className }: LogoMarkProps) {
  const paths = size <= 24 ? MARK_SMALL_PATHS : MARK_PATHS;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="currentColor"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      data-testid="logo-mark"
      data-cut={size <= 24 ? "small" : "full"}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

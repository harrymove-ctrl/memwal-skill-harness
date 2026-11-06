import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** One primary per view; everything else stays secondary. */
  variant?: "primary" | "secondary";
}

export function Button({ variant = "secondary", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      data-variant={variant}
      className={className ? `cc-btn ${className}` : "cc-btn"}
    />
  );
}

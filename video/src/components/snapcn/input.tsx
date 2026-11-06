import type React from "react";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export interface InputProps {
  children?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  footer?: React.ReactNode;
  theme?: "dark" | "light";
  radius?: number;
  padding?: string;
  minHeight?: number;
  fontSize?: number;
  width?: number | string;
  focused?: boolean;
  accentColor?: string;
  background?: string;
  borderColor?: string;
  style?: React.CSSProperties;
}

export const Input: React.FC<InputProps> = ({
  children,
  leading,
  trailing,
  footer,
  theme = "dark",
  radius = 22,
  padding = "18px 24px",
  minHeight = 76,
  fontSize = 26,
  width = "100%",
  focused = false,
  accentColor,
  background,
  borderColor,
  style,
}) => {
  const palette = theme === "dark" ? SNAP_CN_UI.dark : SNAP_CN_UI.light;
  const ringAccent = accentColor ?? palette.accent;
  const resolvedBorder =
    borderColor ?? (focused ? palette.borderStrong : palette.border);

  return (
    <div
      style={{
        width,
        borderRadius: radius,
        backgroundColor: background ?? palette.surface,
        border: `1.5px solid ${resolvedBorder}`,
        boxShadow: focused
          ? `0 0 0 4px ${palette.accentBg}, 0 24px 60px rgba(0, 0, 0, ${
              theme === "dark" ? 0.45 : 0.1
            })`
          : `0 20px 50px rgba(0, 0, 0, ${theme === "dark" ? 0.35 : 0.08})`,
        fontFamily: SNAP_CN_UI.fontFamily,
        color: palette.textPrimary,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          minHeight,
          padding,
          fontSize,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          lineHeight: 1.35,
        }}
      >
        {leading && (
          <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {leading}
          </div>
        )}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {children}
        </div>
        {trailing && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              color: ringAccent,
            }}
          >
            {trailing}
          </div>
        )}
      </div>
      {footer && (
        <div
          style={{
            padding: "12px 24px 16px",
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

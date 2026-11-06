import React from "react";
import { Img, staticFile } from "remotion";
import { PALETTE } from "../palette";

export const MemWalMark: React.FC<{
  size?: number;
  withShadow?: boolean;
  style?: React.CSSProperties;
}> = ({ size = 56, withShadow = true, style }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: withShadow
          ? `0 ${Math.round(size * 0.16)}px ${Math.round(size * 0.42)}px rgba(16, 185, 129, 0.22), 0 2px 6px rgba(20, 20, 19, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)`
          : undefined,
        backgroundColor: PALETTE.mintTint,
        ...style,
      }}
    >
      <Img
        src={staticFile("memwal-mark.svg")}
        style={{
          width: size,
          height: size,
          maxWidth: "none",
          display: "block",
          borderRadius: Math.round(size * 0.24),
        }}
      />
    </div>
  );
};

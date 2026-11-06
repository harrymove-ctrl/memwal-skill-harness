"use client";

import React from "react";
import ChromaCurrent from "./chroma-current";

export interface FullscreenShaderBackgroundProps {
  isDark?: boolean;
  className?: string;
  variant?: "viewport" | "stage";
}

/**
 * Full-viewport background powered by React Bits Pro's ChromaCurrent
 * ("Currents of light flowing across a grid of glowing dots").
 */
export const FullscreenShaderBackground: React.FC<
  FullscreenShaderBackgroundProps
> = ({ isDark = false, className = "", variant = "viewport" }) => {
  // Render a single unified full-viewport ChromaCurrent background (avoid nested duplicate boxes)
  if (variant === "stage") {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      <ChromaCurrent
        colors={isDark ? ["#34d996", "#2dd4bf"] : ["#10b981", "#14b8a6"]}
        backgroundColor={isDark ? "#080c0b" : "#f5f6f1"}
        pattern="streams"
        pitch={8}
        dotSize={0.62}
        variance={0.35}
        shape="circle"
        baseDots={0.14}
        stretch={0.22}
        streams={4}
        spread={0.52}
        speed={0.6}
        turbulence={0.6}
        trail={0.65}
        intensity={1.15}
        bloom={isDark ? 0.68 : 0.45}
        grain={0.16}
        interactive={true}
        stir={1}
        plume={1}
        intro={false}
        className="h-full w-full"
      />
    </div>
  );
};

export default FullscreenShaderBackground;

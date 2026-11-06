import type React from "react";
import { AbsoluteFill } from "remotion";
import { DOT_BLOOM_CUT, DOT_BLOOM_FRAMES, DotBloom } from "@/components/snap-cn/dot-bloom";

export { DOT_BLOOM_CUT, DOT_BLOOM_FRAMES };

/**
 * Wraps the official @snapcn/dot-bloom transition and shifts its default
 * coral/peach halftone palette (+134deg hue rotation) into MemWal Sorbet
 * mint-cream and emerald without editing the upstream snapcn file.
 */
export const EmeraldDotBloom: React.FC<{ speed?: number }> = ({ speed = 1 }) => (
  <AbsoluteFill
    style={{
      filter: "hue-rotate(134deg) saturate(0.90) brightness(1.02)",
      pointerEvents: "none",
    }}
  >
    <DotBloom speed={speed} />
  </AbsoluteFill>
);

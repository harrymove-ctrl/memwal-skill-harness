import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface CursorWaypoint {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
}

export interface CursorTrackProps {
  waypoints: CursorWaypoint[];
  size?: number;
  color?: string;
  strokeColor?: string;
  rippleColor?: string;
  label?: string;
  labelBg?: string;
  labelColor?: string;
}

export const CursorTrack: React.FC<CursorTrackProps> = ({
  waypoints,
  size = 34,
  color = "#111827",
  strokeColor = "#ffffff",
  rippleColor = "#10b981",
  label,
  labelBg = "#10b981",
  labelColor = "#042f2e",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (waypoints.length === 0) return null;

  let x = waypoints[0].x;
  let y = waypoints[0].y;

  if (frame <= waypoints[0].frame) {
    x = waypoints[0].x;
    y = waypoints[0].y;
  } else if (frame >= waypoints[waypoints.length - 1].frame) {
    x = waypoints[waypoints.length - 1].x;
    y = waypoints[waypoints.length - 1].y;
  } else {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const a = waypoints[i];
      const b = waypoints[i + 1];
      if (frame >= a.frame && frame <= b.frame) {
        const span = Math.max(1, b.frame - a.frame);
        const t = interpolate(frame, [a.frame, b.frame], [0, 1], {
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Subtle natural arc perpendicular to travel
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const arc = Math.sin(t * Math.PI) * Math.min(28, Math.hypot(dx, dy) * 0.08);
        x = a.x + dx * t;
        y = a.y + dy * t - (span > 6 ? arc : 0);
        break;
      }
    }
  }

  // Click press scale & ripple
  let pressScale = 1;
  let activeRippleProgress: number | null = null;

  for (const wp of waypoints) {
    if (wp.click && frame >= wp.frame && frame <= wp.frame + 22) {
      const local = frame - wp.frame;
      const bounce = spring({
        frame: Math.max(0, local - 3),
        fps,
        config: { damping: 12, stiffness: 260, mass: 0.5 },
      });
      pressScale = local < 4 ? interpolate(local, [0, 3], [1, 0.82]) : 0.82 + 0.18 * bounce;
      activeRippleProgress = interpolate(local, [0, 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }

  const entranceOpacity = interpolate(
    frame,
    [Math.max(0, waypoints[0].frame - 6), waypoints[0].frame + 4],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 60,
        opacity: entranceOpacity,
        transform: `translate(-4px, -3px) scale(${pressScale})`,
        transformOrigin: "4px 3px",
      }}
    >
      {activeRippleProgress !== null && (
        <div
          style={{
            position: "absolute",
            left: 4,
            top: 3,
            width: 68,
            height: 68,
            borderRadius: "50%",
            border: `2.5px solid ${rippleColor}`,
            transform: `translate(-50%, -50%) scale(${0.25 + activeRippleProgress * 1.15})`,
            opacity: 1 - activeRippleProgress,
          }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 28 28"
        fill="none"
        style={{
          filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.28))",
        }}
      >
        <path
          d="M4.2 3.1L23.4 11.7C24.5 12.2 24.4 13.8 23.2 14.1L14.8 16.3L11.4 24.2C10.9 25.3 9.3 25.1 9.0 23.9L3.1 4.4C2.8 3.4 3.4 2.7 4.2 3.1Z"
          fill={color}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      {label && (
        <div
          style={{
            position: "absolute",
            left: size * 0.72,
            top: size * 0.68,
            padding: "6px 14px",
            borderRadius: 999,
            backgroundColor: labelBg,
            color: labelColor,
            fontSize: 22,
            fontWeight: 700,
            whiteSpace: "nowrap",
            boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
            letterSpacing: "-0.01em",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

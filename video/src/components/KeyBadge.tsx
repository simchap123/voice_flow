import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { BOUNCY } from "../lib/springs";

interface KeyBadgeProps {
  label: string;
  delay?: number;
  size?: "sm" | "md" | "lg";
}

export const KeyBadge: React.FC<KeyBadgeProps> = ({
  label,
  delay = 0,
  size = "md",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: BOUNCY,
  });

  const scale = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sizeMap = {
    sm: { padding: "4px 10px", fontSize: 12 },
    md: { padding: "8px 20px", fontSize: 16 },
    lg: { padding: "12px 28px", fontSize: 22 },
  };

  const s = sizeMap[size];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: s.padding,
        fontSize: s.fontSize,
        fontWeight: 600,
        fontFamily: "Inter, sans-serif",
        color: "rgba(167, 139, 250, 1)",
        background: "rgba(124, 58, 237, 0.15)",
        border: "1px solid rgba(124, 58, 237, 0.3)",
        borderRadius: 8,
        transform: `scale(${scale})`,
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </div>
  );
};

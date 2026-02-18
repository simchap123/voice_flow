import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { SNAPPY } from "../lib/springs";
import { COLORS } from "../lib/colors";

interface GlassmorphicCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  highlighted?: boolean;
  style?: React.CSSProperties;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  delay = 0,
  className = "",
  highlighted = false,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: SNAPPY,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      className={className}
      style={{
        opacity,
        transform: `scale(${scale})`,
        background: COLORS.card,
        border: highlighted
          ? `1px solid ${COLORS.primary}`
          : `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "32px 28px",
        boxShadow: highlighted
          ? `0 0 30px ${COLORS.primaryGlow}`
          : "0 4px 24px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

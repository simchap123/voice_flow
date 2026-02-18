import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../lib/colors";
import { SNAPPY } from "../lib/springs";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  delay = 0,
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

  const translateY = interpolate(progress, [0, 1], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 28,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          background: "rgba(124, 58, 237, 0.1)",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          color: COLORS.primaryLight,
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.text,
          marginBottom: 8,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {title}
      </div>

      {/* Description */}
      <div
        style={{
          fontSize: 14,
          color: COLORS.muted,
          lineHeight: 1.6,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {description}
      </div>
    </div>
  );
};

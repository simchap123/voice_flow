import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { SMOOTH } from "../lib/springs";
import { GRADIENT_PRIMARY } from "../lib/colors";

interface GradientTextProps {
  children: React.ReactNode;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  gradient?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  delay = 0,
  fontSize = 72,
  fontWeight = 800,
  gradient = GRADIENT_PRIMARY,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    delay,
    config: SMOOTH,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(progress, [0, 1], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        fontSize,
        fontWeight,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
        backgroundImage: gradient,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </div>
  );
};

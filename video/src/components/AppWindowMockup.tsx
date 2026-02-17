import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../lib/colors";
import { SMOOTH } from "../lib/springs";

interface AppWindowMockupProps {
  children: React.ReactNode;
  delay?: number;
  width?: number;
  height?: number;
  title?: string;
}

export const AppWindowMockup: React.FC<AppWindowMockupProps> = ({
  children,
  delay = 0,
  width = 700,
  height = 400,
  title = "VoxGen",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SMOOTH,
  });

  const opacity = interpolate(entrance, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(entrance, [0, 1], [0.92, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const translateY = interpolate(entrance, [0, 1], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 18px",
          background: "rgba(255,255,255,0.02)",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLORS.red,
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLORS.yellow,
          }}
        />
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: COLORS.green,
          }}
        />
        <span
          style={{
            marginLeft: 12,
            fontSize: 13,
            color: COLORS.muted,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {title}
        </span>
      </div>

      {/* Body */}
      <div
        style={{
          padding: 40,
          minHeight: height - 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {children}
      </div>
    </div>
  );
};

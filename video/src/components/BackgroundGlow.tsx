import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

export const BackgroundGlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Slow floating motion driven by frame
  const floatY1 = interpolate(
    frame % (8 * fps),
    [0, 4 * fps, 8 * fps],
    [0, 30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const floatY2 = interpolate(
    frame % (10 * fps),
    [0, 5 * fps, 10 * fps],
    [0, -25, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      {/* Top-center purple orb */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          top: -200,
          left: "50%",
          transform: `translateX(-50%) translateY(${floatY1}px)`,
          background:
            "radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%)",
        }}
      />
      {/* Bottom-right blue orb */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          bottom: -100,
          right: -100,
          transform: `translateY(${floatY2}px)`,
          background:
            "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        }}
      />
    </div>
  );
};

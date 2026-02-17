import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Img,
  staticFile,
} from "remotion";
import { BOUNCY } from "../lib/springs";
import { COLORS, GRADIENT_BUTTON } from "../lib/colors";

interface LogoRevealProps {
  delay?: number;
}

export const LogoReveal: React.FC<LogoRevealProps> = ({ delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const iconProgress = spring({
    frame,
    fps,
    delay,
    config: BOUNCY,
  });

  const textProgress = spring({
    frame,
    fps,
    delay: delay + 8,
    config: { damping: 200 },
  });

  const iconScale = interpolate(iconProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textOpacity = interpolate(textProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textTranslateX = interpolate(textProgress, [0, 1], [-20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: GRADIENT_BUTTON,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${iconScale})`,
          boxShadow: `0 4px 24px ${COLORS.primaryGlow}`,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile("icon.png")}
          style={{ width: 48, height: 48 }}
        />
      </div>

      {/* Text */}
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: COLORS.text,
          fontFamily: "Inter, sans-serif",
          opacity: textOpacity,
          transform: `translateX(${textTranslateX}px)`,
        }}
      >
        VoxGen
      </div>
    </div>
  );
};

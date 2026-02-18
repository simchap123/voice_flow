import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS } from "../lib/colors";
import { SMOOTH } from "../lib/springs";
import { BackgroundGlow } from "../components/BackgroundGlow";
import { GradientText } from "../components/GradientText";

interface ProblemSceneProps {
  problemText: string;
  solutionText: string;
  solutionHighlight: string;
}

export const ProblemScene: React.FC<ProblemSceneProps> = ({
  problemText,
  solutionText,
  solutionHighlight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Problem text appears first
  const problemProgress = spring({
    frame,
    fps,
    delay: 10,
    config: SMOOTH,
  });

  const problemOpacity = interpolate(problemProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const problemTranslateY = interpolate(problemProgress, [0, 1], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Solution appears after a delay
  const solutionDelay = 60;
  const solutionProgress = spring({
    frame,
    fps,
    delay: solutionDelay,
    config: SMOOTH,
  });

  const solutionOpacity = interpolate(solutionProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const solutionTranslateY = interpolate(
    solutionProgress,
    [0, 1],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Build the solution text with inline highlight
  const parts = solutionText.split(solutionHighlight);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <BackgroundGlow />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 32,
        }}
      >
        {/* Problem statement */}
        <div
          style={{
            opacity: problemOpacity,
            transform: `translateY(${problemTranslateY}px)`,
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.muted,
            letterSpacing: "-0.01em",
          }}
        >
          {problemText}
        </div>

        {/* Solution statement */}
        <div
          style={{
            opacity: solutionOpacity,
            transform: `translateY(${solutionTranslateY}px)`,
            fontSize: 56,
            fontWeight: 800,
            color: COLORS.text,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
            gap: 12,
          }}
        >
          {parts[0]}
          <GradientText
            fontSize={56}
            fontWeight={800}
            delay={solutionDelay + 8}
          >
            {solutionHighlight}
          </GradientText>
          {parts[1] || ""}
        </div>
      </div>
    </AbsoluteFill>
  );
};

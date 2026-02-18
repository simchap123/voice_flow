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
import { LogoReveal } from "../components/LogoReveal";
import { GradientText } from "../components/GradientText";

interface IntroSceneProps {
  tagline: string;
  taglineHighlight: string;
}

export const IntroScene: React.FC<IntroSceneProps> = ({
  tagline,
  taglineHighlight,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Tagline appears after logo settles
  const taglineDelay = 30;

  const taglineProgress = spring({
    frame,
    fps,
    delay: taglineDelay,
    config: SMOOTH,
  });

  const taglineOpacity = interpolate(taglineProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineTranslateY = interpolate(taglineProgress, [0, 1], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          gap: 40,
        }}
      >
        {/* Logo spring-in */}
        <LogoReveal delay={10} />

        {/* Tagline with gradient highlight */}
        <div
          style={{
            opacity: taglineOpacity,
            transform: `translateY(${taglineTranslateY}px)`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: COLORS.text,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {tagline.split(taglineHighlight)[0]}
            <GradientText
              fontSize={64}
              fontWeight={800}
              delay={taglineDelay + 12}
            >
              {taglineHighlight}
            </GradientText>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

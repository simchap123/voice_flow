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
import { PricingCard } from "../components/PricingCard";

interface PricingTier {
  tier: string;
  price: string;
  suffix: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

interface PricingSceneProps {
  heading: string;
  tiers: [PricingTier, PricingTier, PricingTier];
}

export const PricingScene: React.FC<PricingSceneProps> = ({
  heading,
  tiers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headingProgress = spring({
    frame,
    fps,
    delay: 5,
    config: SMOOTH,
  });

  const headingOpacity = interpolate(headingProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const headingTranslateY = interpolate(
    headingProgress,
    [0, 1],
    [20, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

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
        }}
      >
        {/* Heading */}
        <div
          style={{
            opacity: headingOpacity,
            transform: `translateY(${headingTranslateY}px)`,
            fontSize: 40,
            fontWeight: 700,
            color: COLORS.text,
            marginBottom: 48,
            letterSpacing: "-0.01em",
          }}
        >
          {heading}
        </div>

        {/* 3 pricing cards */}
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {tiers.map((tier, i) => (
            <PricingCard
              key={i}
              tier={tier.tier}
              price={tier.price}
              suffix={tier.suffix}
              features={tier.features}
              highlighted={tier.highlighted}
              badge={tier.badge}
              delay={10 + i * 8}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

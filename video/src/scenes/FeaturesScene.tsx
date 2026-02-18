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
import { FeatureCard } from "../components/FeatureCard";

interface FeatureItem {
  title: string;
  description: string;
}

interface FeaturesSceneProps {
  heading: string;
  features: [FeatureItem, FeatureItem, FeatureItem, FeatureItem];
}

// SVG icons for the 4 features
const icons = [
  // Works Everywhere (pencil)
  <svg
    key="edit"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />
    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.855z" />
  </svg>,
  // AI Cleanup (sparkle)
  <svg
    key="sparkle"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.288L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.288Z" />
  </svg>,
  // Lightning Fast (clock)
  <svg
    key="clock"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>,
  // Private & Secure (shield)
  <svg
    key="shield"
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
  </svg>,
];

export const FeaturesScene: React.FC<FeaturesSceneProps> = ({
  heading,
  features,
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
          padding: "0 80px",
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

        {/* 2x2 grid of feature cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            width: "100%",
            maxWidth: 900,
          }}
        >
          {features.map((feature, i) => (
            <FeatureCard
              key={i}
              icon={icons[i]}
              title={feature.title}
              description={feature.description}
              delay={20 + i * 10}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

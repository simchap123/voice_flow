import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, GRADIENT_BUTTON, GRADIENT_CTA_BOX } from "../lib/colors";
import { SMOOTH, BOUNCY } from "../lib/springs";
import { BackgroundGlow } from "../components/BackgroundGlow";

interface CTASceneProps {
  ctaText: string;
  ctaButtonText: string;
  ctaUrl: string;
}

export const CTAScene: React.FC<CTASceneProps> = ({
  ctaText,
  ctaButtonText,
  ctaUrl,
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

  const buttonProgress = spring({
    frame,
    fps,
    delay: 20,
    config: BOUNCY,
  });

  const buttonScale = interpolate(buttonProgress, [0, 1], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const buttonOpacity = interpolate(buttonProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const urlProgress = spring({
    frame,
    fps,
    delay: 35,
    config: SMOOTH,
  });

  const urlOpacity = interpolate(urlProgress, [0, 1], [0, 1], {
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
        }}
      >
        {/* CTA box */}
        <div
          style={{
            background: GRADIENT_CTA_BOX,
            border: "1px solid rgba(124, 58, 237, 0.15)",
            borderRadius: 24,
            padding: "64px 80px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
          }}
        >
          {/* Heading */}
          <div
            style={{
              opacity: headingOpacity,
              transform: `translateY(${headingTranslateY}px)`,
              fontSize: 44,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: "-0.01em",
              textAlign: "center",
            }}
          >
            {ctaText}
          </div>

          {/* Download button */}
          <div
            style={{
              opacity: buttonOpacity,
              transform: `scale(${buttonScale})`,
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "18px 40px",
              background: GRADIENT_BUTTON,
              borderRadius: 14,
              fontSize: 20,
              fontWeight: 600,
              color: "white",
              boxShadow: `0 4px 24px ${COLORS.primaryGlow}, 0 1px 3px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Download icon */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            {ctaButtonText}
          </div>

          {/* URL */}
          <div
            style={{
              opacity: urlOpacity,
              fontSize: 16,
              color: COLORS.muted,
            }}
          >
            {ctaUrl}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

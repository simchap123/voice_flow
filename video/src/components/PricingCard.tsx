import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, GRADIENT_BUTTON } from "../lib/colors";
import { SNAPPY } from "../lib/springs";

interface PricingCardProps {
  tier: string;
  price: string;
  suffix: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  delay?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  price,
  suffix,
  features,
  highlighted = false,
  badge,
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

  const translateY = interpolate(progress, [0, 1], [50, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(progress, [0, 1], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        background: COLORS.card,
        border: highlighted
          ? `1px solid ${COLORS.primary}`
          : `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: "32px 28px",
        textAlign: "center",
        position: "relative",
        boxShadow: highlighted
          ? `0 0 30px ${COLORS.primaryGlow}`
          : "none",
        width: 260,
      }}
    >
      {/* Popular badge */}
      {badge && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            background: GRADIENT_BUTTON,
            color: "white",
            fontSize: 12,
            fontWeight: 600,
            padding: "4px 16px",
            borderRadius: 100,
            fontFamily: "Inter, sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </div>
      )}

      {/* Tier name */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.muted,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: 12,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {tier}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: COLORS.text,
          lineHeight: 1.1,
          marginBottom: 8,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {price}
        <span
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.muted,
          }}
        >
          {suffix}
        </span>
      </div>

      {/* Features list */}
      <div style={{ marginTop: 20, textAlign: "left" }}>
        {features.map((feature, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              fontSize: 14,
              color: COLORS.muted,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {/* Checkmark */}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "rgba(124, 58, 237, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="8"
                height="6"
                viewBox="0 0 8 6"
                fill="none"
              >
                <path
                  d="M1 3L3 5L7 1"
                  stroke={COLORS.primaryLight}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            {feature}
          </div>
        ))}
      </div>
    </div>
  );
};

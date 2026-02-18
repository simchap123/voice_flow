import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { COLORS, GRADIENT_BUTTON } from "../lib/colors";
import { SMOOTH } from "../lib/springs";

type MicState = "idle" | "recording" | "processing";

interface MicButtonMockupProps {
  state: MicState;
  size?: number;
  delay?: number;
}

export const MicButtonMockup: React.FC<MicButtonMockupProps> = ({
  state,
  size = 64,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    delay,
    config: SMOOTH,
  });

  const scale = interpolate(entrance, [0, 1], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse ring for recording state
  const pulseProgress = interpolate(
    frame % (2 * fps),
    [0, 2 * fps],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const pulseScale = state === "recording"
    ? interpolate(pulseProgress, [0, 1], [1, 1.8], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const pulseOpacity = state === "recording"
    ? interpolate(pulseProgress, [0, 0.5, 1], [0.4, 0.2, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Processing spinner rotation
  const spinRotation = state === "processing"
    ? interpolate(frame % fps, [0, fps], [0, 360], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  const bgColor =
    state === "recording"
      ? "#ef4444"
      : state === "processing"
      ? "rgba(124, 58, 237, 0.5)"
      : undefined;

  const bgGradient =
    state === "idle" ? GRADIENT_BUTTON : undefined;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: entrance,
      }}
    >
      {/* Pulse ring */}
      {state === "recording" && (
        <div
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            background: "rgba(239, 68, 68, 0.2)",
            transform: `scale(${pulseScale})`,
            opacity: pulseOpacity,
          }}
        />
      )}

      {/* Button */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: bgGradient || bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${scale})`,
          boxShadow:
            state === "recording"
              ? "0 4px 20px rgba(239, 68, 68, 0.3)"
              : `0 4px 20px ${COLORS.primaryGlow}`,
        }}
      >
        {state === "processing" ? (
          // Spinner
          <svg
            width={size * 0.45}
            height={size * 0.45}
            viewBox="0 0 24 24"
            fill="none"
            style={{ transform: `rotate(${spinRotation}deg)` }}
          >
            <path
              d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : state === "recording" ? (
          // Stop square
          <svg
            width={size * 0.35}
            height={size * 0.35}
            viewBox="0 0 24 24"
            fill="white"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        ) : (
          // Mic icon
          <svg
            width={size * 0.45}
            height={size * 0.45}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
        )}
      </div>
    </div>
  );
};

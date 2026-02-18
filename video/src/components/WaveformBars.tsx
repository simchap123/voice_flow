import React from "react";
import { useCurrentFrame, interpolate, random } from "remotion";

interface WaveformBarsProps {
  barCount?: number;
  width?: number;
  height?: number;
  active?: boolean;
  startFrame?: number;
}

export const WaveformBars: React.FC<WaveformBarsProps> = ({
  barCount = 24,
  width = 300,
  height = 60,
  active = true,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);

  const barWidth = (width / barCount) * 0.7;
  const gap = (width / barCount) * 0.3;
  const centerY = height / 2;

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Deterministic pseudo-random amplitude per bar, varying over time
        const seed = `waveform-bar-${i}`;
        const baseAmplitude = random(seed) * 0.6 + 0.2;

        // Oscillating height driven by frame
        const phase = random(`phase-${i}`) * Math.PI * 2;
        const speed = 0.08 + random(`speed-${i}`) * 0.06;

        const oscillation = active
          ? Math.sin(elapsed * speed + phase) * 0.5 + 0.5
          : 0;

        const amplitude = active ? baseAmplitude * oscillation : 0;

        // Fade in bars when activating
        const barOpacity = interpolate(
          elapsed,
          [0, 10],
          [0, active ? 1 : 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const barHeight = Math.max(3, amplitude * centerY * 0.9);

        // Purple HSL gradient based on amplitude (matches website waveform)
        const lightness = 40 + amplitude * 30;
        const color = `hsl(262, 83%, ${lightness}%)`;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: i * (barWidth + gap) + (width - barCount * (barWidth + gap)) / 2,
              top: centerY - barHeight,
              width: barWidth,
              height: barHeight * 2,
              opacity: barOpacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {/* Top bar (mirrored from center) */}
            <div
              style={{
                width: barWidth,
                height: barHeight,
                background: color,
                borderRadius: barWidth / 2,
              }}
            />
            {/* Bottom bar (mirrored from center) */}
            <div
              style={{
                width: barWidth,
                height: barHeight,
                background: color,
                borderRadius: barWidth / 2,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

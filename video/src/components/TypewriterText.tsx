import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { COLORS } from "../lib/colors";

interface TypewriterTextProps {
  text: string;
  startFrame?: number;
  charFrames?: number;
  fontSize?: number;
  color?: string;
  showCursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charFrames = 2,
  fontSize = 18,
  color = COLORS.text,
  showCursor = true,
}) => {
  const frame = useCurrentFrame();

  const elapsed = Math.max(0, frame - startFrame);
  const typedChars = Math.min(text.length, Math.floor(elapsed / charFrames));
  const typedText = text.slice(0, typedChars);

  const cursorBlinkFrames = 16;
  const cursorOpacity = showCursor
    ? interpolate(
        frame % cursorBlinkFrames,
        [0, cursorBlinkFrames / 2, cursorBlinkFrames],
        [1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : 0;

  return (
    <div
      style={{
        fontSize,
        color,
        fontFamily: "Inter, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <span>{typedText}</span>
      {showCursor && (
        <span
          style={{
            opacity: cursorOpacity,
            color: COLORS.primary,
            marginLeft: 1,
          }}
        >
          |
        </span>
      )}
    </div>
  );
};

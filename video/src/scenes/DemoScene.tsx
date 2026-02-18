import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
} from "remotion";
import { COLORS } from "../lib/colors";
import { SMOOTH } from "../lib/springs";
import { BackgroundGlow } from "../components/BackgroundGlow";
import { AppWindowMockup } from "../components/AppWindowMockup";
import { MicButtonMockup } from "../components/MicButtonMockup";
import { WaveformBars } from "../components/WaveformBars";
import { TypewriterText } from "../components/TypewriterText";
import { KeyBadge } from "../components/KeyBadge";

interface DemoSceneProps {
  hotkeyLabel: string;
  demoText: string;
}

export const DemoScene: React.FC<DemoSceneProps> = ({
  hotkeyLabel,
  demoText,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline:
  // 0-30:   App window fades in
  // 30-60:  "Press Alt" badge + idle mic
  // 60-90:  Mic transitions to recording, waveform appears
  // 90-210: Waveform animating + recording
  // 210-240: Processing state
  // 240-330: Typewriter text appears

  const phase =
    frame < 30
      ? "entering"
      : frame < 60
      ? "idle"
      : frame < 210
      ? "recording"
      : frame < 240
      ? "processing"
      : "typed";

  const micState =
    phase === "recording"
      ? "recording"
      : phase === "processing"
      ? "processing"
      : "idle";

  const showWaveform = phase === "recording";
  const showTypewriter = phase === "typed";

  // Instruction text fade
  const instructionProgress = spring({
    frame,
    fps,
    delay: 30,
    config: SMOOTH,
  });

  const instructionOpacity = interpolate(instructionProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out instruction when recording starts
  const instructionFadeOut =
    frame >= 60
      ? interpolate(frame, [60, 75], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  // Waveform fade in/out
  const waveformOpacity = interpolate(
    frame,
    [60, 75, 200, 210],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Typed result fade in
  const typedFadeIn =
    frame >= 240
      ? interpolate(frame, [240, 255], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 0;

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
        <AppWindowMockup delay={0} width={750} height={380}>
          {/* Instruction: Press Alt */}
          <div
            style={{
              opacity: instructionOpacity * instructionFadeOut,
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 18,
                color: COLORS.muted,
              }}
            >
              Press
            </span>
            <KeyBadge label={hotkeyLabel} delay={35} size="lg" />
            <span
              style={{
                fontSize: 18,
                color: COLORS.muted,
              }}
            >
              and speak
            </span>
          </div>

          {/* Mic button */}
          <MicButtonMockup state={micState} size={72} delay={25} />

          {/* Waveform */}
          <div style={{ opacity: waveformOpacity, height: 60 }}>
            <WaveformBars
              barCount={30}
              width={400}
              height={60}
              active={showWaveform}
              startFrame={60}
            />
          </div>

          {/* Typed result */}
          <div style={{ opacity: typedFadeIn, minHeight: 40 }}>
            {showTypewriter && (
              <TypewriterText
                text={demoText}
                startFrame={0}
                charFrames={1}
                fontSize={17}
                color={COLORS.text}
              />
            )}
          </div>
        </AppWindowMockup>
      </div>
    </AbsoluteFill>
  );
};

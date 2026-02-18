import React from "react";
import { staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { IntroScene } from "./scenes/IntroScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { DemoScene } from "./scenes/DemoScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { PricingScene } from "./scenes/PricingScene";
import { CTAScene } from "./scenes/CTAScene";
import type { z } from "zod";
import type { PromoVideoSchema } from "./Root";

// Transition duration between scenes (in frames)
const FADE_FRAMES = 15;

// Scene durations (in frames @ 30fps)
// These are "gross" durations - TransitionSeries will overlap by FADE_FRAMES at each cut
const SCENE_DURATIONS = {
  intro: 165,
  problem: 150,
  demo: 330,
  features: 240,
  pricing: 120,
  cta: 105,
} as const;

type PromoVideoProps = z.infer<typeof PromoVideoSchema>;

export const PromoVideo: React.FC<PromoVideoProps> = ({
  tagline,
  taglineHighlight,
  problemText,
  solutionText,
  solutionHighlight,
  hotkeyLabel,
  demoText,
  featuresHeading,
  feature1Title,
  feature1Desc,
  feature2Title,
  feature2Desc,
  feature3Title,
  feature3Desc,
  feature4Title,
  feature4Desc,
  pricingHeading,
  ctaText,
  ctaButtonText,
  ctaUrl,
  showVoiceover,
  showMusic,
}) => {
  return (
    <>
      {/* Voiceover narration */}
      {showVoiceover && (
        <Audio
          src={staticFile("voiceover.mp3")}
          volume={(f) => {
            // Fade in gently over first 15 frames
            if (f < 15) return f / 15;
            return 1;
          }}
        />
      )}

      {/* Background music (ducked under voiceover) */}
      {showMusic && (
        <Audio
          src={staticFile("music.mp3")}
          volume={(f) => {
            const baseVolume = 0.15;
            // Fade in over first 30 frames, fade out over last 45 frames
            if (f < 30) return (f / 30) * baseVolume;
            if (f > 990) return Math.max(0, ((1035 - f) / 45) * baseVolume);
            return baseVolume;
          }}
        />
      )}

      <TransitionSeries>
        {/* Scene 1: Intro/Hook */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.intro}>
          <IntroScene
            tagline={tagline}
            taglineHighlight={taglineHighlight}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 2: Problem */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.problem}>
          <ProblemScene
            problemText={problemText}
            solutionText={solutionText}
            solutionHighlight={solutionHighlight}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 3: Demo */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.demo}>
          <DemoScene hotkeyLabel={hotkeyLabel} demoText={demoText} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 4: Features */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.features}>
          <FeaturesScene
            heading={featuresHeading}
            features={[
              { title: feature1Title, description: feature1Desc },
              { title: feature2Title, description: feature2Desc },
              { title: feature3Title, description: feature3Desc },
              { title: feature4Title, description: feature4Desc },
            ]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 5: Pricing */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.pricing}>
          <PricingScene
            heading={pricingHeading}
            tiers={[
              {
                tier: "Monthly",
                price: "$8",
                suffix: "/mo",
                features: [
                  "Unlimited dictation",
                  "Cloud STT",
                  "AI text cleanup",
                ],
              },
              {
                tier: "Yearly",
                price: "$48",
                suffix: "/yr",
                features: [
                  "Everything in Monthly",
                  "Save 50%",
                  "Priority support",
                ],
                highlighted: true,
                badge: "Best Value",
              },
              {
                tier: "Lifetime",
                price: "$39",
                suffix: " once",
                features: [
                  "Everything in Pro",
                  "Pay once forever",
                  "All future updates",
                ],
              },
            ]}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: FADE_FRAMES })}
        />

        {/* Scene 6: CTA */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
          <CTAScene
            ctaText={ctaText}
            ctaButtonText={ctaButtonText}
            ctaUrl={ctaUrl}
          />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};

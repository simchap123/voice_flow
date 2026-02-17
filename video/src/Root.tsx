import "./style.css";
import React from "react";
import { Composition } from "remotion";
import { z } from "zod";
import { PromoVideo } from "./PromoVideo";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

// Zod schema - all text is parametrizable via Remotion Studio sidebar
export const PromoVideoSchema = z.object({
  // Scene 1: Intro
  tagline: z.string().default("Type with your voice"),
  taglineHighlight: z.string().default("voice"),

  // Scene 2: Problem
  problemText: z.string().default("Typing is slow."),
  solutionText: z.string().default("Speaking is 3x faster."),
  solutionHighlight: z.string().default("3x faster."),

  // Scene 3: Demo
  hotkeyLabel: z.string().default("Alt"),
  demoText: z
    .string()
    .default(
      "I wanted to schedule a meeting for tomorrow afternoon to discuss the quarterly results."
    ),

  // Scene 4: Features
  featuresHeading: z.string().default("Everything you need"),
  feature1Title: z.string().default("Works Everywhere"),
  feature1Desc: z
    .string()
    .default("Any text field, any app. Emails, docs, chat, code editors."),
  feature2Title: z.string().default("AI Text Cleanup"),
  feature2Desc: z
    .string()
    .default('Removes "um", filler words, and fixes grammar automatically.'),
  feature3Title: z.string().default("Lightning Fast"),
  feature3Desc: z
    .string()
    .default("Groq Whisper transcribes in under a second."),
  feature4Title: z.string().default("Private & Secure"),
  feature4Desc: z
    .string()
    .default("Your API key stays on your device. No middleman servers."),

  // Scene 5: Pricing
  pricingHeading: z.string().default("Simple pricing"),

  // Scene 6: CTA
  ctaText: z.string().default("Ready to start dictating?"),
  ctaButtonText: z.string().default("Download Free"),
  ctaUrl: z.string().default("voxgen.app"),

  // Audio toggles
  showVoiceover: z.boolean().default(true),
  showMusic: z.boolean().default(true),
});

// Total duration calculation:
// 6 scenes + 5 transitions (15 frames each)
// 165 + 150 + 330 + 240 + 120 + 105 = 1110 scene frames
// 5 * 15 = 75 overlap frames
// Total = 1110 - 75 = 1035 frames ~ 34.5 seconds
const TOTAL_DURATION = 1035;

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="PromoVideo"
      component={PromoVideo}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
      schema={PromoVideoSchema}
      defaultProps={{
        tagline: "Type with your voice",
        taglineHighlight: "voice",
        problemText: "Typing is slow.",
        solutionText: "Speaking is 3x faster.",
        solutionHighlight: "3x faster.",
        hotkeyLabel: "Alt",
        demoText:
          "I wanted to schedule a meeting for tomorrow afternoon to discuss the quarterly results.",
        featuresHeading: "Everything you need",
        feature1Title: "Works Everywhere",
        feature1Desc:
          "Any text field, any app. Emails, docs, chat, code editors.",
        feature2Title: "AI Text Cleanup",
        feature2Desc:
          'Removes "um", filler words, and fixes grammar automatically.',
        feature3Title: "Lightning Fast",
        feature3Desc: "Groq Whisper transcribes in under a second.",
        feature4Title: "Private & Secure",
        feature4Desc:
          "Your API key stays on your device. No middleman servers.",
        pricingHeading: "Simple pricing",
        ctaText: "Ready to start dictating?",
        ctaButtonText: "Download Free",
        ctaUrl: "voxgen.app",
        showVoiceover: true,
        showMusic: true,
      }}
    />
  );
};

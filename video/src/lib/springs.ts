import type { SpringConfig } from "remotion";

export const SMOOTH: Partial<SpringConfig> = { damping: 200 };
export const SNAPPY: Partial<SpringConfig> = { damping: 20, stiffness: 200 };
export const BOUNCY: Partial<SpringConfig> = { damping: 8 };
export const GENTLE: Partial<SpringConfig> = { damping: 15, stiffness: 80, mass: 2 };

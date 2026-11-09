/**
 * Adaptive quality governor (SPEC B4). Pure state machine: feed it frame times,
 * it answers which quality tier to render at. Hysteresis avoids oscillation.
 */
export interface QualityTier {
  /** Nebula framebuffer scale relative to the canvas. */
  fboScale: number;
  /** Fraction of the particle buffer to draw. */
  particleFraction: number;
  /** Device-pixel-ratio cap for the canvas. */
  dprCap: number;
}

export const TIERS: readonly QualityTier[] = [
  { fboScale: 0.25, particleFraction: 0.25, dprCap: 1 },
  { fboScale: 0.35, particleFraction: 0.5, dprCap: 1 },
  { fboScale: 0.5, particleFraction: 0.75, dprCap: 1.5 },
  { fboScale: 0.6, particleFraction: 1, dprCap: 2 },
];

export interface GovernorOptions {
  targetMs: number; // frame budget (16.7 ≈ 60 fps)
  slackMs: number; // tolerance above target before degrading
  smoothing: number; // EMA factor (0..1), higher = more reactive
  upgradeAfterFrames: number; // sustained good frames before upgrading
  cooldownFrames: number; // frames to wait after any change
}

export const DEFAULT_GOVERNOR: GovernorOptions = {
  targetMs: 16.7,
  slackMs: 4,
  smoothing: 0.08,
  upgradeAfterFrames: 180,
  cooldownFrames: 60,
};

export interface GovernorState {
  tier: number;
  avgMs: number;
  goodFrames: number;
  cooldown: number;
}

export function createGovernor(startTier = 2, opts = DEFAULT_GOVERNOR): GovernorState {
  return {
    tier: clampTier(startTier),
    avgMs: opts.targetMs,
    goodFrames: 0,
    cooldown: opts.cooldownFrames,
  };
}

/** Returns the next state. Huge deltas (tab switch, debugger) are ignored. */
export function updateGovernor(
  state: GovernorState,
  frameMs: number,
  opts = DEFAULT_GOVERNOR,
): GovernorState {
  if (!Number.isFinite(frameMs) || frameMs <= 0 || frameMs > 250) return state;

  const avgMs = state.avgMs + (frameMs - state.avgMs) * opts.smoothing;
  if (state.cooldown > 0) return { ...state, avgMs, cooldown: state.cooldown - 1 };

  if (avgMs > opts.targetMs + opts.slackMs && state.tier > 0) {
    return {
      tier: state.tier - 1,
      avgMs: opts.targetMs,
      goodFrames: 0,
      cooldown: opts.cooldownFrames,
    };
  }

  const goodFrames = avgMs < opts.targetMs * 0.85 ? state.goodFrames + 1 : 0;
  if (goodFrames >= opts.upgradeAfterFrames && state.tier < TIERS.length - 1) {
    return { tier: state.tier + 1, avgMs, goodFrames: 0, cooldown: opts.cooldownFrames };
  }
  return { ...state, avgMs, goodFrames };
}

const LOWEST: QualityTier = { fboScale: 0.25, particleFraction: 0.25, dprCap: 1 };

export function tierAt(index: number): QualityTier {
  return TIERS[clampTier(index)] ?? LOWEST;
}

function clampTier(i: number): number {
  return Math.min(TIERS.length - 1, Math.max(0, Math.round(i)));
}

/**
 * Software rasterizers (SwiftShader, llvmpipe, Microsoft Basic Render) run shaders on the CPU.
 * The background would saturate a core there, so those get the CSS fallback (audit fix H).
 */
export function isSoftwareRenderer(renderer: string): boolean {
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer);
}

/**
 * Whether a viewport change should reallocate the canvas. Mobile URL bars change the height
 * by a few percent on every scroll direction change; reallocating GPU buffers then causes
 * jank, and CSS stretching a noise field by <20% is invisible (audit fix F).
 */
export function shouldResizeCanvas(
  current: { width: number; height: number },
  next: { width: number; height: number },
  heightTolerance = 0.2,
): boolean {
  if (current.width !== next.width) return true;
  if (current.height <= 1) return next.height !== current.height;
  return Math.abs(next.height - current.height) / current.height > heightTolerance;
}

/** Frame pacing: render at most ~60 fps, even on 120/144/240 Hz displays (audit fix G). */
export const FRAME_INTERVAL_MS = 1000 / 60;

export function nextFrameDue(due: number, now: number, interval = FRAME_INTERVAL_MS): number {
  // Advance on a fixed grid so the average stays at the target rate; resync after stalls.
  const next = due + interval;
  return now - next > interval ? now + interval : next;
}

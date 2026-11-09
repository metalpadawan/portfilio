import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GOVERNOR,
  FRAME_INTERVAL_MS,
  TIERS,
  createGovernor,
  isSoftwareRenderer,
  nextFrameDue,
  shouldResizeCanvas,
  tierAt,
  updateGovernor,
} from '../src/bg/quality';

function run(start: number, frameMs: number, frames: number) {
  let s = createGovernor(start);
  for (let i = 0; i < frames; i++) s = updateGovernor(s, frameMs);
  return s;
}

describe('quality governor', () => {
  it('degrades under sustained slow frames, never below tier 0', () => {
    expect(run(3, 40, 120).tier).toBeLessThan(3);
    expect(run(3, 40, 5000).tier).toBe(0);
  });

  it('upgrades after sustained fast frames, never above the top tier', () => {
    expect(run(0, 8, 5000).tier).toBe(TIERS.length - 1);
  });

  it('holds steady at the target frame time (hysteresis)', () => {
    expect(run(2, DEFAULT_GOVERNOR.targetMs, 2000).tier).toBe(2);
  });

  it('ignores outlier deltas from tab switches', () => {
    const s = createGovernor(2);
    expect(updateGovernor(s, 5000)).toBe(s);
    expect(updateGovernor(s, Number.NaN)).toBe(s);
  });

  it('clamps tier lookups', () => {
    expect(tierAt(-5)).toEqual(TIERS[0]);
    expect(tierAt(99)).toEqual(TIERS[TIERS.length - 1]);
  });
});

describe('background helpers (audit fixes F, G, H)', () => {
  it('detects software renderers but not real GPUs', () => {
    expect(
      isSoftwareRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader)'),
    ).toBe(true);
    expect(isSoftwareRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true);
    expect(isSoftwareRenderer('ANGLE (Microsoft, Microsoft Basic Render Driver Direct3D11)')).toBe(
      true,
    );
    expect(isSoftwareRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11)')).toBe(false);
    expect(isSoftwareRenderer('Apple M2')).toBe(false);
  });

  it('ignores small height-only changes (mobile URL bar) but not width changes', () => {
    const current = { width: 1170, height: 2200 };
    expect(shouldResizeCanvas(current, { width: 1170, height: 2050 })).toBe(false);
    expect(shouldResizeCanvas(current, { width: 1170, height: 1500 })).toBe(true);
    expect(shouldResizeCanvas(current, { width: 2200, height: 1170 })).toBe(true);
    expect(shouldResizeCanvas({ width: 300, height: 150 }, { width: 300, height: 900 })).toBe(true);
  });

  it('paces frames at ~60 fps on a 144 Hz display', () => {
    const vsync = 1000 / 144;
    let due = 0;
    let rendered = 0;
    let last = 0;
    for (let i = 1; i <= 144 * 5; i++) {
      const now = i * vsync;
      if (last && now < due - 1) continue;
      due = last ? nextFrameDue(due, now) : now + FRAME_INTERVAL_MS;
      last = now;
      rendered++;
    }
    expect(rendered / 5).toBeGreaterThan(55);
    expect(rendered / 5).toBeLessThan(65);
  });

  it('resyncs after a long stall instead of bursting to catch up', () => {
    expect(nextFrameDue(100, 5000)).toBeCloseTo(5000 + FRAME_INTERVAL_MS);
  });
});

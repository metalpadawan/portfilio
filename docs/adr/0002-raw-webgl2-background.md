# ADR-0002: Raw WebGL2 multi-pass background (no three.js)

- Status: Accepted · Date: 2026-11-09

## Context

The owner wants an "advanced level" background animation. Options:

1. CSS gradients or Canvas 2D: cheap, but they look ordinary and particle counts are CPU-bound.
2. three.js: powerful, but ~150 kB and a scene graph we would barely use.
3. Raw WebGL2 with hand-written shaders: full control, ~6 kB of code.

## Decision

Raw WebGL2 with three passes: low-resolution domain-warped fBm nebula into a
framebuffer, a composite upscale with vignette and grain, then additive GPU
particles whose motion is computed statelessly in the vertex shader. An adaptive
quality governor holds the frame rate.

## Consequences

- ➕ Real GPU techniques (FBO render-to-texture, procedural noise, curl flow,
  additive blending) at a tiny size.
- ➕ Rendering the nebula at low resolution makes the expensive fragment shader cheap.
- ➖ More low-level code to maintain, so resource handling is isolated in `bg/gl.ts`.
- ➖ WebGL2 is missing on a few old browsers, which get the CSS fallback (B7).

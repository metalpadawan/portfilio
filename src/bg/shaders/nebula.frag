#version 300 es
// Pass 1: domain-warped fractal Brownian motion "nebula" (rendered at low resolution).
// Technique: f(p + 4·r), r = fbm(p + 4·q), q = fbm(p), after Inigo Quilez's domain warping.
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform vec2 uResolution;   // framebuffer size in pixels
uniform float uTime;        // seconds
uniform float uScroll;      // page scroll in viewport heights
uniform vec2 uPointer;      // smoothed pointer, 0..1 (y up)

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Smooth value noise with quintic interpolation.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8); // rotate octaves to hide grid artifacts

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p = ROT * p * 2.02;
    amp *= 0.5;
  }
  return value;
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) * 2.4;
  p.y -= uScroll * 0.35;                       // scroll parallax
  p += (uPointer - 0.5) * 0.25;                // subtle pointer drift

  float t = uTime * 0.035;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 1.6), fbm(p + 4.0 * q + vec2(8.3, 2.8) - t * 1.2));
  float f = fbm(p + 4.0 * r);

  // Palette: deep space → indigo → teal, with a magenta ridge along warp edges.
  vec3 base = vec3(0.012, 0.016, 0.04);
  vec3 indigo = vec3(0.13, 0.08, 0.36);
  vec3 teal = vec3(0.02, 0.42, 0.45);
  vec3 magenta = vec3(0.55, 0.12, 0.42);

  vec3 col = mix(base, indigo, clamp(f * f * 2.2, 0.0, 1.0));
  col = mix(col, teal, clamp(length(q) * 0.6 - 0.12, 0.0, 1.0) * 0.9);
  col = mix(col, magenta, clamp(r.x * r.x * 1.1 - 0.12, 0.0, 1.0) * 0.6);
  col *= 0.5 + 1.25 * f * f;                  // carve dark voids for text contrast (scrim adds more)

  outColor = vec4(col, 1.0);
}

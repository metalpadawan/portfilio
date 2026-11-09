#version 300 es
// Pass 3: stateless GPU particles (SPEC B2). Each vertex stores only random seeds;
// position is a pure function of (seed, time, scroll, pointer), so the CPU does no per-frame work.
precision highp float;

layout(location = 0) in vec4 aSeed; // xy: start position, z: depth, w: phase

uniform vec2 uResolution;
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointer;      // 0..1 (y up)
uniform float uPointerActive;
uniform float uDpr;

out float vAlpha;
out vec3 vColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// 2D curl of a scalar noise field: divergence-free, so particles swirl instead of clumping.
vec2 curl(vec2 p) {
  const float e = 0.08;
  float n1 = noise(p + vec2(0.0, e));
  float n2 = noise(p - vec2(0.0, e));
  float n3 = noise(p + vec2(e, 0.0));
  float n4 = noise(p - vec2(e, 0.0));
  return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
}

void main() {
  float depth = aSeed.z;                       // 0 = far, 1 = near
  float aspect = uResolution.x / uResolution.y;
  float t = uTime;

  // Slow drift (nearer = faster) wrapped to [0,1); scroll parallax scales with depth.
  vec2 drift = vec2(0.006, 0.012) * (0.4 + depth) * t;
  vec2 uv = fract(aSeed.xy + drift + vec2(0.0, uScroll * (0.08 + depth * 0.22)));

  // Curl-noise flow displacement.
  vec2 flow = curl(uv * 3.0 + vec2(t * 0.03, -t * 0.02) + aSeed.w * 7.0);
  vec2 world = (uv - 0.5) * vec2(aspect, 1.0) + flow * 0.035 * (0.5 + depth);

  // Pointer interaction: repel + swirl inside a soft radius.
  vec2 pointer = (uPointer - 0.5) * vec2(aspect, 1.0);
  vec2 toP = world - pointer;
  float dist = length(toP);
  // Note: smoothstep requires edge0 < edge1 (reversed edges are undefined in GLSL), hence 1 - smoothstep.
  float influence = uPointerActive * (1.0 - smoothstep(0.0, 0.28, dist)) * (0.4 + depth);
  vec2 dir = dist > 1e-4 ? toP / dist : vec2(0.0);
  world += (dir * 0.07 + vec2(-dir.y, dir.x) * 0.05) * influence;

  gl_Position = vec4(world.x / aspect * 2.0, world.y * 2.0, 0.0, 1.0);

  // Twinkle, edge fade (hide wrap-around pops) and depth-based size.
  float twinkle = 0.55 + 0.45 * sin(t * (0.6 + aSeed.w * 2.0) + aSeed.w * 40.0);
  vec2 edge = smoothstep(0.0, 0.06, uv) * (1.0 - smoothstep(0.94, 1.0, uv));
  vAlpha = twinkle * edge.x * edge.y * mix(0.25, 0.9, depth) * (1.0 + influence * 1.5);
  gl_PointSize = mix(1.0, 3.2, depth * depth) * uDpr;

  vec3 cool = vec3(0.45, 0.95, 0.88);  // mint
  vec3 violet = vec3(0.70, 0.60, 1.0);
  vec3 warm = vec3(1.0, 0.78, 0.55);
  vColor = mix(violet, cool, depth);
  vColor = mix(vColor, warm, step(0.965, fract(aSeed.w * 13.7))); // ~3.5% warm sparks
}

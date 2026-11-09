#version 300 es
// Pass 2: bilinear upscale of the low-res nebula + pointer glow + vignette + film grain.
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uScene;
uniform vec2 uResolution;   // canvas size in pixels
uniform vec2 uPointer;      // 0..1 (y up)
uniform float uTime;

float grain(vec2 p, float t) {
  return fract(sin(dot(p + t, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 col = texture(uScene, vUv).rgb;

  float aspect = uResolution.x / uResolution.y;
  vec2 d = (vUv - uPointer) * vec2(aspect, 1.0);
  col += vec3(0.10, 0.22, 0.26) * exp(-dot(d, d) * 9.0) * 0.55; // soft light following the pointer

  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 1.1;                                 // vignette

  col += (grain(gl_FragCoord.xy, fract(uTime)) - 0.5) * 0.025;  // dither banding away
  outColor = vec4(max(col, 0.0), 1.0);
}

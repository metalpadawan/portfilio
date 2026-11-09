#version 300 es
precision mediump float;

in float vAlpha;
in vec3 vColor;
out vec4 outColor;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = dot(c, c);
  if (d > 0.25) discard;
  float soft = exp(-d * 14.0);               // gaussian falloff → soft glow
  outColor = vec4(vColor * soft * vAlpha, 1.0); // additive: alpha unused (ONE, ONE)
}

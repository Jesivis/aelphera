precision mediump float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D heightMap;
uniform float displacementScale;
uniform vec2 repeat;

void main() {
  vUv = uv * repeat;
  float h = texture2D(heightMap, uv).r;
  vec3 displaced = position + normal * (h * displacementScale);
  vPosition = displaced;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}

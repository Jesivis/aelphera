precision mediump float;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

uniform sampler2D heightMap;
uniform sampler2D sandMap;
uniform sampler2D grassMap;
uniform sampler2D rockMap;
uniform sampler2D lavaMap;
uniform sampler2D iceMap;

uniform float seaLevel;
uniform float displacementScale;
uniform vec2 repeat;
uniform vec3 lightDir;

float slopeFactor(vec3 n) {
  return clamp(1.0 - dot(normalize(n), vec3(0.0, 1.0, 0.0)), 0.0, 1.0);
}

vec3 tonemap(vec3 c) {
  return pow(clamp(c, 0.0, 1.0), vec3(1.0/2.2));
}

void main() {
  float h = texture2D(heightMap, vUv).r;
  float s = slopeFactor(vNormal);

  float weightSand = smoothstep(0.0, 0.08, 0.12 - (h));
  float weightIce = smoothstep(0.9, 1.0, h) * (1.0 - s);
  float weightLava = 0.0;
  float weightGrass = smoothstep(0.06, 0.6, h) * (1.0 - s);
  float weightRock = smoothstep(0.4, 0.95, h) * s;

  vec3 sandCol = texture2D(sandMap, vUv * repeat).rgb;
  vec3 grassCol = texture2D(grassMap, vUv * repeat).rgb;
  vec3 rockCol = texture2D(rockMap, vUv * repeat).rgb;
  vec3 lavaCol = texture2D(lavaMap, vUv * repeat).rgb;
  vec3 iceCol = texture2D(iceMap, vUv * repeat).rgb;

  float wSum = weightSand + weightGrass + weightRock + weightIce + weightLava + 1e-6;
  vec3 col = (sandCol * weightSand + grassCol * weightGrass + rockCol * weightRock + iceCol * weightIce + lavaCol * weightLava) / wSum;

  vec3 n = normalize(vNormal);
  float lambert = clamp(dot(n, normalize(lightDir)), 0.0, 1.0) * 0.8 + 0.2;

  col *= lambert;

  gl_FragColor = vec4(tonemap(col), 1.0);
}

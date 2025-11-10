uniform sampler2D heightMap;
uniform float displacementScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vElevation;

void main() {
  vUv = uv;
  
  // Sample heightmap for displacement
  float height = texture2D(heightMap, uv).r;
  vElevation = height;
  
  // Displace vertex along normal
  vec3 displaced = position + normal * height * displacementScale;
  vPosition = displaced;
  
  // Calculate normal by sampling neighboring heightmap values
  float texelSize = 1.0 / 512.0;
  float heightL = texture2D(heightMap, uv + vec2(-texelSize, 0.0)).r;
  float heightR = texture2D(heightMap, uv + vec2(texelSize, 0.0)).r;
  float heightD = texture2D(heightMap, uv + vec2(0.0, -texelSize)).r;
  float heightU = texture2D(heightMap, uv + vec2(0.0, texelSize)).r;
  
  vec3 tangent = normalize(vec3(2.0 * texelSize * displacementScale, heightR - heightL, 0.0));
  vec3 bitangent = normalize(vec3(0.0, heightU - heightD, 2.0 * texelSize * displacementScale));
  vNormal = normalize(cross(tangent, bitangent));
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}

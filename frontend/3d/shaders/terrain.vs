// Terrain Vertex Shader
// Handles displacement mapping from heightmap

uniform sampler2D heightmap;
uniform float heightScale;
uniform float texelSize; // Size of one texel in UV space (1.0 / heightmapResolution)

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vElevation;

void main() {
  vUv = uv;
  
  // Sample heightmap to get elevation
  vec4 heightData = texture2D(heightmap, uv);
  float height = heightData.r; // Use red channel (grayscale)
  
  // Store elevation for fragment shader
  vElevation = height;
  
  // Displace vertex position based on height
  vec3 newPosition = position;
  newPosition.y += height * heightScale;
  
  // Store position for lighting calculations
  vPosition = newPosition;
  
  // Calculate normal for lighting
  // Sample neighboring heightmap values to compute gradient
  float heightL = texture2D(heightmap, uv + vec2(-texelSize, 0.0)).r;
  float heightR = texture2D(heightmap, uv + vec2(texelSize, 0.0)).r;
  float heightD = texture2D(heightmap, uv + vec2(0.0, -texelSize)).r;
  float heightU = texture2D(heightmap, uv + vec2(0.0, texelSize)).r;
  
  // Compute gradient (slope)
  vec3 tangent = normalize(vec3(2.0 * texelSize, (heightR - heightL) * heightScale, 0.0));
  vec3 bitangent = normalize(vec3(0.0, (heightU - heightD) * heightScale, 2.0 * texelSize));
  
  // Normal is cross product of tangent and bitangent
  vNormal = normalize(cross(tangent, bitangent));
  
  // Transform to clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}

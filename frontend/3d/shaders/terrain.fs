// Terrain Fragment Shader
// Blends 5 terrain materials (sand, grass, rock, lava, ice) based on elevation and slope

uniform sampler2D sandTexture;
uniform sampler2D grassTexture;
uniform sampler2D rockTexture;
uniform sampler2D lavaTexture;
uniform sampler2D iceTexture;

// Elevation thresholds (normalized 0-1)
uniform float sandLevel;      // 0.15
uniform float grassLevel;     // 0.35
uniform float rockLevel;      // 0.55
uniform float lavaLevel;      // 0.75
uniform float iceLevel;       // 0.90
uniform float blendSharpness; // Controls transition smoothness

varying vec2 vUv;
varying vec3 vPosition;
varying vec3 vNormal;
varying float vElevation;

// Smooth blend function using smoothstep
float blendFactor(float value, float threshold, float width) {
  return smoothstep(threshold - width, threshold + width, value);
}

void main() {
  // Sample all texture atlases
  vec4 sandColor = texture2D(sandTexture, vUv * 8.0);
  vec4 grassColor = texture2D(grassTexture, vUv * 8.0);
  vec4 rockColor = texture2D(rockTexture, vUv * 8.0);
  vec4 lavaColor = texture2D(lavaTexture, vUv * 8.0);
  vec4 iceColor = texture2D(iceTexture, vUv * 8.0);
  
  // Calculate slope from normal (steeper = higher slope value)
  float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
  
  // Initialize weights for each material
  float sandWeight = 0.0;
  float grassWeight = 0.0;
  float rockWeight = 0.0;
  float lavaWeight = 0.0;
  float iceWeight = 0.0;
  
  // Elevation-based blending with smooth transitions
  // Sand (low elevation)
  if (vElevation < sandLevel + blendSharpness) {
    sandWeight = 1.0 - blendFactor(vElevation, sandLevel, blendSharpness);
  }
  
  // Grass (low to medium elevation)
  if (vElevation > sandLevel - blendSharpness && vElevation < grassLevel + blendSharpness) {
    float start = blendFactor(vElevation, sandLevel, blendSharpness);
    float end = 1.0 - blendFactor(vElevation, grassLevel, blendSharpness);
    grassWeight = start * end;
  }
  
  // Rock (medium elevation or steep slopes)
  if (vElevation > grassLevel - blendSharpness && vElevation < rockLevel + blendSharpness) {
    float start = blendFactor(vElevation, grassLevel, blendSharpness);
    float end = 1.0 - blendFactor(vElevation, rockLevel, blendSharpness);
    rockWeight = start * end;
  }
  
  // Add rock on steep slopes regardless of elevation
  if (slope > 0.3) {
    rockWeight += smoothstep(0.3, 0.6, slope) * 0.5;
  }
  
  // Lava (high elevation)
  if (vElevation > rockLevel - blendSharpness && vElevation < lavaLevel + blendSharpness) {
    float start = blendFactor(vElevation, rockLevel, blendSharpness);
    float end = 1.0 - blendFactor(vElevation, lavaLevel, blendSharpness);
    lavaWeight = start * end;
  }
  
  // Ice (highest elevation)
  if (vElevation > lavaLevel - blendSharpness) {
    iceWeight = blendFactor(vElevation, lavaLevel, blendSharpness);
  }
  
  // Normalize weights so they sum to 1.0
  float totalWeight = sandWeight + grassWeight + rockWeight + lavaWeight + iceWeight;
  if (totalWeight > 0.0) {
    sandWeight /= totalWeight;
    grassWeight /= totalWeight;
    rockWeight /= totalWeight;
    lavaWeight /= totalWeight;
    iceWeight /= totalWeight;
  } else {
    // Fallback to grass if no weights
    grassWeight = 1.0;
  }
  
  // Blend colors based on weights
  vec4 finalColor = 
    sandColor * sandWeight +
    grassColor * grassWeight +
    rockColor * rockWeight +
    lavaColor * lavaWeight +
    iceColor * iceWeight;
  
  // Simple directional lighting
  vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
  float diffuse = max(dot(vNormal, lightDir), 0.0);
  float ambient = 0.4;
  float lighting = ambient + diffuse * 0.6;
  
  // Apply lighting
  finalColor.rgb *= lighting;
  
  // Optional: Add glow effect for lava
  if (lavaWeight > 0.1) {
    finalColor.rgb += vec3(1.0, 0.3, 0.0) * lavaWeight * 0.3;
  }
  
  gl_FragColor = finalColor;
}

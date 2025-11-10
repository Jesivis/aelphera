uniform sampler2D heightMap;
uniform sampler2D terrainSand;
uniform sampler2D terrainGrass;
uniform sampler2D terrainRock;
uniform sampler2D terrainLava;
uniform sampler2D terrainIce;
uniform float seaLevel;
uniform float repeat;
uniform vec3 lightDir;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying float vElevation;

// Simple tonemapping
vec3 tonemap(vec3 color) {
  return color / (color + vec3(1.0));
}

void main() {
  // Sample terrain textures with tiling
  vec2 tiledUV = vUv * repeat;
  vec3 sand = texture2D(terrainSand, tiledUV).rgb;
  vec3 grass = texture2D(terrainGrass, tiledUV).rgb;
  vec3 rock = texture2D(terrainRock, tiledUV).rgb;
  vec3 lava = texture2D(terrainLava, tiledUV).rgb;
  vec3 ice = texture2D(terrainIce, tiledUV).rgb;
  
  // Calculate slope from normal
  float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
  
  // Blend materials based on elevation and slope
  vec3 color = vec3(0.0);
  
  // Sand (low elevation, < 0.2)
  float sandMix = smoothstep(0.25, 0.15, vElevation);
  color = mix(color, sand, sandMix);
  
  // Grass (medium elevation, 0.2-0.5)
  float grassMix = smoothstep(0.15, 0.25, vElevation) * (1.0 - smoothstep(0.45, 0.55, vElevation));
  grassMix *= smoothstep(0.6, 0.3, slope); // Less grass on steep slopes
  color = mix(color, grass, grassMix);
  
  // Rock (high elevation or steep slopes, 0.5-0.8)
  float rockMix = smoothstep(0.45, 0.55, vElevation) * (1.0 - smoothstep(0.75, 0.85, vElevation));
  rockMix += smoothstep(0.3, 0.6, slope) * 0.7; // More rock on steep slopes
  rockMix = clamp(rockMix, 0.0, 1.0);
  color = mix(color, rock, rockMix);
  
  // Ice (very high elevation, > 0.8)
  float iceMix = smoothstep(0.75, 0.85, vElevation);
  color = mix(color, ice, iceMix);
  
  // Lava (special areas - heightmap generator marks these)
  // Check for very low red values in specific regions as marker
  float lavaMarker = step(vElevation, 0.1) * step(0.05, vElevation);
  float lavaMix = lavaMarker * smoothstep(0.4, 0.5, slope);
  color = mix(color, lava * 1.5, lavaMix * 0.0); // Lava blending disabled by default
  
  // Basic Lambert lighting
  vec3 lightDirection = normalize(lightDir);
  float ndl = max(dot(vNormal, lightDirection), 0.0);
  float ambient = 0.3;
  float diffuse = ndl * 0.7;
  float lighting = ambient + diffuse;
  
  color *= lighting;
  
  // Apply tonemapping
  color = tonemap(color);
  
  // Gamma correction
  color = pow(color, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(color, 1.0);
}

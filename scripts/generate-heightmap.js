#!/usr/bin/env node
/**
 * generate-heightmap.js
 * 
 * Generates a 512x512 grayscale PNG heightmap from GeoJSON data.
 * Reads neighborhoods.geojson and lots.geojson, computes elevation based on:
 * - Neighborhood category (residential, commercial, volcanic, etc.)
 * - Lot elevation values
 * - Procedural Perlin noise for natural variation
 * - Special terrain types (lava, ice) from properties.terrain
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.error('Error: canvas module not found.');
  console.error('Please install it with: npm install canvas');
  console.error('Or run: cd server && npm install');
  process.exit(1);
}

const { createCanvas } = Canvas;

// Configuration
const WIDTH = 512;
const HEIGHT = 512;
const OUTPUT_PATH = path.join(__dirname, '../frontend/3d/assets/heightmap.png');
const NEIGHBORHOODS_PATH = path.join(__dirname, '../data/neighborhoods.geojson');
const LOTS_PATH = path.join(__dirname, '../data/lots.geojson');

// ============================================================================
// Perlin Noise Implementation (simple 2D)
// ============================================================================

class PerlinNoise {
  constructor(seed = 12345) {
    this.seed = seed;
    this.gradients = {};
    this.memory = {};
  }

  rand(x, y) {
    // Pseudo-random number generator using sine function
    // Constants chosen for good distribution properties
    const MAGIC_X = 12.9898;  // X multiplier for distribution
    const MAGIC_Y = 78.233;   // Y multiplier for distribution
    const MAGIC_SCALE = 43758.5453; // Large prime-like number for amplification
    const n = Math.sin(x * MAGIC_X + y * MAGIC_Y + this.seed) * MAGIC_SCALE;
    return n - Math.floor(n);
  }

  getGradient(x, y) {
    const key = `${x},${y}`;
    if (this.gradients[key]) {
      return this.gradients[key];
    }
    const angle = this.rand(x, y) * Math.PI * 2;
    const gradient = [Math.cos(angle), Math.sin(angle)];
    this.gradients[key] = gradient;
    return gradient;
  }

  dotProduct(x, y, vx, vy) {
    const gradient = this.getGradient(x, y);
    return gradient[0] * vx + gradient[1] * vy;
  }

  smootherstep(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  interpolate(a, b, t) {
    return a + this.smootherstep(t) * (b - a);
  }

  noise(x, y) {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    const dx0 = x - x0;
    const dx1 = x - x1;
    const dy0 = y - y0;
    const dy1 = y - y1;

    const d00 = this.dotProduct(x0, y0, dx0, dy0);
    const d10 = this.dotProduct(x1, y0, dx1, dy0);
    const d01 = this.dotProduct(x0, y1, dx0, dy1);
    const d11 = this.dotProduct(x1, y1, dx1, dy1);

    const ix0 = this.interpolate(d00, d10, dx0);
    const ix1 = this.interpolate(d01, d11, dx0);

    return this.interpolate(ix0, ix1, dy0);
  }

  octaveNoise(x, y, octaves = 4, persistence = 0.5) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }
}

// ============================================================================
// Geometry Utilities
// ============================================================================

function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

function getBoundingBox(features) {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  features.forEach(feature => {
    const coords = feature.geometry.coordinates[0];
    coords.forEach(([lon, lat]) => {
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });
  });

  return { minLon, maxLon, minLat, maxLat };
}

function projectToPixel(lon, lat, bbox, width, height) {
  const x = ((lon - bbox.minLon) / (bbox.maxLon - bbox.minLon)) * width;
  const y = ((bbox.maxLat - lat) / (bbox.maxLat - bbox.minLat)) * height;
  return [Math.floor(x), Math.floor(y)];
}

// ============================================================================
// Elevation Mapping
// ============================================================================

function getCategoryElevation(category) {
  const elevations = {
    'residential': 20,
    'commercial': 30,
    'mountains': 50,
    'volcanic': 40,
    'arctic': 35,
    'beach': 5,
    'default': 15
  };
  return elevations[category] || elevations['default'];
}

function getTerrainModifier(terrain) {
  const modifiers = {
    'lava': 1.5,
    'ice': 1.2,
    'rock': 1.3,
    'sand': 0.5,
    'default': 1.0
  };
  return modifiers[terrain] || modifiers['default'];
}

// ============================================================================
// Main Generation Function
// ============================================================================

async function generateHeightmap() {
  console.log('Starting heightmap generation...');

  // Load GeoJSON files
  console.log('Loading GeoJSON files...');
  const neighborhoods = JSON.parse(fs.readFileSync(NEIGHBORHOODS_PATH, 'utf-8'));
  const lots = JSON.parse(fs.readFileSync(LOTS_PATH, 'utf-8'));

  // Compute bounding box from all features
  const allFeatures = [
    ...neighborhoods.features,
    ...lots.features
  ];
  const bbox = getBoundingBox(allFeatures);
  console.log('Bounding box:', bbox);

  // Initialize Perlin noise generator
  const perlin = new PerlinNoise(42);

  // Create canvas
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(WIDTH, HEIGHT);

  console.log('Generating heightmap...');

  // For each pixel, compute elevation
  for (let py = 0; py < HEIGHT; py++) {
    for (let px = 0; px < WIDTH; px++) {
      // Convert pixel to geographic coordinates
      const lon = bbox.minLon + (px / WIDTH) * (bbox.maxLon - bbox.minLon);
      const lat = bbox.maxLat - (py / HEIGHT) * (bbox.maxLat - bbox.minLat);
      const point = [lon, lat];

      // Base elevation from neighborhoods
      let elevation = 10; // Default base
      let terrainMod = 1.0;

      // Check which neighborhood this point belongs to
      for (const feature of neighborhoods.features) {
        const polygon = feature.geometry.coordinates[0];
        if (pointInPolygon(point, polygon)) {
          const props = feature.properties;
          elevation = props.elevation || getCategoryElevation(props.category);
          if (props.terrain) {
            terrainMod = getTerrainModifier(props.terrain);
          }
          break;
        }
      }

      // Add elevation from lots
      for (const feature of lots.features) {
        const polygon = feature.geometry.coordinates[0];
        if (pointInPolygon(point, polygon)) {
          const lotElevation = feature.properties.elevation || 5;
          elevation += lotElevation;
          break;
        }
      }

      // Apply terrain modifier
      elevation *= terrainMod;

      // Add Perlin noise for natural variation
      const noiseScale = 0.02; // Adjust for hills frequency
      const noiseValue = perlin.octaveNoise(px * noiseScale, py * noiseScale, 4, 0.5);
      const noiseContribution = (noiseValue * 0.5 + 0.5) * 25; // 0-25 range
      elevation += noiseContribution;

      // Normalize to 0-255 range
      // Max expected elevation: base (up to 50) * modifier (up to 1.5) + lots (up to 15) + noise (up to 25) ≈ 115
      const MAX_ELEVATION = 115;
      let normalizedElevation = (elevation / MAX_ELEVATION) * 255;
      normalizedElevation = Math.max(0, Math.min(255, normalizedElevation));

      // Set pixel (grayscale)
      const idx = (py * WIDTH + px) * 4;
      const value = Math.floor(normalizedElevation);
      imageData.data[idx] = value;     // R
      imageData.data[idx + 1] = value; // G
      imageData.data[idx + 2] = value; // B
      imageData.data[idx + 3] = 255;   // A
    }

    // Progress indicator
    if (py % 50 === 0) {
      console.log(`Progress: ${Math.floor((py / HEIGHT) * 100)}%`);
    }
  }

  console.log('Progress: 100%');

  // Write image data to canvas
  ctx.putImageData(imageData, 0, 0);

  // Save to PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(OUTPUT_PATH, buffer);

  console.log(`Heightmap generated successfully: ${OUTPUT_PATH}`);
  console.log(`Size: ${WIDTH}x${HEIGHT} pixels`);
}

// Run the generator
generateHeightmap().catch(err => {
  console.error('Error generating heightmap:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Heightmap Generator for Aelphera 3D Terrain
 * 
 * Reads GeoJSON data (neighborhoods and lots) and rasterizes them into
 * a grayscale PNG heightmap suitable for displacement mapping.
 * 
 * Usage: node scripts/generate-heightmap.js
 */

const fs = require('fs');
const path = require('path');

// Check for canvas package
let createCanvas;
try {
  const Canvas = require('canvas');
  createCanvas = Canvas.createCanvas;
} catch (error) {
  console.error('\n❌ ERROR: The "canvas" package is not installed.');
  console.error('\nThis package is required for heightmap generation.');
  console.error('\nInstallation instructions:');
  console.error('\n  Ubuntu/Debian:');
  console.error('    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev');
  console.error('    npm install canvas');
  console.error('\n  macOS:');
  console.error('    brew install pkg-config cairo pango libpng jpeg giflib librsvg');
  console.error('    npm install canvas');
  console.error('\n  Windows:');
  console.error('    npm install --global windows-build-tools');
  console.error('    npm install canvas');
  console.error('\nAlternatively, use the placeholder heightmap included in frontend/3d/assets/\n');
  process.exit(1);
}

// Configuration
const CONFIG = {
  outputSize: 512,
  outputPath: path.join(__dirname, '../frontend/3d/assets/heightmap.png'),
  neighborhoodsPath: path.join(__dirname, '../data/neighborhoods.geojson'),
  lotsPath: path.join(__dirname, '../data/lots.geojson'),
  baseElevations: {
    residential: 3,
    commercial: 5,
    park: 2,
    mountain: 50,
    default: 1
  },
  lotBump: 2,
  noiseScale: 0.05,
  noiseAmplitude: 5
};

// Simple 2D value noise implementation
class ValueNoise {
  constructor(seed = 12345) {
    this.seed = seed;
  }

  random(x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return n - Math.floor(n);
  }

  noise(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    // Sample corners
    const a = this.random(xi, yi);
    const b = this.random(xi + 1, yi);
    const c = this.random(xi, yi + 1);
    const d = this.random(xi + 1, yi + 1);

    // Smooth interpolation
    const u = xf * xf * (3.0 - 2.0 * xf);
    const v = yf * yf * (3.0 - 2.0 * yf);

    return a * (1 - u) * (1 - v) +
           b * u * (1 - v) +
           c * (1 - u) * v +
           d * u * v;
  }
}

// Point-in-polygon test (ray casting)
function pointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    const intersect = ((yi > point[1]) !== (yj > point[1])) &&
                     (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Compute bounding box from features
function computeBoundingBox(features) {
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  features.forEach(feature => {
    if (feature.geometry.type === 'Polygon') {
      feature.geometry.coordinates[0].forEach(coord => {
        minLon = Math.min(minLon, coord[0]);
        maxLon = Math.max(maxLon, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      });
    }
  });

  return { minLon, maxLon, minLat, maxLat };
}

// Main generator
async function generateHeightmap() {
  console.log('🏔️  Aelphera Heightmap Generator\n');

  // Load GeoJSON files
  console.log('📖 Loading GeoJSON data...');
  let neighborhoods, lots;
  
  try {
    const neighborhoodsData = fs.readFileSync(CONFIG.neighborhoodsPath, 'utf8');
    neighborhoods = JSON.parse(neighborhoodsData);
    console.log(`   ✓ Loaded ${neighborhoods.features.length} neighborhoods`);
  } catch (error) {
    console.error(`   ✗ Failed to load neighborhoods: ${error.message}`);
    process.exit(1);
  }

  try {
    const lotsData = fs.readFileSync(CONFIG.lotsPath, 'utf8');
    lots = JSON.parse(lotsData);
    console.log(`   ✓ Loaded ${lots.features.length} lots`);
  } catch (error) {
    console.error(`   ✗ Failed to load lots: ${error.message}`);
    process.exit(1);
  }

  // Compute bounding box
  console.log('\n📐 Computing bounding box...');
  const allFeatures = [...neighborhoods.features, ...lots.features];
  const bbox = computeBoundingBox(allFeatures);
  console.log(`   ✓ Bounds: [${bbox.minLon.toFixed(4)}, ${bbox.minLat.toFixed(4)}] to [${bbox.maxLon.toFixed(4)}, ${bbox.maxLat.toFixed(4)}]`);

  // Create canvas
  const canvas = createCanvas(CONFIG.outputSize, CONFIG.outputSize);
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(CONFIG.outputSize, CONFIG.outputSize);
  
  console.log('\n🎨 Rasterizing terrain...');
  const noise = new ValueNoise();
  
  // Process each pixel
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  const elevations = new Float32Array(CONFIG.outputSize * CONFIG.outputSize);

  for (let y = 0; y < CONFIG.outputSize; y++) {
    for (let x = 0; x < CONFIG.outputSize; x++) {
      // Map pixel to lon/lat
      const lon = bbox.minLon + (x / CONFIG.outputSize) * (bbox.maxLon - bbox.minLon);
      const lat = bbox.maxLat - (y / CONFIG.outputSize) * (bbox.maxLat - bbox.minLat);
      const point = [lon, lat];

      let elevation = 0;

      // Check neighborhoods for base elevation
      for (const feature of neighborhoods.features) {
        if (feature.geometry.type === 'Polygon') {
          if (pointInPolygon(point, feature.geometry.coordinates[0])) {
            const category = feature.properties.category || 'default';
            elevation = CONFIG.baseElevations[category] || CONFIG.baseElevations.default;
            if (feature.properties.elevation) {
              elevation = feature.properties.elevation;
            }
            break;
          }
        }
      }

      // Check lots for additional bumps and terrain types
      for (const feature of lots.features) {
        if (feature.geometry.type === 'Polygon') {
          if (pointInPolygon(point, feature.geometry.coordinates[0])) {
            const lotElevation = feature.properties.elevation || CONFIG.lotBump;
            elevation += lotElevation;

            // Mark special terrain types with specific elevation ranges
            const terrain = feature.properties.terrain;
            if (terrain === 'lava') {
              // Lava regions: lower elevation for shader to detect
              elevation = Math.max(2, elevation * 0.3);
            } else if (terrain === 'ice') {
              // Ice regions: very high elevation
              elevation = Math.max(elevation, 40) + 10;
            }
            break;
          }
        }
      }

      // Add procedural noise
      const noiseValue = noise.noise(x * CONFIG.noiseScale, y * CONFIG.noiseScale);
      elevation += noiseValue * CONFIG.noiseAmplitude;

      elevations[y * CONFIG.outputSize + x] = elevation;
      minElevation = Math.min(minElevation, elevation);
      maxElevation = Math.max(maxElevation, elevation);
    }

    // Progress indicator
    if ((y + 1) % 64 === 0) {
      const progress = ((y + 1) / CONFIG.outputSize * 100).toFixed(0);
      process.stdout.write(`\r   Progress: ${progress}%`);
    }
  }

  console.log('\r   ✓ Rasterization complete!');
  console.log(`   ✓ Elevation range: ${minElevation.toFixed(2)}m to ${maxElevation.toFixed(2)}m`);

  // Normalize to [0, 255]
  console.log('\n🔧 Normalizing heightmap...');
  const range = maxElevation - minElevation;
  
  for (let i = 0; i < elevations.length; i++) {
    const normalized = Math.floor(((elevations[i] - minElevation) / range) * 255);
    const idx = i * 4;
    imageData.data[idx] = normalized;     // R
    imageData.data[idx + 1] = normalized; // G
    imageData.data[idx + 2] = normalized; // B
    imageData.data[idx + 3] = 255;        // A
  }

  ctx.putImageData(imageData, 0, 0);

  // Save to file
  console.log('\n💾 Saving heightmap...');
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(CONFIG.outputPath, buffer);
  
  const stats = fs.statSync(CONFIG.outputPath);
  console.log(`   ✓ Saved to: ${CONFIG.outputPath}`);
  console.log(`   ✓ Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   ✓ Dimensions: ${CONFIG.outputSize}x${CONFIG.outputSize}`);

  console.log('\n✅ Heightmap generation complete!\n');
  console.log('Next steps:');
  console.log('  1. Open frontend/3d/index.html in a web browser');
  console.log('  2. Use a local web server (e.g., python3 -m http.server)');
  console.log('  3. Navigate to http://localhost:8000/frontend/3d/\n');
}

// Run generator
generateHeightmap().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

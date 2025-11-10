# Aelphera 3D Terrain Preview

This directory contains a 3D terrain preview prototype that visualizes the Aelphera city map with stylized terrain rendering.

## Features

- **3D Terrain Visualization**: High-resolution terrain mesh with displacement mapping
- **Stylized Shader**: Blends 5 terrain types based on elevation and slope:
  - 🏖️ Sand (beaches, low elevation)
  - 🌿 Grass (plains, medium elevation)
  - 🪨 Rock (mountains, steep slopes)
  - 🌋 Lava (volcanic regions)
  - ❄️ Ice (peaks, very high elevation)
- **Interactive Camera**: Orbit, pan, and zoom controls
- **Dynamic Water**: Animated water plane at sea level
- **Atmospheric Effects**: Fog and lighting for visual depth

## Directory Structure

```
frontend/3d/
├── index.html          # Main HTML page
├── app-3d.js          # Three.js application (ES module)
├── README-3d.md       # This file
├── shaders/
│   ├── terrain.vs     # Vertex shader (displacement)
│   └── terrain.fs     # Fragment shader (material blending)
└── assets/
    ├── heightmap.png         # Generated terrain heightmap (512x512)
    ├── terrain-sand.png      # Sand texture
    ├── terrain-grass.png     # Grass texture
    ├── terrain-rock.png      # Rock texture
    ├── terrain-lava.png      # Lava texture
    └── terrain-ice.png       # Ice/snow texture
```

## Prerequisites

### For Preview Only
- A modern web browser with WebGL support
- A local web server (Python, Node.js, or VS Code Live Server)

### For Heightmap Generation
- Node.js (v14 or later)
- `canvas` package (native dependency)

## Quick Start

### 1. Preview the 3D Terrain

The repository includes placeholder textures so you can preview immediately:

```bash
# Option A: Using Python
cd frontend/3d
python3 -m http.server 8080

# Option B: Using Node.js http-server
npx http-server frontend/3d -p 8080

# Option C: Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Then open your browser to: `http://localhost:8080`

### 2. Generate Real Heightmap (Optional)

To generate a heightmap from the GeoJSON data:

#### Install Dependencies

```bash
cd server
npm install canvas
```

**Note**: The `canvas` package has native dependencies (Cairo). If installation fails, see troubleshooting below.

#### Run Generator

```bash
# From project root
npm run generate:heightmap

# Or directly
node scripts/generate-heightmap.js
```

This will create `frontend/3d/assets/heightmap.png` (512x512) by rasterizing:
- `data/neighborhoods.geojson` - neighborhood boundaries with base elevations
- `data/lots.geojson` - individual lots with elevation bumps and terrain types

#### Heightmap Generation Details

The generator:
1. Computes a bounding box from all GeoJSON features
2. Maps each pixel to longitude/latitude coordinates
3. For each pixel:
   - Determines base elevation from neighborhood category
   - Adds elevation bump if inside a lot polygon
   - Adds procedural noise for natural variation
   - Respects `properties.terrain` on lots for lava/ice regions
4. Normalizes elevation to [0, 255] and saves as grayscale PNG

**Neighborhood Categories & Base Elevations:**
- `residential`: 3m
- `commercial`: 5m
- `park`: 2m
- `mountain`: 50m

**Lot Terrain Types:**
- `normal`: Standard elevation bump
- `lava`: Marks region for lava blending (low elevation marker)
- `ice`: Marks region for ice blending (very high elevation)

### 3. Replace Placeholder Textures (Optional)

The included textures are 16x16 placeholder colors. For better visuals, replace with real textures:

```bash
frontend/3d/assets/
├── terrain-sand.png    # Sandy beach texture (e.g., 512x512)
├── terrain-grass.png   # Grass/vegetation texture
├── terrain-rock.png    # Rock/stone texture
├── terrain-lava.png    # Glowing lava texture
└── terrain-ice.png     # Ice/snow texture
```

## Controls

- **Left Mouse Button**: Rotate camera
- **Right Mouse Button**: Pan camera
- **Mouse Wheel**: Zoom in/out

## Troubleshooting

### Canvas Installation Issues

The `canvas` package requires native dependencies. If you encounter errors:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm install canvas
```

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
npm install canvas
```

**Windows:**
- Install Windows Build Tools: `npm install --global windows-build-tools`
- Or use the placeholder heightmap (already included)

### WebGL Errors

If you see a blank screen:
1. Check browser console for errors
2. Ensure your browser supports WebGL 2.0
3. Try a different browser (Chrome, Firefox, Edge)

### CORS Issues

If textures fail to load:
- Make sure you're using a web server, not opening `index.html` directly
- Check that all asset paths are relative and correct

## Customization

### Adjust Terrain Scale

Edit `app-3d.js`:
```javascript
const CONFIG = {
  terrainSize: 512,        // Size of terrain plane
  terrainSegments: 512,    // Mesh resolution (higher = more detail)
  displacementScale: 100,  // Vertical exaggeration
  seaLevel: 0.2,          // Water height (0-1)
  textureRepeat: 8        // Texture tiling
};
```

### Modify Material Blending

Edit `shaders/terrain.fs` to adjust elevation thresholds and transitions:
```glsl
// Sand: < 0.2 elevation
float sandMix = smoothstep(0.25, 0.15, vElevation);

// Grass: 0.2 - 0.5 elevation
float grassMix = smoothstep(0.15, 0.25, vElevation) * 
                 (1.0 - smoothstep(0.45, 0.55, vElevation));
```

## Technical Details

- **Rendering**: Three.js with custom GLSL shaders
- **Terrain Resolution**: 512x512 vertices (262,144 triangles)
- **Textures**: 6 textures (heightmap + 5 terrain materials)
- **Lighting**: Lambert diffuse + ambient + hemisphere light
- **Post-processing**: Tonemapping and gamma correction

## Future Enhancements

- [ ] Real-time procedural noise on GPU
- [ ] Better lava/ice region detection from GeoJSON properties
- [ ] Normal mapping for enhanced detail
- [ ] Dynamic time-of-day lighting
- [ ] Animated lava glow effect
- [ ] Minimap overlay
- [ ] Export capability (screenshot, 3D model)

## License

This feature is part of the Aelphera project and follows the same MPL-2.0 license.

## Contact

For questions or issues, contact the project leaders:
- @Jesivis
- @copilot (Copilot Astra)

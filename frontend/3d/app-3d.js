/**
 * app-3d.js
 * Three.js module for rendering 3D terrain with elevation-based material blending
 */

// Scene setup
let scene, camera, renderer, controls;
let terrain;
const textureLoader = new THREE.TextureLoader();

// Shader material uniforms
const uniforms = {
  heightmap: { value: null },
  sandTexture: { value: null },
  grassTexture: { value: null },
  rockTexture: { value: null },
  lavaTexture: { value: null },
  iceTexture: { value: null },
  heightScale: { value: 30.0 },
  // Elevation thresholds for blending (0-1 normalized)
  sandLevel: { value: 0.15 },
  grassLevel: { value: 0.35 },
  rockLevel: { value: 0.55 },
  lavaLevel: { value: 0.75 },
  iceLevel: { value: 0.90 },
  blendSharpness: { value: 0.1 }
};

// Initialize the scene
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 50, 300);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 50, 80);
  camera.lookAt(0, 0, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 20;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2 - 0.1;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x4a5f3a, 0.4);
  scene.add(hemisphereLight);

  // Load all assets
  loadAssets();

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);
}

// Load textures and shaders
async function loadAssets() {
  try {
    // Load shaders
    const vertexShader = await fetch('shaders/terrain.vs').then(r => r.text());
    const fragmentShader = await fetch('shaders/terrain.fs').then(r => r.text());

    // Load textures
    const loadTexture = (path) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          path,
          (texture) => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(8, 8);
            resolve(texture);
          },
          undefined,
          reject
        );
      });
    };

    const [heightmap, sand, grass, rock, lava, ice] = await Promise.all([
      loadTexture('assets/heightmap.png'),
      loadTexture('assets/terrain-sand.png'),
      loadTexture('assets/terrain-grass.png'),
      loadTexture('assets/terrain-rock.png'),
      loadTexture('assets/terrain-lava.png'),
      loadTexture('assets/terrain-ice.png')
    ]);

    // Heightmap shouldn't repeat
    heightmap.wrapS = THREE.ClampToEdgeWrapping;
    heightmap.wrapT = THREE.ClampToEdgeWrapping;
    heightmap.repeat.set(1, 1);

    // Assign textures to uniforms
    uniforms.heightmap.value = heightmap;
    uniforms.sandTexture.value = sand;
    uniforms.grassTexture.value = grass;
    uniforms.rockTexture.value = rock;
    uniforms.lavaTexture.value = lava;
    uniforms.iceTexture.value = ice;

    // Create terrain mesh
    createTerrain(vertexShader, fragmentShader);

    // Hide loading message
    document.getElementById('loading').style.display = 'none';

    // Start animation loop
    animate();
  } catch (error) {
    console.error('Error loading assets:', error);
    document.getElementById('loading').innerHTML = 'Error loading assets. Check console.';
  }
}

// Create the terrain geometry and material
function createTerrain(vertexShader, fragmentShader) {
  // High-resolution plane geometry (256x256 segments for smooth terrain)
  const geometry = new THREE.PlaneGeometry(100, 100, 255, 255);
  geometry.rotateX(-Math.PI / 2); // Make it horizontal

  // Create shader material
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    wireframe: false
  });

  terrain = new THREE.Mesh(geometry, material);
  scene.add(terrain);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the application
init();

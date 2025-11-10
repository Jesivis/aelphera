import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Configuration
const CONFIG = {
  terrainSize: 512,
  terrainSegments: 512,
  displacementScale: 100,
  seaLevel: 0.2,
  textureRepeat: 8,
  waterColor: 0x1e3a5f,
  fogColor: 0x87ceeb,
  fogNear: 100,
  fogFar: 800
};

class TerrainPreview {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.terrain = null;
    this.water = null;
    this.assets = {
      heightMap: null,
      terrainSand: null,
      terrainGrass: null,
      terrainRock: null,
      terrainLava: null,
      terrainIce: null,
      vertexShader: null,
      fragmentShader: null
    };
  }

  async init() {
    try {
      await this.loadAssets();
      this.setupScene();
      this.createTerrain();
      this.createWater();
      this.setupLighting();
      this.animate();
      this.hideLoading();
    } catch (error) {
      console.error('Failed to initialize terrain preview:', error);
      this.showError(error.message);
    }
  }

  async loadAssets() {
    const textureLoader = new THREE.TextureLoader();
    
    // Load shaders
    const [vertexShader, fragmentShader] = await Promise.all([
      fetch('shaders/terrain.vs').then(r => r.text()),
      fetch('shaders/terrain.fs').then(r => r.text())
    ]);
    
    this.assets.vertexShader = vertexShader;
    this.assets.fragmentShader = fragmentShader;

    // Load textures
    const loadTexture = (path) => {
      return new Promise((resolve, reject) => {
        textureLoader.load(
          path,
          (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            resolve(texture);
          },
          undefined,
          reject
        );
      });
    };

    [
      this.assets.heightMap,
      this.assets.terrainSand,
      this.assets.terrainGrass,
      this.assets.terrainRock,
      this.assets.terrainLava,
      this.assets.terrainIce
    ] = await Promise.all([
      loadTexture('assets/heightmap.png'),
      loadTexture('assets/terrain-sand.png'),
      loadTexture('assets/terrain-grass.png'),
      loadTexture('assets/terrain-rock.png'),
      loadTexture('assets/terrain-lava.png'),
      loadTexture('assets/terrain-ice.png')
    ]);
  }

  setupScene() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.fogColor);
    this.scene.fog = new THREE.Fog(CONFIG.fogColor, CONFIG.fogNear, CONFIG.fogFar);

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      2000
    );
    this.camera.position.set(300, 250, 300);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 1000;

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize(), false);
  }

  createTerrain() {
    const geometry = new THREE.PlaneGeometry(
      CONFIG.terrainSize,
      CONFIG.terrainSize,
      CONFIG.terrainSegments,
      CONFIG.terrainSegments
    );
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        heightMap: { value: this.assets.heightMap },
        terrainSand: { value: this.assets.terrainSand },
        terrainGrass: { value: this.assets.terrainGrass },
        terrainRock: { value: this.assets.terrainRock },
        terrainLava: { value: this.assets.terrainLava },
        terrainIce: { value: this.assets.terrainIce },
        displacementScale: { value: CONFIG.displacementScale },
        seaLevel: { value: CONFIG.seaLevel },
        repeat: { value: CONFIG.textureRepeat },
        lightDir: { value: new THREE.Vector3(1, 1, 0.5).normalize() }
      },
      vertexShader: this.assets.vertexShader,
      fragmentShader: this.assets.fragmentShader,
      side: THREE.DoubleSide
    });

    this.terrain = new THREE.Mesh(geometry, material);
    this.scene.add(this.terrain);
  }

  createWater() {
    const waterGeometry = new THREE.PlaneGeometry(
      CONFIG.terrainSize * 1.2,
      CONFIG.terrainSize * 1.2
    );
    waterGeometry.rotateX(-Math.PI / 2);

    const waterMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.waterColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });

    this.water = new THREE.Mesh(waterGeometry, waterMaterial);
    this.water.position.y = CONFIG.seaLevel * CONFIG.displacementScale - 10;
    this.scene.add(this.water);
  }

  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 300, 100);
    this.scene.add(dirLight);

    // Hemisphere light for sky/ground color
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
    this.scene.add(hemiLight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Animate water slightly
    if (this.water) {
      this.water.position.y = Math.sin(Date.now() * 0.0005) * 0.5 + 
                              (CONFIG.seaLevel * CONFIG.displacementScale - 10);
    }
    
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  }

  showError(message) {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `❌ Error: ${message}<br><small>Check console for details</small>`;
      loading.style.color = '#ff6b6b';
    }
  }
}

// Initialize when DOM is ready
const preview = new TerrainPreview();
preview.init();

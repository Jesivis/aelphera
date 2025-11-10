import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.158.0/examples/jsm/controls/OrbitControls.js";

async function loadText(url) {
  const r = await fetch(url);
  return await r.text();
}

(async function () {
  const container = document.getElementById("app");
  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b4a6b);

  const camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
  camera.position.set(200, 180, 300);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 50;
  controls.maxDistance = 2000;
  controls.target.set(0, 20, 0);
  controls.update();

  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(100, 200, 100);
  key.castShadow = true;
  scene.add(key);

  const fill = new THREE.AmbientLight(0xffffff, 0.35);
  scene.add(fill);

  const loader = new THREE.TextureLoader();
  const assetsBase = "/frontend/3d/assets";

  const [
    heightTex,
    sandTex,
    grassTex,
    rockTex,
    lavaTex,
    iceTex,
    vertexSource,
    fragmentSource
  ] = await Promise.all([
    loader.loadAsync(`${assetsBase}/heightmap.png`),
    loader.loadAsync(`${assetsBase}/terrain-sand.png`),
    loader.loadAsync(`${assetsBase}/terrain-grass.png`),
    loader.loadAsync(`${assetsBase}/terrain-rock.png`),
    loader.loadAsync(`${assetsBase}/terrain-lava.png`),
    loader.loadAsync(`${assetsBase}/terrain-ice.png`),
    loadText('frontend/3d/shaders/terrain.vs'),
    loadText('frontend/3d/shaders/terrain.fs')
  ]);

  heightTex.wrapS = heightTex.wrapT = THREE.ClampToEdgeWrapping;
  sandTex.wrapS = sandTex.wrapT = THREE.RepeatWrapping;
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
  rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping;
  lavaTex.wrapS = lavaTex.wrapT = THREE.RepeatWrapping;
  iceTex.wrapS = iceTex.wrapT = THREE.RepeatWrapping;

  const size = 512;
  const segments = 512;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const uniforms = {
    heightMap: { value: heightTex },
    sandMap: { value: sandTex },
    grassMap: { value: grassTex },
    rockMap: { value: rockTex },
    lavaMap: { value: lavaTex },
    iceMap: { value: iceTex },
    displacementScale: { value: 100.0 },
    seaLevel: { value: 0.5 },
    repeat: { value: new THREE.Vector2(4, 4) },
    lightDir: { value: new THREE.Vector3(0.5, 0.8, 0.2).normalize() }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertexSource,
    fragmentShader: fragmentSource,
    uniforms,
    lights: false,
    side: THREE.DoubleSide
  });

  const terrain = new THREE.Mesh(geometry, material);
  terrain.castShadow = false;
  terrain.receiveShadow = true;
  scene.add(terrain);

  const worldSeaY = -uniforms.displacementScale.value * (1.0 - uniforms.seaLevel.value) + 0;
  const waterGeom = new THREE.PlaneGeometry(size * 1.05, size * 1.05, 1, 1);
  waterGeom.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x4fc3ff, transparent: true, opacity: 0.95 });
  const water = new THREE.Mesh(waterGeom, waterMat);
  water.position.y = worldSeaY;
  scene.add(water);

  window.addEventListener("resize", () => {
    const W = container.clientWidth || window.innerWidth;
    const H = container.clientHeight || window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H);
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    key.position.x = 100 * Math.cos(clock.elapsedTime * 0.05);
    key.position.z = 100 * Math.sin(clock.elapsedTime * 0.05);
    renderer.render(scene, camera);
  }

  animate();

  window.AELPHERA_3D = { scene, camera, renderer, terrain, material, uniforms };
})();

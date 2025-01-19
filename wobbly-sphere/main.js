import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import GUI from "lil-gui";

/**
 * Base
 */
// Debug
const gui = new GUI({ width: 325 });
gui.close();
const debugObject = {};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const rgbeLoader = new RGBELoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./draco/");
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**
 * Environment map
 */
rgbeLoader.load("./studio_country_hall_1k.hdr", (environmentMap) => {
  environmentMap.mapping = THREE.EquirectangularReflectionMapping;

  scene.background = environmentMap;
  scene.environment = environmentMap;

  scene.environmentIntensity = 1;
  scene.backgroundBlurriness = 0;
});

/**
 * Wobble
 */
// Material
const material = new THREE.MeshPhysicalMaterial({
  metalness: 0,
  roughness: 0.5,
  color: "#ffa82e",
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

// Tweaks
gui.add(material, "metalness", 0, 1, 0.001);
gui.add(material, "roughness", 0, 1, 0.001);
gui.add(material, "transmission", 0, 1, 0.001);
gui.add(material, "ior", 0, 10, 0.001);
gui.add(material, "thickness", 0, 10, 0.001);
gui.addColor(material, "color");

// Geometry
const geometry = new THREE.IcosahedronGeometry(2.5, 50);

// Mesh
const wobble = new THREE.Mesh(geometry, material);
scene.add(wobble);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffffff", 3);
directionalLight.position.set(-1.5, 2.5, 2.25);

const helper = new THREE.DirectionalLightHelper(directionalLight);

scene.add(directionalLight);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(-16, 4.5, 1.5);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
});
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

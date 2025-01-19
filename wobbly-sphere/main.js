import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import GUI from "lil-gui";
import wobbleVertexShader from "./shaders/wobble/vertex.glsl";
import wobbleFragmentShader from "./shaders/wobble/fragment.glsl";

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
});

// Material
debugObject.colorA = "#f80";
debugObject.colorB = "#ffe1ad";

const uniforms = {
  uTime: new THREE.Uniform(0),
  uPositionFrequency: new THREE.Uniform(1.5),
  uTimeFrequency: new THREE.Uniform(0.4),
  uStrength: new THREE.Uniform(1.0),
  uWarpPositionFrequency: new THREE.Uniform(0.38),
  uWarpTimeFrequency: new THREE.Uniform(0.12),
  uWarpStrength: new THREE.Uniform(1.7),
  uColorA: new THREE.Uniform(new THREE.Color(debugObject.colorA)),
  uColorB: new THREE.Uniform(new THREE.Color(debugObject.colorB)),
};

const material = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: wobbleVertexShader,
  fragmentShader: wobbleFragmentShader,
  uniforms: uniforms,
  silent: true,

  // MeshPhysicalMaterial
  metalness: 0.1,
  roughness: 0.9,
  color: "#ffffff",
  transmission: 0,
  ior: 1.5,
  thickness: 1.5,
  transparent: true,
  wireframe: false,
});

const depthMaterial = new CustomShaderMaterial({
  // CSM
  baseMaterial: THREE.MeshDepthMaterial,
  vertexShader: wobbleVertexShader,
  uniforms: uniforms,
  silent: true,

  // MeshDepthMaterial
  depthPacking: THREE.RGBADepthPacking,
});

// Tweaks
gui
  .add(uniforms.uPositionFrequency, "value", 0, 2, 0.001)
  .name("uPositionFrequency");
gui.add(uniforms.uTimeFrequency, "value", 0, 2, 0.001).name("uTimeFrequency");
gui.add(uniforms.uStrength, "value", 0, 2, 0.001).name("uStrength");
gui
  .add(uniforms.uWarpPositionFrequency, "value", 0, 2, 0.001)
  .name("uWarpPositionFrequency");
gui
  .add(uniforms.uWarpTimeFrequency, "value", 0, 2, 0.001)
  .name("uWarpTimeFrequency");
gui.add(uniforms.uWarpStrength, "value", 0, 2, 0.001).name("uWarpStrength");
gui
  .addColor(debugObject, "colorA")
  .onChange(() => uniforms.uColorA.value.set(debugObject.colorA));
gui
  .addColor(debugObject, "colorB")
  .onChange(() => uniforms.uColorB.value.set(debugObject.colorB));
gui.add(material, "metalness", 0, 1, 0.001);
gui.add(material, "roughness", 0, 1, 0.001);
gui.add(material, "transmission", 0, 1, 0.001);
gui.add(material, "ior", 0, 10, 0.001);
gui.add(material, "thickness", 0, 10, 0.001);

// Geometry
let geometry = new THREE.IcosahedronGeometry(2.5, 80);
geometry = mergeVertices(geometry);
geometry.computeTangents();

const wobble = new THREE.Mesh(geometry, material);
wobble.customDepthMaterial = depthMaterial;
scene.add(wobble);

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight("#ffe1ad", 3);
directionalLight.position.set(-2.5, -0.2, -1.25);

const helper = new THREE.DirectionalLightHelper(directionalLight);

scene.add(directionalLight);
// scene.add(helper);

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

  // Materials
  uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

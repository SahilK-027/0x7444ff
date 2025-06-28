import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import testVertexShader from "./shaders/vertex.glsl";
import testFragmentShader from "./shaders/fragment.glsl";

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Test mesh
 */
// Geometry
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);
const diffuseTexture = new THREE.TextureLoader().load(
  "/textures/seamless_cartoon_styled_water_texture_by_berserkitty_dcatyft-375w-2x.jpg"
);
diffuseTexture.wrapS = THREE.MirrorWrapping;
diffuseTexture.wrapT = THREE.MirrorWrapping;

// Material
const material = new THREE.ShaderMaterial({
  vertexShader: testVertexShader,
  fragmentShader: testFragmentShader,
  side: THREE.DoubleSide,
  uniforms: {
    uTime: { value: 0 },
    uFrequency: { value: 4.0 },
    uAmplitude: { value: 0.1 },
    uScrollSpeed: { value: 0.2 },
    uNoiseScale: { value: 0.1 },
    uNoiseSpeed: { value: 0.1 },
    uDiffuse: { value: diffuseTexture },
  },
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

/**
 * Base
 */
// Debug
// Make sure that material.uniforms is defined before setting up the GUI
if (material.uniforms) {
  const gui = new GUI();

  // Check if the properties exist before adding them to the GUI
  if (material.uniforms.uFrequency) {
    gui
      .add(material.uniforms.uFrequency, "value")
      .min(0.5)
      .max(20.0)
      .step(0.01)
      .name("Frequency");
  }

  if (material.uniforms.uAmplitude) {
    gui
      .add(material.uniforms.uAmplitude, "value")
      .min(0.0)
      .max(1.0)
      .step(0.1)
      .name("Amplitude");
  }
  if (material.uniforms.uScrollSpeed) {
    gui
      .add(material.uniforms.uScrollSpeed, "value")
      .min(0.0)
      .max(1.0)
      .step(0.1)
      .name("Speed");
  }
}

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 0.85);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Animate
 */
const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update material
  material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

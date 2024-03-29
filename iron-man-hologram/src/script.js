import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import holographicVertexShader from "./shaders/holographic/vertex.glsl";
import holographicFragmentShader from "./shaders/holographic/fragment.glsl";

let data = `A genius, billionaire, playboy, and philanthropist Mr. Tony Stark designed and built the iconic
          battle suit "Iron Man". The suit is powered by the arc reactor, a device that
          provides unlimited energy. It is equipped with various weapons and
          gadgets, including repulsor rays, missiles, and a jetpack. Iron Man embodies courage
          and resilience in protecting the world.`;

let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  data = `A genius, billionaire, playboy, and philanthropist Mr. Tony Stark designed and built the iconic
  battle suit "Iron Man". The suit is powered by the arc reactor, a device that
  provides unlimited energy.`;
}

let charIndex = 0;
document.addEventListener("DOMContentLoaded", () => {
  const ironman_info = document.getElementById("iron-man-text");
  const type = () => {
    if (charIndex < data.length) {
      ironman_info.innerHTML += data.charAt(charIndex);
      charIndex++;
      setTimeout(type, 100);
    }
  };
  type();
});

/**
 * Base
 */
// Debug
const gui = new GUI();
gui.close();

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Loaders
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

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
  25,
  sizes.width / sizes.height,
  0.1,
  100
);
isMobile ? camera.position.set(15, 0, 20) : camera.position.set(3, 3, 12);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.minPolarAngle = Math.PI / 5;
controls.maxPolarAngle = Math.PI / 2;
controls.enablePan = false;

/**
 * Renderer
 */
const rendererParameters = {};
rendererParameters.clearColor = "#111218";

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setClearColor(rendererParameters.clearColor);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

gui.addColor(rendererParameters, "clearColor").onChange(() => {
  renderer.setClearColor(rendererParameters.clearColor);
});

/**
 * Material
 */
const materialParameters = {};
materialParameters.color = "#256393";

gui.addColor(materialParameters, "color").onChange(() => {
  material.uniforms.uColor.value.set(materialParameters.color);
});

const material = new THREE.ShaderMaterial({
  vertexShader: holographicVertexShader,
  fragmentShader: holographicFragmentShader,
  uniforms: {
    uTime: new THREE.Uniform(0),
    uColor: new THREE.Uniform(new THREE.Color(materialParameters.color)),
  },
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});

// ironman
let ironman = null;
gltfLoader.load("./ironman.glb", (gltf) => {
  ironman = gltf.scene;
  ironman.traverse((child) => {
    if (child.isMesh) child.material = material;
  });
  scene.add(ironman);
});

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

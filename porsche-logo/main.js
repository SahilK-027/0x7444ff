import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const bgTexture = textureLoader.load("/textures/logoBG.jpg");
const fgTexture = textureLoader.load("/textures/logo.jpg");
const blob = textureLoader.load("/blob.png");

let fgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 32, 32),
  new THREE.MeshBasicMaterial({
    map: fgTexture,
    side: THREE.DoubleSide,
  })
);
fgMesh.scale.y = 2 / 3;
scene.add(fgMesh);

// Mesh
const bgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 32, 32),
  new THREE.RawShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: bgTexture },
      mask: {
        value: blob
      },
    },
    transparent: true
  })
);
bgMesh.scale.y = 2 / 3;
bgMesh.position.z = 0.1;
scene.add(bgMesh);

// Debug
// const gui = new GUI();
// gui
//   .add(material.uniforms.uFrequency.value, "x")
//   .min(0)
//   .max(20)
//   .step(0.01)
//   .name("frequencyX");
// gui
//   .add(material.uniforms.uFrequency.value, "y")
//   .min(0)
//   .max(20)
//   .step(0.01)
//   .name("frequencyY");

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
camera.position.set(0, 0, 0.47);
scene.add(camera);


/**
 * Raycaster and Mouse
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const points = new THREE.Vector3();

// Update mouse position on mousemove
window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1) for both components
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = - (event.clientY / sizes.height) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections
  const intersects = raycaster.intersectObjects([bgMesh]); // Note: Intersect with an array of objects

  if (intersects.length > 0) {
    points.copy(intersects[0].point);
  }
});


// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
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
  // material.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  console.log(points.x);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

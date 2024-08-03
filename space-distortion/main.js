import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

const rangeFunction = (a, b) => {
  let r = Math.random();
  return a * r + b * (1 - r);
};

/**
 * Base
 */

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
const scene1 = new THREE.Scene();

/**
 * Raycaster and Mouse
 */
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const points = new THREE.Vector3();

// Update mouse position on mousemove
window.addEventListener("mousemove", (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1) for both components
  mouse.x = (event.clientX / sizes.width) * 2 - 1;
  mouse.y = -(event.clientY / sizes.height) * 2 + 1;

  // Update the raycaster
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections
  const intersects = raycaster.intersectObjects([bgMesh]); // Note: Intersect with an array of objects

  if (intersects.length > 0) {
    points.copy(intersects[0].point);
  }
});

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const bgTexture =  new THREE.VideoTexture(document.getElementById('fg-video'));
const fgTexture = new THREE.VideoTexture(document.getElementById('bg-video'));
const blobTexture = textureLoader.load("/blob.png");

const vs1 = `
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

attribute vec2 uv;
attribute vec3 position;

varying vec2 vUv;

void main() {
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vUv = uv;
}
`;

const fs1 = `
precision mediump float;

uniform vec3 uColor;
uniform sampler2D uTexture;

varying vec2 vUv;

void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    gl_FragColor = textureColor;
}
`;

let fgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 32, 32),
  new THREE.RawShaderMaterial({
    vertexShader: vs1,
    fragmentShader: fs1,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: fgTexture },
    },
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
      mask: { value: blobTexture },
    },
    transparent: true,
  })
);

bgMesh.scale.y = 2 / 3;
bgMesh.position.z = 0.02;
scene.add(bgMesh);

/**
 * Blobs
 */
let blobsCount = 50;
let blobsMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(0.1, 0.1),
  new THREE.MeshBasicMaterial({
    map: blobTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    opacity: 0.9,
  })
);

const allBlobs = [];
blobsMesh.position.z = 0.1;

for (let i = 0; i < blobsCount; i++) {
  let clonnedBlob = blobsMesh.clone();
  let deviation = rangeFunction(0, 2 * Math.PI);
  let r = rangeFunction(0.01, 0.08);
  clonnedBlob.position.x = r * Math.sin(deviation);
  clonnedBlob.position.y = r * Math.cos(deviation);
  clonnedBlob.userData.life = rangeFunction(-2 * Math.PI, 2 * Math.PI);

  allBlobs.push(clonnedBlob);
  scene1.add(clonnedBlob);
}

const updateBlobs = () => {
  allBlobs.forEach((blob) => {
    blob.userData.life += 0.175;
    blob.scale.setScalar(Math.sin(0.5 * blob.userData.life));

    if (blob.userData.life > 2 * Math.PI) {
      blob.userData.life = -2 * Math.PI;

      let deviation = rangeFunction(0, 2 * Math.PI);
      let r = rangeFunction(0.01, 0.08);

      blob.position.x = points.x + r * Math.sin(deviation);
      blob.position.y = points.y + r * Math.cos(deviation);
    }
    //reset life
  });
};

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

const renderTarget = new THREE.WebGLRenderTarget(sizes.width, sizes.height, {});

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
camera.position.set(0, 0, 0.5);
scene.add(camera);

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

  // Update controls
  controls.update();

  updateBlobs();

  // Render scene1 to renderTarget
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene1, camera);

  bgMesh.material.uniforms.mask.value = renderTarget.texture;

  // Render scene to canvas
  renderer.setRenderTarget(null);


  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
  renderer.render(scene, camera);
};

tick();

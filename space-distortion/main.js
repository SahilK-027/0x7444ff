import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShaderBG from "./shaders/vertexBG.glsl";
import fragmentShaderBG from "./shaders/fragmentBG.glsl";
import vertexShaderFG from "./shaders/vertexFG.glsl";
import fragmentShaderFG from "./shaders/fragmentFG.glsl";

const rangeFunction = (a, b) => {
  let r = Math.random();
  return a * r + b * (1 - r);
};

let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const demo1 = document.getElementById("demo-1");
const demo2 = document.getElementById("demo-2");

demo1.addEventListener("click", () => {
  changeDemo("demo-1");
});
demo2.addEventListener("click", () => {
  changeDemo("demo-2");
});

/**
 * Base setup
 */
// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();
const scene1 = new THREE.Scene();

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

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
let bgTexture = textureLoader.load("/textures/bg.png");
let fgTexture = textureLoader.load("/textures/fg.png");

const changeDemo = (demo) => {
  if (demo === "demo-1") {
    bgTexture = textureLoader.load("/textures/bg.png");
    fgTexture = textureLoader.load("/textures/fg.png");
  } else {
    console.log("called");
    fgTexture = textureLoader.load("/textures/bird-bw.jpg");
    bgTexture = textureLoader.load("/textures/bird.jpg");
  }

  // Update the textures in the shader materials
  fgMesh.material.uniforms.uTexture.value = fgTexture;
  bgMesh.material.uniforms.uTexture.value = bgTexture;
};
const blobTexture = textureLoader.load("/blob.png");

/**
 * Meshes
 */
// Forground mesh
let fgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 32, 32),
  new THREE.RawShaderMaterial({
    vertexShader: vertexShaderFG,
    fragmentShader: fragmentShaderFG,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: fgTexture },
    },
  })
);
fgMesh.scale.y = 2 / 3;
fgMesh.position.z = 0.1;
scene.add(fgMesh);

// Background Mesh
const bgMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1, 32, 32),
  new THREE.RawShaderMaterial({
    vertexShader: vertexShaderBG,
    fragmentShader: fragmentShaderBG,
    side: THREE.DoubleSide,
    uniforms: {
      uTexture: { value: bgTexture },
      mask: { value: blobTexture },
      uMovementStrength: { value: 6.0 },
    },
    transparent: true,
  })
);

bgMesh.scale.y = 2 / 3;
bgMesh.position.z = 0.125;
scene.add(bgMesh);

// Blobs
const blobParams = {
  blobsRadius: isMobile ? 0.0001 : 0.001,
  blobsdispersion: isMobile ? 0.01 : 0.03,
  blobsSpeed: 0.2,
  blobsCount: isMobile ? 20 : 50,
  edgeOpacity: 0.9,
  distortionSize: isMobile ? 0.03 : 0.07,
};

let blobsMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(blobParams.distortionSize, blobParams.distortionSize),
  new THREE.MeshBasicMaterial({
    map: blobTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    depthWrite: false,
    opacity: blobParams.edgeOpacity,
  })
);

let allBlobs = [];
blobsMesh.position.z = 0.1;

const createBlobs = () => {
  // Remove old blobs
  allBlobs.forEach((blob) => scene1.remove(blob));
  allBlobs = [];

  for (let i = 0; i < blobParams.blobsCount; i++) {
    let clonnedBlob = blobsMesh.clone();
    let deviation = rangeFunction(0, 2 * Math.PI);
    let r = rangeFunction(blobParams.blobsRadius, blobParams.blobsdispersion);
    clonnedBlob.position.x = r * Math.sin(deviation);
    clonnedBlob.position.y = r * Math.cos(deviation);
    clonnedBlob.userData.life = rangeFunction(-2 * Math.PI, 2 * Math.PI);

    allBlobs.push(clonnedBlob);
    scene1.add(clonnedBlob);
  }
};

createBlobs();

const updateBlobs = () => {
  allBlobs.forEach((blob) => {
    blob.userData.life += blobParams.blobsSpeed;
    blob.scale.setScalar(Math.sin(blob.userData.life / 2));

    if (blob.userData.life > 2 * Math.PI) {
      blob.userData.life = -2 * Math.PI;

      let deviation = rangeFunction(0, 2 * Math.PI);
      let r = rangeFunction(blobParams.blobsRadius, blobParams.blobsdispersion);

      blob.position.x = points.x + r * Math.sin(deviation);
      blob.position.y = points.y + r * Math.cos(deviation);
    }
  });
};

/**
 * Debug GUI
 */
const gui = new GUI();
gui
  .add(blobParams, "blobsRadius")
  .min(0.0001)
  .max(0.2)
  .step(0.0001)
  .name("Blobs Separation");
gui
  .add(blobParams, "blobsCount")
  .min(0)
  .max(100)
  .step(1)
  .name("Blobs Count")
  .onChange(createBlobs);
gui
  .add(blobParams, "blobsdispersion")
  .min(0.01)
  .max(0.2)
  .step(0.001)
  .name("Blobs Positions");
gui
  .add(blobParams, "edgeOpacity")
  .min(0.0)
  .max(1.0)
  .step(0.0001)
  .name("Edge Opacity")
  .onChange((value) => {
    allBlobs.forEach((blob) => {
      blob.material.opacity = value;
    });
  });
gui
  .add(blobParams, "distortionSize")
  .min(0.0)
  .max(0.5)
  .step(0.0001)
  .name("Distortion Size")
  .onChange((value) => {
    blobsMesh.geometry.dispose();
    blobsMesh.geometry = new THREE.PlaneGeometry(value, value);
    allBlobs.forEach((blob) => {
      blob.geometry.dispose();
      blob.geometry = new THREE.PlaneGeometry(value, value);
    });
  });
gui
  .add(blobParams, "blobsSpeed")
  .min(0.01)
  .max(1)
  .step(0.01)
  .name("Blobs Speed");
gui
  .add(bgMesh.material.uniforms.uMovementStrength, "value")
  .min(0.0)
  .max(10.0)
  .step(1)
  .name("Distortion Effect");

/**
 * Window resize handler
 */
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
camera.position.set(0, 0, 0.425);
scene.add(camera);

/**
 * Orbit controls
 */
// const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;

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
  // controls.update();

  updateBlobs();

  // Render scene1 to renderTarget
  renderer.setRenderTarget(renderTarget);
  renderer.render(scene1, camera);

  bgMesh.material.uniforms.mask.value = renderTarget.texture;

  // Render scene to canvas
  renderer.setRenderTarget(null);

  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

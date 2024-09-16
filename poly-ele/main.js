import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { gsap } from "gsap";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import GUI from "lil-gui";

const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "flex";
  }
};

loadingManager.onLoad = () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.display = "none";
  }
};

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  console.log(`Loading: ${url} (${itemsLoaded}/${itemsTotal})`);
};

loadingManager.onError = (url) => {
  console.error(`Error loading: ${url}`);
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0xe1ffd8, 0);

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uTriScale: { value: 0.5 },
    uMosaic: { value: 50.0 },
    uProgress: { value: 1.0 },
    uRedShift: { value: 1.0 },
    uGreenShift: { value: 0.8 },
    uBlueShift: { value: 1.0 },
  },
  side: THREE.DoubleSide,
});

// GSAP Animations for uniforms
gsap.to(shaderMaterial.uniforms.uProgress, {
  value: 0,
  duration: 5,
  ease: "power2.inOut",
  repeat: -1,
  yoyo: true,
});

// Debug with lil GUI
const gui = new GUI();
gui
  .add(shaderMaterial.uniforms.uTriScale, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("Triangle Scale");
gui
  .add(shaderMaterial.uniforms.uMosaic, "value")
  .min(0)
  .max(50)
  .step(0.01)
  .name("Mosaic");
gui
  .add(shaderMaterial.uniforms.uRedShift, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("R-channel");
gui
  .add(shaderMaterial.uniforms.uGreenShift, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("G-channel");
gui
  .add(shaderMaterial.uniforms.uBlueShift, "value")
  .min(0)
  .max(1)
  .step(0.01)
  .name("B-channel");

// Model Loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/gltf");

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
  "/models/ele.glb",
  (gltf) => {
    const model = gltf.scene.getObjectByName("ele");

    if (model) {
      model.scale.set(0.8, 0.8, 0.8);

      let geometry = model.geometry.toNonIndexed();
      geometry.center();

      const positionAttribute = geometry.getAttribute("position");
      const centers = new Float32Array(positionAttribute.count * 3);

      for (let i = 0; i < positionAttribute.count; i += 3) {
        const centerX =
          (positionAttribute.getX(i) +
            positionAttribute.getX(i + 1) +
            positionAttribute.getX(i + 2)) /
          3;
        const centerY =
          (positionAttribute.getY(i) +
            positionAttribute.getY(i + 1) +
            positionAttribute.getY(i + 2)) /
          3;
        const centerZ =
          (positionAttribute.getZ(i) +
            positionAttribute.getZ(i + 1) +
            positionAttribute.getZ(i + 2)) /
          3;

        centers.set([centerX, centerY, centerZ], i * 3);
        centers.set([centerX, centerY, centerZ], (i + 1) * 3);
        centers.set([centerX, centerY, centerZ], (i + 2) * 3);
      }

      geometry.setAttribute("center", new THREE.BufferAttribute(centers, 3));

      const mesh = new THREE.Mesh(geometry, shaderMaterial);
      scene.add(mesh);
    } else {
      console.error("Model not found");
    }
  },
  undefined,
  (error) => {
    console.error("An error occurred:", error);
  }
);

// Add Post-Processing: Bloom Effect
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// UnrealBloomPass parameters: strength, radius, threshold
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  1.5,
  0.8,
  0.85
);
composer.addPass(bloomPass);

// Clock
const clock = new THREE.Clock();

// Animation Loop
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update the uTime uniform with the elapsed time
  shaderMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render the scene with post-processing
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

// Handle window resize
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer and post-processing
  renderer.setSize(sizes.width, sizes.height);
  composer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

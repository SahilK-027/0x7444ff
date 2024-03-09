import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import GUI from "lil-gui";
import particlesVertexShader from "./shaders/particles/vertex.glsl";
import particlesFragmentShader from "./shaders/particles/fragment.glsl";
import gpgpuParticlesFragmentShader from "./shaders/gpgpu/particles-frag.glsl";

const isMobile = window.matchMedia("(max-width: 768px)").matches;

const models = [
  {
    name: "Rose Garden",
    modelLink: "./rose.glb",
    camera: {
      x: 0,
      y: 10,
      z: 35 + (isMobile ? 10 : 0),
    },
    clearColor: "#120310",
    rotation: {
      x: Math.PI / 3,
      y: Math.PI / 2,
      z: Math.PI / 2,
    },
    uSize: 0.17,
  },
  {
    name: "MV Spartan",
    modelLink: "./model.glb",
    camera: {
      x: 4.5,
      y: 4,
      z: 20 + (isMobile ? 8 : 0),
    },
    clearColor: "#1a1622",
    rotation: {
      x: 0,
      y: (-1 * Math.PI) / 8,
      z: 0,
    },
    uSize: 0.07,
  },
  {
    name: "Flowerpot",
    modelLink: "./flowerpot.glb",
    camera: {
      x: 0,
      y: 0,
      z: 70 + (isMobile ? 25 : 0),
    },
    clearColor: "#2a1325",
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    uSize: 0.4,
    Influence: 0.3,
    Strength: 4,
    Frequency: 0.5,
  },
  {
    name: "Chameleon",
    modelLink: "./chameleon.glb",
    camera: {
      x: 0,
      y: 10,
      z: 16 + (isMobile ? 8 : 0),
    },
    clearColor: "#041615",
    rotation: {
      x: 0,
      y: 0 + (isMobile ? -0.4 : 0),
      z: 0,
    },
    uSize: 0.14,
  },
];
// Get the previously selected model index from the cookie
const previousModelIndex = parseInt(document.cookie ? document.cookie : -1);

// Generate a new model index different from the previous one
let modelIndex = (previousModelIndex + 1) % models.length;
document.getElementById("curr-model-name").innerText =
  models[modelIndex % models.length].name;
document.getElementById("next-model-name").innerText =
  models[(modelIndex + 1) % models.length].name;

// Set the new model index to the cookie
document.cookie = modelIndex;

const model = models[modelIndex];
/**
 * Base
 */
/**=======================================================================
 * * DEBUG
======================================================================= */
const gui = new GUI({
  width: 300,
});
if (isMobile) {
  gui.close();
}
const debugObject = {};

/**=======================================================================
 * * Canvas
======================================================================= */
const canvas = document.querySelector("canvas.webgl");

/**=======================================================================
 * * Scene
======================================================================= */
const scene = new THREE.Scene();

/**=======================================================================
 * * Loaders
======================================================================= */
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

/**=======================================================================
 * * Resizing
======================================================================= */
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

  // Materials
  particles.material.uniforms.uResolution.value.set(
    sizes.width * sizes.pixelRatio,
    sizes.height * sizes.pixelRatio
  );

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
});

/**=======================================================================
 * * Camera
======================================================================= */
// Base camera
const camera = new THREE.PerspectiveCamera(
  35,
  sizes.width / sizes.height,
  0.01,
  1000
);
camera.position.set(model.camera.x, model.camera.y, model.camera.z);
scene.add(camera);

/**=======================================================================
 * * Orbit Controls
======================================================================= */
const controls = new OrbitControls(camera, canvas);
controls.minPolarAngle = Math.PI / 5;
controls.maxPolarAngle = Math.PI / 2;
controls.enableDamping = true;
controls.enablePan = false;
/**=======================================================================
 * * 3D Renderer
======================================================================= */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);

debugObject.clearColor = model.clearColor;
renderer.setClearColor(debugObject.clearColor);

/**
 * Load model
 */
const gltf = await gltfLoader.loadAsync(model.modelLink);

/**=======================================================================
 * * Base Geometry
======================================================================= */
const baseGeometry = {};
baseGeometry.instance = gltf.scene.children[0].geometry;
baseGeometry.count = baseGeometry.instance.attributes.position.count;

/**=======================================================================
 * * GPGPU
======================================================================= */
const gpgpu = {};
gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count));
gpgpu.computation = new GPUComputationRenderer(
  gpgpu.size, // width
  gpgpu.size, // height
  renderer // renderer
);
// Base Particle Data
const baseParticlesTexture = gpgpu.computation.createTexture();
for (let i = 0; i < baseGeometry.count; i++) {
  const i3 = i * 3;
  const i4 = i * 4;

  // Position based on geometry
  baseParticlesTexture.image.data[i4 + 0] =
    baseGeometry.instance.attributes.position.array[i3 + 0];
  baseParticlesTexture.image.data[i4 + 1] =
    baseGeometry.instance.attributes.position.array[i3 + 1];
  baseParticlesTexture.image.data[i4 + 2] =
    baseGeometry.instance.attributes.position.array[i3 + 2];
  baseParticlesTexture.image.data[i4 + 3] = Math.random();
}
// Particles Data
gpgpu.particlesVariable = gpgpu.computation.addVariable(
  "uParticles",
  gpgpuParticlesFragmentShader,
  baseParticlesTexture
);
gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [
  gpgpu.particlesVariable,
]);

// Uniforms
gpgpu.particlesVariable.material.uniforms.uTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uDeltaTime = new THREE.Uniform(0);
gpgpu.particlesVariable.material.uniforms.uBase = new THREE.Uniform(
  baseParticlesTexture
);
gpgpu.particlesVariable.material.uniforms.Influence = new THREE.Uniform(
  model.Influence ? model.Influence : 0.2
);
gpgpu.particlesVariable.material.uniforms.Strength = new THREE.Uniform(
  model.Strength ? model.Strength : 4.0
);
gpgpu.particlesVariable.material.uniforms.Frequency = new THREE.Uniform(
  model.Frequency ? model.Frequency : 0.5
);

// Init
gpgpu.computation.init();

// Debug Plane
gpgpu.debug = new THREE.Mesh(
  new THREE.PlaneGeometry(3, 3),
  new THREE.MeshBasicMaterial({
    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable)
      .texture,
  })
);
gpgpu.debug.position.set(3, 0, 0);
// scene.add(gpgpu.debug);

/**=======================================================================
 * * Particles
======================================================================= */
const particles = {};
// Geometry
const particlesUvArray = new Float32Array(baseGeometry.count * 2);
const sizesArray = new Float32Array(baseGeometry.count);

for (let y = 0; y < gpgpu.size; y++) {
  for (let x = 0; x < gpgpu.size; x++) {
    const i = y * gpgpu.size + x;
    const i2 = i * 2;

    // Particles UV
    const uvX = (x + 0.5) / gpgpu.size;
    const uvY = (y + 0.5) / gpgpu.size;

    particlesUvArray[i2 + 0] = uvX;
    particlesUvArray[i2 + 1] = uvY;

    // Size
    sizesArray[i] = Math.random();
  }
}

// Geometry
particles.geometry = new THREE.BufferGeometry();
particles.geometry.setDrawRange(0, baseGeometry.count);
particles.geometry.setAttribute(
  "aParticlesUv",
  new THREE.BufferAttribute(particlesUvArray, 2)
);
particles.geometry.setAttribute(
  "aColor",
  baseGeometry.instance.attributes.color
);
particles.geometry.setAttribute(
  "aSize",
  new THREE.BufferAttribute(sizesArray, 1)
);

// Material
particles.material = new THREE.ShaderMaterial({
  vertexShader: particlesVertexShader,
  fragmentShader: particlesFragmentShader,
  uniforms: {
    uSize: new THREE.Uniform(model.uSize),
    uResolution: new THREE.Uniform(
      new THREE.Vector2(
        sizes.width * sizes.pixelRatio,
        sizes.height * sizes.pixelRatio
      )
    ),
    uParticlesTexture: new THREE.Uniform(),
  },
});

// Points
particles.points = new THREE.Points(particles.geometry, particles.material);
particles.points.rotateZ(model.rotation.z);
particles.points.rotateX(model.rotation.x);
particles.points.rotateY(model.rotation.y);
scene.add(particles.points);

/**=======================================================================
 * * Debug GUI
======================================================================= */
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});
gui
  .add(particles.material.uniforms.uSize, "value")
  .min(0)
  .max(0.5)
  .step(0.0001)
  .name("Size");
gui
  .add(gpgpu.particlesVariable.material.uniforms.Influence, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Influence");
gui
  .add(gpgpu.particlesVariable.material.uniforms.Strength, "value")
  .min(0)
  .max(10)
  .step(0.001)
  .name("Strength");
gui
  .add(gpgpu.particlesVariable.material.uniforms.Frequency, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Frequency");

/**=======================================================================
 * * Animation Loop
======================================================================= */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update controls
  controls.update();

  // Update GPGPU
  gpgpu.particlesVariable.material.uniforms.uTime.value = elapsedTime;
  gpgpu.particlesVariable.material.uniforms.uDeltaTime.value = deltaTime;
  gpgpu.computation.compute();
  particles.material.uniforms.uParticlesTexture.value =
    gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture;

  // Render normal scene
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

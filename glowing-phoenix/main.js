import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import gsap from "gsap";

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
camera.position.set(1.4, -0.0, 3.0);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  alpha: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uTriScale: { value: 0.7 },
    uMosaic: { value: 20.0 },
    uProgress: { value: 0.0 },
    uMousePosition: { value: new THREE.Vector2(0, 0) },
    uMouseVelocity: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0.0 },
    uBaseColor: { value: new THREE.Color(0x850000) }, // Bright orange-red
    uGlowColor: { value: new THREE.Color(0xffaa00) }, // Bright orange
    uAccentColor: { value: new THREE.Color(0xff0000) }, // Bright red
  },
});
// Mouse interaction
let mousePosition = new THREE.Vector2();
let previousMousePosition = new THREE.Vector2();
let mouseVelocity = new THREE.Vector2();
let hover = 0;

window.addEventListener("mousemove", (event) => {
  previousMousePosition.copy(mousePosition);
  mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
  mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
  mouseVelocity.subVectors(mousePosition, previousMousePosition);
});

window.addEventListener("mousedown", () => {
  hover = 1;
});

window.addEventListener("mouseup", () => {
  hover = 0;
});

// Model Loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/gltf");

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setDRACOLoader(dracoLoader);

gltfLoader.load(
  "/models/phoenix.glb",
  (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        let geometry = child.geometry;
        geometry = geometry.toNonIndexed();
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
        mesh.position.set(0, -0.5, 0);
        scene.add(mesh);
      }
    });
  },
  undefined,
  (error) => {
    console.error("An error occurred:", error);
  }
);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(sizes.width, sizes.height),
  1.5, // strength
  1.0, // radius
  0.8 // threshold
);
composer.addPass(bloomPass);

const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    varying vec2 vUv;
    
    vec3 adjustContrast(vec3 color, float contrast) {
      return 0.5 + (1.0 + contrast) * (color - 0.5);
    }
    
    vec3 adjustSaturation(vec3 color, float saturation) {
      float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
      return mix(vec3(grey), color, 1.0 + saturation);
    }
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // Enhance contrast and saturation
      vec3 color = adjustContrast(texel.rgb, 0.2);
      color = adjustSaturation(color, 0.2);
      
      // Subtle color shift
      float shift = sin(0.2) * 0.5 + 0.5;
      color = mix(color, color.gbr, shift * 0.1);
      
      // Vignette effect
      vec2 center = vUv - 0.5;
      float vignette = 1.0 - dot(center, center) * 0.3;
      color *= vignette;
      
      gl_FragColor = vec4(color, texel.a);
    }
  `,
};

const customPass = new ShaderPass(customShader);
composer.addPass(customPass);

// Custom glow shader
const glowShader = {
  uniforms: {
    tDiffuse: { value: null },
    uIntensity: { value: 0.4 },
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uIntensity;
    uniform float uTime;
    varying vec2 vUv;
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 glow = texel.rgb * uIntensity;
      
      // Enhanced pulsating glow effect
      float pulse = (sin(2.0) * 0.5 + 0.5) * 0.5;
      glow *= 1.0 + pulse;
      
      // Color shift
      float colorShift = sin(0.5) * 0.5 + 0.5;
      vec3 shiftedColor = mix(glow, vec3(glow.g, glow.b, glow.r), colorShift);
      
      gl_FragColor = vec4(texel.rgb + shiftedColor, texel.a);
    }
  `,
};

const glowPass = new ShaderPass(glowShader);
composer.addPass(glowPass);

// Create a GSAP timeline
const tl = gsap.timeline({
  repeat: -1, // Repeat the entire sequence indefinitely
  yoyo: true, // Play the sequence backwards on alternate iterations
});

// Add animations to the timeline
tl.to(shaderMaterial.uniforms.uTriScale, {
  value: 0.2,
  duration: 5,
  ease: "power2.inOut",
}).to(
  shaderMaterial.uniforms.uProgress,
  {
    value: 1,
    duration: 5,
    ease: "power2.inOut",
  },
  "-=4"
);
// Play the timeline
tl.play();

// GUI
const gui = new GUI();
// Shader Material GUI
const shaderFolder = gui.addFolder("Shader Material");
shaderFolder
  .add(shaderMaterial.uniforms.uMosaic, "value", 1, 100, 0.1)
  .name("Mosaic");

// Bloom Pass GUI
const bloomFolder = gui.addFolder("Bloom Effect");
bloomFolder.add(bloomPass, "strength", 0, 3, 0.01).name("Strength");
bloomFolder.add(bloomPass, "radius", 0, 1, 0.01).name("Radius");
bloomFolder.add(bloomPass, "threshold", 0, 1, 0.01).name("Threshold");

// Custom Pass GUI
const customPassFolder = gui.addFolder("Custom Post-processing");
customPassFolder
  .add(customPass.uniforms.uTime, "value", 0, 10, 0.1)
  .name("Time Scale");

// Glow Pass GUI
const glowPassFolder = gui.addFolder("Glow Effect");
glowPassFolder
  .add(glowPass.uniforms.uIntensity, "value", 0, 10, 0.01)
  .name("Glow Intensity");

// Mouse Interaction GUI
const mouseFolder = gui.addFolder("Mouse Interaction");
const mouseSettings = {
  velocityDecay: 0.95,
};
mouseFolder
  .add(mouseSettings, "velocityDecay", 0.8, 0.99, 0.01)
  .name("Velocity Decay");

// Color GUI
const colorFolder = gui.addFolder("Colors");

colorFolder
  .addColor(shaderMaterial.uniforms.uBaseColor, "value")
  .name("Base Color");
colorFolder
  .addColor(shaderMaterial.uniforms.uGlowColor, "value")
  .name("Glow Color");
colorFolder
  .addColor(shaderMaterial.uniforms.uAccentColor, "value")
  .name("Accent Color");
// Clock
const clock = new THREE.Clock();

// Animation Loop
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  shaderMaterial.uniforms.uTime.value = elapsedTime;
  shaderMaterial.uniforms.uMousePosition.value = mousePosition;
  shaderMaterial.uniforms.uMouseVelocity.value = mouseVelocity;
  shaderMaterial.uniforms.uHover.value = THREE.MathUtils.lerp(
    shaderMaterial.uniforms.uHover.value,
    hover,
    0.1
  );

  mouseVelocity.multiplyScalar(0.95);

  // Update custom uniforms
  glowPass.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render using the composer
  composer.render();

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

// Handle window resize
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer and composer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(sizes.width, sizes.height);
});

import SceneManager from "./SceneManager";
import ResourceLoader from "./utils/ResourceLoader";

// Select the WebGL canvas element from the DOM
const canvas = document.querySelector("canvas.webgl");

// Application configuration defaults
const CONFIG = {
  // Debug settings
  debugConfig: {
    debugEnable: true,
    debugClosed: false,
  },

  // Scene settings
  sceneConfig: {
    backgroundColor: "#1861a5",
    fog: {
      color: {
        x: 0.1,
        y: 0.38,
        z: 0.6,
      },
      density: 0.075,
    },
  },

  // Perspective camera setup
  cameraConfig: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: {
      x: 1.5,
      y: 1.0,
      z: 1.5,
    },
    aspect: window.innerWidth / window.innerHeight,
  },

  // WebGL renderer options
  rendererConfig: {
    pixelRatio: Math.min(2, window.devicePixelRatio),
    antialias: true,
    shadowMap: {
      enabled: false,
      type: "PCFSoftShadowMap",
    },
  },

  // OrbitControls configuration
  controlsConfig: {
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: true,
    minDistance: 1,
    maxDistance: 50,
    maxPolarAngle: Math.PI / 2.5,
  },
};

// Asset definitions: type, identifier, and resource path
const ASSETS = [
  {
    type: "texture",
    name: "grassTexture",
    url: "/assets/textures/grass_blade.png",
  },
  {
    type: "texture",
    name: "grassDisplacementTexture",
    // Anime Grass Tutorial - Blender Files from @trungduyng
    // YT Link: https://youtu.be/M4kMri55rdE
    // https://trungduyng.substack.com/p/anime-grass-tutorial-blender
    url: "/assets/textures/grass_displacement_map.png",
  },
  {
    type: "texture",
    name: "grassDisplacementTexture2",
    // https://thedemonthrone.ca/projects/rendering-terrain/rendering-terrain-part-20-normal-and-displacement-mapping/
    url: "/assets/textures/grass_displacement_map_2.png",
  },
  {
    type: "texture",
    name: "grassDisplacementTexture3",
    // https://www.filterforge.com/filters/11382-bump.html
    url: "/assets/textures/grass_displacement_map_3.png",
  },
  {
    type: "texture",
    name: "flowerDiffuseTexture",
    url: "/assets/textures/flower_diffuse.png",
  },
  // Example of adding other asset types:
  // { type: "model", name: "testModel", url: "/assets/models/test.glb" },
  // { type: "environment", name: "sunsetHDR", url: "/assets/env/sunset.hdr" },
];

// Application initialization
function initApp() {
  if (ASSETS.length === 0) {
    console.log("No assets defined, initializing SceneManager with defaults");

    // Instantiate SceneManager without resources
    new SceneManager({
      canvas,
      resources: {},
      config: CONFIG,
    });
  } else {
    // Initialize resource loader with progress callback
    const loader = new ResourceLoader(ASSETS, (percent) => {
      console.log(`Loading assets: ${percent}% complete`);
    });

    // Load all assets asynchronously
    loader
      .loadAll()
      .then((resources) => {
        console.log("Assets loaded successfully:", resources);

        // Start SceneManager with loaded assets and configuration
        new SceneManager({
          canvas,
          resources,
          config: CONFIG,
        });
      })
      .catch((error) => {
        console.error("Asset loading failed:", error);
      });
  }
}

initApp();

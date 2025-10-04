import * as THREE from "three";
import MainScene from "./scenes/MainScene.js";
import PerspectiveCamera from "./cameras/PerspectiveCamera.js";
import OrbitControls from "./controls/OrbitControls.js";
import WebGLRenderer from "./renderers/WebGLRenderer.js";
import DebugGUI from "./utils/DebugGUI.js";
import PerfMonitor from "./utils/PerfMonitor.js";
import GlobalUniformsManager from "./utils/GlobalUniformsManager.js";

export default class SceneManager {
  constructor({ canvas, resources, config }) {
    this.canvas = canvas;
    this.resources = resources;
    const {
      debugConfig,
      sceneConfig,
      cameraConfig,
      rendererConfig,
      controlsConfig,
    } = config;
    this.clock = new THREE.Clock();

    // Initialize the debug interface (if enabled)
    this.debug = new DebugGUI();
    this.debug.setEnabled(debugConfig.debugEnable);
    this.debug.close(debugConfig.debugClosed);

    // Initialize WebGL renderer tied to the canvas
    this.rendererRef = new WebGLRenderer(this.canvas, rendererConfig);

    this.globalUniforms = new GlobalUniformsManager(this.clock);

    // Create the main scene using resources and scene config
    this.scene = new MainScene(
      this.resources,
      sceneConfig,
      this.clock,
      this.rendererRef.renderer,
      this.globalUniforms
    );

    // Set up perspective camera with provided parameters
    this.camera = new PerspectiveCamera(cameraConfig);

    // Attach orbit controls to the camera and canvas
    this.controls = new OrbitControls(
      this.camera.instance,
      this.canvas,
      controlsConfig
    );

    // Enable performance monitoring
    // this.perf = new PerfMonitor(this.rendererRef.renderer);

    // Hook into window resize to maintain correct aspect and sizes
    this._bindEvents();

    // Start the render/update loop
    this._animate();
  }

  _bindEvents() {
    window.addEventListener("resize", () => this._onResize());
  }

  _onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.onResize(width, height);
    this.rendererRef.onResize(width, height);

    // Now update any modules that need the new resolution:
    this.globalUniforms.updateResolution(width, height);
  }

  _animate() {
    requestAnimationFrame(() => this._animate());

    // this.perf.beginFrame();

    // Smooth camera motion
    this.controls.update();

    // Update scene logic
    this.scene.update();

    // Update global uniforms
    this.globalUniforms.updateTime();

    // Draw the scene
    this.rendererRef.render(this.scene.instance, this.camera.instance);

    // end stats
    // this.perf.endFrame();
    // this.perf.updateFrame();
  }

  /**
   * Dispose of all resources and event listeners
   */
  destroy() {
    // Remove controls and release event listeners
    this.controls?.dispose();

    // Dispose of renderer WebGL context
    this.rendererRef?.instance.dispose();

    // Tear down the debug GUI instance
    DebugGUI.destroy();

    // Tear down the perf instance
    PerfMonitor.destroy();
  }
}

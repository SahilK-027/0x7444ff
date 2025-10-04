import * as THREE from "three";

export default class WebGLRenderer {
  constructor(canvas, rendererConfig = {}) {
    const {
      antialias = true,
      pixelRatio = window.devicePixelRatio,
      shadowMap = { enabled: false, type: THREE.PCFSoftShadowMap },
    } = rendererConfig;

    // Create renderer with antialiasing and no alpha by default
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias,
    });

    // Initial size and pixel ratio setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(pixelRatio, 2));

    // Output in standard sRGB space for correct color representation
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Configure shadow mapping
    this.renderer.shadowMap.enabled = shadowMap.enabled;
    this.renderer.shadowMap.type = shadowMap.type;

    // Listen for window resize to update renderer size
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  render(scene, camera) {
    this.renderer.render(scene, camera);
  }

  get instance() {
    return this.renderer;
  }
}

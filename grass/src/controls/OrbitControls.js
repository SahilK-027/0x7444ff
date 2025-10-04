import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default class OrbitControls {
  constructor(camera, domElement, controlConfig = {}) {
    const {
      enableDamping = true,
      dampingFactor = 0.1,
      enableZoom = false,
      enablePan = false,
      minDistance = null,
      maxDistance = null,
      maxPolarAngle = Math.PI / 2.4,
      minPolarAngle = Math.PI / 2.4,
    } = controlConfig;

    // Create Three.js OrbitControls instance
    this.controls = new ThreeOrbitControls(camera, domElement);

    // Apply configuration settings
    this.controls.enableDamping = enableDamping;
    this.controls.dampingFactor = dampingFactor;
    this.controls.enableZoom = true;
    this.controls.enablePan = false;
    // this.controls.maxPolarAngle = maxPolarAngle;
    // this.controls.minPolarAngle = minPolarAngle;
    // this.controls.autoRotate = true;
    // this.controls.autoRotateSpeed = 0.75;

    // Set distance constraints if provided
    if (minDistance !== null) {
      this.controls.minDistance = minDistance;
    }
    if (maxDistance !== null) {
      this.controls.maxDistance = maxDistance;
    }
  }

  update() {
    this.controls.update();
  }

  get instance() {
    return this.controls;
  }
}

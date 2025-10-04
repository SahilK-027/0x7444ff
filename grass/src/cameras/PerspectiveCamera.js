import * as THREE from "three";

export default class PerspectiveCamera {
  constructor(cameraConfig = {}) {
    const {
      fov = 75,
      aspect = window.innerWidth / window.innerHeight,
      near = 0.1,
      far = 5000,
      position = { x: 0, y: 0, z: 3 },
    } = cameraConfig;

    // Instantiate THREE.PerspectiveCamera
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Set initial position
    this.camera.position.set(position.x, position.y, position.z);

    // Listen for resize events to maintain correct aspect ratio
    window.addEventListener("resize", () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  addToScene(scene) {
    scene.add(this.camera);
  }

  get instance() {
    return this.camera;
  }
}

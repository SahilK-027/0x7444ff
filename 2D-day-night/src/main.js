import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import "./style.css";

class ShaderRenderer {
  constructor() {
    // Debug
    // this.gui = new GUI();
    // this.gui.close();

    // Canvas
    this.canvas = document.querySelector("canvas.webgl");

    // Scene
    this.scene = new THREE.Scene();

    this.clock = new THREE.Clock();

    // Sizes
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.initGeometry();
    this.initCamera();
    this.initRenderer();
    // this.initControls();
    this.initEventListeners();
    this.startAnimationLoop();
  }

  initGeometry() {
    // Geometry
    this.geometry = new THREE.PlaneGeometry(2, 2, 32, 32);

    // Material
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: {
          value: 0.0,
        },
        uResolution: {
          value: new THREE.Vector2(this.sizes.width, this.sizes.height),
        },
        uRandomFloat: {
          value: Math.random() + 0.1,
        },
      },
    });

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  initCamera() {
    // Base camera
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
    this.camera.position.set(0.0, 0.0, 1);
    this.scene.add(this.camera);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  initEventListeners() {
    window.addEventListener("resize", () => this.handleResize());
  }

  handleResize() {
    // Update sizes
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.screenResolution = this.sizes.width / this.sizes.height;

    this.material.uniforms.uResolution.value = new THREE.Vector2(
      this.sizes.width,
      this.sizes.height
    );
  }

  animate() {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime();
    // Update controls
    // this.controls.update();

    // Render
    this.renderer.render(this.scene, this.camera);

    // Call animate again on the next frame
    window.requestAnimationFrame(() => this.animate());
  }

  startAnimationLoop() {
    this.animate();
  }
}

// Initialize the renderer when the script loads
const shaderRenderer = new ShaderRenderer();

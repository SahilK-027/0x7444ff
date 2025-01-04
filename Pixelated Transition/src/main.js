import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import "./style.css";
import t1 from "./assets/t1.png";

class ShaderRenderer {
  constructor() {
    this.gui = new GUI(); // Debug UI
    this.canvas = document.querySelector("canvas.webgl");

    this.scene = new THREE.Scene();

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.initGeometry();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initEventListeners();
    this.startAnimationLoop();
  }

  initGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 32, 32); // Plane geometry
    const textureImg = new THREE.TextureLoader().load(t1);

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader, // Shader source
      fragmentShader: fragmentShader, // Shader source
      uniforms: {
        uTexture: {
          value: textureImg,
        },
      },
      side: THREE.DoubleSide, // Render both sides of the plane
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.y = 2 / 2.5;
    this.mesh.scale.x = 1.3;
    this.scene.add(this.mesh);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.camera.position.set(0.0, 0.0, 0.8);
    this.scene.add(this.camera);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
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
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera); // Render the scene
    window.requestAnimationFrame(() => this.animate()); // Continue animation loop
  }

  startAnimationLoop() {
    this.animate();
  }
}

// Initialize the renderer
const shaderRenderer = new ShaderRenderer();

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import "./style.css";
import t1 from "./assets/t3.png";

class ShaderRenderer {
  constructor() {
    this.gui = new GUI();
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
    const aspect = this.sizes.width / this.sizes.height;
    this.geometry = new THREE.PlaneGeometry(aspect, 1, 32, 32);

    const texture1 = new THREE.TextureLoader().load(t1);

    texture1.wrapS = texture1.wrapT = THREE.ClampToEdgeWrapping;

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTexture: { value: texture1 },
        uResolution: {
          value: new THREE.Vector2(this.sizes.width, this.sizes.height),
        },
      },
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    // this.mesh.scale.y = 2/2.5;
    this.scene.add(this.mesh);
  }

  initCamera() {
    const aspect = this.sizes.width / this.sizes.height;
    const frustumHeight = 1; // Choose a logical height for your scene
    const frustumWidth = frustumHeight * aspect;

    this.camera = new THREE.OrthographicCamera(
      -frustumWidth / 2, // left
      frustumWidth / 2, // right
      frustumHeight / 2, // top
      -frustumHeight / 2, // bottom
      0.1, // near
      100 // far
    );
    this.camera.position.set(0.0, 0.0, 0.8); // Position the camera
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

    const aspect = this.sizes.width / this.sizes.height;
    const frustumHeight = 1;
    const frustumWidth = frustumHeight * aspect;

    this.camera.left = -frustumWidth / 2;
    this.camera.right = frustumWidth / 2;
    this.camera.top = frustumHeight / 2;
    this.camera.bottom = -frustumHeight / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.updatePlaneScale();
  }

  animate() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(() => this.animate());
  }

  startAnimationLoop() {
    this.animate();
  }
}

// Initialize the renderer
new ShaderRenderer();

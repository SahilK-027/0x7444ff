import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import "./style.css";
import t1 from "./assets/1.png";
import t2 from "./assets/2.png";
import t1sm from "./assets/1sm.png";
import t2sm from "./assets/2sm.png";
class ShaderRenderer {
  constructor() {
    this.gui = new GUI();
    this.canvas = document.querySelector("canvas.webgl");

    this.scene = new THREE.Scene();

    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.isMobile = this.sizes.width < 500;

    this.initGeometry();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initEventListeners();
    this.addGUIControls();
    this.startAnimationLoop();
  }

  initGeometry() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    const texture1 = new THREE.TextureLoader().load(this.isMobile ? t1sm : t1);
    const texture2 = new THREE.TextureLoader().load(this.isMobile ? t2sm : t2);

    texture1.wrapS = texture1.wrapT = THREE.ClampToEdgeWrapping;

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTexture1: { value: texture1 },
        uTexture2: { value: texture2 },
        uResolution: {
          value: new THREE.Vector2(this.sizes.width, this.sizes.height),
        },
        uTime: { value: 0 },
        uTransition: { value: 0.5 },
        uPattern: { value: 0 },
      },
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  initCamera() {
    this.camera = new THREE.OrthographicCamera(
      -1.0 / 2, // left
      1.0 / 2, // right
      1.0 / 2, // top
      -1.0 / 2, // bottom
      0.01, // near
      1000 // far
    );

    this.camera.position.set(0.0, 0.0, 2.0);
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
    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  animate() {
    const elapsedTime = performance.now() / 1000;
    this.material.uniforms.uTime.value = elapsedTime;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(() => this.animate());
  }

  addGUIControls() {
    this.gui
      .add(this.material.uniforms.uTransition, "value", 0, 1)
      .name("Transition");
    this.gui
      .add(this.material.uniforms.uPattern, "value", {
        Square: 0,
        Hexagon: 1,
        Circle: 2,
      })
      .name("Pattern Type")
      .onChange((value) => {
        console.log(value);
        this.material.uniforms.uPattern.value = value;
      });
  }

  startAnimationLoop() {
    this.animate();
  }
}

// Initialize the renderer
new ShaderRenderer();

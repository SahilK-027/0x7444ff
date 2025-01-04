import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import "./style.css";
import t1 from "./assets/t1.png";
import t2 from "./assets/t2.png";

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
    this.geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

    const texture1 = new THREE.TextureLoader().load(t1, (texture) => {
      this.resizeAspectRatio(texture);
    });

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        uTexture: {
          value: texture1,
        },
      },
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  resizeAspectRatio(texture) {
    const textureAspect = texture.image.width / texture.image.height;

    // Update UVs to preserve texture aspect ratio
    const geometryAspect = this.sizes.width / this.sizes.height;
    const scaleX = geometryAspect / textureAspect;

    this.geometry.attributes.uv.array = this.geometry.attributes.uv.array.map(
      (uv, index) => {
        if (index % 2 === 0) return uv * scaleX;
        return uv;
      }
    );

    this.geometry.attributes.uv.needsUpdate = true;

    this.updatePlaneScale();
  }

  updatePlaneScale() {
    const aspect = this.sizes.width / this.sizes.height;
    const fovInRadians = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fovInRadians / 2) * this.camera.position.z;
    const width = height * aspect;

    this.mesh.scale.set(width, height, 1);
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
    this.updatePlaneScale();
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

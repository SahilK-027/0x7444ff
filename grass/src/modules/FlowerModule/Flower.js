import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import DebugGUI from "../../utils/DebugGUI";

export default class FlowerModule {
  constructor(scene, grass, resources, clock) {
    this.scene = scene;
    this.grass = grass;
    this.resources = resources;
    this.clock = clock;
    this.debug = DebugGUI.getInstance();
  }

  init() {
    const FLOWER_COUNT = 1000;
    const flowerGeo = new THREE.PlaneGeometry(0.03, 0.03, 1, 1);
    const flowerMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(0xffff00) },
        uFlowerDiffuse: { value: this.resources.texture.flowerDiffuseTexture },
      },
      transparent: true,
    });

    const instanced = new THREE.InstancedMesh(
      flowerGeo,
      flowerMat,
      FLOWER_COUNT
    );

    const offsets = [];
    const shears = [];
    for (let i = 0; i < FLOWER_COUNT; i++) {
      // random on-floor position:
      const x = (Math.random() - 0.5) * 3;
      const z = (Math.random() - 0.5) * 3;
      offsets.push(x, 0, z);
      // small random shear in X and Z
      shears.push((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
      // identity matrix for now; actual shear happens in shader
      const m = new THREE.Matrix4().makeTranslation(x, 0.1, z);
      instanced.setMatrixAt(i, m);
    }
    instanced.instanceMatrix.needsUpdate = true;

    // 4) Attach our custom InstancedBufferAttributes
    instanced.geometry.setAttribute(
      "instanceShear",
      new THREE.InstancedBufferAttribute(new Float32Array(shears), 2)
    );
    // (we baked position into the matrix, so no need for instanceOffset)
    this.grass.grassMesh.add(instanced);

    // Add GUI controls for grass parameters
    this._setupGUI();
  }

  _setupGUI() {
    // this.debug.addFolder("Floor Debug");
    // this.debug.add(
    //   this.floorMaterial.uniforms.uColor,
    //   "value",
    //   { color: true, label: "Floor Color" },
    //   "Floor Debug"
    // );
  }

  update() {}
}

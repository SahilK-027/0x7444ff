import * as THREE from "three";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";
import DebugGUI from "../../utils/DebugGUI";

export default class FloorModule {
  constructor(scene, resources, clock) {
    this.scene = scene;
    this.resources = resources;
    this.clock = clock;
    this.debug = DebugGUI.getInstance();
  }

  init() {
    const GRID_SIZE = 10;
    const fogUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib["fog"]]);
    this.floorGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, 1, 1);
    this.floorMaterial = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      fog: true,
      uniforms: {
        ...fogUniforms,
        uColor: { value: new THREE.Color(0x121316) },
        uLineColor: { value: new THREE.Color(0x70f5ff) },
        uGridFrequency: { value: GRID_SIZE },
        uLineWidth: { value: 0.005 },
        uInnerPatternLineColor: { value: new THREE.Color(0x70f5ff) },
        uInnerPatternCount: { value: 10.0 },
        uInnerPatternWidth: { value: 0.1 },
        uInnerPatternOffset: { value: new THREE.Vector2(0.505, 0.505) },
      },
    });

    this.floorMesh = new THREE.Mesh(this.floorGeometry, this.floorMaterial);
    this.floorMesh.rotation.x = -Math.PI / 2;

    this.scene.add(this.floorMesh);

    // Add GUI controls for grass parameters
    this._setupGUI();
  }

  _setupGUI() {
    this.debug.addFolder("Floor Debug");
    this.debug.add(
      this.floorMaterial.uniforms.uColor,
      "value",
      { color: true, label: "Floor Color" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uLineColor,
      "value",
      { color: true, label: "Floor Line Color" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uGridFrequency,
      "value",
      { min: 1, max: 1000, step: 1, label: "Grid Frequency" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uLineWidth,
      "value",
      { min: 0, max: 0.1, step: 0.001, label: "Grid Line Width" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uInnerPatternLineColor,
      "value",
      { color: true, label: "Floor Pattern Color" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uInnerPatternCount,
      "value",
      { min: 0, max: 10, step: 1, label: "Floor Patten Color" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uInnerPatternWidth,
      "value",
      { min: 0, max: 1, step: 0.01, label: "Floor Patten Width" },
      "Floor Debug"
    );
    this.debug.add(
      this.floorMaterial.uniforms.uInnerPatternOffset,
      "value",
      { min: -5, max: 5, step: 0.001, label: "Floor Pattern offset" },
      "Floor Debug"
    );
  }

  update() {}
}

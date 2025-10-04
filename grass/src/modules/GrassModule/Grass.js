import * as THREE from "three";
import vertex from "./shaders/vertex.glsl";
import fragment from "./shaders/fragment.glsl";
import DebugGUI from "../../utils/DebugGUI";

export default class GrassModule {
  static BLADES_NUM = 64000;
  static SEGMENTS = 2;
  static PATCH_SIZE = 1; // Note: 0.5 patch size will corresponds 1 square unit on grid
  static BLADE_HEIGHT = 0.25;
  static BLADE_WIDTH = 0.02;

  constructor(scene, resources, clock, renderer, globalUniforms) {
    this.scene = scene;
    this.resources = resources;
    this.clock = clock;
    this.renderer = renderer;
    this.debug = DebugGUI.getInstance();
    this.guiFolder = this.debug.addFolder("Grass Settings");
    this.globalUniforms = globalUniforms;
  }

  init() {
    this.grassGeometry = this.#createGrassGeometry();
    this.grassMaterial = this.#createGrassMaterial();

    this.grassMesh = new THREE.Mesh(this.grassGeometry, this.grassMaterial);
    this.grassMesh.position.set(0, 0, 0);
    this.scene.add(this.grassMesh);

    // Add GUI controls for grass parameters
    this._setupGUI();
  }

  #createGrassGeometry() {
    const { SEGMENTS, BLADES_NUM, PATCH_SIZE, BLADE_WIDTH, BLADE_HEIGHT } =
      this.constructor;

    /**
     * Each blade segment is a quad (two triangles), requiring 4 vertices.
     * For N segments, there are N+1 rows of 2 vertices each => (SEGMENTS + 1) * 2 vertices.
     */
    const VERTICES = (SEGMENTS + 1) * 2;

    /**
     * Build index buffer for one blade. Each quad (segment) is composed of 2 triangles,
     * requiring 6 indices. We optionally duplicate/reverse indices for backside geometry
     * so blades are two-sided without extra geometry duplication in CPU.
     */
    const INDICES = [];

    for (let i = 0; i < SEGMENTS; i++) {
      // You can visualize these calculation in /public/theory/grassAnatomy.md
      // vi: index offset into the current blade's vertex list for this segment.
      const vi = i * 2;
      // -- Front face indices (counter-clockwise winding) --
      // Lower-left, lower-right, upper-left
      INDICES[i * 12 + 0] = vi + 0;
      INDICES[i * 12 + 1] = vi + 1;
      INDICES[i * 12 + 2] = vi + 2;

      // Upper-left, lower-right, upper-right
      INDICES[i * 12 + 3] = vi + 2;
      INDICES[i * 12 + 4] = vi + 1;
      INDICES[i * 12 + 5] = vi + 3;

      // -- Back face indices (clockwise winding) duplicates same vertices but flips winding --
      // fi: offset index for mirrored backside (if duplicating vertices, else same indices)
      // Here we reference the same verts but flip winding
      const fi = VERTICES + vi;
      INDICES[i * 12 + 6] = fi + 2;
      INDICES[i * 12 + 7] = fi + 1;
      INDICES[i * 12 + 8] = fi + 0;

      INDICES[i * 12 + 9] = fi + 3;
      INDICES[i * 12 + 10] = fi + 1;
      INDICES[i * 12 + 11] = fi + 2;
    }

    /**
     * 
      // If you want tip of blade to not be quad but single triangle use this iteration for last segment
      // now emit a single‐triangle tip (front + back) in the same 12‐slot chunk
      const i = SEGMENTS - 1;
      const base = i * 12;
      const vi = i * 2;
      const tipF = VERTICES - 1; // front‐side tip vert
      const tipB = VERTICES * 2 - 1; // back‐side tip vert (duplicate zone)

      // front‐facing tip triangle: lower-left, lower-right, tip
      INDICES[base + 0] = vi + 0;
      INDICES[base + 1] = vi + 1;
      INDICES[base + 2] = tipF;
      // fill the unused quad slots (3–5) with any valid index so buffer is dense
      INDICES[base + 3] = vi + 1;
      INDICES[base + 4] = vi + 1;
      INDICES[base + 5] = vi + 1;

      // back‐facing tip triangle: tip, lower-right, lower-left (CW)
      INDICES[base + 6] = tipB;
      INDICES[base + 7] = VERTICES + vi + 1;
      INDICES[base + 8] = VERTICES + vi + 0;
      // fill the unused back‐quad slots (9–11)
      INDICES[base + 9] = VERTICES + vi + 1;
      INDICES[base + 10] = VERTICES + vi + 1;
      INDICES[base + 11] = VERTICES + vi + 1;
    */
    // Create instanced geometry: shares buffers across BLADES_NUM instances
    const grassGeo = new THREE.InstancedBufferGeometry();

    // How many blades to draw
    grassGeo.instanceCount = BLADES_NUM;

    // Attach the index buffer. Reuse across all instances saves GPU memory.
    grassGeo.setIndex(INDICES);

    /**
     * Compute a conservative bounding sphere that encloses all blades:
     * Patch extends PATCH_SIZE units in X/Z; blade height extends in Y.
     * Diagonal of patch = sqrt(2*PATCH_SIZE^2), so radius = diagonal + half blade height.
     * Bounding sphere accelerates frustum culling on GPU.
     */
    grassGeo.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      1 + PATCH_SIZE * 2
    );

    return grassGeo;
  }

  #createGrassMaterial() {
    const { SEGMENTS, BLADES_NUM, PATCH_SIZE, BLADE_WIDTH, BLADE_HEIGHT } =
      this.constructor;

    const grassMaterial = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.FrontSide,
      uniforms: {
        ...this.globalUniforms.all,
        uGrassParams: {
          value: new THREE.Vector4(
            SEGMENTS,
            PATCH_SIZE,
            BLADE_WIDTH,
            BLADE_HEIGHT
          ),
        },
        uGrassDisplacementMap: {
          value: this.resources.texture.grassDisplacementTexture,
        },
        uTipColorDarkBlade: {
          value: new THREE.Color(
            0.3803921568627451,
            0.6862745098039216,
            0.03137254901960784
          ),
        },
        uBaseColorDarkBlade: {
          value: new THREE.Color(
            0.26666666666666666,
            0.43529411764705883,
            0.08627450980392157
          ),
        },
        uTipColorLightBlade: {
          value: new THREE.Color(0.7490196078431373, 0.9019607843137255, 0.0),
        },
        uBaseColorLightBlade: {
          value: new THREE.Color(0.48627450980392156, 0.6196078431372549, 0.0),
        },
        uGrassColorStep: {
          value: new THREE.Vector2(0.0, 1.0),
        },
        uGrassTexture: {
          value: this.resources.texture.grassTexture,
        },
      },
    });

    return grassMaterial;
  }

  _setupGUI() {
    const params = this.grassMaterial.uniforms;
    this.debug.add(
      params.uTipColorDarkBlade,
      "value",
      { color: true, label: "Tip Color Dark Blade" },
      "Grass Settings"
    );
    this.debug.add(
      params.uBaseColorDarkBlade,
      "value",
      { color: true, label: "Base Color Dark Blade" },
      "Grass Settings"
    );
    this.debug.add(
      params.uTipColorLightBlade,
      "value",
      { color: true, label: "Tip Color Light Blade" },
      "Grass Settings"
    );
    this.debug.add(
      params.uBaseColorLightBlade,
      "value",
      { color: true, label: "Base Color Light Blade" },
      "Grass Settings"
    );

    this.debug.add(
      GrassModule,
      "BLADES_NUM",
      {
        min: 1,
        max: 100000,
        step: 10,
        label: "Blade Count",
        onChange: (v) => {
          this.grassGeometry.instanceCount = v;
        },
      },
      "Grass Settings"
    );

    // Blade width and height sliders via uGrassParams (Vector4)
    this.debug.add(
      params.uGrassParams.value,
      "z",
      { min: 0.01, max: 0.2, step: 0.005, label: "Blade Width" },
      "Grass Settings"
    );
    this.debug.add(
      params.uGrassParams.value,
      "w",
      { min: 0.0, max: 2.0, step: 0.05, label: "Blade Height" },
      "Grass Settings"
    );
    // Patch size
    this.debug.add(
      params.uGrassParams.value,
      "y",
      { min: 0.5, max: 5.0, step: 0.1, label: "Patch Size" },
      "Grass Settings"
    );

    this.debug.add(
      params.uGrassColorStep,
      "value",
      { min: -1.0, max: 1.0, step: 0.01, label: "Grass Color step" },
      "Grass Settings"
    );
  }

  update() {}
}

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

class ShaderRenderer {
  constructor() {
    // Debug
    this.gui = new GUI();
    this.gui.close();

    // Clock
    this.clock = new THREE.Clock();

    // Canvas
    this.canvas = document.querySelector('canvas.webgl');

    // Scene
    this.scene = new THREE.Scene();

    // Sizes
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    this.initGeometry();
    this.initCamera();
    this.initRenderer();
    this.initControls();
    this.initGUI();
    this.initEventListeners();
    this.startAnimationLoop();
  }

  initGeometry() {
    // Geometry
    this.geometry = new THREE.PlaneGeometry(3.5, 3.5, 64, 64);

    // Material with all uniforms
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      side: THREE.DoubleSide,
      uniforms: {
        uTime: { value: 0.0 },

        // Hash function
        uHashFract: { value: new THREE.Vector2(123.34, 456.21) },
        uHashDot: { value: 45.32 },

        // Rand01
        uRandFract: { value: new THREE.Vector3(123.5, 234.34, 345.65) },
        uRandDot: { value: 34.45 },

        // Noise
        uNoiseSmoothness: { value: 3.0 },

        // FBM
        uFbmAmp: { value: 2.0 },
        uFbmFreq: { value: 0.5 },
        uFbmFreqMult: { value: 2.1 },
        uFbmAmpMult: { value: 0.5 },

        // Voronoi
        uVoronoiJitter: { value: 0.5 },
        uVoronoiAnimBase: { value: 0.08 },
        uVoronoiSinSpeed1: { value: 0.6 },
        uVoronoiSinSpeed2: { value: 0.8 },
        uVoronoiSinAmp1: { value: 0.6 },
        uVoronoiSinSpeed3: { value: 0.5 },
        uVoronoiSinSpeed4: { value: 0.7 },
        uVoronoiSinAmp2: { value: 0.5 },
        uVoronoiFbmScale1: { value: 0.4 },
        uVoronoiFbmSpeed1: { value: 0.06 },
        uVoronoiFbmScale2: { value: 0.45 },
        uVoronoiFbmSpeed2: { value: 0.04 },
        uVoronoiFbmDispl: { value: 0.08 },

        // Swirl
        uSwirlSmoothStart: { value: 0.0 },
        uSwirlSmoothEnd: { value: 0.5 },
        uSwirlSpeedMult: { value: 3.0 },
        uSwirlNoiseAmp2: { value: 0.6 },
        uSwirlNoiseScale2: { value: 1.5 },
        uSwirlNoiseScale3: { value: 0.7 },
        uSwirlNoiseSpeed1: { value: 0.15 },
        uSwirlNoiseSpeed2: { value: 0.1 },
        uSwirlNoiseSpeed3: { value: 0.08 },
        uSwirlNoiseSpeed4: { value: 0.06 },
        uSwirlRadialFlow: { value: 0.04 },

        // Cell counts
        uCellCount2: { value: 2.5 },
        uCellCount3: { value: 3.5 },

        // Layer 2
        uLayer2Speed: { value: 2.0 },
        uLayer2Twist: { value: 0.6 },
        uLayer2NoiseScale: { value: 20.0 },
        uLayer2NoiseAmp: { value: 0.7 },
        uLayer2TimeSpeed: { value: 1.4 },
        uLayer2Seed: { value: 77.0 },

        // Layer 3
        uLayer3Speed: { value: 2.0 },
        uLayer3Twist: { value: 1.4 },
        uLayer3NoiseScale: { value: 20.0 },
        uLayer3NoiseAmp: { value: 1.2 },
        uLayer3TimeSpeed: { value: 0.8 },
        uLayer3Seed: { value: 133.0 },

        // Edges
        uEdgeNoiseScale: { value: 2.0 },
        uEdgeNoiseSpeed: { value: 0.12 },
        uEdgeWidthMin: { value: 0.6 },
        uEdgeWidthMax: { value: 1.8 },
        uBaseWidth: { value: 0.015 },

        uSecondaryEdgeWidth: { value: 1.8 },
        uSecondaryEdgePow: { value: 3.5 },
        uSecondaryEdgeStrength: { value: 0.9 },

        uTertiaryEdgeWidth: { value: 2.5 },
        uTertiaryEdgePow: { value: 2.0 },
        uTertiaryEdgeStrength: { value: 0.5 },

        // Glows
        uGlow2Start: { value: 1.0 },
        uGlow2End: { value: 8.0 },
        uGlow2Pow: { value: 4.5 },
        uGlow2Strength: { value: 0.45 },

        uGlow3Start: { value: 2.0 },
        uGlow3End: { value: 10.0 },
        uGlow3Pow: { value: 4.0 },
        uGlow3Strength: { value: 0.28 },

        // Junction
        uJunctionWidth: { value: 3.0 },
        uJunctionPow: { value: 8.0 },
        uJunctionStrength: { value: 1.4 },

        // Color noise
        uColorNoise2Scale: { value: 5.0 },
        uColorNoise2Speed: { value: 0.25 },
        uColorNoise3Scale: { value: 3.0 },
        uColorNoise3Speed: { value: 0.15 },
        uEdgeBrightnessMin: { value: 0.6 },
        uEdgeBrightnessMax: { value: 1.0 },

        // Cell lights
        uCellLight2Mult: { value: 15.0 },
        uCellLight2Strength: { value: 0.35 },
        uCellLight3Mult: { value: 8.0 },
        uCellLight3Strength: { value: 0.18 },

        // Background
        uBgNoiseScale: { value: 2.5 },
        uBgNoiseSpeed: { value: 0.06 },
        uBgDetailScale: { value: 1.5 },
        uBgDetailSpeed: { value: 0.04 },
        uBgValueMin: { value: 0.05 },
        uBgValueMax: { value: 0.25 },
        uBgNoiseStrength: { value: 0.04 },
        uBgDetailStrength: { value: 0.02 },
        uBgColor: { value: new THREE.Color(0.5, 0.5, 0.5) },

        // Caustic weights
        uSecondaryWeight: { value: 1.2 },
        uTertiaryWeight: { value: 1.6 },
        uGlow2Weight: { value: 1.0 },
        uGlow3Weight: { value: 0.7 },
        uJunctionWeight: { value: 0.9 },

        // Color shift
        uColorShift: { value: new THREE.Color(0.3, 0.2, 1.0) },

        // Color grading
        uColorMultiplier: { value: 3.2 },
        uColorGamma: { value: 0.82 },

        // Fresnel
        uFresnelPow: { value: 2.0 },
        uFresnelStrength: { value: 0.3 },

        // Organic color palette
        uWarmColor1: { value: new THREE.Color(1.0, 0.3, 0.15) }, // Deep orange
        uWarmColor2: { value: new THREE.Color(1.0, 0.6, 0.2) }, // Orange
        uWarmColor3: { value: new THREE.Color(1.0, 0.85, 0.3) }, // Yellow-orange
        uCoolColor1: { value: new THREE.Color(0.4, 0.85, 1.0) }, // Cyan
        uCoolColor2: { value: new THREE.Color(0.5, 0.7, 1.0) }, // Light blue
        uCoolColor3: { value: new THREE.Color(0.6, 0.5, 1.0) }, // Purple-blue

        // Color mixing parameters
        uColorZone1Influence: { value: 0.4 },
        uColorZone2Influence: { value: 0.3 },
        uCellColorInfluence: { value: 0.2 },
      },
    });

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  initCamera() {
    // Base camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sizes.width / this.sizes.height,
      0.1,
      100,
    );
    this.camera.position.set(0, 0, 2.5);
    this.scene.add(this.camera);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  initControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
  }

  initGUI() {
    const uniforms = this.material.uniforms;

    // Cell Counts
    const cellFolder = this.gui.addFolder('Cell Counts');
    cellFolder
      .add(uniforms.uCellCount2, 'value', 1, 10, 0.1)
      .name('Cell Count 2');
    cellFolder
      .add(uniforms.uCellCount3, 'value', 1, 10, 0.1)
      .name('Cell Count 3');

    // Layer 2
    const layer2Folder = this.gui.addFolder('Layer 2');
    layer2Folder.add(uniforms.uLayer2Speed, 'value', -2, 2, 0.1).name('Speed');
    layer2Folder.add(uniforms.uLayer2Twist, 'value', 0, 2, 0.1).name('Twist');
    layer2Folder
      .add(uniforms.uLayer2NoiseScale, 'value', 1, 20, 0.5)
      .name('Noise Scale');
    layer2Folder
      .add(uniforms.uLayer2NoiseAmp, 'value', 0, 3, 0.1)
      .name('Noise Amp');
    layer2Folder
      .add(uniforms.uLayer2TimeSpeed, 'value', 0, 5, 0.1)
      .name('Time Speed');
    layer2Folder.add(uniforms.uLayer2Seed, 'value', 0, 200, 1).name('Seed');

    // Layer 3
    const layer3Folder = this.gui.addFolder('Layer 3');
    layer3Folder.add(uniforms.uLayer3Speed, 'value', -2, 2, 0.1).name('Speed');
    layer3Folder.add(uniforms.uLayer3Twist, 'value', 0, 2, 0.1).name('Twist');
    layer3Folder
      .add(uniforms.uLayer3NoiseScale, 'value', 1, 20, 0.5)
      .name('Noise Scale');
    layer3Folder
      .add(uniforms.uLayer3NoiseAmp, 'value', 0, 3, 0.1)
      .name('Noise Amp');
    layer3Folder
      .add(uniforms.uLayer3TimeSpeed, 'value', 0, 5, 0.1)
      .name('Time Speed');
    layer3Folder.add(uniforms.uLayer3Seed, 'value', 0, 200, 1).name('Seed');

    // Edges
    const edgesFolder = this.gui.addFolder('Edges');
    edgesFolder
      .add(uniforms.uEdgeNoiseScale, 'value', 0.5, 5, 0.1)
      .name('Edge Noise Scale');
    edgesFolder
      .add(uniforms.uEdgeNoiseSpeed, 'value', 0, 0.5, 0.01)
      .name('Edge Noise Speed');
    edgesFolder
      .add(uniforms.uEdgeWidthMin, 'value', 0.1, 3, 0.1)
      .name('Edge Width Min');
    edgesFolder
      .add(uniforms.uEdgeWidthMax, 'value', 0.1, 5, 0.1)
      .name('Edge Width Max');
    edgesFolder
      .add(uniforms.uBaseWidth, 'value', 0.001, 0.1, 0.001)
      .name('Base Width');
    edgesFolder
      .add(uniforms.uSecondaryEdgeWidth, 'value', 0.5, 5, 0.1)
      .name('Secondary Width');
    edgesFolder
      .add(uniforms.uSecondaryEdgePow, 'value', 1, 10, 0.1)
      .name('Secondary Pow');
    edgesFolder
      .add(uniforms.uSecondaryEdgeStrength, 'value', 0, 2, 0.1)
      .name('Secondary Strength');
    edgesFolder
      .add(uniforms.uTertiaryEdgeWidth, 'value', 0.5, 5, 0.1)
      .name('Tertiary Width');
    edgesFolder
      .add(uniforms.uTertiaryEdgePow, 'value', 1, 10, 0.1)
      .name('Tertiary Pow');
    edgesFolder
      .add(uniforms.uTertiaryEdgeStrength, 'value', 0, 2, 0.1)
      .name('Tertiary Strength');

    // Glows
    const glowsFolder = this.gui.addFolder('Glows');
    glowsFolder
      .add(uniforms.uGlow2Start, 'value', 0.1, 5, 0.1)
      .name('Glow 2 Start');
    glowsFolder.add(uniforms.uGlow2End, 'value', 1, 20, 0.5).name('Glow 2 End');
    glowsFolder.add(uniforms.uGlow2Pow, 'value', 1, 10, 0.1).name('Glow 2 Pow');
    glowsFolder
      .add(uniforms.uGlow2Strength, 'value', 0, 2, 0.05)
      .name('Glow 2 Strength');
    glowsFolder
      .add(uniforms.uGlow3Start, 'value', 0.1, 5, 0.1)
      .name('Glow 3 Start');
    glowsFolder.add(uniforms.uGlow3End, 'value', 1, 20, 0.5).name('Glow 3 End');
    glowsFolder.add(uniforms.uGlow3Pow, 'value', 1, 10, 0.1).name('Glow 3 Pow');
    glowsFolder
      .add(uniforms.uGlow3Strength, 'value', 0, 2, 0.05)
      .name('Glow 3 Strength');

    // Junction
    const junctionFolder = this.gui.addFolder('Junction');
    junctionFolder
      .add(uniforms.uJunctionWidth, 'value', 0.5, 10, 0.1)
      .name('Width');
    junctionFolder
      .add(uniforms.uJunctionPow, 'value', 1, 15, 0.5)
      .name('Power');
    junctionFolder
      .add(uniforms.uJunctionStrength, 'value', 0, 5, 0.1)
      .name('Strength');

    // Color Noise
    const colorNoiseFolder = this.gui.addFolder('Color Noise');
    colorNoiseFolder
      .add(uniforms.uColorNoise2Scale, 'value', 1, 20, 0.5)
      .name('Noise 2 Scale');
    colorNoiseFolder
      .add(uniforms.uColorNoise2Speed, 'value', 0, 1, 0.01)
      .name('Noise 2 Speed');
    colorNoiseFolder
      .add(uniforms.uColorNoise3Scale, 'value', 1, 20, 0.5)
      .name('Noise 3 Scale');
    colorNoiseFolder
      .add(uniforms.uColorNoise3Speed, 'value', 0, 1, 0.01)
      .name('Noise 3 Speed');
    colorNoiseFolder
      .add(uniforms.uEdgeBrightnessMin, 'value', 0, 1, 0.05)
      .name('Brightness Min');
    colorNoiseFolder
      .add(uniforms.uEdgeBrightnessMax, 'value', 0, 2, 0.05)
      .name('Brightness Max');

    // Cell Lights
    const cellLightsFolder = this.gui.addFolder('Cell Lights');
    cellLightsFolder
      .add(uniforms.uCellLight2Mult, 'value', 1, 50, 1)
      .name('Light 2 Mult');
    cellLightsFolder
      .add(uniforms.uCellLight2Strength, 'value', 0, 1, 0.05)
      .name('Light 2 Strength');
    cellLightsFolder
      .add(uniforms.uCellLight3Mult, 'value', 1, 50, 1)
      .name('Light 3 Mult');
    cellLightsFolder
      .add(uniforms.uCellLight3Strength, 'value', 0, 1, 0.05)
      .name('Light 3 Strength');

    // Background
    const bgFolder = this.gui.addFolder('Background');
    bgFolder
      .add(uniforms.uBgNoiseScale, 'value', 0.5, 10, 0.1)
      .name('Noise Scale');
    bgFolder
      .add(uniforms.uBgNoiseSpeed, 'value', 0, 0.3, 0.01)
      .name('Noise Speed');
    bgFolder
      .add(uniforms.uBgDetailScale, 'value', 0.5, 10, 0.1)
      .name('Detail Scale');
    bgFolder
      .add(uniforms.uBgDetailSpeed, 'value', 0, 0.3, 0.01)
      .name('Detail Speed');
    bgFolder.add(uniforms.uBgValueMin, 'value', 0, 0.5, 0.01).name('Value Min');
    bgFolder.add(uniforms.uBgValueMax, 'value', 0, 1, 0.05).name('Value Max');
    bgFolder
      .add(uniforms.uBgNoiseStrength, 'value', 0, 0.2, 0.01)
      .name('Noise Strength');
    bgFolder
      .add(uniforms.uBgDetailStrength, 'value', 0, 0.2, 0.01)
      .name('Detail Strength');

    // Caustic Weights
    const weightsFolder = this.gui.addFolder('Caustic Weights');
    weightsFolder
      .add(uniforms.uSecondaryWeight, 'value', 0, 3, 0.1)
      .name('Secondary');
    weightsFolder
      .add(uniforms.uTertiaryWeight, 'value', 0, 3, 0.1)
      .name('Tertiary');
    weightsFolder.add(uniforms.uGlow2Weight, 'value', 0, 3, 0.1).name('Glow 2');
    weightsFolder.add(uniforms.uGlow3Weight, 'value', 0, 3, 0.1).name('Glow 3');
    weightsFolder
      .add(uniforms.uJunctionWeight, 'value', 0, 3, 0.1)
      .name('Junction');

    // Color Grading
    const gradingFolder = this.gui.addFolder('Color Grading');
    gradingFolder
      .add(uniforms.uColorMultiplier, 'value', 0.5, 10, 0.1)
      .name('Multiplier');
    gradingFolder
      .add(uniforms.uColorGamma, 'value', 0.3, 2, 0.01)
      .name('Gamma');

    // Voronoi Animation
    const voronoiFolder = this.gui.addFolder('Voronoi Animation');
    voronoiFolder
      .add(uniforms.uVoronoiJitter, 'value', 0, 1, 0.05)
      .name('Jitter');
    voronoiFolder
      .add(uniforms.uVoronoiAnimBase, 'value', 0, 0.3, 0.01)
      .name('Anim Base');
    voronoiFolder
      .add(uniforms.uVoronoiSinSpeed1, 'value', 0, 2, 0.1)
      .name('Sin Speed 1');
    voronoiFolder
      .add(uniforms.uVoronoiSinSpeed2, 'value', 0, 2, 0.1)
      .name('Sin Speed 2');
    voronoiFolder
      .add(uniforms.uVoronoiSinAmp1, 'value', 0, 2, 0.1)
      .name('Sin Amp 1');
    voronoiFolder
      .add(uniforms.uVoronoiSinSpeed3, 'value', 0, 2, 0.1)
      .name('Sin Speed 3');
    voronoiFolder
      .add(uniforms.uVoronoiSinSpeed4, 'value', 0, 2, 0.1)
      .name('Sin Speed 4');
    voronoiFolder
      .add(uniforms.uVoronoiSinAmp2, 'value', 0, 2, 0.1)
      .name('Sin Amp 2');
    voronoiFolder
      .add(uniforms.uVoronoiFbmScale1, 'value', 0.1, 2, 0.05)
      .name('FBM Scale 1');
    voronoiFolder
      .add(uniforms.uVoronoiFbmSpeed1, 'value', 0, 0.3, 0.01)
      .name('FBM Speed 1');
    voronoiFolder
      .add(uniforms.uVoronoiFbmScale2, 'value', 0.1, 2, 0.05)
      .name('FBM Scale 2');
    voronoiFolder
      .add(uniforms.uVoronoiFbmSpeed2, 'value', 0, 0.3, 0.01)
      .name('FBM Speed 2');
    voronoiFolder
      .add(uniforms.uVoronoiFbmDispl, 'value', 0, 0.3, 0.01)
      .name('FBM Displ');

    // Swirl
    const swirlFolder = this.gui.addFolder('Swirl');
    swirlFolder
      .add(uniforms.uSwirlSmoothStart, 'value', 0, 1, 0.05)
      .name('Smooth Start');
    swirlFolder
      .add(uniforms.uSwirlSmoothEnd, 'value', 0, 1, 0.05)
      .name('Smooth End');
    swirlFolder
      .add(uniforms.uSwirlSpeedMult, 'value', 0, 10, 0.1)
      .name('Speed Mult');
    swirlFolder
      .add(uniforms.uSwirlNoiseAmp2, 'value', 0, 2, 0.1)
      .name('Noise Amp 2');
    swirlFolder
      .add(uniforms.uSwirlNoiseScale2, 'value', 0.5, 5, 0.1)
      .name('Noise Scale 2');
    swirlFolder
      .add(uniforms.uSwirlNoiseScale3, 'value', 0.5, 5, 0.1)
      .name('Noise Scale 3');
    swirlFolder
      .add(uniforms.uSwirlNoiseSpeed1, 'value', 0, 0.5, 0.01)
      .name('Noise Speed 1');
    swirlFolder
      .add(uniforms.uSwirlNoiseSpeed2, 'value', 0, 0.5, 0.01)
      .name('Noise Speed 2');
    swirlFolder
      .add(uniforms.uSwirlNoiseSpeed3, 'value', 0, 0.5, 0.01)
      .name('Noise Speed 3');
    swirlFolder
      .add(uniforms.uSwirlNoiseSpeed4, 'value', 0, 0.5, 0.01)
      .name('Noise Speed 4');
    swirlFolder
      .add(uniforms.uSwirlRadialFlow, 'value', 0, 0.2, 0.01)
      .name('Radial Flow');

    // FBM
    const fbmFolder = this.gui.addFolder('FBM');
    fbmFolder.add(uniforms.uFbmAmp, 'value', 0, 2, 0.1).name('Amplitude');
    fbmFolder.add(uniforms.uFbmFreq, 'value', 0.5, 10, 0.1).name('Frequency');
    fbmFolder.add(uniforms.uFbmFreqMult, 'value', 1, 5, 0.1).name('Freq Mult');
    fbmFolder.add(uniforms.uFbmAmpMult, 'value', 0.1, 1, 0.05).name('Amp Mult');

    // Color Palette
    const colorPaletteFolder = this.gui.addFolder('Color Palette');

    // Color Mixing
    const colorMixingFolder = colorPaletteFolder.addFolder('Color Mixing');
    colorMixingFolder
      .add(uniforms.uCellColorInfluence, 'value', 0, 1, 0.05)
      .name('Cell Influence');

    // Background Color
    bgFolder.addColor(uniforms.uBgColor, 'value').name('Background Color');

    // Color Shift
    gradingFolder.addColor(uniforms.uColorShift, 'value').name('Color Shift');

    // Close all folders by default
    cellFolder.close();
    layer2Folder.close();
    layer3Folder.close();
    edgesFolder.close();
    glowsFolder.close();
    junctionFolder.close();
    colorNoiseFolder.close();
    cellLightsFolder.close();
    bgFolder.close();
    weightsFolder.close();
    gradingFolder.close();
    voronoiFolder.close();
    swirlFolder.close();
    fbmFolder.close();
    colorPaletteFolder.close();
    colorMixingFolder.close();
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.handleResize());
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
  }

  animate() {
    this.material.uniforms.uTime.value =
      (this.clock.getElapsedTime() + 85) % 2000;
    // Update controls
    this.controls.update();

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

import './style.css';
import * as THREE from 'three';
import * as dat from 'lil-gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from './passes/BokehPass.js';
import terrainVertexShader from './shaders/terrain/vertex.glsl';
import terrainFragmentShader from './shaders/terrain/fragment.glsl';
import terrainDepthVertexShader from './shaders/terrainDepth/vertex.glsl';
import terrainDepthFragmentShader from './shaders/terrainDepth/fragment.glsl';
import vignetteVertexShader from './shaders/vignette/vertex.glsl';
import vignetteFragmentShader from './shaders/vignette/fragment.glsl';
/**============================================================================
 * *                           CANVAS
============================================================================ */
const canvas = document.querySelector('canvas.webgl');

/**============================================================================
 * *                           SCENE
============================================================================ */
const scene = new THREE.Scene();

/**============================================================================
 * *                           Window Size
============================================================================ */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
};

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Update camera
    camera.instance.aspect = sizes.width / sizes.height;
    camera.instance.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(sizes.pixelRatio);

    // Update Composer
    effectComposer.setSize(sizes.width, sizes.height);
    effectComposer.setPixelRatio(sizes.pixelRatio);

    bokehPass.renderTargetDepth.width = sizes.width * sizes.pixelRatio;
    bokehPass.renderTargetDepth.height = sizes.height * sizes.pixelRatio;
});

/**============================================================================
 * *                           CAMERA
============================================================================ */
/**
 * Camera
 */
const camera = {};
camera.position = new THREE.Vector3();
camera.rotation = new THREE.Euler();
camera.rotation.reorder('YXZ');

// Base camera
camera.instance = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.instance.rotation.reorder('YXZ');
scene.add(camera.instance);

window.camera = camera.instance;
// orbitControls
const controls = new OrbitControls(camera.instance, canvas);
controls.enableDamping = true;



/**============================================================================
 * *                           TERRAIN
============================================================================ */
const terrain = {};

// Texture
terrain.texture = {};
terrain.texture.visible = false;
terrain.texture.linesCount = 7;
terrain.texture.bigLineWidth = 0.08;
terrain.texture.smallLineWidth = 0.01;
terrain.texture.width = 32;
terrain.texture.height = 128;
terrain.texture.canvas = document.createElement('canvas');
terrain.texture.canvas.width = terrain.texture.width;
terrain.texture.canvas.height = terrain.texture.height;
terrain.texture.canvas.style.position = 'fixed';
terrain.texture.canvas.style.top = 0;
terrain.texture.canvas.style.left = 0;
terrain.texture.canvas.style.zIndex = 1;
terrain.texture.context = terrain.texture.canvas.getContext('2d');
terrain.texture.instance = new THREE.CanvasTexture(terrain.texture.canvas);
terrain.texture.instance.wrapS = THREE.RepeatWrapping;
terrain.texture.instance.wrapT = THREE.RepeatWrapping;
terrain.texture.instance.magFilter = THREE.NearestFilter;

if (terrain.texture.visible) {
    document.body.append(terrain.texture.canvas);
}

terrain.texture.update = () => {
    terrain.texture.context.clearRect(0, 0, terrain.texture.width, terrain.texture.height);
    // Big lines
    const actualBigLineWidth = Math.round(terrain.texture.height * terrain.texture.bigLineWidth);
    terrain.texture.context.globalAlpha = 1
    terrain.texture.context.fillStyle = '#ffffff';

    terrain.texture.context.fillRect(
        0,
        0,
        terrain.texture.width,
        actualBigLineWidth
    );

    // Small lines
    const actualSmallLineWidth = Math.round(terrain.texture.height * terrain.texture.smallLineWidth);
    const smallLinesCount = terrain.texture.linesCount - 1;
    for (let i = 0; i < smallLinesCount; i++) {
        terrain.texture.context.globalAlpha = 0.5;
        terrain.texture.context.fillStyle = '#00f9f9';
        terrain.texture.context.fillRect(
            0,
            actualBigLineWidth + Math.round((terrain.texture.height - actualBigLineWidth) / terrain.texture.linesCount) * (i + 1),
            terrain.texture.width,
            actualSmallLineWidth
        );
    }
}
terrain.texture.update()

// geometry
terrain.geometry = new THREE.PlaneGeometry(1, 1, 1000, 1000);
terrain.geometry.rotateX(-Math.PI / 2);

// Terrain Color Pallete
const colorsPallet = [
    {
        terrainColor: 0.77,
    }
]
// Uniforms
terrain.uniforms = {
    uTexture: { value: terrain.texture.instance },
    uElevation: { value: 2 },
    uElevationValley: { value: 0.4 },
    uElevationValleyFrequency: { value: 1.5 },
    uElevationGeneral: { value: 0.2 },
    uElevationGeneralFrequency: { value: 0.2 },
    uElevationDetails: { value: 0.2 },
    uElevationDetailsFrequency: { value: 2.012 },
    uTextureFrequency: { value: 10.0 },
    uTextureOffset: { value: 0.585 },

    uHslHueOffset: { value: 0.4 },
    uHslHue: { value: 0.466 },
    uHslHueFrequency: { value: 0.0 },
    uHslTimeFrequency: { value: 0.055 },
    uHslLightness: { value: 0.35 },
    uHslLightnessVariation: { value: 0.09 },
    uHslLightnessFrequency: { value: 60.69 },
    uTime: { value: 0.0 }
};

// Material
terrain.material = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: terrainVertexShader,
    fragmentShader: terrainFragmentShader,
    uniforms: terrain.uniforms
});

// Depth Material
const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.common,
    THREE.UniformsLib.displacementmap
]);
for (const uniformKey in terrain.uniforms) {
    uniforms[uniformKey] = terrain.uniforms[uniformKey];
}

terrain.depthMaterial = new THREE.ShaderMaterial({
    vertexShader: terrainDepthVertexShader,
    fragmentShader: terrainDepthFragmentShader,
    uniforms: uniforms,
});

terrain.depthMaterial.depthPacking = THREE.RGBADepthPacking;
terrain.depthMaterial.blending = THREE.NoBlending;


// Mesh
terrain.mesh = new THREE.Mesh(terrain.geometry, terrain.material);
terrain.mesh.scale.set(10, 10, 10);
terrain.mesh.userData.depthMaterial = terrain.depthMaterial;
scene.add(terrain.mesh);

/**============================================================================
 * *                           Vignette
============================================================================ */
const vignette = {};
vignette.color = {};
vignette.color.value = '#020d03';
vignette.color.instance = new THREE.Color(vignette.color.value);
vignette.geometry = new THREE.PlaneGeometry(2, 2);
vignette.material = new THREE.ShaderMaterial({
    vertexShader: vignetteVertexShader,
    fragmentShader: vignetteFragmentShader,
    transparent: true,
    depthTest: false,
    uniforms: {
        uColor: { value: vignette.color.instance },
        uOffset: { value: -0.27 },
        uMultiplier: { value: 1.16 }
    }
});
vignette.mesh = new THREE.Mesh(vignette.geometry, vignette.material);
vignette.mesh.frustumCulled = false,
    vignette.mesh.userData.noBokeh = true;
scene.add(vignette.mesh);

/**============================================================================
 * *                           RENDERER
============================================================================ */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
renderer.setClearColor(0x050b1b, 1);
renderer.outputEncoding = THREE.sRGBEncoding;


/**============================================================================
 * *                           Effect Composer
============================================================================ */
const renderTarget = new THREE.WebGLMultipleRenderTargets(800, 600, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding
});
const effectComposer = new EffectComposer(renderer);
effectComposer.setSize(sizes.width, sizes.height);
effectComposer.setPixelRatio(sizes.pixelRatio);

// Renderer pass
const renderPass = new RenderPass(scene, camera.instance);
effectComposer.addPass(renderPass);

// Bokeh Pass

const bokehPass = new BokehPass(
    scene,
    camera.instance,
    {
        focus: 1.0,
        aperture: 0.015,
        maxblur: 0.01,

        width: sizes.width * sizes.pixelRatio,
        height: sizes.height * sizes.pixelRatio
    }
);
bokehPass.materialDepth = terrain.depthMaterial;
effectComposer.addPass(bokehPass);


/**============================================================================
 * *                          View
============================================================================ */
const view = {};
view.settings = [
    // 1.
    {
        position: { x: 0, y: 2.124, z: -0.172 },
        rotation: { x: -1.489, y: -Math.PI, z: 0 },
        focus: 2.14,
        parallaxMultiplier: 0.15
    },
];

view.current = null;
let _currentViewIndex = 0;

// Parallax
view.parallax = {};
view.parallax.target = {};
view.parallax.target.x = 0;
view.parallax.target.y = 0;
view.parallax.eased = {};
view.parallax.eased.x = 0;
view.parallax.eased.y = 0;
view.parallax.eased.multiplier = 4;

window.addEventListener('mousemove', (_event) => {
    view.parallax.target.x = (_event.clientX / sizes.width - 0.5) * view.parallax.multiplier;
    view.parallax.target.y = - (_event.clientY / sizes.height - 0.5) * view.parallax.multiplier;
})

// Change
view.change = (_index) => {
    const viewSetting = view.settings[_index];
    // Camera
    camera.position.copy(viewSetting.position)
    camera.rotation.x = viewSetting.rotation.x
    camera.rotation.y = viewSetting.rotation.y

    // Bokeh
    bokehPass.materialBokeh.uniforms.focus.value = viewSetting.focus

    // Parallax
    view.parallax.multiplier = viewSetting.parallaxMultiplier

    // Save
    view.current = viewSetting
}

view.change(_currentViewIndex);


// Create GUI
const gui = new dat.GUI();

// Terrain Uniforms Folder
const terrainFolder = gui.addFolder('Terrain Uniforms');

// Elevation Controls
const elevationFolder = terrainFolder.addFolder('Elevation');
elevationFolder.add(terrain.uniforms.uElevation, 'value').min(0).max(5).step(0.01).name('Total Elevation');
elevationFolder.add(terrain.uniforms.uElevationValley, 'value').min(0).max(1).step(0.01).name('Elevation');
elevationFolder.add(terrain.uniforms.uElevationValleyFrequency, 'value').min(0).max(5).step(0.01).name('Frequency');
elevationFolder.add(terrain.uniforms.uElevationGeneral, 'value').min(0).max(1).step(0.01).name('General Elevation');
elevationFolder.add(terrain.uniforms.uElevationGeneralFrequency, 'value').min(0).max(5).step(0.01).name('General Frequency');
elevationFolder.add(terrain.uniforms.uElevationDetails, 'value').min(0).max(1).step(0.01).name('Details Elevation');
elevationFolder.add(terrain.uniforms.uElevationDetailsFrequency, 'value').min(0).max(5).step(0.01).name('Details Frequency');

// Texture Controls
const textureFolder = terrainFolder.addFolder('Texture');
textureFolder.add(terrain.uniforms.uTextureFrequency, 'value').min(0).max(20).step(0.001).name('Texture Frequency');
textureFolder.add(terrain.uniforms.uTextureOffset, 'value').min(0).max(1).step(0.001).name('Texture Offset');

// HSL Color Controls
const hslFolder = terrainFolder.addFolder('HSL Color');
hslFolder.add(terrain.uniforms.uHslHueOffset, 'value').min(0).max(1).step(0.01).name('Hue Offset');
hslFolder.add(terrain.uniforms.uHslHue, 'value').min(0).max(1).step(0.01).name('Hue');
hslFolder.add(terrain.uniforms.uHslHueFrequency, 'value').min(0).max(1).step(0.01).name('Hue Frequency');
hslFolder.add(terrain.uniforms.uHslTimeFrequency, 'value').min(0).max(0.1).step(0.001).name('Time Frequency');
hslFolder.add(terrain.uniforms.uHslLightness, 'value').min(0).max(1).step(0.01).name('Lightness');
hslFolder.add(terrain.uniforms.uHslLightnessVariation, 'value').min(0).max(1).step(0.01).name('Lightness Variation');
hslFolder.add(terrain.uniforms.uHslLightnessFrequency, 'value').min(0).max(100).step(0.01).name('Lightness Frequency');

// Vignette Controls
const vignetteFolder = gui.addFolder('Vignette');
vignetteFolder.add(vignette.material.uniforms.uOffset, 'value').min(-1).max(1).step(0.01).name('Offset');
vignetteFolder.add(vignette.material.uniforms.uMultiplier, 'value').min(0).max(2).step(0.01).name('Multiplier');
vignetteFolder.addColor(vignette.color, 'value').name('Color').onChange((value) => {
    vignette.color.instance.set(value);
    vignette.material.uniforms.uColor.value = vignette.color.instance;
});

// Bokeh Controls
const bokehFolder = gui.addFolder('Bokeh');
bokehFolder.add(bokehPass.materialBokeh.uniforms.focus, 'value').min(0).max(5).step(0.01).name('Focus');
bokehFolder.add(bokehPass.materialBokeh.uniforms.aperture, 'value').min(0).max(0.1).step(0.001).name('Aperture');
bokehFolder.add(bokehPass.materialBokeh.uniforms.maxblur, 'value').min(0).max(0.1).step(0.001).name('Max Blur');

/**============================================================================
 * *                           Animation Loop
============================================================================ */
const clock = new THREE.Clock();
let lastElapsedTime = 0;

const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - lastElapsedTime;
    lastElapsedTime = elapsedTime;

    // Update Terrain
    terrain.uniforms.uTime.value = elapsedTime;

    // Update controls
    // controls.update();

    // Camera
    camera.instance.position.copy(camera.position)

    view.parallax.eased.x += (view.parallax.target.x - view.parallax.eased.x) * deltaTime * view.parallax.eased.multiplier
    view.parallax.eased.y += (view.parallax.target.y - view.parallax.eased.y) * deltaTime * view.parallax.eased.multiplier
    camera.instance.translateX(view.parallax.eased.x)
    camera.instance.translateY(view.parallax.eased.y)

    camera.instance.rotation.x = camera.rotation.x
    camera.instance.rotation.y = camera.rotation.y

    // Render
    // renderer.render(scene, camera);
    effectComposer.render();

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
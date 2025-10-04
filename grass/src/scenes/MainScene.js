import * as THREE from "three";
import DebugGUI from "../utils/DebugGUI.js";
import GrassModule from "../modules/GrassModule/Grass.js";
import FloorModule from "../modules/FloorModule/Floor.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import FlowerModule from "../modules/FlowerModule/Flower.js";
export default class MainScene {
  constructor(resources, sceneConfig, clock, renderer, globalUniforms) {
    const { backgroundColor, fog } = sceneConfig;

    this.debug = DebugGUI.getInstance();

    // Create the root scene instance
    this.instance = new THREE.Scene();

    this.renderer = renderer;

    // Apply background color from configuration
    this.instance.background = new THREE.Color(backgroundColor);
    this.instance.fog = new THREE.FogExp2(
      new THREE.Color(fog.color.x, fog.color.y, fog.color.z),
      fog.density
    );

    // List of scene modules (each handles its own init/update)
    this.modules = [];

    // Add and initialize core modules
    this.grass = new GrassModule(
      this.instance,
      resources,
      clock,
      this.renderer,
      globalUniforms
    );
    this._addModule(this.grass);
    this._addModule(new FloorModule(this.instance, resources, clock));
    // this._addModule(
    //   new FlowerModule(this.instance, this.grass, resources, clock)
    // );

    // Init environments
    this.initEnvironment();

    this.#_initDebug();
  }

  initEnvironment() {
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load(
      "/assets/environment/clouds.hdr",
      (hdrEquirect) => {
        // Convert the equirectangular HDR to a cubemap for PBR
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

        // Apply to scene background and/or environment
        this.instance.background = hdrEquirect;
        this.instance.environment = hdrEquirect;
      },
      // onProgress
      (xhr) => {
        console.log(
          `HDR ${((xhr.loaded / xhr.total) * 100).toFixed(1)}% loaded`
        );
      },
      // onError
      (err) => {
        console.error("Failed to load HDR:", err);
      }
    );
  }

  #_initDebug() {
    this.debug.addFolder("Scene Debug");

    this.debug.add(
      this.instance,
      "background",
      { color: true, label: "Background Color" },
      "Scene Debug"
    );

    this.debug.add(
      this.instance.fog,
      "density",
      { min: 0, max: 1, step: 0.001, label: "Fog density" },
      "Scene Debug"
    );

    this.debug.add(
      this.instance.fog,
      "color",
      { color: true, label: "Fog Color" },
      "Scene Debug"
    );
  }

  _addModule(module) {
    this.modules.push(module);
    if (typeof module.init === "function") {
      module.init();
    }
  }

  update() {
    this.modules.forEach((module) => {
      if (typeof module.update === "function") {
        module.update();
      }
    });
  }
}

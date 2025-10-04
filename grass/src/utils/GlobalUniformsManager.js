import * as THREE from "three";
import DebugGUI from "./DebugGUI";

export default class GlobalUniformsManager {
  constructor(clock) {
    this.clock = clock;
    this.debug = DebugGUI.getInstance();
    this.debug.addFolder("Global Uniforms");
    this.uniforms = {
      // Setup related uniforms
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2() },

      // Wind related uniforms
      uWindStrength: { value: 0.4 },
      // blowing along +X
      // blow from west→east: 1, 0
      // blow from north→south: 0, -1
      uWindDir: { value: new THREE.Vector2(1, 0) },
    };
    this._lastTime = performance.now();

    this.#initDebug();
  }

  #initDebug() {
    this.debug.add(
      this.uniforms.uWindStrength,
      "value",
      { min: 0, max: 1, step: 0.01, label: "Wind Strength" },
      "Global Uniforms"
    );
    this.debug.add(
      this.uniforms.uWindDir,
      "value",
      { min: -1, max: 1, step: 0.1, label: "Wind Direction" },
      "Global Uniforms"
    );
  }

  updateResolution(width, height) {
    this.uniforms.uResolution.value.set(width, height);
  }

  updateTime() {
    this.uniforms.uTime.value = this.clock.getElapsedTime();
  }

  get all() {
    return this.uniforms;
  }
}

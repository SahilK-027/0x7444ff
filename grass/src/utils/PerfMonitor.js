import Stats from "stats-gl";
import DebugGUI from "./DebugGUI";

export default class PerfMonitor {
  constructor(renderer, options = {}) {
    this.renderer = renderer;
    this.debug = DebugGUI.getInstance();

    // Initialize Stats‑GL with memory + GPU tracking
    this.stats = new Stats({
      trackGPU: true,
      trackHz: true,
      trackCPT: true,
      logsPerSecond: 4,
      graphsPerSecond: 30,
      samplesLog: 40,
      samplesGraph: 10,
      precision: 2,
      horizontal: false,
      minimal: false,
      mode: 0,
    });

    this.stats.init(this.renderer.domElement);
    document.body.appendChild(this.stats.dom);

    // Create or retrieve "Performance" folder
    this.perfFolder = this.debug.addFolder("Performance");

    // Enable toggle control
    this.enabled = false;
    this.debug
      .add(this, "enabled", { label: "Enable PerfMonitor" }, "Performance")
      .onChange((v) => {
        this.stats.dom.style.display = v ? "block" : "none";
      });
  }

  // Call this before rendering each frame
  beginFrame() {
    if (this.enabled) this.stats.begin();
  }

  // Call this after rendering each frame
  endFrame() {
    if (this.enabled) this.stats.end();
  }

  updateFrame() {
    if (this.enabled) this.stats.update();
  }

  destroy() {
    if (this.stats && this.stats.container.parentNode) {
      this.stats.container.parentNode.removeChild(this.stats.container);
    }
  }
}

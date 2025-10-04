import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

/**
 * ResourceLoader handles preloading of textures, models, and environments.
 * Supports progress callbacks for loader screens.
 */

// Example usage:
// const assets = [
//   { name: 'grassTexture',    url: '/assets/textures/grass.png', type: 'texture' },
//   { name: 'terrainHeight',   url: '/assets/textures/height.png', type: 'texture' },
//   { name: 'treeModel',       url: '/assets/models/tree.glb' type: 'model' },
//   { name: 'forestHDR',       url: '/assets/env/forest.hdr', type: 'environment' },
// ];
// const loader = new ResourceLoader(assets);
// loader.loadAll().then(resources => {
//   console.log('Loaded resources:', resources);
// });

export default class ResourceLoader {
  constructor(assets = [], onProgress = null) {
    this.assets = assets;
    this.onProgress = typeof onProgress === "function" ? onProgress : null;
    this.manager = new THREE.LoadingManager();
    this._setupLoadingManager();
  }

  _setupLoadingManager() {
    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      if (this.onProgress) this.onProgress(progress);
      console.log(
        `Loading progress: ${progress.toFixed(
          1
        )}% (${itemsLoaded}/${itemsTotal})`
      );
    };
    this.manager.onLoad = () => {
      if (this.onProgress) this.onProgress(100);
      console.log("All assets loaded successfully");
    };
    this.manager.onError = (url) => {
      console.error(`Failed to load asset: ${url}`);
    };
  }

  loadAll() {
    if (!this.assets.length) {
      console.warn("ResourceLoader: No assets defined for loading");
      if (this.onProgress) this.onProgress(100);
      return Promise.resolve({ texture: {}, model: {}, environment: {} });
    }

    const promises = this.assets.map((asset) => {
      const ext = asset.url.split(".").pop().toLowerCase();
      switch (ext) {
        case "png":
        case "jpg":
        case "jpeg":
        case "webp":
          return this._loadTexture(asset);
        case "hdr":
        case "exr":
          return this._loadHDR(asset);
        case "glb":
        case "gltf":
          return this._loadGLTF(asset);
        default:
          return Promise.reject(new Error(`Unsupported asset type: ${ext}`));
      }
    });

    return Promise.all(promises)
      .then((loaded) => {
        const resources = { texture: {}, model: {}, environment: {} };
        loaded.forEach(({ name, resource, type }) => {
          if (resources[type]) resources[type][name] = resource;
          else console.warn(`Unknown resource type: ${type}`);
        });
        return resources;
      })
      .catch((err) => {
        console.error("[ResourceLoader] Error loading assets:", err);
        throw err;
      });
  }

  _loadTexture({ name, url, type }) {
    return new Promise((resolve, reject) => {
      new THREE.TextureLoader(this.manager).load(
        url,
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.generateMipmaps = true;
          resolve({ name, resource: texture, type });
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  _loadHDR({ name, url, type }) {
    return new Promise((resolve, reject) => {
      new RGBELoader(this.manager).setDataType(THREE.UnsignedByteType).load(
        url,
        (hdrEquirect) => resolve({ name, resource: hdrEquirect, type }),
        undefined,
        (err) => reject(err)
      );
    });
  }

  _loadGLTF({ name, url, type }) {
    return new Promise((resolve, reject) => {
      new GLTFLoader(this.manager).load(
        url,
        (gltf) => resolve({ name, resource: gltf, type }),
        undefined,
        (err) => reject(err)
      );
    });
  }

  getProgress() {
    if (this.manager.itemsTotal === 0) return 100;
    return (this.manager.itemsLoaded / this.manager.itemsTotal) * 100;
  }

  dispose() {
    Object.values(this.textures || {}).forEach(
      (tex) => tex.dispose && tex.dispose()
    );
    this.textures = {};
    this.models = {};
    this.environments = {};
  }
}

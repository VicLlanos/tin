// GLB helpers: parse (Draco + Meshopt supported), auto-fit to the scene, and render a preview thumbnail.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

let loader;
function getLoader() {
  if (!loader) {
    loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    loader.setDRACOLoader(draco);
    loader.setMeshoptDecoder(MeshoptDecoder);
  }
  return loader;
}

export const parseGLB = buf => new Promise((res, rej) => getLoader().parse(buf, '', g => res(g.scene), rej));

// Centre the model, scale it to ~2.6 units and sit it on the viewer floor (y = -1).
export function fit(obj, size = 2.6) {
  const box = new THREE.Box3().setFromObject(obj);
  const dims = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const k = size / (Math.max(dims.x, dims.y, dims.z) || 1);
  obj.position.sub(mid);
  const group = new THREE.Group();
  group.add(obj);
  group.scale.setScalar(k);
  group.position.y = dims.y * k / 2 - 1;
  group.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
  return { group, dims };
}

export function makeThumb(group, w = 640, h = 400) {
  const canvas = document.createElement('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  r.setSize(w, h, false);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  const s = new THREE.Scene();
  s.background = new THREE.Color('#0d1a28');
  s.add(new THREE.HemisphereLight(0xcfe6ff, 0x1d2a38, 2.4));
  const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(5, 8, 6); s.add(key);
  const grid = new THREE.GridHelper(14, 28, 0x3c5a78, 0x22384f); grid.position.y = -1.005; s.add(grid);
  s.add(group);
  const cam = new THREE.PerspectiveCamera(32, w / h, .1, 100);
  cam.position.set(3.7, 3.1, 4.4); cam.lookAt(0, -.1, 0);
  r.render(s, cam);
  const url = canvas.toDataURL('image/jpeg', .8);
  s.remove(group); r.dispose();
  return url;
}

export function disposeObject(o) {
  o.traverse(n => {
    if (!n.isMesh) return;
    n.geometry?.dispose();
    [].concat(n.material || []).forEach(m => { Object.values(m).forEach(v => v?.isTexture && v.dispose()); m.dispose(); });
  });
}

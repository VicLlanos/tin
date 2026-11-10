import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, push, remove, update } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/* ============================================================
   FIREBASE
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyD6f6xMhYF6lqKp7cqmeywqarL-_yRbm9E",
  authDomain: "tine-54a9e.firebaseapp.com",
  databaseURL: "https://tine-54a9e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tine-54a9e",
  storageBucket: "tine-54a9e.firebasestorage.app",
  messagingSenderId: "898265691586",
  appId: "1:898265691586:web:d9684a5a401c32cf3a125b",
  measurementId: "G-9L1YCGEJQK"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* ---------- NAV ---------- */
  const navbar = $('#navbar'), navToggle = $('#navToggle'), navLinks = $('#navLinks');
  const scroll = () => navbar?.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', scroll, { passive: true });
  scroll();
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('active');
    navLinks.classList.remove('open');
  }));

  /* ---------- REVEAL ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  /* ---------- FILTERS ---------- */
  $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    $$('.project-card').forEach(card => {
      const cat = card.dataset.category || '';
      card.classList.toggle('hidden', btn.dataset.filter !== 'all' && cat !== btn.dataset.filter);
    });
  }));

  /* ============================================================
     MATERIALS (black & white technical palette)
     ============================================================ */
  const M = {
    cast:   new THREE.MeshStandardMaterial({ color: '#4a4a4a', metalness: 0.55, roughness: 0.4 }),
    dark:   new THREE.MeshStandardMaterial({ color: '#2a2a2a', metalness: 0.6,  roughness: 0.45 }),
    steel:  new THREE.MeshStandardMaterial({ color: '#c8c8c8', metalness: 0.9,  roughness: 0.2 }),
    gold:   new THREE.MeshStandardMaterial({ color: '#a0a0a0', metalness: 0.7,  roughness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.85 }),
    blue:   new THREE.MeshStandardMaterial({ color: '#8a8a8a', metalness: 0.5,  roughness: 0.35 }),
    green:  new THREE.MeshStandardMaterial({ color: '#6a6a6a', metalness: 0.4,  roughness: 0.45 }),
    copper: new THREE.MeshStandardMaterial({ color: '#9a9a9a', metalness: 0.8,  roughness: 0.28 }),
    white:  new THREE.MeshStandardMaterial({ color: '#e8e8e8', metalness: 0.2,  roughness: 0.5 }),
    orange: new THREE.MeshStandardMaterial({ color: '#7a7a7a', metalness: 0.5,  roughness: 0.4 }),
  };

  /* ============================================================
     GEOMETRY HELPERS
     ============================================================ */
  function box(g, s, p, m) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(...s), m);
    o.position.set(...p); o.castShadow = o.receiveShadow = true; g.add(o); return o;
  }
  function cyl(g, r1, r2, h, p, m, n = 32, rot = [0, 0, 0]) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, n), m);
    o.position.set(...p); o.rotation.set(...rot); o.castShadow = o.receiveShadow = true; g.add(o); return o;
  }
  function torus(g, r, tube, p, m, rot = [0, 0, 0], n = 24) {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, n), m);
    o.position.set(...p); o.rotation.set(...rot); o.castShadow = o.receiveShadow = true; g.add(o); return o;
  }
  function bolt(g, p, r = 0.06) {
    cyl(g, r, r, 0.035, p, M.steel, 8, [Math.PI / 2, 0, 0]);
  }

  /* ============================================================
     PROCEDURAL MODELS (fallback when no GLB)
     ============================================================ */
  function vise(g, exploded = false) {
    box(g, [2.65, 0.28, 1.65], [0, -0.82, 0], M.cast);
    box(g, [2.35, 0.12, 1.42], [0, -0.63, 0], M.dark);
    cyl(g, 0.82, 0.82, 0.18, [0, -0.48, 0], M.steel, 64);
    cyl(g, 0.69, 0.69, 0.12, [0, -0.35, 0], M.cast, 64);
    for (const x of [-1, 1]) for (const z of [-0.55, 0.55]) {
      cyl(g, 0.18, 0.18, 0.16, [x * 1.02, -0.83, z], M.dark);
      cyl(g, 0.075, 0.075, 0.02, [x * 1.02, -0.73, z], M.rubber);
    }
    box(g, [0.62, 1.35, 0.72], [-0.72, 0.25, 0], M.cast);
    box(g, [0.86, 0.24, 1.03], [-0.72, 0.99, 0], M.dark);
    box(g, [0.08, 0.86, 0.82], [-0.24, 0.99, 0], M.steel);
    for (let i = 0; i < 7; i++) box(g, [0.025, 0.035, 0.82], [-0.19, 0.62 + i * 0.12, 0], M.dark);
    const shift = exploded ? 0.5 : 0.16;
    box(g, [0.75, 0.92, 0.86], [0.53 + shift, 0.82, 0], M.cast);
    box(g, [0.09, 0.78, 0.82], [0.94 + shift, 0.88, 0], M.gold);
    for (let i = 0; i < 6; i++) box(g, [0.02, 0.035, 0.82], [0.995 + shift, 0.57 + i * 0.12, 0], M.dark);
    box(g, [1.9, 0.22, 0.26], [0.18, -0.1, 0], M.dark);
    box(g, [1.9, 0.22, 0.26], [0.18, 0.08, 0], M.blue);
    cyl(g, 0.105, 0.105, 2.25, [0.18, -0.38, 0], M.steel, 32, [0, 0, Math.PI / 2]);
    for (let i = 0; i < 17; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.016, 6, 24), M.gold);
      t.rotation.y = Math.PI / 2;
      t.position.set(-0.88 + i * 0.13, -0.38, 0);
      g.add(t);
    }
    cyl(g, 0.23, 0.23, 0.18, [1.35, -0.38, 0], M.dark, 40, [0, 0, Math.PI / 2]);
    cyl(g, 0.13, 0.13, 0.22, [1.48, -0.38, 0], M.steel, 32, [0, 0, Math.PI / 2]);
    cyl(g, 0.065, 0.065, 1.18, [1.63, -0.38, 0], M.steel, 24, [0, 0, Math.PI / 2]);
    for (const z of [-0.53, 0.53]) cyl(g, 0.105, 0.105, 0.22, [1.63, -0.38, z], M.rubber, 32, [0, 0, Math.PI / 2]);
    for (const x of [-0.95, -0.49]) for (const z of [-0.32, 0.32]) bolt(g, [x, 1, z], 0.055);
    for (const side of [-1, 1]) {
      const rib = box(g, [0.12, 0.78, 0.12], [-0.72 + side * 0.31, 0.2, side * 0.37], M.dark);
      rib.rotation.z = side * 0.13;
    }
  }

  function housing(g) {
    box(g, [2.5, 1.25, 1.65], [0, 0, 0], M.cast);
    box(g, [2.32, 0.12, 1.48], [0, 0.68, 0], M.steel);
    box(g, [2.05, 0.05, 1.22], [0, 0.77, 0], M.dark);
    for (let i = 0; i < 9; i++) box(g, [0.045, 0.035, 0.7], [-0.78 + i * 0.195, 0.81, 0], M.blue);
    for (const x of [-0.92, 0.92]) for (const z of [-0.55, 0.55]) bolt(g, [x, 0.79, z]);
    box(g, [0.14, 0.45, 0.5], [1.32, -0.1, 0], M.dark);
    for (let i = 0; i < 3; i++) cyl(g, 0.09, 0.09, 0.22, [1.42, -0.1, -0.16 + i * 0.16], M.gold, 24, [0, 0, Math.PI / 2]);
    box(g, [2.25, 0.12, 0.12], [0, -0.65, 0.84], M.dark);
    for (let i = 0; i < 6; i++) box(g, [0.04, 0.5, 0.04], [-1.15 + i * 0.07, 0.1, -0.86], M.steel);
    box(g, [0.6, 0.18, 0.02], [0, 0.35, 0.84], M.gold);
  }

  function template(g) {
    const s = new THREE.Shape();
    s.moveTo(-1.5, -0.85); s.lineTo(1.35, -0.85); s.lineTo(1.5, -0.55);
    s.lineTo(1.5, 0.55); s.lineTo(1.2, 0.85); s.lineTo(-1.5, 0.85); s.closePath();
    const h = new THREE.Path();
    h.absellipse(-0.85, 0, 0.22, 0.22, 0, Math.PI * 2, true, 0);
    s.holes.push(h);
    const plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025 }),
      M.gold
    );
    plate.rotation.x = -Math.PI / 2; plate.position.y = -0.2; plate.castShadow = true; g.add(plate);
    for (let i = 0; i < 5; i++) box(g, [0.025, 0.025, 1.1], [-0.95 + i * 0.45, -0.12, 0], M.steel);
    for (const x of [-1.25, 1.25]) for (const z of [-0.6, 0.6]) cyl(g, 0.05, 0.05, 0.18, [x, -0.08, z], M.steel, 16);
    for (const x of [-0.9, 0.9]) box(g, [0.2, 0.04, 0.1], [x, -0.05, 0.72], M.blue);
    for (const x of [-1.35, 1.35]) for (const z of [-0.75, 0.75]) box(g, [0.08, 0.02, 0.08], [x, -0.17, z], M.dark);
  }

  function drawing(g) {
    box(g, [3.6, 0.06, 2.35], [0, -0.15, 0], M.dark);
    const lm = new THREE.MeshBasicMaterial({ color: '#cccccc' });
    const line = (x1, z1, x2, z2, w = 0.012) => {
      const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz);
      const o = new THREE.Mesh(new THREE.BoxGeometry(l, 0.012, w), lm);
      o.position.set((x1 + x2) / 2, -0.105, (z1 + z2) / 2);
      o.rotation.y = -Math.atan2(dz, dx); g.add(o);
    };
    [[-1.35, -0.45, -0.15, -0.45], [-1.35, 0.45, -0.15, 0.45], [-1.35, -0.45, -1.35, 0.45], [-0.15, -0.45, -0.15, 0.45],
     [0.2, -0.45, 1.35, -0.45], [0.2, 0.45, 1.35, 0.45], [0.2, -0.45, 0.2, 0.45], [1.35, -0.45, 1.35, 0.45],
     [-1.35, 0.75, -0.15, 0.75], [0.2, 0.75, 1.35, 0.75]].forEach(a => line(...a));
    for (let i = 0; i < 12; i++) if (i % 2 === 0) line(-1.35 + i * 0.1, -0.9, -1.35 + i * 0.1, 0.9, 0.006);
    const am = new THREE.MeshBasicMaterial({ color: '#e0e0e0' });
    for (const [x, z] of [[-1.35, -0.55], [-0.15, -0.55], [0.2, -0.55], [1.35, -0.55]]) {
      const a = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.12, 8), am);
      a.position.set(x, -0.1, z); a.rotation.x = Math.PI / 2; g.add(a);
    }
    box(g, [1.2, 0.02, 0.35], [1.1, -0.1, 0.9], M.white);
    for (let i = 0; i < 3; i++) line(0.55 + i * 0.35, 0.75, 0.55 + i * 0.35, 1.05, 0.008);
    for (const [x, z] of [[-0.85, 0.2], [0.85, -0.2]]) {
      cyl(g, 0.12, 0.12, 0.02, [x, -0.1, z], M.steel, 24);
      cyl(g, 0.06, 0.06, 0.03, [x, -0.09, z], M.dark, 16);
    }
  }

  function exploded(g) {
    box(g, [2.6, 0.18, 1.6], [0, -0.8, 0], M.cast);
    box(g, [2.2, 0.15, 1.3], [0, -0.45, 0], M.dark);
    box(g, [2.0, 0.12, 1.15], [0, -0.15, 0], M.steel);
    box(g, [1.7, 0.1, 0.95], [0, 0.15, 0], M.blue);
    box(g, [1.4, 0.08, 0.75], [0, 0.42, 0], M.gold);
    for (const x of [-0.85, 0.85]) for (const z of [-0.5, 0.5]) {
      cyl(g, 0.07, 0.07, 0.3, [x, 0.65, z], M.steel, 16);
      cyl(g, 0.1, 0.1, 0.06, [x, 0.82, z], M.gold, 16);
    }
    const lm = new THREE.MeshBasicMaterial({ color: '#666666', transparent: true, opacity: 0.5 });
    for (const [x, z] of [[-0.85, -0.5], [0.85, -0.5], [-0.85, 0.5], [0.85, 0.5]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.5, 6), lm);
      l.position.set(x, -0.05, z); g.add(l);
    }
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 20), M.gold);
      b.position.set(-1.4 + i * 0.35, 0.3 + (i % 2) * 0.3, 0.9); g.add(b);
    }
  }

  function nesting(g) {
    box(g, [3.2, 0.04, 2.0], [0, -0.15, 0], M.dark);
    const shapes = [
      { s: [0.9, 0.04, 0.5], p: [-0.95, -0.08, -0.5], m: M.cast },
      { s: [0.7, 0.04, 0.4], p: [-0.95, -0.08, 0.15], m: M.gold },
      { s: [0.6, 0.04, 0.55], p: [-0.95, -0.08, 0.65], m: M.blue },
      { s: [0.55, 0.04, 0.55], p: [0.0, -0.08, -0.55], m: M.steel },
      { s: [0.5, 0.04, 0.5], p: [0.05, -0.08, 0.1], m: M.green },
      { s: [0.45, 0.04, 0.4], p: [0.1, -0.08, 0.6], m: M.orange },
      { s: [0.5, 0.04, 0.6], p: [0.9, -0.08, -0.5], m: M.copper },
      { s: [0.4, 0.04, 0.5], p: [0.95, -0.08, 0.1], m: M.cast },
      { s: [0.55, 0.04, 0.45], p: [0.9, -0.08, 0.65], m: M.gold },
    ];
    shapes.forEach(({ s, p, m }) => box(g, s, p, m));
    for (const [x, z] of [[-0.95, -0.35], [0.0, -0.3], [0.9, -0.35], [0.95, 0.3]]) {
      cyl(g, 0.09, 0.09, 0.06, [x, -0.06, z], M.rubber, 20);
    }
    const bm = new THREE.MeshBasicMaterial({ color: '#888888' });
    const edges = [
      [-1.55, -0.95, 1.55, -0.95], [1.55, -0.95, 1.55, 0.95],
      [1.55, 0.95, -1.55, 0.95], [-1.55, 0.95, -1.55, -0.95]
    ];
    edges.forEach(([x1, z1, x2, z2]) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x2 - x1, z2 - z1), 0.012, 0.012), bm);
      l.position.set((x1 + x2) / 2, -0.09, (z1 + z2) / 2);
      l.rotation.y = -Math.atan2(z2 - z1, x2 - x1); g.add(l);
    });
  }

  function bracketAssembly(g) {
    box(g, [2.4, 0.2, 1.6], [0, -0.75, 0], M.cast);
    for (const x of [-0.9, 0.9]) for (const z of [-0.55, 0.55]) bolt(g, [x, -0.62, z], 0.07);
    for (const x of [-0.85, 0.85]) {
      box(g, [0.3, 1.4, 0.3], [x, 0.05, 0], M.steel);
      box(g, [0.42, 0.1, 0.42], [x, -0.55, 0], M.dark);
      box(g, [0.42, 0.1, 0.42], [x, 0.75, 0], M.dark);
    }
    box(g, [2.0, 0.22, 0.26], [0, 0.75, 0], M.dark);
    box(g, [0.7, 0.5, 0.9], [0, 0.42, 0], M.gold);
    box(g, [0.9, 0.12, 1.0], [0, 0.7, 0], M.cast);
    for (const z of [-0.35, 0.35]) cyl(g, 0.1, 0.1, 0.7, [0, 0.42, z], M.steel, 24, [Math.PI / 2, 0, 0]);
    cyl(g, 0.07, 0.07, 1.8, [0, 0.2, 0], M.steel, 20);
    for (let i = 0; i < 14; i++) torus(g, 0.08, 0.012, [0, -0.55 + i * 0.12, 0], M.copper, [Math.PI / 2, 0, 0], 20);
    cyl(g, 0.22, 0.22, 0.06, [0, -0.85, 0], M.dark, 32);
    for (let i = 0; i < 4; i++) {
      const h = box(g, [0.5, 0.05, 0.08], [0, -0.85, 0], M.gold);
      h.rotation.y = i * Math.PI / 2;
    }
    cyl(g, 0.06, 0.06, 0.3, [0, -1.0, 0], M.steel, 16);
    for (const x of [-0.85, 0.85]) {
      const br = box(g, [0.1, 0.6, 0.5], [x * 1.1, 0.0, 0], M.green);
      br.rotation.z = x > 0 ? -0.3 : 0.3;
    }
    for (const x of [-1.2, 1.2]) box(g, [0.2, 0.08, 0.5], [x, -0.62, 0], M.orange);
  }

  function buildModel(type, explodedFlag = false) {
    const g = new THREE.Group();
    switch (type) {
      case 'vise':     vise(g, explodedFlag); break;
      case 'assembly': bracketAssembly(g); break;
      case 'housing':  housing(g); break;
      case 'template': template(g); break;
      case 'drawing':  drawing(g); break;
      case 'exploded': exploded(g); break;
      case 'nesting':  nesting(g); break;
      default:         vise(g, explodedFlag);
    }
    return g;
  }

  /* ============================================================
     SCENE FACTORY
     ============================================================ */
  const gltfLoader = new GLTFLoader();

  function makeScene(canvas, typeOrUrl, hero = false) {
    if (!canvas) return null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(hero ? '#0c0c0c' : '#0a0a0a');
    scene.fog = new THREE.Fog(scene.background, 9, 20);

    const camera = new THREE.PerspectiveCamera(hero ? 36 : 34, 1, 0.1, 100);
    camera.position.set(4.6, 3.1, 5.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 7, 5); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0xaaaaaa, 1.4);
    rim.position.set(-5, 3, -4); scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.02; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(12, 24, 0x444444, 0x222222);
    grid.position.y = -1.005; scene.add(grid);

    let model = new THREE.Group();
    scene.add(model);

    const isUrl = typeof typeOrUrl === 'string' && (typeOrUrl.startsWith('http') || typeOrUrl.endsWith('.glb') || typeOrUrl.endsWith('.gltf'));
    if (isUrl) {
      gltfLoader.load(typeOrUrl, (gltf) => {
        scene.remove(model);
        model = gltf.scene;
        // Center & scale
        const box3 = new THREE.Box3().setFromObject(model);
        const size = box3.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.4 / maxDim;
        model.scale.setScalar(scale);
        const center = box3.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.2;
        model.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
        scene.add(model);
      }, undefined, (err) => {
        console.warn('GLB load failed, falling back to procedural', err);
        scene.remove(model);
        model = buildModel('vise');
        scene.add(model);
      });
    } else {
      model = buildModel(typeOrUrl || 'vise', typeOrUrl === 'assembly');
      scene.add(model);
    }

    let controls = null;
    if (hero) {
      controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.minDistance = 3.5;
      controls.maxDistance = 9;
      controls.maxPolarAngle = Math.PI * 0.49;
      controls.target.set(0, 0, 0);
      controls.autoRotate = !reduced;
      controls.autoRotateSpeed = 0.7;
    } else {
      camera.position.set(4.2, 2.8, 5.2);
      if (['template', 'nesting', 'drawing'].includes(typeOrUrl)) {
        camera.position.set(0, 4.8, 0.01);
      }
      camera.lookAt(0, 0, 0);
      if (model) model.rotation.y = -0.25;
    }

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);
    resize();

    let frame;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls?.update();
      if (!hero && !reduced && !isUrl && ['housing', 'assembly'].includes(typeOrUrl)) {
        model.rotation.y += 0.0025;
      }
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls?.dispose();
      renderer.dispose();
    };
  }

  /* ---------- HERO + DEFAULT PROJECT PREVIEWS ---------- */
  const cleanup = [];
  const heroCleanup = makeScene($('#heroModel'), 'vise', true);
  if (heroCleanup) cleanup.push(heroCleanup);

  // Fallback project cards if Firebase is empty
  const FALLBACK_PROJECTS = [
    { id: 'fb-housing', title: 'Packaging Component Set', category: 'product', description: 'Modular product housing designed for efficient assembly and material optimization.', tags: ['SolidWorks', 'DFM'], model: 'housing', kicker: 'PRODUCT · DFM',
      specs: ['Dimensions: 250 × 165 × 125 mm', 'Material: Glass-filled nylon (PA66-GF30)', 'Process: Injection moulding', 'Tolerance: ±0.15 mm on mating surfaces'] },
    { id: 'fb-template', title: 'Production Template Pack', category: 'template', description: 'Precision templates and patterns for consistent manufacturing output at scale.', tags: ['AutoCAD', 'Templating'], model: 'template', kicker: 'TEMPLATE · PRECISION',
      specs: ['Dimensions: 300 × 170 × 12 mm', 'Material: 6082-T6 aluminium', 'Process: CNC milling', 'Flatness: 0.05 mm'] },
    { id: 'fb-drawing', title: 'Detailed Part Drawing', category: 'drawing', description: 'Full production drawings with dimensions, tolerances, and clear callouts.', tags: ['AutoCAD', 'GD&T'], model: 'drawing', kicker: 'DRAWING · GD&T',
      specs: ['Sheet size: A2', 'Standards: ISO 2768-mK, ASME Y14.5', 'Views: Front, top, right, isometric', 'Tolerances: ±0.1 mm general'] },
    { id: 'fb-assembly', title: 'Multi-Part Assembly', category: 'assembly', description: 'Complex assembly modeling with clear mate relationships and motion studies.', tags: ['SolidWorks', 'Assembly'], model: 'assembly', kicker: 'ASSEMBLY · MOTION',
      specs: ['Parts: 14 unique components', 'Materials: Steel, aluminium, bronze', 'Motion: 120 mm carriage travel', 'Mates: Concentric, coincident, limit'] },
    { id: 'fb-exploded', title: 'Exploded View Package', category: 'drawing', description: 'Exploded assembly drawings with item balloons and parts list for production.', tags: ['SolidWorks', 'Documentation'], model: 'exploded', kicker: 'DOCUMENTATION · EXPLODED',
      specs: ['Format: A3 exploded isometric', 'Balloons: 4 item references', 'Parts list: 8 line items', 'Standards: ASME Y14.34'] },
    { id: 'fb-nesting', title: 'Nesting Template Layout', category: 'template', description: 'Optimized nesting templates to maximize material yield and reduce waste.', tags: ['AutoCAD', 'Templating'], model: 'nesting', kicker: 'TEMPLATE · NESTING',
      specs: ['Sheet size: 320 × 200 mm', 'Parts nested: 9 unique blanks', 'Material yield: 87%', 'Process: Laser cutting'] },
  ];

  let liveProjects = [...FALLBACK_PROJECTS];

  function renderGallery(projects) {
    const gallery = $('#gallery');
    if (!gallery) return;
    // Clean previous procedural canvases
    cleanup.splice(1).forEach(fn => fn());
    gallery.innerHTML = '';

    projects.forEach((p, i) => {
      const article = document.createElement('article');
      article.className = 'project-card reveal visible';
      article.dataset.category = p.category || 'product';
      article.dataset.project = p.id;
      article.style.transitionDelay = `${(i % 6) * 0.05}s`;

      const hasGlb = p.modelUrl && (p.modelUrl.includes('.glb') || p.modelUrl.includes('.gltf') || p.modelUrl.startsWith('http'));
      const hasThumb = p.thumbnailUrl;

      let visualHtml;
      if (hasThumb) {
        visualHtml = `<img class="project-thumb" src="${p.thumbnailUrl}" alt="${p.title}">`;
      } else {
        visualHtml = `<canvas class="project-model" data-model="${p.model || 'vise'}" data-url="${p.modelUrl || ''}" aria-label="3D model"></canvas>`;
      }

      article.innerHTML = `
        <div class="project-visual">
          ${visualHtml}
          <div class="project-overlay"><span class="project-tag">${(p.category || 'product').toUpperCase()}</span></div>
        </div>
        <div class="project-info">
          <h3>${p.title}</h3>
          <p>${p.description || ''}</p>
          <div class="project-meta">${(p.tags || []).slice(0, 3).map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      `;
      article.addEventListener('click', () => openProjectModal(p));
      gallery.appendChild(article);

      if (!hasThumb) {
        const canvas = article.querySelector('.project-model');
        if (canvas) {
          const src = hasGlb ? p.modelUrl : (p.model || 'vise');
          const stop = makeScene(canvas, src, false);
          if (stop) cleanup.push(stop);
        }
      }
    });
  }

  /* ============================================================
     PROJECT MODAL
     ============================================================ */
  const modal = $('#projectModal');
  const modalBackdrop = $('#modalBackdrop');
  const modalClose = $('#modalClose');
  const modalCanvas = $('#modalModel');
  const modalTitle = $('#modalTitle');
  const modalKicker = $('#modalKicker');
  const modalDesc = $('#modalDescription');
  const modalSpecs = $('#modalSpecs');
  const modalTags = $('#modalTags');
  const modalLoading = $('#modalLoading');

  let modalCleanup = null;
  let modalOpen = false;

  function openProjectModal(data) {
    if (!data) return;
    modalTitle.textContent = data.title || 'Project';
    modalKicker.textContent = data.kicker || (data.category || 'PROJECT').toUpperCase();
    modalDesc.textContent = data.description || '';
    const specs = data.specs || [];
    modalSpecs.innerHTML = specs.map(s => `<div class="modal-spec">${s}</div>`).join('');
    const tags = data.tags || [];
    modalTags.innerHTML = tags.map(t => `<span>${t}</span>`).join('');

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    modalOpen = true;
    document.body.style.overflow = 'hidden';

    if (modalLoading) modalLoading.hidden = false;

    requestAnimationFrame(() => {
      if (modalCleanup) { modalCleanup(); modalCleanup = null; }
      const src = data.modelUrl || data.model || 'vise';
      modalCleanup = makeModalScene(modalCanvas, src);
      if (modalLoading) setTimeout(() => { modalLoading.hidden = true; }, 600);
    });
  }

  function closeProjectModal() {
    if (!modalOpen) return;
    modal.classList.remove('open');
    modalOpen = false;
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
      if (modalCleanup) { modalCleanup(); modalCleanup = null; }
    }, 280);
  }

  function makeModalScene(canvas, typeOrUrl) {
    if (!canvas) return null;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a0a');
    scene.fog = new THREE.Fog(scene.background, 10, 22);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const isoDist = 6.2;
    camera.position.set(
      isoDist * Math.sin(45 * Math.PI / 180) * Math.cos(35.264 * Math.PI / 180),
      isoDist * Math.sin(35.264 * Math.PI / 180),
      isoDist * Math.cos(45 * Math.PI / 180) * Math.cos(35.264 * Math.PI / 180)
    );
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(5, 8, 6); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0xbbbbbb, 1.5);
    rim.position.set(-6, 4, -5); scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: '#0e0e0e', roughness: 0.8 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.02; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(14, 28, 0x3a3a3a, 0x1e1e1e);
    grid.position.y = -1.005; scene.add(grid);

    let model = new THREE.Group();
    scene.add(model);

    const isUrl = typeof typeOrUrl === 'string' && (typeOrUrl.startsWith('http') || typeOrUrl.includes('.glb') || typeOrUrl.includes('.gltf'));
    if (isUrl) {
      gltfLoader.load(typeOrUrl, (gltf) => {
        scene.remove(model);
        model = gltf.scene;
        const box3 = new THREE.Box3().setFromObject(model);
        const size = box3.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2.6 / maxDim;
        model.scale.setScalar(scale);
        const center = box3.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.15;
        model.traverse(c => { if (c.isMesh) { c.castShadow = c.receiveShadow = true; } });
        scene.add(model);
      }, undefined, () => {
        scene.remove(model);
        model = buildModel('vise');
        scene.add(model);
      });
    } else {
      model = buildModel(typeOrUrl || 'vise', false);
      scene.add(model);
    }

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.5;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.target.set(0, 0, 0);
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.0;
    controls.update();

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement || canvas);
    resize();

    let frame;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }

  modalClose?.addEventListener('click', closeProjectModal);
  modalBackdrop?.addEventListener('click', closeProjectModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProjectModal(); closeAdmin(); } });

  /* ============================================================
     DATA LOADERS (RTDB)
     ============================================================ */
  function toArray(snap) {
    const val = snap.val();
    if (!val) return [];
    return Object.entries(val).map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }

  // Experience
  onValue(ref(db, 'experiences'), (snap) => {
    const list = toArray(snap);
    const el = $('#experienceList');
    if (!el) return;
    if (list.length === 0) {
      el.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-period">2023 – Present</div>
          <div class="timeline-role">CAD Designer</div>
          <div class="timeline-company">ISHIP LOGIPACK INCORPORATED</div>
          <div class="timeline-desc">Product design, 3D modeling, and production templating for packaging systems. Focus on design-for-manufacturing and clear technical documentation.</div>
        </div>`;
      return;
    }
    el.innerHTML = list.map(e => `
      <div class="timeline-item">
        <div class="timeline-period">${e.period || ''}</div>
        <div class="timeline-role">${e.role || ''}</div>
        <div class="timeline-company">${e.company || ''}</div>
        <div class="timeline-desc">${e.description || ''}</div>
      </div>
    `).join('');
  });

  // Certifications
  onValue(ref(db, 'certifications'), (snap) => {
    const list = toArray(snap);
    const el = $('#certsList');
    if (!el) return;
    if (list.length === 0) {
      el.innerHTML = `<div class="timeline-placeholder">No certifications added yet. Sign in as admin to add some.</div>`;
      return;
    }
    el.innerHTML = list.map(c => `
      <div class="cert-card">
        <div class="cert-title">${c.title || ''}</div>
        <div class="cert-issuer">${c.issuer || ''}</div>
        <div class="cert-date">${c.date || ''}</div>
        ${c.credentialUrl ? `<a class="cert-link" href="${c.credentialUrl}" target="_blank" rel="noopener">View credential →</a>` : ''}
      </div>
    `).join('');
  });

  // Projects
  onValue(ref(db, 'projects'), (snap) => {
    const list = toArray(snap);
    if (list.length > 0) {
      liveProjects = list.map(p => ({
        ...p,
        tags: Array.isArray(p.tags) ? p.tags : (p.tags || '').split(',').map(t => t.trim()).filter(Boolean),
        specs: Array.isArray(p.specs) ? p.specs : (p.specs || '').split('\n').map(s => s.trim()).filter(Boolean),
        kicker: p.kicker || (p.category || 'PROJECT').toUpperCase(),
      }));
    } else {
      liveProjects = [...FALLBACK_PROJECTS];
    }
    renderGallery(liveProjects);
  });

  // Initial render with fallbacks
  renderGallery(liveProjects);

  /* ============================================================
     ADMIN PANEL
     ============================================================ */
  const adminOverlay = $('#adminOverlay');
  const adminLogin = $('#adminLogin');
  const adminDashboard = $('#adminDashboard');
  const loginForm = $('#loginForm');
  const loginError = $('#loginError');

  function openAdmin() {
    adminOverlay.hidden = false;
  }
  function closeAdmin() {
    adminOverlay.hidden = true;
  }

  $('#adminLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    openAdmin();
  });
  $('#adminClose')?.addEventListener('click', closeAdmin);

  // Tabs
  $$('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.admin-tab').forEach(t => t.classList.remove('active'));
      $$('.admin-tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $(`#tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  // Auth state
  onAuthStateChanged(auth, (user) => {
    if (user) {
      adminLogin.hidden = true;
      adminDashboard.hidden = false;
      refreshAdminLists();
    } else {
      adminLogin.hidden = false;
      adminDashboard.hidden = true;
    }
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const email = $('#adminEmail').value.trim();
    const password = $('#adminPassword').value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      loginError.textContent = err.message || 'Sign-in failed';
      loginError.hidden = false;
    }
  });

  $('#signOutBtn')?.addEventListener('click', () => signOut(auth));

  /* ----- Admin list helpers ----- */
  function refreshAdminLists() {
    // Projects
    onValue(ref(db, 'projects'), (snap) => {
      const list = toArray(snap);
      const el = $('#adminProjectsList');
      if (!el) return;
      el.innerHTML = list.length ? list.map(p => `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-title">${p.title}</div>
            <div class="admin-item-meta">${p.category || ''} · order ${p.order ?? 0}${p.modelUrl ? ' · GLB' : ''}</div>
          </div>
          <div class="admin-item-actions">
            <button type="button" data-edit-project="${p.id}">Edit</button>
            <button type="button" class="btn-del" data-del-project="${p.id}">Delete</button>
          </div>
        </div>
      `).join('') : '<p class="timeline-placeholder">No projects yet.</p>';

      el.querySelectorAll('[data-edit-project]').forEach(btn => {
        btn.addEventListener('click', () => editProject(list.find(x => x.id === btn.dataset.editProject)));
      });
      el.querySelectorAll('[data-del-project]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this project?')) await remove(ref(db, `projects/${btn.dataset.delProject}`));
        });
      });
    }, { onlyOnce: false });

    // Experience
    onValue(ref(db, 'experiences'), (snap) => {
      const list = toArray(snap);
      const el = $('#adminExpList');
      if (!el) return;
      el.innerHTML = list.length ? list.map(e => `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-title">${e.role} @ ${e.company}</div>
            <div class="admin-item-meta">${e.period || ''}</div>
          </div>
          <div class="admin-item-actions">
            <button type="button" data-edit-exp="${e.id}">Edit</button>
            <button type="button" class="btn-del" data-del-exp="${e.id}">Delete</button>
          </div>
        </div>
      `).join('') : '<p class="timeline-placeholder">No experience entries.</p>';

      el.querySelectorAll('[data-edit-exp]').forEach(btn => {
        btn.addEventListener('click', () => editExp(list.find(x => x.id === btn.dataset.editExp)));
      });
      el.querySelectorAll('[data-del-exp]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this entry?')) await remove(ref(db, `experiences/${btn.dataset.delExp}`));
        });
      });
    });

    // Certs
    onValue(ref(db, 'certifications'), (snap) => {
      const list = toArray(snap);
      const el = $('#adminCertsList');
      if (!el) return;
      el.innerHTML = list.length ? list.map(c => `
        <div class="admin-item">
          <div class="admin-item-info">
            <div class="admin-item-title">${c.title}</div>
            <div class="admin-item-meta">${c.issuer || ''} · ${c.date || ''}</div>
          </div>
          <div class="admin-item-actions">
            <button type="button" data-edit-cert="${c.id}">Edit</button>
            <button type="button" class="btn-del" data-del-cert="${c.id}">Delete</button>
          </div>
        </div>
      `).join('') : '<p class="timeline-placeholder">No certifications.</p>';

      el.querySelectorAll('[data-edit-cert]').forEach(btn => {
        btn.addEventListener('click', () => editCert(list.find(x => x.id === btn.dataset.editCert)));
      });
      el.querySelectorAll('[data-del-cert]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this certification?')) await remove(ref(db, `certifications/${btn.dataset.delCert}`));
        });
      });
    });
  }

  /* ----- Project form ----- */
  const projectForm = $('#projectForm');
  $('#addProjectBtn')?.addEventListener('click', () => {
    projectForm.hidden = false;
    $('#projectFormTitle').textContent = 'New Project';
    $('#projectId').value = '';
    projectForm.reset();
    $('#pOrder').value = '0';
  });
  $('#cancelProjectBtn')?.addEventListener('click', () => { projectForm.hidden = true; });

  function editProject(p) {
    if (!p) return;
    projectForm.hidden = false;
    $('#projectFormTitle').textContent = 'Edit Project';
    $('#projectId').value = p.id;
    $('#pTitle').value = p.title || '';
    $('#pCategory').value = p.category || 'product';
    $('#pDescription').value = p.description || '';
    $('#pTags').value = Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || '');
    $('#pSpecs').value = Array.isArray(p.specs) ? p.specs.join('\n') : (p.specs || '');
    $('#pOrder').value = p.order ?? 0;
  }

  async function uploadFile(file, path, onProgress) {
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, file);
    return new Promise((resolve, reject) => {
      task.on('state_changed',
        (snap) => {
          const pct = (snap.bytesTransferred / snap.totalBytes) * 100;
          onProgress?.(pct);
        },
        reject,
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });
  }

  projectForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = $('#projectError');
    const prog = $('#projectProgress');
    const fill = $('#projectProgressFill');
    const progText = $('#projectProgressText');
    errEl.hidden = true;
    prog.hidden = true;

    const id = $('#projectId').value;
    const title = $('#pTitle').value.trim();
    const category = $('#pCategory').value;
    const description = $('#pDescription').value.trim();
    const tags = $('#pTags').value.split(',').map(t => t.trim()).filter(Boolean);
    const specs = $('#pSpecs').value.split('\n').map(s => s.trim()).filter(Boolean);
    const order = parseInt($('#pOrder').value, 10) || 0;
    const glbFile = $('#pGlb').files[0];
    const thumbFile = $('#pThumb').files[0];

    try {
      let modelUrl = null;
      let thumbnailUrl = null;

      // Keep existing URLs if editing
      if (id) {
        const existing = liveProjects.find(p => p.id === id);
        if (existing) {
          modelUrl = existing.modelUrl || null;
          thumbnailUrl = existing.thumbnailUrl || null;
        }
      }

      if (glbFile || thumbFile) {
        prog.hidden = false;
        fill.style.width = '0%';
      }

      if (glbFile) {
        progText.textContent = 'Uploading GLB…';
        const path = `models/${Date.now()}_${glbFile.name}`;
        modelUrl = await uploadFile(glbFile, path, (pct) => {
          fill.style.width = `${pct * 0.7}%`;
          progText.textContent = `Uploading GLB… ${Math.round(pct)}%`;
        });
      }

      if (thumbFile) {
        progText.textContent = 'Uploading thumbnail…';
        const path = `thumbnails/${Date.now()}_${thumbFile.name}`;
        thumbnailUrl = await uploadFile(thumbFile, path, (pct) => {
          fill.style.width = `${70 + pct * 0.3}%`;
          progText.textContent = `Uploading thumbnail… ${Math.round(pct)}%`;
        });
      }

      fill.style.width = '100%';
      progText.textContent = 'Saving…';

      const data = {
        title, category, description, tags, specs, order,
        modelUrl: modelUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        updatedAt: Date.now(),
      };

      if (id) {
        await update(ref(db, `projects/${id}`), data);
      } else {
        data.createdAt = Date.now();
        await push(ref(db, 'projects'), data);
      }

      projectForm.hidden = true;
      projectForm.reset();
      prog.hidden = true;
    } catch (err) {
      console.error(err);
      errEl.textContent = err.message || 'Save failed. Check Storage rules and Auth.';
      errEl.hidden = false;
      prog.hidden = true;
    }
  });

  /* ----- Experience form ----- */
  const expForm = $('#expForm');
  $('#addExpBtn')?.addEventListener('click', () => {
    expForm.hidden = false;
    $('#expFormTitle').textContent = 'New Experience';
    $('#expId').value = '';
    expForm.reset();
    $('#eOrder').value = '0';
  });
  $('#cancelExpBtn')?.addEventListener('click', () => { expForm.hidden = true; });

  function editExp(e) {
    if (!e) return;
    expForm.hidden = false;
    $('#expFormTitle').textContent = 'Edit Experience';
    $('#expId').value = e.id;
    $('#eCompany').value = e.company || '';
    $('#eRole').value = e.role || '';
    $('#ePeriod').value = e.period || '';
    $('#eDescription').value = e.description || '';
    $('#eOrder').value = e.order ?? 0;
  }

  expForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const id = $('#expId').value;
    const data = {
      company: $('#eCompany').value.trim(),
      role: $('#eRole').value.trim(),
      period: $('#ePeriod').value.trim(),
      description: $('#eDescription').value.trim(),
      order: parseInt($('#eOrder').value, 10) || 0,
    };
    if (id) await update(ref(db, `experiences/${id}`), data);
    else await push(ref(db, 'experiences'), data);
    expForm.hidden = true;
    expForm.reset();
  });

  /* ----- Cert form ----- */
  const certForm = $('#certForm');
  $('#addCertBtn')?.addEventListener('click', () => {
    certForm.hidden = false;
    $('#certFormTitle').textContent = 'New Certification';
    $('#certId').value = '';
    certForm.reset();
    $('#cOrder').value = '0';
  });
  $('#cancelCertBtn')?.addEventListener('click', () => { certForm.hidden = true; });

  function editCert(c) {
    if (!c) return;
    certForm.hidden = false;
    $('#certFormTitle').textContent = 'Edit Certification';
    $('#certId').value = c.id;
    $('#cTitle').value = c.title || '';
    $('#cIssuer').value = c.issuer || '';
    $('#cDate').value = c.date || '';
    $('#cUrl').value = c.credentialUrl || '';
    $('#cOrder').value = c.order ?? 0;
  }

  certForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const id = $('#certId').value;
    const data = {
      title: $('#cTitle').value.trim(),
      issuer: $('#cIssuer').value.trim(),
      date: $('#cDate').value.trim(),
      credentialUrl: $('#cUrl').value.trim() || null,
      order: parseInt($('#cOrder').value, 10) || 0,
    };
    if (id) await update(ref(db, `certifications/${id}`), data);
    else await push(ref(db, 'certifications'), data);
    certForm.hidden = true;
    certForm.reset();
  });

  /* ---------- CONTACT ---------- */
  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    location.href = `mailto:justine.nagrampa@example.com?subject=${subject}&body=${body}`;
  });

  document.body.classList.add('js-enabled');
});

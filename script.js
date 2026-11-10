import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './js/sheet.js';
import './js/cloud.js';
import { parseGLB, fit, disposeObject } from './js/glb.js';

document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const navbar = $('#navbar'), navToggle = $('#navToggle'), navLinks = $('#navLinks');
  const scroll = () => navbar?.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', scroll, { passive: true }); scroll();
  navToggle?.addEventListener('click', () => {
    navToggle.classList.toggle('active'); navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(navToggle.classList.contains('active')));
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('active'); navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    }), { threshold: .1, rootMargin: '0px 0px -30px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  } else $$('.reveal').forEach(el => el.classList.add('visible'));

  $$('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
    $$('.project-card').forEach(card => card.classList.toggle('hidden',
      btn.dataset.filter !== 'all' && card.dataset.category !== btn.dataset.filter));
  }));

  /* ============================================================
     MATERIALS
     ============================================================ */
  const M = {
    cast:    new THREE.MeshStandardMaterial({ color: '#55738c', metalness: .68, roughness: .32 }),
    dark:    new THREE.MeshStandardMaterial({ color: '#263d52', metalness: .7,  roughness: .34 }),
    steel:   new THREE.MeshStandardMaterial({ color: '#b9c9d7', metalness: .9,  roughness: .22 }),
    gold:    new THREE.MeshStandardMaterial({ color: '#d99c52', metalness: .7,  roughness: .28 }),
    rubber:  new THREE.MeshStandardMaterial({ color: '#17232e', roughness: .82 }),
    blue:    new THREE.MeshStandardMaterial({ color: '#8fb7d5', metalness: .6,  roughness: .3 }),
    green:   new THREE.MeshStandardMaterial({ color: '#4fae7a', metalness: .5,  roughness: .4 }),
    copper:  new THREE.MeshStandardMaterial({ color: '#b87333', metalness: .85, roughness: .25 }),
    white:   new THREE.MeshStandardMaterial({ color: '#e8eef4', metalness: .3,  roughness: .45 }),
    orange:  new THREE.MeshStandardMaterial({ color: '#e08a3c', metalness: .55, roughness: .35 }),
    glass:   new THREE.MeshStandardMaterial({ color: '#9fd0ff', metalness: .1,  roughness: .15, transparent: true, opacity: .45 }),
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
  function bolt(g, p, r = .06) { cyl(g, r, r, .035, p, M.steel, 8, [Math.PI / 2, 0, 0]); }

  /* ============================================================
     MODELS
     ============================================================ */

  // ---- Precision Bench Vise (hero + assembly) ----
  function vise(g, exploded = false) {
    box(g, [2.65, .28, 1.65], [0, -.82, 0], M.cast);
    box(g, [2.35, .12, 1.42], [0, -.63, 0], M.dark);
    cyl(g, .82, .82, .18, [0, -.48, 0], M.steel, 64);
    cyl(g, .69, .69, .12, [0, -.35, 0], M.cast, 64);
    for (const x of [-1, 1]) for (const z of [-.55, .55]) {
      cyl(g, .18, .18, .16, [x * 1.02, -.83, z], M.dark);
      cyl(g, .075, .075, .02, [x * 1.02, -.73, z], M.rubber);
    }
    box(g, [.62, 1.35, .72], [-.72, .25, 0], M.cast);
    box(g, [.86, .24, 1.03], [-.72, .99, 0], M.dark);
    box(g, [.08, .86, .82], [-.24, .99, 0], M.steel);
    for (let i = 0; i < 7; i++) box(g, [.025, .035, .82], [-.19, .62 + i * .12, 0], M.dark);
    const shift = exploded ? .5 : .16;
    box(g, [.75, .92, .86], [.53 + shift, .82, 0], M.cast);
    box(g, [.09, .78, .82], [.94 + shift, .88, 0], M.gold);
    for (let i = 0; i < 6; i++) box(g, [.02, .035, .82], [.995 + shift, .57 + i * .12, 0], M.dark);
    box(g, [1.9, .22, .26], [.18, -.1, 0], M.dark);
    box(g, [1.9, .22, .26], [.18, .08, 0], M.blue);
    cyl(g, .105, .105, 2.25, [.18, -.38, 0], M.steel, 32, [0, 0, Math.PI / 2]);
    for (let i = 0; i < 17; i++) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(.115, .016, 6, 24), M.gold);
      t.rotation.y = Math.PI / 2; t.position.set(-.88 + i * .13, -.38, 0); g.add(t);
    }
    cyl(g, .23, .23, .18, [1.35, -.38, 0], M.dark, 40, [0, 0, Math.PI / 2]);
    cyl(g, .13, .13, .22, [1.48, -.38, 0], M.steel, 32, [0, 0, Math.PI / 2]);
    cyl(g, .065, .065, 1.18, [1.63, -.38, 0], M.steel, 24, [0, 0, Math.PI / 2]);
    for (const z of [-.53, .53]) cyl(g, .105, .105, .22, [1.63, -.38, z], M.rubber, 32, [0, 0, Math.PI / 2]);
    for (const x of [-.95, -.49]) for (const z of [-.32, .32]) bolt(g, [x, 1, z], .055);
    for (const side of [-1, 1]) { const rib = box(g, [.12, .78, .12], [-.72 + side * .31, .2, side * .37], M.dark); rib.rotation.z = side * .13; }
  }

  // ---- Packing Component Set (product housing) ----
  function housing(g) {
    // Main box body
    box(g, [2.5, 1.25, 1.65], [0, 0, 0], M.cast);
    // Top plate
    box(g, [2.32, .12, 1.48], [0, .68, 0], M.steel);
    // Recessed lid
    box(g, [2.05, .05, 1.22], [0, .77, 0], M.dark);
    // Ventilation slots
    for (let i = 0; i < 9; i++) box(g, [.045, .035, .7], [-.78 + i * .195, .81, 0], M.blue);
    // Corner bolts
    for (const x of [-.92, .92]) for (const z of [-.55, .55]) bolt(g, [x, .79, z]);
    // Side connector block
    box(g, [.14, .45, .5], [1.32, -.1, 0], M.dark);
    for (let i = 0; i < 3; i++) cyl(g, .09, .09, .22, [1.42, -.1, -.16 + i * .16], M.gold, 24, [0, 0, Math.PI / 2]);
    // Base rim
    box(g, [2.25, .12, .12], [0, -.65, .84], M.dark);
    // Additional detail: cooling fins on rear
    for (let i = 0; i < 6; i++) box(g, [.04, .5, .04], [-1.15 + i * .07, .1, -.86], M.steel);
    // Branding plate
    box(g, [.6, .18, .02], [0, .35, .84], M.gold);
  }

  // ---- Production Template Pack ----
  function template(g) {
    const s = new THREE.Shape();
    s.moveTo(-1.5, -.85); s.lineTo(1.35, -.85); s.lineTo(1.5, -.55);
    s.lineTo(1.5, .55); s.lineTo(1.2, .85); s.lineTo(-1.5, .85); s.closePath();
    const h = new THREE.Path();
    h.absellipse(-.85, 0, .22, .22, 0, Math.PI * 2, true, 0);
    s.holes.push(h);
    const plate = new THREE.Mesh(
      new THREE.ExtrudeGeometry(s, { depth: .045, bevelEnabled: true, bevelSegments: 2, bevelSize: .025, bevelThickness: .025 }),
      M.gold
    );
    plate.rotation.x = -Math.PI / 2; plate.position.y = -.2; plate.castShadow = true; g.add(plate);
    // Guide rails
    for (let i = 0; i < 5; i++) box(g, [.025, .025, 1.1], [-.95 + i * .45, -.12, 0], M.steel);
    // Alignment pins
    for (const x of [-1.25, 1.25]) for (const z of [-.6, .6]) {
      cyl(g, .05, .05, .18, [x, -.08, z], M.steel, 16);
    }
    // Registration tabs
    for (const x of [-.9, .9]) box(g, [.2, .04, .1], [x, -.05, .72], M.blue);
    // Corner notches
    for (const x of [-1.35, 1.35]) for (const z of [-.75, .75]) box(g, [.08, .02, .08], [x, -.17, z], M.dark);
  }

  // ---- Detailed Part Drawing (technical) ----
  function drawing(g) {
    // Base plate representing the drawing sheet
    box(g, [3.6, .06, 2.35], [0, -.15, 0], M.dark);
    const lm = new THREE.MeshBasicMaterial({ color: '#9bd1ff' });
    const line = (x1, z1, x2, z2, w = .012) => {
      const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz);
      const o = new THREE.Mesh(new THREE.BoxGeometry(l, .012, w), lm);
      o.position.set((x1 + x2) / 2, -.105, (z1 + z2) / 2);
      o.rotation.y = -Math.atan2(dz, dx); g.add(o);
    };
    // Orthographic views
    [[-1.35, -.45, -.15, -.45], [-1.35, .45, -.15, .45], [-1.35, -.45, -1.35, .45], [-.15, -.45, -.15, .45],
     [.2, -.45, 1.35, -.45], [.2, .45, 1.35, .45], [.2, -.45, .2, .45], [1.35, -.45, 1.35, .45],
     [-1.35, .75, -.15, .75], [.2, .75, 1.35, .75]].forEach(a => line(...a));
    // Center lines (dashed)
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) line(-1.35 + i * .1, -.9, -1.35 + i * .1, .9, .006);
    }
    // Dimension arrows
    const am = new THREE.MeshBasicMaterial({ color: '#ffb454' });
    for (const [x, z] of [[-1.35, -.55], [-.15, -.55], [.2, -.55], [1.35, -.55]]) {
      const a = new THREE.Mesh(new THREE.ConeGeometry(.04, .12, 8), am);
      a.position.set(x, -.1, z); a.rotation.x = Math.PI / 2; g.add(a);
    }
    // Title block
    box(g, [1.2, .02, .35], [1.1, -.1, .9], M.white);
    for (let i = 0; i < 3; i++) line(.55 + i * .35, .75, .55 + i * .35, 1.05, .008);
    // Hole callouts
    for (const [x, z] of [[-.85, .2], [.85, -.2]]) {
      cyl(g, .12, .12, .02, [x, -.1, z], M.steel, 24);
      cyl(g, .06, .06, .03, [x, -.09, z], M.dark, 16);
    }
  }

  // ---- Exploded View Package ----
  function exploded(g) {
    // Base
    box(g, [2.6, .18, 1.6], [0, -.8, 0], M.cast);
    // Exploded stack of parts
    box(g, [2.2, .15, 1.3], [0, -.45, 0], M.dark);
    box(g, [2.0, .12, 1.15], [0, -.15, 0], M.steel);
    box(g, [1.7, .1, .95], [0, .15, 0], M.blue);
    box(g, [1.4, .08, .75], [0, .42, 0], M.gold);
    // Exploded fasteners
    for (const x of [-.85, .85]) for (const z of [-.5, .5]) {
      cyl(g, .07, .07, .3, [x, .65, z], M.steel, 16);
      cyl(g, .1, .1, .06, [x, .82, z], M.gold, 16);
    }
    // Connecting dashed lines (thin cylinders)
    const lm = new THREE.MeshBasicMaterial({ color: '#5a8bb0', transparent: true, opacity: .5 });
    for (const [x, z] of [[-.85, -.5], [.85, -.5], [-.85, .5], [.85, .5]]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, 1.5, 6), lm);
      l.position.set(x, -.05, z); g.add(l);
    }
    // Balloons
    for (let i = 0; i < 4; i++) {
      const b = new THREE.Mesh(new THREE.TorusGeometry(.08, .012, 6, 20), M.gold);
      b.position.set(-1.4 + i * .35, .3 + (i % 2) * .3, .9); g.add(b);
    }
  }

  // ---- Nesting Template Layout ----
  function nesting(g) {
    // Base sheet
    box(g, [3.2, .04, 2.0], [0, -.15, 0], M.dark);
    // Nested parts (various shapes)
    const shapes = [
      { s: [.9, .04, .5], p: [-.95, -.08, -.5], m: M.cast },
      { s: [.7, .04, .4], p: [-.95, -.08, .15], m: M.gold },
      { s: [.6, .04, .55], p: [-.95, -.08, .65], m: M.blue },
      { s: [.55, .04, .55], p: [.0, -.08, -.55], m: M.steel },
      { s: [.5, .04, .5], p: [.05, -.08, .1], m: M.green },
      { s: [.45, .04, .4], p: [.1, -.08, .6], m: M.orange },
      { s: [.5, .04, .6], p: [.9, -.08, -.5], m: M.copper },
      { s: [.4, .04, .5], p: [.95, -.08, .1], m: M.cast },
      { s: [.55, .04, .45], p: [.9, -.08, .65], m: M.gold },
    ];
    shapes.forEach(({ s, p, m }) => box(g, s, p, m));
    // Cutout holes
    for (const [x, z] of [[-.95, -.35], [.0, -.3], [.9, -.35], [.95, .3]]) {
      cyl(g, .09, .09, .06, [x, -.06, z], M.rubber, 20);
    }
    // Material boundary
    const bm = new THREE.MeshBasicMaterial({ color: '#4fae7a' });
    const edges = [
      [-1.55, -0.95, 1.55, -0.95], [1.55, -0.95, 1.55, 0.95],
      [1.55, 0.95, -1.55, 0.95], [-1.55, 0.95, -1.55, -0.95]
    ];
    edges.forEach(([x1, z1, x2, z2]) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(Math.hypot(x2 - x1, z2 - z1), .012, .012), bm);
      l.position.set((x1 + x2) / 2, -.09, (z1 + z2) / 2);
      l.rotation.y = -Math.atan2(z2 - z1, x2 - x1); g.add(l);
    });
  }

  // ---- Modular Bracket Assembly (new, more realistic) ----
  function bracketAssembly(g) {
    // Base plate
    box(g, [2.4, .2, 1.6], [0, -.75, 0], M.cast);
    for (const x of [-.9, .9]) for (const z of [-.55, .55]) bolt(g, [x, -.62, z], .07);
    // Vertical columns
    for (const x of [-.85, .85]) {
      box(g, [.3, 1.4, .3], [x, .05, 0], M.steel);
      box(g, [.42, .1, .42], [x, -.55, 0], M.dark);
      box(g, [.42, .1, .42], [x, .75, 0], M.dark);
    }
    // Cross bar
    box(g, [2.0, .22, .26], [0, .75, 0], M.dark);
    // Sliding carriage
    box(g, [.7, .5, .9], [0, .42, 0], M.gold);
    box(g, [.9, .12, 1.0], [0, .7, 0], M.cast);
    // Bearings
    for (const z of [-.35, .35]) cyl(g, .1, .1, .7, [0, .42, z], M.steel, 24, [Math.PI / 2, 0, 0]);
    // Lead screw
    cyl(g, .07, .07, 1.8, [0, .2, 0], M.steel, 20);
    for (let i = 0; i < 14; i++) torus(g, .08, .012, [0, -.55 + i * .12, 0], M.copper, [Math.PI / 2, 0, 0], 20);
    // Handwheel
    cyl(g, .22, .22, .06, [0, -.85, 0], M.dark, 32);
    for (let i = 0; i < 4; i++) {
      const h = box(g, [.5, .05, .08], [0, -.85, 0], M.gold);
      h.rotation.y = i * Math.PI / 2;
    }
    cyl(g, .06, .06, .3, [0, -1.0, 0], M.steel, 16);
    // Side support brackets
    for (const x of [-.85, .85]) {
      const br = box(g, [.1, .6, .5], [x * 1.1, .0, 0], M.green);
      br.rotation.z = x > 0 ? -.3 : .3;
    }
    // Mounting tabs
    for (const x of [-1.2, 1.2]) box(g, [.2, .08, .5], [x, -.62, 0], M.orange);
  }

  /* ============================================================
     SCENE FACTORY
     ============================================================ */
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

  function makeScene(canvas, type, hero = false) {
    if (!canvas) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(hero ? '#101d2b' : '#102033');
    scene.fog = new THREE.Fog(scene.background, 8, 18);
    const camera = new THREE.PerspectiveCamera(hero ? 36 : 34, 1, .1, 100);
    camera.position.set(4.6, 3.1, 5.5);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    scene.add(new THREE.HemisphereLight(0xc9e3ff, 0x263342, 2));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(4, 7, 5); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0x69aaff, 2.1);
    rim.position.set(-5, 3, -4); scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: '#101b28', roughness: .7 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.02; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(12, 24, 0x34516b, 0x20374d);
    grid.position.y = -1.005; scene.add(grid);

    const model = buildModel(type, type === 'assembly');
    scene.add(model);

    let controls = null;
    if (hero) {
      controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true; controls.dampingFactor = .055;
      controls.minDistance = 3.5; controls.maxDistance = 9;
      controls.maxPolarAngle = Math.PI * .49;
      controls.target.set(0, 0, 0);
      controls.autoRotate = !reduced; controls.autoRotateSpeed = .75;
    } else {
      camera.position.set(4.2, 2.8, 5.2);
      if (['template', 'nesting', 'drawing'].includes(type)) {
        camera.position.set(0, 4.8, .01);
      }
      camera.lookAt(0, 0, 0);
      model.rotation.y = -.25;
    }

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();

    let frame;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls?.update();
      if (!hero && !reduced && ['housing', 'assembly'].includes(type)) model.rotation.y += .0025;
      renderer.render(scene, camera);
    };
    render();

    return () => { cancelAnimationFrame(frame); ro.disconnect(); renderer.dispose(); };
  }

  const cleanup = [];
  const heroCleanup = makeScene($('#heroModel'), 'vise', true);
  if (heroCleanup) cleanup.push(heroCleanup);
  $$('.project-model').forEach(c => {
    const stop = makeScene(c, c.dataset.model);
    if (stop) cleanup.push(stop);
  });

  /* ============================================================
     PROJECT DETAIL MODAL
     ============================================================ */
  const PROJECTS = {
    housing: {
      title: 'Packaging Component Set',
      category: 'Product Design',
      kicker: 'PRODUCT · DFM',
      description: 'A modular product housing system designed for efficient assembly and material optimization. The housing features a recessed lid with ventilation slots, a dedicated side connector block for wiring pass-through, and a reinforced base rim that allows snap-fit assembly without fasteners. Internal cooling fins manage heat dissipation in enclosed environments.',
      specs: [
        'Dimensions: 250 × 165 × 125 mm',
        'Material: Glass-filled nylon (PA66-GF30)',
        'Process: Injection moulding',
        'Tolerance: ±0.15 mm on mating surfaces',
      ],
      tags: ['SolidWorks', 'DFM', 'Injection Moulding', 'Snap-fit'],
      model: 'housing',
    },
    template: {
      title: 'Production Template Pack',
      category: 'Template',
      kicker: 'TEMPLATE · PRECISION',
      description: 'A precision production template used to align and locate components during fabrication. The plate is CNC-machined from aluminium tooling plate and features hardened guide rails, alignment pins, and registration tabs. The central elliptical cut-out provides clearance for a rotating shaft assembly, while corner notches ensure correct orientation on the fixture table.',
      specs: [
        'Dimensions: 300 × 170 × 12 mm',
        'Material: 6082-T6 aluminium tooling plate',
        'Process: CNC milling',
        'Flatness: 0.05 mm over full length',
      ],
      tags: ['AutoCAD', 'Templating', 'CNC', 'Fixtures'],
      model: 'template',
    },
    drawing: {
      title: 'Detailed Part Drawing',
      category: 'Technical Drawing',
      kicker: 'DRAWING · GD&T',
      description: 'A full production drawing set for a machined component, including orthographic views, section cuts, and a title block with revision history. Dimensions and tolerances are specified per ISO 2768-mK, with geometric tolerancing (GD&T) applied to critical features. Hole callouts reference standard fastener sizes.',
      specs: [
        'Sheet size: A2 (420 × 594 mm)',
        'Standards: ISO 2768-mK, ASME Y14.5',
        'Views: Front, top, right, isometric',
        'Tolerances: ±0.1 mm general, ±0.02 mm critical',
      ],
      tags: ['AutoCAD', 'GD&T', 'ISO 2768', 'Production'],
      model: 'drawing',
    },
    assembly: {
      title: 'Multi-Part Assembly',
      category: 'Assembly',
      kicker: 'ASSEMBLY · MOTION',
      description: 'A multi-part mechanical assembly consisting of a base plate, twin vertical columns, a sliding carriage, lead screw, and handwheel. The assembly is modelled with proper mate relationships (concentric, coincident, and limit mates) to simulate the carriage travel. The lead screw uses a helical thread representation for realistic motion studies.',
      specs: [
        'Parts: 14 unique components',
        'Materials: Steel, aluminium, bronze',
        'Motion: 120 mm carriage travel',
        'Mates: Concentric, coincident, limit',
      ],
      tags: ['SolidWorks', 'Assembly', 'Motion Study', 'Mate Relationships'],
      model: 'assembly',
    },
    exploded: {
      title: 'Exploded View Package',
      category: 'Technical Drawing',
      kicker: 'DOCUMENTATION · EXPLODED',
      description: 'An exploded assembly drawing with item balloons and a parts list, used for production documentation and assembly instructions. Each component is separated along its assembly axis with dashed leader lines connecting the exploded positions. Balloons reference the bill of materials for traceability.',
      specs: [
        'Format: A3 exploded isometric',
        'Balloons: 4 item references',
        'Parts list: 8 line items',
        'Standards: ASME Y14.34',
      ],
      tags: ['SolidWorks', 'Documentation', 'BOM', 'Exploded View'],
      model: 'exploded',
    },
    nesting: {
      title: 'Nesting Template Layout',
      category: 'Template',
      kicker: 'TEMPLATE · NESTING',
      description: 'An optimized nesting layout that arranges multiple part blanks on a single sheet to maximize material yield and reduce waste. Parts are rotated and packed using a heuristic nesting algorithm, with cut-out holes pre-drilled for downstream operations. The material boundary is shown in green.',
      specs: [
        'Sheet size: 320 × 200 mm',
        'Parts nested: 9 unique blanks',
        'Material yield: 87%',
        'Process: Laser cutting',
      ],
      tags: ['AutoCAD', 'Templating', 'Nesting', 'Laser Cutting'],
      model: 'nesting',
    },
  };

  const modal = $('#projectModal');
  const modalBackdrop = $('#modalBackdrop');
  const modalClose = $('#modalClose');
  const modalCanvas = $('#modalModel');
  const modalTitle = $('#modalTitle');
  const modalKicker = $('#modalKicker');
  const modalDesc = $('#modalDescription');
  const modalSpecs = $('#modalSpecs');
  const modalTags = $('#modalTags');

  let modalCleanup = null;
  let modalOpen = false, modalTok = 0, modalApi = null;

  function openProjectModal(projectId) {
    const data = PROJECTS[projectId] || (window.PF?.dyn || {})[projectId];
    if (!data) return;

    // Populate text
    modalTitle.textContent = data.title;
    modalKicker.textContent = data.kicker;
    modalDesc.textContent = data.description;
    modalSpecs.innerHTML = data.specs.map(s => `<div class="modal-spec">${esc(s)}</div>`).join('');
    modalTags.innerHTML = data.tags.map(t => `<span>${esc(t)}</span>`).join('');

    // Show modal
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('open'));
    modalOpen = true;
    document.body.style.overflow = 'hidden';

    // Build modal 3D scene after layout so canvas has dimensions
    requestAnimationFrame(() => startModalViewer(data));
  }

  function closeProjectModal() {
    if (!modalOpen) return;
    modal.classList.remove('open');
    modalOpen = false; modalTok++;
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
      if (modalCleanup) { modalCleanup(); modalCleanup = null; }
    }, 280);
  }

  // Sample projects -> procedural model; admin projects -> GLB streamed from the database (or cover image)
  async function startModalViewer(data) {
    const tok = ++modalTok;
    if (modalCleanup) { modalCleanup(); modalCleanup = null; }
    const load = $('#modalLoad'), cover = $('#modalCover'), tools = $('#viewerTools'), dims = $('#viewerDims');
    cover.hidden = load.hidden = tools.hidden = dims.hidden = true;
    modalCanvas.style.visibility = 'visible';
    $$('[data-v]', tools).forEach(b => b.classList.toggle('on', b.dataset.v === 'spin' && !reduced));
    if (data.modelId) {
      load.hidden = false; $('span', load).textContent = 'LOADING MODEL…'; load.style.setProperty('--p', 0);
      try {
        const buf = await window.PF.fetchModel(data.modelId, p => load.style.setProperty('--p', p));
        const obj = await parseGLB(buf);
        if (tok !== modalTok || !modalOpen) return;
        const { group, dims: d } = fit(obj);
        modalCleanup = makeModalScene(modalCanvas, null, group);
        tools.hidden = dims.hidden = false;
        dims.textContent = `BBOX  ${d.x.toFixed(2)} × ${d.y.toFixed(2)} × ${d.z.toFixed(2)}  (model units)`;
      } catch (err) { console.warn(err); if (tok === modalTok) $('span', load).textContent = 'Could not load the 3D model'; return; }
      load.hidden = true;
    } else if (data.cover) {
      modalCanvas.style.visibility = 'hidden'; cover.src = data.cover; cover.hidden = false;
    } else if (data.model) {
      modalCleanup = makeModalScene(modalCanvas, data.model);
    }
  }

  $('#viewerTools')?.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !modalApi) return;
    const a = modalApi, v = b.dataset.v;
    if (v === 'wire') { b.classList.toggle('on'); a.model.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { m.wireframe = b.classList.contains('on'); }); }); }
    if (v === 'box') { b.classList.toggle('on'); if (!a.box) { a.box = new THREE.BoxHelper(a.model, 0xffb454); a.scene.add(a.box); } a.box.visible = b.classList.contains('on'); }
    if (v === 'spin') { b.classList.toggle('on'); a.controls.autoRotate = b.classList.contains('on'); }
    if (v === 'reset') { a.camera.position.copy(a.home); a.controls.target.set(0, 0, 0); a.controls.update(); }
  });

  function makeModalScene(canvas, type, custom) {
    if (!canvas) return null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0d1a28');
    scene.fog = new THREE.Fog(scene.background, 9, 20);

    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    // True isometric-ish view: 45° azimuth, 35.264° elevation
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
    renderer.toneMappingExposure = 1.2;

    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x1d2a38, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(5, 8, 6); key.castShadow = true; scene.add(key);
    const rim = new THREE.DirectionalLight(0x6aa8ff, 2.0);
    rim.position.set(-6, 4, -5); scene.add(rim);
    const fill = new THREE.DirectionalLight(0xffd9a0, .6);
    fill.position.set(-3, -2, 4); scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: '#0f1a26', roughness: .75 })
    );
    floor.rotation.x = -Math.PI / 2; floor.position.y = -1.02; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(14, 28, 0x3c5a78, 0x22384f);
    grid.position.y = -1.005; scene.add(grid);

    const model = custom || buildModel(type, false);
    scene.add(model);

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = .06;
    controls.minDistance = 3.5;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI * .49;
    controls.target.set(0, 0, 0);
    controls.autoRotate = !reduced;
    controls.autoRotateSpeed = 1.1;
    controls.update();
    modalApi = { scene, camera, controls, model, home: camera.position.clone(), box: null };

    const resize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    resize();

    let frame;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => { cancelAnimationFrame(frame); ro.disconnect(); controls.dispose(); if (custom) disposeObject(custom); modalApi = null; renderer.dispose(); };
  }

  // Card click handlers
  $$('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.project;
      if (id) openProjectModal(id);
    });
  });

  window.PF = window.PF || {}; window.PF.open = openProjectModal;
  modalClose?.addEventListener('click', closeProjectModal);
  modalBackdrop?.addEventListener('click', closeProjectModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProjectModal(); });

  $('#contactForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();
    const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    location.href = `mailto:justine.nagrampa@example.com?subject=${subject}&body=${body}`;
  });

  // Progressive enhancement
  document.body.classList.add('js-enabled');
});

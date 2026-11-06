import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const navbar=$('#navbar'), navToggle=$('#navToggle'), navLinks=$('#navLinks');
  const scroll=()=>navbar?.classList.toggle('scrolled',scrollY>40);
  addEventListener('scroll',scroll,{passive:true}); scroll();
  navToggle?.addEventListener('click',()=>{
    navToggle.classList.toggle('active'); navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded',String(navToggle.classList.contains('active')));
  });
  $$('#navLinks a').forEach(a=>a.addEventListener('click',()=>{
    navToggle.classList.remove('active');navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded','false');
  }));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{
      if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}
    }),{threshold:.1,rootMargin:'0px 0px -30px 0px'});
    $$('.reveal').forEach(el=>io.observe(el));
  } else $$('.reveal').forEach(el=>el.classList.add('visible'));

  $$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.filter-btn').forEach(b=>b.classList.toggle('active',b===btn));
    $$('.project-card').forEach(card=>card.classList.toggle('hidden',
      btn.dataset.filter!=='all' && card.dataset.category!==btn.dataset.filter));
  }));

  const M={
    cast:new THREE.MeshStandardMaterial({color:'#55738c',metalness:.68,roughness:.32}),
    dark:new THREE.MeshStandardMaterial({color:'#263d52',metalness:.7,roughness:.34}),
    steel:new THREE.MeshStandardMaterial({color:'#b9c9d7',metalness:.9,roughness:.22}),
    gold:new THREE.MeshStandardMaterial({color:'#d99c52',metalness:.7,roughness:.28}),
    rubber:new THREE.MeshStandardMaterial({color:'#17232e',roughness:.82}),
    blue:new THREE.MeshStandardMaterial({color:'#8fb7d5',metalness:.6,roughness:.3})
  };
  function box(g,s,p,m){const o=new THREE.Mesh(new THREE.BoxGeometry(...s),m);o.position.set(...p);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
  function cyl(g,r1,r2,h,p,m,n=32,rot=[0,0,0]){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),m);o.position.set(...p);o.rotation.set(...rot);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
  function bolt(g,p,r=.06){cyl(g,r,r,.035,p,M.steel,8,[Math.PI/2,0,0]);}
  function vise(g,exploded=false){
    box(g,[2.65,.28,1.65],[0,-.82,0],M.cast);
    box(g,[2.35,.12,1.42],[0,-.63,0],M.dark);
    cyl(g,.82,.82,.18,[0,-.48,0],M.steel,64);
    cyl(g,.69,.69,.12,[0,-.35,0],M.cast,64);
    for(const x of [-1,1])for(const z of [-.55,.55]){cyl(g,.18,.18,.16,[x*1.02,-.83,z],M.dark);cyl(g,.075,.075,.02,[x*1.02,-.73,z],M.rubber);}
    box(g,[.62,1.35,.72],[-.72,.25,0],M.cast);
    box(g,[.86,.24,1.03],[-.72,.99,0],M.dark);
    box(g,[.08,.86,.82],[-.24,.99,0],M.steel);
    for(let i=0;i<7;i++)box(g,[.025,.035,.82],[-.19,.62+i*.12,0],M.dark);
    const shift=exploded?.5:.16;
    box(g,[.75,.92,.86],[.53+shift,.82,0],M.cast);
    box(g,[.09,.78,.82],[.94+shift,.88,0],M.gold);
    for(let i=0;i<6;i++)box(g,[.02,.035,.82],[.995+shift,.57+i*.12,0],M.dark);
    box(g,[1.9,.22,.26],[.18,-.1,0],M.dark);
    box(g,[1.9,.22,.26],[.18,.08,0],M.blue);
    cyl(g,.105,.105,2.25,[.18,-.38,0],M.steel,32,[0,0,Math.PI/2]);
    for(let i=0;i<17;i++){const t=new THREE.Mesh(new THREE.TorusGeometry(.115,.016,6,24),M.gold);t.rotation.y=Math.PI/2;t.position.set(-.88+i*.13,-.38,0);g.add(t);}
    cyl(g,.23,.23,.18,[1.35,-.38,0],M.dark,40,[0,0,Math.PI/2]);
    cyl(g,.13,.13,.22,[1.48,-.38,0],M.steel,32,[0,0,Math.PI/2]);
    cyl(g,.065,.065,1.18,[1.63,-.38,0],M.steel,24,[0,0,Math.PI/2]);
    for(const z of [-.53,.53])cyl(g,.105,.105,.22,[1.63,-.38,z],M.rubber,32,[0,0,Math.PI/2]);
    for(const x of [-.95,-.49])for(const z of [-.32,.32])bolt(g,[x,1,z],.055);
    for(const side of [-1,1]){const rib=box(g,[.12,.78,.12],[-.72+side*.31,.2,side*.37],M.dark);rib.rotation.z=side*.13;}
  }
  function makeScene(canvas,type,hero=false){
    if(!canvas)return;
    const scene=new THREE.Scene();scene.background=new THREE.Color(hero?'#101d2b':'#102033');
    scene.fog=new THREE.Fog(scene.background,8,18);
    const camera=new THREE.PerspectiveCamera(hero?36:34,1,.1,100);camera.position.set(4.6,3.1,5.5);
    const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
    scene.add(new THREE.HemisphereLight(0xc9e3ff,0x263342,2));
    const key=new THREE.DirectionalLight(0xffffff,3.1);key.position.set(4,7,5);key.castShadow=true;scene.add(key);
    const rim=new THREE.DirectionalLight(0x69aaff,2.1);rim.position.set(-5,3,-4);scene.add(rim);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#101b28',roughness:.7}));
    floor.rotation.x=-Math.PI/2;floor.position.y=-1.02;floor.receiveShadow=true;scene.add(floor);
    const grid=new THREE.GridHelper(12,24,0x34516b,0x20374d);grid.position.y=-1.005;scene.add(grid);
    const model=new THREE.Group();scene.add(model);
    if(type==='vise'||type==='assembly')vise(model,type==='assembly');
    else if(type==='housing'){
      box(model,[2.5,1.25,1.65],[0,0,0],M.cast);box(model,[2.32,.12,1.48],[0,.68,0],M.steel);
      box(model,[2.05,.05,1.22],[0,.77,0],M.dark);
      for(let i=0;i<9;i++)box(model,[.045,.035,.7],[-.78+i*.195,.81,0],M.blue);
      for(const x of [-.92,.92])for(const z of [-.55,.55])bolt(model,[x,.79,z]);
      box(model,[.14,.45,.5],[1.32,-.1,0],M.dark);
      for(let i=0;i<3;i++)cyl(model,.09,.09,.22,[1.42,-.1,-.16+i*.16],M.gold,24,[0,0,Math.PI/2]);
      box(model,[2.25,.12,.12],[0,-.65,.84],M.dark);
    }else if(type==='template'||type==='nesting'){
      const s=new THREE.Shape();s.moveTo(-1.5,-.85);s.lineTo(1.35,-.85);s.lineTo(1.5,-.55);s.lineTo(1.5,.55);s.lineTo(1.2,.85);s.lineTo(-1.5,.85);s.closePath();
      const h=new THREE.Path();h.absellipse(-.85,0,.22,.22,0,Math.PI*2,true,0);s.holes.push(h);
      const plate=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.045,bevelEnabled:true,bevelSegments:2,bevelSize:.025,bevelThickness:.025}),M.gold);
      plate.rotation.x=-Math.PI/2;plate.position.y=-.2;plate.castShadow=true;model.add(plate);
      for(let i=0;i<5;i++)box(model,[.025,.025,1.1],[-.95+i*.45,-.12,0],M.steel);
      if(type==='nesting')for(let i=0;i<3;i++)box(model,[.48,.035,.48],[-.95+i*.9,-.08,.55],M.cast);
    }else{
      box(model,[3.6,.06,2.35],[0,-.15,0],M.dark);
      const lm=new THREE.MeshBasicMaterial({color:'#9bd1ff'});
      const line=(x1,z1,x2,z2)=>{const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz),o=new THREE.Mesh(new THREE.BoxGeometry(l,.012,.012),lm);o.position.set((x1+x2)/2,-.105,(z1+z2)/2);o.rotation.y=-Math.atan2(dz,dx);model.add(o);};
      [[-1.35,-.45,-.15,-.45],[-1.35,.45,-.15,.45],[-1.35,-.45,-1.35,.45],[-.15,-.45,-.15,.45],[.2,-.45,1.35,-.45],[.2,.45,1.35,.45],[.2,-.45,.2,.45],[1.35,-.45,1.35,.45],[-1.35,.75,-.15,.75],[.2,.75,1.35,.75]].forEach(a=>line(...a));
    }
    let controls=null;
    if(hero){controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=3.5;controls.maxDistance=9;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,0,0);controls.autoRotate=!reduced;controls.autoRotateSpeed=.75;}
    else{camera.position.set(4.2,2.8,5.2);if(['template','nesting','drawing'].includes(type))camera.position.set(0,4.8,.01);camera.lookAt(0,0,0);model.rotation.y=-.25;}
    const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
    const ro=new ResizeObserver(resize);ro.observe(canvas.parentElement);resize();
    let frame;const render=()=>{frame=requestAnimationFrame(render);controls?.update();if(!hero&&!reduced&&['housing','assembly'].includes(type))model.rotation.y+=.0025;renderer.render(scene,camera);};render();
    return()=>{cancelAnimationFrame(frame);ro.disconnect();renderer.dispose();};
  }
  const cleanup=[];
  const heroCleanup=makeScene($('#heroModel'),'vise',true);if(heroCleanup)cleanup.push(heroCleanup);
  $$('.project-model').forEach(c=>{const stop=makeScene(c,c.dataset.model);if(stop)cleanup.push(stop);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanup.forEach(fn=>fn());});

  const zone=$('#uploadZone'),input=$('#fileInput'),preview=$('#uploadPreview');
  $('#browseBtn')?.addEventListener('click',()=>input?.click());
  ['dragenter','dragover','dragleave','drop'].forEach(n=>zone?.addEventListener(n,e=>{e.preventDefault();e.stopPropagation();}));
  ['dragenter','dragover'].forEach(n=>zone?.addEventListener(n,()=>zone.classList.add('dragover')));
  ['dragleave','drop'].forEach(n=>zone?.addEventListener(n,()=>zone.classList.remove('dragover')));
  zone?.addEventListener('drop',e=>handleFiles(e.dataTransfer.files));
  input?.addEventListener('change',()=>handleFiles(input.files));
  function handleFiles(files){[...(files||[])].filter(f=>f.type.startsWith('image/')).forEach(file=>{
    const reader=new FileReader();reader.onload=()=>{const item=document.createElement('div');item.className='preview-item';
      const img=document.createElement('img');img.src=reader.result;img.alt=file.name;
      const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='×';remove.setAttribute('aria-label','Remove image');remove.onclick=()=>item.remove();
      item.append(img,remove);preview.append(item);};reader.readAsDataURL(file);
  });if(input)input.value='';}
  $('#contactForm')?.addEventListener('submit',e=>{e.preventDefault();
    const name=$('#name').value.trim(),email=$('#email').value.trim(),message=$('#message').value.trim();
    const subject=encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body=encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    location.href=`mailto:justine.nagrampa@example.com?subject=${subject}&body=${body}`;
  });
});

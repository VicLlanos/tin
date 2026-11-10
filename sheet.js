// "Technical drawing sheet" layer: frame with zone references, sheet tag, CAD crosshair.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frame = document.createElement('div');
frame.className = 'sheet-frame'; frame.setAttribute('aria-hidden', 'true');
frame.innerHTML = '<i class="zt">' + [1, 2, 3, 4, 5, 6, 7, 8].map(n => `<b>${n}</b>`).join('') + '</i><i class="zl">'
  + 'ABCDEF'.split('').map(c => `<b>${c}</b>`).join('') + '</i>';
document.body.append(frame);
requestAnimationFrame(() => document.body.classList.add('sheet-ready'));

// Sheet tag follows the section being read
const secs = [...document.querySelectorAll('header.hero, section.section')];
const tag = document.createElement('div');
tag.className = 'sheet-tag';
tag.innerHTML = `<span>SHEET <b id="stN">01</b>/${String(secs.length).padStart(2, '0')}</span><span id="stT">HOME</span><span>SCALE 1:1</span>`;
document.body.append(tag);
const names = { home: 'HOME', about: 'ABOUT', skills: 'SKILLS', experience: 'EXPERIENCE', work: 'PROJECTS', certs: 'CERTIFICATIONS', contact: 'CONTACT' };
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    $n.textContent = String(secs.indexOf(e.target) + 1).padStart(2, '0');
    $t.textContent = names[e.target.id] || e.target.id.toUpperCase();
  }), { threshold: .35 });
  var $n = tag.querySelector('#stN'), $t = tag.querySelector('#stT');
  secs.forEach(s => io.observe(s));
}

// CAD-style crosshair with coordinate read-out (mouse devices only)
if (matchMedia('(pointer: fine)').matches && !reduced) {
  const x = document.createElement('div');
  x.className = 'xhair'; x.setAttribute('aria-hidden', 'true');
  x.innerHTML = '<i class="h"></i><i class="v"></i><span></span>';
  document.body.append(x);
  const label = x.querySelector('span'); let raf = 0, px = 0, py = 0;
  addEventListener('mousemove', e => {
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(() => {
      raf = 0;
      x.style.transform = `translate(${px}px,${py}px)`;
      label.textContent = `X ${(px * .2646).toFixed(1)}  Y ${(py * .2646).toFixed(1)}`;
    });
  }, { passive: true });
  document.addEventListener('mouseleave', () => x.classList.remove('on'));
  document.addEventListener('mouseenter', () => x.classList.add('on'));
  addEventListener('mousemove', () => x.classList.add('on'), { once: true });
}

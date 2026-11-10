// Firebase (Auth + Realtime Database): public rendering + admin panel.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getDatabase, ref, onValue, get, set, push, remove } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js';
import { parseGLB, fit, makeThumb } from './glb.js';

const app = initializeApp({
  apiKey: 'AIzaSyD6f6xMhYF6lqKp7cqmeywqarL-_yRbm9E',
  authDomain: 'tine-54a9e.firebaseapp.com',
  databaseURL: 'https://tine-54a9e-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'tine-54a9e',
  storageBucket: 'tine-54a9e.firebasestorage.app',
  messagingSenderId: '898265691586',
  appId: '1:898265691586:web:d9684a5a401c32cf3a125b',
});
const auth = getAuth(app), db = getDatabase(app);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const lines = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
const safeUrl = u => (/^https?:\/\//i.test(u || '') ? u : '');
const MAX_GLB = 12 * 1024 * 1024;           // 12 MB per model (stored as chunked base64)
const CAT = { product: 'Product Design', template: 'Template', drawing: 'Technical Drawing', assembly: 'Assembly' };
const KICK = { product: 'PRODUCT', template: 'TEMPLATE', drawing: 'DRAWING', assembly: 'ASSEMBLY' };

const PF = (window.PF = window.PF || {});
PF.dyn = {};
let DATA = { experience: {}, certifications: {}, projects: {}, settings: {} };

const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
}), { threshold: .1 }) : null;
const reveal = el => (io ? io.observe(el) : el.classList.add('visible'));

/* ---------------- public rendering ---------------- */
const DEFAULT_EXP = { role: 'CAD Designer', company: 'ISHIP LOGIPACK INCORPORATED', location: '', start: '', end: '',
  summary: 'Product design and templating — turning concepts into clean, production-ready models and accurate templates.', bullets: [] };

function renderExperience() {
  const host = $('#expList'); if (!host) return;
  const list = Object.entries(DATA.experience).map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => String(b.start || '').localeCompare(String(a.start || '')) || (b.ts || 0) - (a.ts || 0));
  const rows = list.length ? list : [DEFAULT_EXP];
  host.innerHTML = `<div class="rev-head"><span>REV</span><span>PERIOD</span><span>DESCRIPTION</span></div>` + rows.map((e, i) => `
    <div class="rev-row reveal" style="transition-delay:${i * .08}s">
      <div class="rev-no">${String.fromCharCode(65 + Math.min(rows.length - 1 - i, 25))}</div>
      <div class="rev-period">${esc(e.start || '—')}<br><i>▼</i><br>${esc(e.end || 'PRESENT')}</div>
      <div class="rev-main"><h3>${esc(e.role)}</h3>
        <div class="rev-org">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</div>
        ${e.summary ? `<p>${esc(e.summary)}</p>` : ''}
        ${e.bullets?.length ? `<ul>${[].concat(e.bullets).map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>
    </div>`).join('');
  host.querySelectorAll('.reveal').forEach(reveal);
}

function renderCerts() {
  const host = $('#certList'); if (!host) return;
  const list = Object.entries(DATA.certifications).map(([id, c]) => ({ id, ...c })).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  host.innerHTML = list.length ? list.map((c, i) => {
    const url = safeUrl(c.url);
    return `<article class="cert reveal" style="transition-delay:${i * .06}s">
      <div class="cert-stamp">✓<small>CERT</small></div>
      <h3>${esc(c.name)}</h3><div class="cert-issuer">${esc(c.issuer)}</div>
      <div class="cert-meta">${c.date ? 'ISSUED ' + esc(c.date) : ''}${c.credId ? ' · ID ' + esc(c.credId) : ''}</div>
      ${url ? `<a class="cert-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Verify ↗</a>` : ''}</article>`;
  }).join('') : '<p class="empty-note">Certifications will be listed here.</p>';
  host.querySelectorAll('.reveal').forEach(reveal);
}

function renderProjects() {
  const gallery = $('#gallery'); if (!gallery) return;
  gallery.querySelectorAll('.dyn').forEach(n => n.remove());
  PF.dyn = {};
  const list = Object.entries(DATA.projects).map(([id, p]) => ({ id, ...p })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const frag = document.createDocumentFragment();
  list.forEach((p, i) => {
    const key = 'db:' + p.id, cat = CAT[p.category] ? p.category : 'product';
    PF.dyn[key] = { title: p.title, category: CAT[cat], kicker: KICK[cat] + (p.modelId ? ' · 3D' : ''), description: p.description || '',
      specs: [].concat(p.specs || []), tags: [].concat(p.tags || []), modelId: p.modelId || null, cover: p.cover || null };
    const a = document.createElement('article');
    a.className = 'project-card reveal dyn'; a.dataset.category = cat; a.dataset.project = key;
    a.style.transitionDelay = (i % 6) * .05 + 's';
    const cover = (p.cover || '').startsWith('data:image/') ? `<img class="cover" src="${p.cover}" alt="${esc(p.title)}" loading="lazy">` : '<div class="cover-ph">NO PREVIEW</div>';
    a.innerHTML = `<div class="project-visual model-visual">${cover}${p.modelId ? '<span class="badge3d">3D · GLB</span>' : ''}
      <div class="project-overlay"><span class="project-tag">${esc(CAT[cat])}</span></div></div>
      <div class="project-info"><h3>${esc(p.title)}</h3><p>${esc((p.description || '').slice(0, 130))}${(p.description || '').length > 130 ? '…' : ''}</p>
      <div class="project-meta">${[].concat(p.tags || []).slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}</div></div>`;
    a.addEventListener('click', () => PF.open?.(key));
    frag.append(a); reveal(a);
  });
  gallery.prepend(frag);
  const showSamples = DATA.settings.showSamples ?? list.length === 0;
  gallery.classList.toggle('hide-samples', !showSamples);
  $('.filter-btn.active')?.click();
}

const renderAll = () => { renderExperience(); renderCerts(); renderProjects(); if (admOpen) renderAdm(); };
onValue(ref(db, 'portfolio'), snap => {
  const v = snap.val() || {};
  DATA = { experience: v.experience || {}, certifications: v.certifications || {}, projects: v.projects || {}, settings: v.settings || {} };
  renderAll();
}, err => { console.warn('Portfolio read failed:', err.message); renderExperience(); renderCerts(); });

/* ---------------- GLB storage in RTDB (chunked base64) ---------------- */
PF.fetchModel = async (id, onP) => {
  const meta = (await get(ref(db, `models/${id}/meta`))).val();
  if (!meta) throw new Error('Model data not found');
  let done = 0;
  const parts = await Promise.all(Array.from({ length: meta.n }, (_, i) =>
    get(ref(db, `models/${id}/c/${i}`)).then(s => { onP?.(++done / meta.n); return s.val() || ''; })));
  const out = new Uint8Array(meta.size); let o = 0;
  for (const p of parts) { const bin = atob(p); for (let i = 0; i < bin.length; i++) out[o++] = bin.charCodeAt(i); }
  return out.buffer;
};

async function uploadModel(id, buf, onP) {
  const CH = 192 * 1024, n = Math.ceil(buf.byteLength / CH), u8 = new Uint8Array(buf);
  await remove(ref(db, `models/${id}`));
  for (let i = 0; i < n; i += 4) {
    await Promise.all([...Array(Math.min(4, n - i))].map((_, k) => {
      const s = u8.subarray((i + k) * CH, (i + k + 1) * CH); let b = '';
      for (let j = 0; j < s.length; j += 0x8000) b += String.fromCharCode.apply(null, s.subarray(j, j + 0x8000));
      return set(ref(db, `models/${id}/c/${i + k}`), btoa(b));
    }));
    onP(Math.min(1, (i + 4) / n));
  }
  await set(ref(db, `models/${id}/meta`), { n, size: buf.byteLength, ts: Date.now() });   // written last = upload complete
}

async function imageToJpeg(file, maxW = 640) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxW / bmp.width), c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', .8);
}

/* ---------------- admin panel ---------------- */
const SCHEMA = {
  experience: { title: 'Experience', label: e => `${e.role} — ${e.company}`, fields: [
    ['role', 'Role / title', 't'], ['company', 'Company', 't'], ['location', 'Location', 't'],
    ['start', 'Start (YYYY-MM)', 't'], ['end', 'End (blank = Present)', 't'],
    ['summary', 'Summary', 'a'], ['bullets', 'Highlights — one per line', 'a']] },
  certifications: { title: 'Certifications', label: e => `${e.name} — ${e.issuer}`, fields: [
    ['name', 'Certification name', 't'], ['issuer', 'Issuer', 't'], ['date', 'Date issued', 't'],
    ['credId', 'Credential ID', 't'], ['url', 'Verify URL (https://…)', 't']] },
  projects: { title: 'Projects', label: e => e.title, fields: [
    ['title', 'Project title', 't'], ['category', 'Category', 's'], ['description', 'Description', 'a'],
    ['specs', 'Specs — one per line', 'a'], ['tags', 'Tags — comma separated', 't']] },
};
let adm, admOpen = false, tab = 'experience', editId = null, busy = false, isAdmin = false;

function buildAdm() {
  adm = document.createElement('aside');
  adm.id = 'adm'; adm.setAttribute('role', 'dialog'); adm.setAttribute('aria-label', 'Admin');
  adm.innerHTML = '<div class="adm-back"></div><div class="adm-sheet"><button class="adm-x" aria-label="Close">×</button><div class="adm-body"></div></div>';
  document.body.append(adm);
  adm.querySelector('.adm-back').onclick = adm.querySelector('.adm-x').onclick = () => toggleAdm(false);
  adm.addEventListener('submit', onSubmit);
  adm.addEventListener('click', onClick);
}
function toggleAdm(on) {
  if (!adm) buildAdm();
  admOpen = on; adm.classList.toggle('open', on); document.body.style.overflow = on ? 'hidden' : '';
  if (on) renderAdm();
}
const msg = (t, bad) => { const m = $('#admMsg', adm); if (m) { m.textContent = t; m.className = bad ? 'bad' : ''; } };

function renderAdm() {
  const body = $('.adm-body', adm);
  if (!isAdmin) {
    body.innerHTML = `<div class="adm-kick">REV. A · RESTRICTED</div><h3>Admin sign-in</h3>
      <form data-form="login"><label>Email<input name="email" type="email" required autocomplete="username"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
      <button class="btn btn-primary btn-full">Sign in</button></form><p id="admMsg"></p>`;
    return;
  }
  const tabs = ['experience', 'certifications', 'projects', 'settings'];
  let html = `<div class="adm-kick">ADMIN · ${esc(auth.currentUser?.email || '')}</div>
    <div class="adm-tabs">${tabs.map(t => `<button data-tab="${t}" class="${t === tab ? 'on' : ''}">${t === 'settings' ? 'Settings' : SCHEMA[t].title}</button>`).join('')}</div>`;
  if (tab === 'settings') {
    const show = DATA.settings.showSamples ?? Object.keys(DATA.projects).length === 0;
    html += `<label class="chk"><input type="checkbox" id="optSamples" ${show ? 'checked' : ''}> Show the built-in sample projects in the gallery</label>
      <button class="btn btn-outline" data-act="signout">Sign out</button><p id="admMsg"></p>`;
  } else {
    const S = SCHEMA[tab], items = Object.entries(DATA[tab]);
    const cur = editId ? DATA[tab][editId] || {} : {};
    html += `<ul class="adm-list">${items.map(([id, e]) => `<li><span>${esc(S.label(e))}</span>
      <button data-act="edit" data-id="${id}">Edit</button><button data-act="del" data-id="${id}" class="danger">Delete</button></li>`).join('') || '<li class="muted">Nothing yet.</li>'}</ul>
      <form data-form="${tab}"><h4>${editId ? 'Edit entry' : 'Add new'}</h4>
      ${S.fields.map(([k, label, type]) => {
        const v = Array.isArray(cur[k]) ? cur[k].join(k === 'tags' ? ', ' : '\n') : (cur[k] ?? '');
        if (type === 'a') return `<label>${label}<textarea name="${k}" rows="${k === 'description' ? 4 : 3}">${esc(v)}</textarea></label>`;
        if (type === 's') return `<label>${label}<select name="${k}">${Object.entries(CAT).map(([c, n]) => `<option value="${c}" ${cur[k] === c ? 'selected' : ''}>${n}</option>`).join('')}</select></label>`;
        return `<label>${label}<input name="${k}" value="${esc(v)}"></label>`;
      }).join('')}
      ${tab === 'projects' ? `<label>3D model (.glb, max 12 MB)${cur.modelId ? ' — leave empty to keep the current one' : ''}<input type="file" name="model" accept=".glb,model/gltf-binary"></label>
        <label>Cover image (optional — otherwise generated from the model)<input type="file" name="cover" accept="image/*"></label>
        <div class="bar"><i id="admBar"></i></div>` : ''}
      <div class="adm-actions"><button class="btn btn-primary">${editId ? 'Save changes' : 'Add'}</button>
      ${editId ? '<button type="button" class="btn btn-outline" data-act="cancel">Cancel</button>' : ''}</div></form><p id="admMsg"></p>`;
  }
  body.innerHTML = html;
  $('#optSamples', adm)?.addEventListener('change', e => set(ref(db, 'portfolio/settings/showSamples'), e.target.checked).then(() => msg('Saved ✓')).catch(x => msg(x.message, 1)));
}

async function onClick(e) {
  const t = e.target.closest('[data-tab],[data-act]'); if (!t) return;
  if (t.dataset.tab) { tab = t.dataset.tab; editId = null; return renderAdm(); }
  const act = t.dataset.act;
  if (act === 'signout') { await signOut(auth); return; }
  if (act === 'edit') { editId = t.dataset.id; renderAdm(); $('.adm-sheet', adm).scrollTo({ top: 9999, behavior: 'smooth' }); }
  if (act === 'cancel') { editId = null; renderAdm(); }
  if (act === 'del' && confirm('Delete this entry? This cannot be undone.')) {
    try {
      await remove(ref(db, `portfolio/${tab}/${t.dataset.id}`));
      if (tab === 'projects') await remove(ref(db, `models/${t.dataset.id}`));
      msg('Deleted ✓');
    } catch (x) { msg(x.message, 1); }
  }
}

async function onSubmit(e) {
  e.preventDefault();
  const f = e.target, kind = f.dataset.form; if (busy) return;
  const fd = new FormData(f);
  try {
    if (kind === 'login') {
      msg('Signing in…');
      const cred = await signInWithEmailAndPassword(auth, fd.get('email'), fd.get('password'));
      const ok = (await get(ref(db, 'admins/' + cred.user.uid))).val() === true;
      if (!ok) { await signOut(auth); msg('This account is not an authorised admin.', 1); }
      return;
    }
    busy = true; f.querySelector('.adm-actions .btn-primary').disabled = true;
    const old = editId ? DATA[kind][editId] || {} : {};
    const rec = { ts: old.ts || Date.now() };
    SCHEMA[kind].fields.forEach(([k]) => {
      const v = String(fd.get(k) || '').trim();
      rec[k] = k === 'bullets' || k === 'specs' ? lines(v) : k === 'tags' ? v.split(',').map(s => s.trim()).filter(Boolean) : v;
    });
    if (kind === 'experience' && !rec.role) throw new Error('Role is required');
    if (kind === 'certifications' && !rec.name) throw new Error('Certification name is required');
    if (kind === 'certifications' && rec.url && !safeUrl(rec.url)) throw new Error('Verify URL must start with http(s)://');
    const id = editId || push(ref(db, `portfolio/${kind}`)).key;
    if (kind === 'projects') {
      if (!rec.title) throw new Error('Project title is required');
      rec.createdAt = old.createdAt || Date.now(); rec.modelId = old.modelId || null; rec.cover = old.cover || null;
      const glb = fd.get('model'), img = fd.get('cover'), bar = $('#admBar', adm);
      if (glb && glb.size) {
        if (glb.size > MAX_GLB) throw new Error('GLB is larger than 12 MB — compress it (Draco/gltfpack) first.');
        msg('Reading model…');
        const buf = await glb.arrayBuffer();
        if (new TextDecoder().decode(buf.slice(0, 4)) !== 'glTF') throw new Error('That file is not a binary glTF (.glb).');
        const obj = await parseGLB(buf.slice(0));
        const { group } = fit(obj);
        if (!(img && img.size)) rec.cover = makeThumb(group);
        msg('Uploading model…');
        await uploadModel(id, buf, p => { bar.style.width = p * 100 + '%'; });
        rec.modelId = id; rec.modelSize = glb.size;
      }
      if (img && img.size) rec.cover = await imageToJpeg(img);
    }
    await set(ref(db, `portfolio/${kind}/${id}`), rec);
    editId = null; renderAdm(); msg('Saved ✓');
  } catch (x) { console.error(x); msg(x.message || 'Something went wrong', 1); }
  finally { busy = false; f.querySelector?.('.adm-actions .btn-primary') && (f.querySelector('.adm-actions .btn-primary').disabled = false); }
}

onAuthStateChanged(auth, async u => {
  isAdmin = false;
  if (u) { try { isAdmin = (await get(ref(db, 'admins/' + u.uid))).val() === true; } catch { isAdmin = false; } }
  document.body.classList.toggle('is-admin', isAdmin);
  const link = $('#adminLink'); if (link) link.textContent = isAdmin ? 'Admin ●' : 'Admin';
  if (admOpen) renderAdm();
});
$('#adminLink')?.addEventListener('click', e => { e.preventDefault(); toggleAdm(true); });
addEventListener('keydown', e => { if (e.key === 'Escape' && admOpen) toggleAdm(false); });

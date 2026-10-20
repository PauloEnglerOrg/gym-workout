'use strict';

/* =====================================================================
   Gym Workout — one screen at a time, everything saved on the phone.
   ===================================================================== */

/* ---------- small helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = () => 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const LIB = Object.fromEntries(LIBRARY.map(e => [e.id, e]));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GROUPS = { chest: 'Chest', shoulders: 'Shoulders', triceps: 'Triceps', back: 'Back', biceps: 'Biceps', quads: 'Quads', hamstrings: 'Hamstrings', hips: 'Hips & glutes', calves: 'Calves', core: 'Core' };
const EQUIP = { barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable', machine: 'Machine', smith: 'Smith', bodyweight: 'Bodyweight', band: 'Band' };

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: app still works, just doesn't remember */ } }
};

const IC = {
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  swap: '<path d="M4 8h13l-3.5-3.5M20 16H7l3.5 3.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".6"/><circle cx="4.5" cy="12" r=".6"/><circle cx="4.5" cy="18" r=".6"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  chev: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/>',
  dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;

/* ---------- saved state ---------- */
const LB = 0.45359237; // kilograms in one pound

/* Version 1 saved each weight as a plain number in one unit, with 2.5 / 5 steps.
   Version 2 keeps every weight in kilograms (shown as kg and lb together), lets an
   exercise remember which unit its machine uses, and steps by 0.5 by default. */
function convertLegacy(d) {
  const lb = !!(d.settings && d.settings.unit === 'lb');
  const f = lb ? LB : 1, u = lb ? 'lb' : 'kg';
  const r4 = n => Math.round(n * 1e4) / 1e4;
  const fixEx = ex => {
    if (!ex) return;
    ex.weight = r4((Number(ex.weight) || 0) * f);
    ex.unit = u;
    const old = Number(ex.step);
    if (lb) { ex.stepLb = old > 0 ? old : 5; ex.step = 0.5; }
    else { if (!(old > 0) || old === 2 || old === 2.5 || old === 5) ex.step = 0.5; ex.stepLb = 5; }
  };
  const fixSets = arr => (arr || []).forEach(s => { s.w = r4((Number(s.w) || 0) * f); });
  if (d.plan && Array.isArray(d.plan.days)) d.plan.days.forEach(day => (day.exercises || []).forEach(fixEx));
  if (d.weights) Object.keys(d.weights).forEach(k => { d.weights[k] = r4((Number(d.weights[k]) || 0) * f); });
  if (Array.isArray(d.history)) d.history.forEach(h => (h.exercises || []).forEach(x => { x.weights = (x.weights || []).map(w => r4((Number(w) || 0) * f)); x.unit = u; }));
  if (d.session && Array.isArray(d.session.queue)) d.session.queue.forEach(q => {
    fixEx(q.ex); fixSets(q.setsDone);
    if (q.orig) { fixEx(q.orig.ex); fixSets(q.orig.setsDone); }
  });
  return d;
}
if (store.get('gym.schema', null) === null) {
  if (store.get('gym.plan', null)) {
    const old = { plan: store.get('gym.plan', null), settings: store.get('gym.settings', {}), weights: store.get('gym.weights', {}), history: store.get('gym.history', []), session: store.get('gym.session', null) };
    store.set('gym.v1backup', old); // untouched copy of everything, kept just in case
    const d = convertLegacy(JSON.parse(JSON.stringify(old)));
    store.set('gym.plan', d.plan); store.set('gym.weights', d.weights); store.set('gym.history', d.history);
    if (d.session) store.set('gym.session', d.session);
  }
  store.set('gym.schema', 2);
}

let plan = store.get('gym.plan', null);
if (!plan || !Array.isArray(plan.days)) plan = clone(DEFAULT_PLAN);
let settings = Object.assign({ unit: 'kg', sound: true, vibrate: true, awake: true, prefill: true, pictures: 'drawing', alarmVol: 'loud' }, store.get('gym.settings', {}));
let session = store.get('gym.session', null);
let history = store.get('gym.history', []);
let lastW = store.get('gym.weights', {}); // last weight used per exercise, in kg
let lastU = store.get('gym.units', {});   // which unit each exercise's machine uses
const savePlan = () => store.set('gym.plan', plan);
const saveSettings = () => store.set('gym.settings', settings);
const saveHistory = () => store.set('gym.history', history);
const saveW = () => store.set('gym.weights', lastW);
const saveU = () => store.set('gym.units', lastU);
function saveSession() {
  if (session) session.updated = Date.now();
  store.set('gym.session', session);
}

let view = 'home';
if (session && Date.now() - (session.updated || 0) < 6 * 3600e3) view = 'workout';
let edDay = plan.days[0] && plan.days[0].id;
let histOpen = {};
let busyAll = false;
let selDayId = null; // the day picked on the home screen (null = the suggested one)

/* ---------- display helpers ---------- */
function repsLabel(ex) {
  const r = String(ex.reps || '').trim();
  if (!r) return '';
  if (ex.timed) return r + ' sec';
  if (/[a-z]/i.test(r)) return r;
  return r + ' reps';
}
/* Weights are stored in kilograms (negative = assisted). The unit only decides how
   a weight is shown and how far the − / + buttons move it. */
const toUnit = (kg, u) => (u === 'lb' ? kg / LB : kg);
const fromUnit = (v, u) => (u === 'lb' ? v * LB : v);
const otherUnit = u => (u === 'lb' ? 'kg' : 'lb');
function fmtNum(v, dec) {
  const p = Math.pow(10, dec), r = Math.round(v * p) / p;
  return String(r === 0 ? 0 : r);
}
const fmtIn = (kg, u) => fmtNum(toUnit(kg, u), u === 'lb' ? 1 : 2);   // plain text, for input boxes
const disp = (kg, u) => fmtIn(kg, u).replace('-', '−');               // for reading, with a real minus
// "3 × 40 kg", "40 · 42.5 · 45 kg", or just "3 sets" when no weight was used
function fmtWeights(ws, u) {
  u = u || 'kg';
  if (ws.every(w => !w)) return ws.length + (ws.length === 1 ? ' set' : ' sets');
  const body = ws.every(w => w === ws[0]) ? ws.length + ' × ' + disp(ws[0], u) : ws.map(w => disp(w, u)).join(' · ');
  return body + ' ' + u;
}
const KG_STEPS = [0.5, 1, 2.5, 5, 10];
const LB_STEPS = [1, 2.5, 5, 10, 25];
const unitOf = ex => (ex && ex.unit === 'lb' ? 'lb' : 'kg');
const stepOf = ex => (unitOf(ex) === 'lb' ? (Number(ex.stepLb) || 5) : (Number(ex.step) || 0.5));
function fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
}
function fmtDur(sec) {
  const m = Math.round(sec / 60);
  return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min';
}
const libOf = ex => (ex && ex.lib && LIB[ex.lib]) || null;
const groupOf = ex => (libOf(ex) && libOf(ex).group) || (ex && ex.group) || '';
const keyOf = ex => ex.lib || ('n:' + String(ex.name).toLowerCase());

// The exercise picture: two photos that flip between start and end pose. `cls` = 'big' for the enlarged view.
function figure(ex, cls) {
  const L = libOf(ex), c = 'fig' + (cls ? ' ' + cls : '');
  if (!L) return `<div class="${c} noimg">${ic('dumbbell')}</div>`;
  // Small view: an animated drawing when there is a clear one (settings can switch to photos). The big view is always the photo.
  const key = settings.pictures !== 'photo' && cls !== 'big' && PICTO.map[L.id];
  if (key) return `<div class="${c} pic">${PICTO.svg(PICTO.specs[key], 0, '', key)}</div>`;
  // Holds (plank): the second photo is the held position, so show just that one.
  if (ex.timed) return `<div class="${c}"><img src="img/${L.id}-1.jpg" alt=""></div>`;
  return `<div class="${c}"><img src="img/${L.id}-0.jpg" alt=""><img class="b" src="img/${L.id}-1.jpg" alt=""></div>`;
}
function thumb(ex, cls) {
  const L = libOf(ex);
  return L ? `<img class="${cls}" src="img/${L.id}-0.jpg" alt="" loading="lazy">` : `<div class="${cls} ph">${ic('dumbbell')}</div>`;
}
function libThumb(L, cls) {
  return `<img class="${cls}" src="img/${L.id}-0.jpg" alt="" loading="lazy">`;
}

/* ---------- toast / sheets ---------- */
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, 2200);
}
let sheetFn = null;
function showSheet(fn) {
  sheetFn = fn;
  $('#sheet').innerHTML = fn();
  $('#sheetWrap').hidden = false;
}
function refreshSheet() { if (sheetFn && !$('#sheetWrap').hidden) { const sc = $('#sheet').scrollTop; $('#sheet').innerHTML = sheetFn(); $('#sheet').scrollTop = sc; } }
function closeSheet() { sheetFn = null; $('#sheetWrap').hidden = true; $('#sheet').innerHTML = ''; }

let confirmCb = null;
function confirmSheet(title, text, okLabel, danger, cb) {
  confirmCb = cb;
  showSheet(() => `<div class="grab"></div><h3>${esc(title)}</h3><p class="sub2">${esc(text)}</p>
    <div class="row"><button class="btn ghost" data-act="closeSheet">Cancel</button>
    <button class="btn ${danger ? 'danger' : 'primary'}" data-act="confirmOk">${esc(okLabel)}</button></div>`);
}

/* =====================================================================
   Sound, vibration, screen-awake
   ===================================================================== */
let actx = null, master = null;
function unlockAudio() { // must run from a tap, otherwise the phone keeps the sound switched off
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') actx.resume();
  } catch (e) { /* no sound available */ }
}
const ALARM_VOL = { normal: 0.35, loud: 0.6, max: 0.9 };
const BEEP = 1175, LONG = 1568; // pitch in Hz: a high, sharp tone cuts through music
// One clear beep: a square wave (much more present than a soft sine) with a quick fade so it never clicks.
function tone(freq, at, dur) {
  if (!settings.sound || !actx) return;
  try {
    if (actx.state !== 'running') actx.resume();
    if (!master) {
      const comp = actx.createDynamicsCompressor(); // stops the loudest setting from distorting
      comp.threshold.value = -14; comp.ratio.value = 8; comp.attack.value = 0.002; comp.release.value = 0.12;
      master = actx.createGain(); master.connect(comp); comp.connect(actx.destination);
    }
    master.gain.value = ALARM_VOL[settings.alarmVol] || ALARM_VOL.loud;
    const t0 = actx.currentTime + at;
    const o = actx.createOscillator(), lp = actx.createBiquadFilter(), g = actx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(1, t0 + 0.012);
    g.gain.setValueAtTime(1, t0 + dur - 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) { /* ignore */ }
}
function beeps(n, freq, at) { for (let i = 0; i < n; i++) tone(freq || BEEP, (at || 0) + i * 0.27, 0.15); }
function buzz(pattern) {
  if (settings.vibrate && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
}
// 15 s left: three beeps, 10 s: two, 5 s: one. Then one long beep at zero.
function warn(secLeft) {
  const n = secLeft === 15 ? 3 : secLeft === 10 ? 2 : 1;
  beeps(n);
  buzz(Array.from({ length: n * 2 - 1 }, (_, i) => (i % 2 ? 90 : 130)));
  const ring = $('.ring');
  if (ring) { ring.classList.remove('pulse'); void ring.offsetWidth; ring.classList.add('pulse'); }
}
function alarmEnd() { tone(LONG, 0, 1.5); buzz([900]); }
function holdAlert() { beeps(3, LONG); buzz([150, 90, 150, 90, 150]); }
function testBeeps() { unlockAudio(); beeps(3); beeps(2, BEEP, 1.3); beeps(1, BEEP, 2.4); tone(LONG, 3.3, 1.5); }
let wake = null;
async function requestWake() {
  if (!settings.awake || !('wakeLock' in navigator) || wake) return;
  try {
    wake = await navigator.wakeLock.request('screen');
    wake.addEventListener('release', () => { wake = null; });
  } catch (e) { wake = null; }
}
function releaseWake() { try { if (wake) wake.release(); } catch (e) { /* ignore */ } wake = null; }

/* =====================================================================
   Workout logic
   ===================================================================== */
const cur = () => session.queue[session.idx];
const isComplete = q => q.setsDone.length >= q.ex.sets;
function nextPending(from) {
  const n = session.queue.length;
  for (let k = 1; k <= n; k++) {
    const i = (from + k) % n;
    if (!isComplete(session.queue[i])) return i;
  }
  return -1;
}
const findDay = id => plan.days.find(d => d.id === id);

function startWorkout(dayId) {
  const day = findDay(dayId);
  if (!day || !day.exercises.length) { toast('Add some exercises to this day first'); return; }
  session = {
    dayId, dayName: day.name, startedAt: Date.now(), updated: Date.now(),
    queue: day.exercises.map(ex => ({ qid: uid(), ex: clone(ex), setsDone: [], orig: null })),
    idx: 0, phase: 'work', restEnd: 0, restTotal: 0, holdStart: 0, holdBeeped: false, lastQid: null
  };
  saveSession();
  unlockAudio(); requestWake();
  setView('workout');
}

// Remember this exercise's weight and unit (and write them back into the plan).
function persistEx(q) {
  const ex = q.ex, k = keyOf(ex);
  lastW[k] = ex.weight; lastU[k] = unitOf(ex); saveW(); saveU();
  if (!ex.swapped && session) {
    const day = findDay(session.dayId);
    const pe = day && day.exercises.find(e => e.id === ex.id);
    if (pe) { pe.weight = ex.weight; pe.unit = unitOf(ex); pe.step = ex.step; pe.stepLb = ex.stepLb; savePlan(); }
  }
}

function setWeightKg(kg) {
  const q = cur(); if (!q) return;
  q.ex.weight = Number.isFinite(kg) ? kg : 0;
  q.pf = q.setsDone.length; // this set's weight is now decided by hand
  persistEx(q); saveSession(); refreshWeightUI();
}

function setActiveUnit(u) {
  const q = session && cur();
  if (!q || unitOf(q.ex) === u) return;
  q.ex.unit = u;
  persistEx(q); saveSession(); refreshWeightUI();
}

/* What the same exercise looked like the last time it was saved to History. */
const histKey = x => x.lib || ('n:' + String(x.name).toLowerCase());
function lastTimeSets(ex) {
  const k = keyOf(ex);
  for (const h of history) {
    for (const x of h.exercises || []) {
      if (histKey(x) === k && x.weights && x.weights.length) return { date: h.date, weights: x.weights };
    }
  }
  return null;
}

/* Start each set at the weight you used for that set last time. After the first set
   it never goes below the weight you just lifted. Returns true when it ran for a new set. */
function prefill(q) {
  const n = q.setsDone.length;
  if (q.pf === n) return false;
  q.pf = n;
  if (!settings.prefill || q.ex.timed) return true;
  const lt = lastTimeSets(q.ex);
  if (!lt) return true;
  const target = lt.weights[n];
  if (target == null) return true;
  if (n === 0) {
    // only when the plan weight wasn't changed by hand since the last workout
    if (Math.abs(q.ex.weight - lt.weights[lt.weights.length - 1]) < 1e-6) q.ex.weight = target;
  } else {
    q.ex.weight = Math.max(target, q.setsDone[n - 1].w);
  }
  return true;
}

/* The weight boxes, step buttons and set-by-set row, refreshed without redrawing the screen. */
function wtoolsHtml(ex) {
  const u = unitOf(ex), step = stepOf(ex), neg = ex.weight < 0;
  const list = (u === 'lb' ? LB_STEPS : KG_STEPS).slice();
  if (!list.includes(step)) { list.push(step); list.sort((a, b) => a - b); }
  return `<span class="wlab ${neg ? 'neg' : ''}">${neg ? 'assisted' : 'step ' + u}</span>` +
    list.map(s => `<button class="stp ${s === step ? 'on' : ''}" data-act="wstepset" data-s="${s}">${s}</button>`).join('') +
    `<button class="stp flip ${neg ? 'on' : ''}" data-act="wflip" aria-label="Switch between added weight and assisted">±</button>`;
}
function setRowHtml(q) {
  const ex = q.ex, u = unitOf(ex), n = q.setsDone.length;
  const lt = ex.timed ? null : lastTimeSets(ex);
  let h = '';
  for (let i = 0; i < ex.sets; i++) {
    let cls = 'empty', val = '–';
    if (i < n) {
      cls = 'done';
      val = ex.timed ? (q.setsDone[i].h != null ? q.setsDone[i].h + 's' : '✓') : disp(q.setsDone[i].w, u);
    } else if (i === n) {
      cls = 'now';
      val = ex.timed ? ex.reps + 's' : disp(ex.weight, u);
    } else if (lt && lt.weights[i] != null) {
      cls = 'plan';
      val = disp(lt.weights[i], u);
    }
    h += `<div class="sc ${cls}"><small>Set ${i + 1}</small><b>${esc(val)}</b></div>`;
  }
  return h;
}
function refreshWeightUI() {
  const q = session && session.queue && cur();
  if (!q || view !== 'workout') return;
  const ex = q.ex, u = unitOf(ex);
  const k = $('#wk'), l = $('#wl');
  const kv = fmtIn(ex.weight, 'kg'), lv = fmtIn(ex.weight, 'lb');
  if (k && k.value !== kv) k.value = kv;
  if (l && l.value !== lv) l.value = lv;
  const wk = $('#wuk'), wl = $('#wul');
  if (wk) wk.classList.toggle('act', u === 'kg');
  if (wl) wl.classList.toggle('act', u === 'lb');
  const wt = $('#wtools'); if (wt) wt.innerHTML = wtoolsHtml(ex);
  const sr = $('#setrow'); if (sr) sr.innerHTML = setRowHtml(q);
}

function setDone() {
  const s = session, q = cur();
  const entry = { w: q.ex.weight, t: Date.now() };
  if (q.ex.timed && s.holdStart) entry.h = Math.round((Date.now() - s.holdStart) / 1000);
  q.setsDone.push(entry);
  persistEx(q);
  s.lastQid = q.qid;
  s.holdStart = 0; s.holdBeeped = false;
  const restSec = q.ex.rest || 0;
  if (isComplete(q)) {
    const nxt = nextPending(s.idx);
    if (nxt === -1) { finishLine(); return; }
    s.idx = nxt;
  }
  if (restSec > 0) {
    s.phase = 'rest'; s.restTotal = restSec; s.restEnd = Date.now() + restSec * 1000;
    s.fired = { 5: restSec <= 5, 10: restSec <= 10, 15: restSec <= 15 }; // a warning already "behind us" never sounds
  } else {
    s.phase = 'work';
  }
  saveSession(); render();
}

function finishLine() {
  session.phase = 'done'; session.finishedAt = Date.now();
  saveSession(); render();
}

function endRest(auto) {
  session.phase = 'work'; session.restEnd = 0;
  saveSession();
  if (auto) alarmEnd();
  render();
  if (auto) { const sc = $('.screen'); if (sc) sc.classList.add('flash'); }
}

function undoLast() {
  const s = session;
  const i = s.queue.findIndex(q => q.qid === s.lastQid);
  if (i < 0) return;
  const q = s.queue[i];
  if (!q.setsDone.length) return;
  q.setsDone.pop();
  q.pf = q.setsDone.length; // keep the weight as it is
  s.idx = i; s.phase = 'work'; s.lastQid = null; s.restEnd = 0; s.holdStart = 0;
  saveSession(); render(); toast('Last set undone');
}

function suggestions(q) {
  const ex = q.ex, L = libOf(ex), group = groupOf(ex);
  if (!group) return { top: [], more: [] };
  const used = new Set();
  session.queue.forEach(z => { if (z.ex.lib) used.add(z.ex.lib); if (z.orig && z.orig.ex.lib) used.add(z.orig.ex.lib); });
  const cand = LIBRARY.filter(e => e.group === group && !used.has(e.id)).map(e => {
    let score = 0;
    if (L && e.pattern === L.pattern) score += 100;
    if (!L || e.equip !== L.equip) score += 20;
    if (e.equip === 'dumbbell' || e.equip === 'bodyweight') score += 5;
    return { e, score };
  }).sort((a, b) => b.score - a.score).map(x => x.e);
  return { top: cand.slice(0, 4), more: cand.slice(4) };
}

function swapTo(libId) {
  const s = session, q = cur(), L = LIB[libId];
  if (!L) return;
  const remaining = Math.max(1, q.ex.sets - q.setsDone.length);
  const timed = L.pattern === 'plank';
  const ex = {
    id: uid(), lib: libId, name: L.name, sets: remaining,
    reps: (timed === !!q.ex.timed) ? q.ex.reps : (timed ? '30-45' : '12-15'),
    rest: q.ex.rest, weight: lastW[libId] || 0, unit: lastU[libId] || settings.unit, step: 0.5, stepLb: 5,
    notes: '', timed, swapped: true
  };
  s.queue[s.idx] = { qid: uid(), ex, setsDone: [], orig: q.orig || { ex: q.ex, setsDone: q.setsDone } };
  s.holdStart = 0;
  saveSession(); closeSheet(); render(); toast('Swapped to ' + L.name);
}

function revertSwap() {
  const s = session, q = cur();
  if (!q.orig) return;
  s.queue[s.idx] = { qid: uid(), ex: q.orig.ex, setsDone: q.orig.setsDone, orig: null };
  saveSession(); closeSheet(); render();
}

function doLater() {
  const s = session, old = s.idx;
  const [item] = s.queue.splice(old, 1);
  s.queue.push(item);
  const len = s.queue.length;
  let t = -1;
  for (let k = 0; k < len - 1; k++) {
    const i = (old + k) % (len - 1);
    if (!isComplete(s.queue[i])) { t = i; break; }
  }
  s.idx = t >= 0 ? t : len - 1;
  s.holdStart = 0;
  saveSession(); closeSheet(); render();
}

function buildEntry() {
  const s = session, exs = [];
  s.queue.forEach(q => {
    [q.orig, q].filter(Boolean).forEach(z => {
      if (z.setsDone.length) exs.push({ name: z.ex.name, lib: z.ex.lib || null, weights: z.setsDone.map(x => x.w), unit: unitOf(z.ex), swapped: !!z.ex.swapped });
    });
  });
  return { id: uid(), date: s.startedAt, dur: Math.round(((s.finishedAt || Date.now()) - s.startedAt) / 1000), dayId: s.dayId, dayName: s.dayName, exercises: exs };
}

function finishSave() {
  const entry = buildEntry();
  if (entry.exercises.length) { history.unshift(entry); history = history.slice(0, 200); saveHistory(); }
  session = null; store.set('gym.session', null);
  selDayId = null;
  releaseWake(); closeSheet();
  setView('home');
  toast('Workout saved');
}

function discardSession() {
  session = null; store.set('gym.session', null);
  releaseWake(); closeSheet();
  setView('home');
}

/* ---------- ticking clock (rest timer + plank hold) ---------- */
const RING_C = 2 * Math.PI * 58;
function onTick() {
  if (view !== 'workout' || !session) return;
  const s = session;
  if (s.phase === 'rest') {
    const leftMs = s.restEnd - Date.now();
    const left = Math.ceil(leftMs / 1000);
    if (left <= 0) {
      // Coming back to the app long after the rest ended: don't sound a stale alarm, just say so.
      if (-leftMs > 4000) { endRest(false); toast('Rest ended ' + fmtTime(-leftMs / 1000) + ' ago. Beeps only sound while the app is open on screen.'); }
      else endRest(true);
      return;
    }
    const rt = $('#rt'); if (rt) rt.textContent = fmtTime(left);
    const fg = $('#ringfg');
    if (fg) fg.style.strokeDashoffset = String(RING_C * (1 - Math.max(0, leftMs) / (s.restTotal * 1000)));
    if (!s.fired) s.fired = { 5: false, 10: false, 15: false };
    for (const t of [5, 10, 15]) {
      if (left <= t && !s.fired[t]) {
        s.fired[t] = true;
        if (left > t - 2) warn(t); // only on time, not as a late catch-up
      }
    }
  } else if (s.phase === 'work' && s.holdStart) {
    const sec = Math.floor((Date.now() - s.holdStart) / 1000);
    const h = $('#hold'); if (h) h.textContent = fmtTime(sec);
    const target = parseInt(String(cur().ex.reps), 10) || 0;
    if (target && sec >= target && !s.holdBeeped) { s.holdBeeped = true; holdAlert(); }
  }
}
setInterval(onTick, 250);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (actx && actx.state !== 'running') { try { actx.resume().catch(() => {}); } catch (e) { /* ignore */ } } // phones switch sound off in the background
  if (session && view === 'workout') { requestWake(); onTick(); }
});

/* =====================================================================
   Views
   ===================================================================== */
function setView(v) { view = v; render(); window.scrollTo(0, 0); }

function render() {
  if (view === 'workout' && !session) view = 'home';
  if (view === 'workout' && session.phase !== 'done' && prefill(cur())) saveSession();
  $('#app').innerHTML = view === 'workout' ? viewWorkout()
    : view === 'editor' ? viewEditor()
    : view === 'history' ? viewHistory()
    : viewHome();
  PICTO.start(); // keeps any drawing on screen moving
}

/* ---------- home ---------- */
function dayMinutes(day) {
  const sec = day.exercises.reduce((a, e) => a + e.sets * ((e.timed ? (parseInt(e.reps, 10) || 45) : 40) + (e.rest || 0)), 0);
  return Math.max(5, Math.round(sec / 60 / 5) * 5);
}
/* The week runs Monday to Sunday. "Up next" is the first day of the plan not yet done this week,
   so skipping a day just moves the order along (and any day can be picked by hand). */
const weekStart = () => {
  const x = new Date(); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x.getTime();
};
const dayIdOf = h => h.dayId || (plan.days.find(d => d.name === h.dayName) || {}).id;
function doneThisWeek() { // dayId -> when it was last finished this week
  const ws = weekStart(), m = new Map();
  history.forEach(h => { if (h.date >= ws) { const id = dayIdOf(h); if (id && !m.has(id)) m.set(id, h.date); } });
  return m;
}

function viewHome() {
  const now = new Date();
  const done = doneThisWeek();
  const sug = plan.days.find(d => !done.has(d.id)) || plan.days[0] || null;
  const sel = plan.days.find(d => d.id === selDayId) || sug;
  const wd3 = ts => WEEKDAYS[new Date(ts).getDay()].slice(0, 3);
  let h = `<div class="screen">
    <div class="head"><div><div class="eyebrow">${WEEKDAYS[now.getDay()]}, ${esc(now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}</div><h1>Workout</h1></div>
    <button class="icon-btn" data-act="goEditor" aria-label="Edit plan">${ic('sliders')}</button></div>`;

  if (session) {
    const n = session.queue.filter(isComplete).length;
    h += `<div class="card resume"><div class="eyebrow">Workout in progress</div>
      <h2 style="font-size:24px;margin:4px 0 2px">${esc(session.dayName)}</h2>
      <div class="mu" style="margin-bottom:14px">${n} of ${session.queue.length} exercises done</div>
      <div class="row"><button class="btn primary" data-act="resume">Resume</button><button class="btn ghost" data-act="discardAsk">Discard</button></div></div>`;
  }

  if (plan.days.length) {
    h += `<div class="sect">${done.size} of ${plan.days.length} done this week · tap to pick today's workout</div><div class="daylist">`;
    plan.days.forEach((d, i) => {
      const on = sel && d.id === sel.id, dd = done.get(d.id);
      const usual = (d.weekday === null || d.weekday === undefined || d.weekday === '') ? '' : 'Usually ' + WEEKDAYS[d.weekday].slice(0, 3) + ' · ';
      const sub = dd ? 'Done ' + wd3(dd) : usual + d.exercises.length + ' exercises · ~' + dayMinutes(d) + ' min';
      h += `<button class="dayrow ${on ? 'on' : ''}" data-act="pickDay" data-day="${d.id}">
        <span class="dnum ${dd ? 'ok' : ''}">${dd ? ic('check') : i + 1}</span>
        <span class="dtx"><span class="dn">${esc(d.name)}${sug && d.id === sug.id ? '<span class="badge up">Up next</span>' : ''}</span>
          <span class="dd">${esc(sub)}</span>
          ${on ? `<span class="thumbs">${d.exercises.slice(0, 6).map(e => thumb(e, '')).join('')}</span>` : ''}</span></button>`;
    });
    h += `</div>`;
  } else {
    h += `<div class="card empty">No workout days yet.<br>Open <b>Edit plan</b> to add one.</div>`;
  }

  h += `<div class="startbar">
    ${sel ? `<button class="btn primary big" data-act="start" data-day="${sel.id}">${session ? 'Start this instead' : 'Start ' + esc(sel.name)}</button>` : ''}
    <div class="row" style="margin-top:10px">
      <button class="btn ghost" data-act="goHistory">${ic('clock')} History</button>
      <button class="btn ghost" data-act="goEditor">${ic('sliders')} Edit plan</button></div></div></div>`;
  return h;
}

/* ---------- workout ---------- */
function viewWorkout() {
  const s = session;
  if (s.phase === 'done') return viewSummary();
  const q = cur(), ex = q.ex;
  const resting = s.phase === 'rest';
  const setNo = Math.min(q.setsDone.length + 1, ex.sets);
  const segs = s.queue.map((x, i) => `<i class="${isComplete(x) ? 'done' : i === s.idx ? 'cur' : ''}"></i>`).join('');
  const note = (ex.swapped && q.orig ? `Swapped in for ${q.orig.ex.name}. ` : '') + (ex.notes || '');
  const pos = s.queue.filter(isComplete).length + (isComplete(q) ? 0 : 1);

  let h = `<div class="screen work">
    <div class="wtop">
      <button class="icon-btn" data-act="endAsk" aria-label="End workout">${ic('x')}</button>
      <div class="t"><small>Exercise ${Math.min(pos, s.queue.length)} of ${s.queue.length}</small>${esc(s.dayName)}</div>
      <button class="icon-btn" data-act="listOpen" aria-label="All exercises">${ic('list')}</button>
    </div>
    <div class="segs">${segs}</div>
    <div class="exhead">
      <button class="figbtn" data-act="figOpen" aria-label="Show a bigger picture">${figure(ex)}</button>
      <div class="exinfo">
        ${resting ? '<div class="eyebrow up">Up next</div>' : ''}
        <div class="wname">${esc(ex.name)}</div>
        <div class="chips">
          <span class="chip ac">Set ${setNo} of ${ex.sets}</span>
          <span class="chip">${esc(repsLabel(ex))}</span>
          <span class="chip rest">${ex.rest}s rest</span>
        </div>
      </div>
    </div>
    ${note ? `<div class="note">${esc(note)}</div>` : ''}`;

  if (!ex.timed) {
    const u = unitOf(ex);
    h += `<div class="weight">
      <button class="wbtn" data-act="wstep" data-d="-1" aria-label="Lighter">${ic('minus')}</button>
      <div class="wpair">
        <label class="wu ${u === 'kg' ? 'act' : ''}" id="wuk"><input id="wk" type="number" step="any" value="${fmtIn(ex.weight, 'kg')}" aria-label="Weight in kilograms"><span>kg</span></label>
        <label class="wu ${u === 'lb' ? 'act' : ''}" id="wul"><input id="wl" type="number" step="any" value="${fmtIn(ex.weight, 'lb')}" aria-label="Weight in pounds"><span>lb</span></label>
      </div>
      <button class="wbtn" data-act="wstep" data-d="1" aria-label="Heavier">${ic('plus')}</button></div>
    <div class="wtools" id="wtools">${wtoolsHtml(ex)}</div>`;
  }
  h += `<div class="setrow" id="setrow" data-act="exHist" role="button" tabindex="0" aria-label="Weight history by set">${setRowHtml(q)}</div>`;

  h += `<div class="action">`;
  if (resting) {
    const left = Math.max(0, Math.ceil((s.restEnd - Date.now()) / 1000));
    const off = RING_C * (1 - Math.max(0, s.restEnd - Date.now()) / (s.restTotal * 1000));
    h += `<div class="resting">
      <div class="ring"><svg viewBox="0 0 132 132"><circle class="bg" cx="66" cy="66" r="58"/><circle id="ringfg" class="fg" cx="66" cy="66" r="58" stroke-dasharray="${RING_C.toFixed(2)}" style="stroke-dashoffset:${off.toFixed(2)}"/></svg>
        <div class="tx"><b id="rt">${fmtTime(left)}</b><span>rest</span></div></div>
      <div class="rbtns">
        <button class="btn rest" data-act="skipRest">Skip rest</button>
        <div class="row"><button class="btn sm" data-act="restAdj" data-d="-15">−15s</button><button class="btn sm" data-act="restAdj" data-d="15">+15s</button></div>
      </div></div>`;
  } else if (ex.timed) {
    if (s.holdStart) {
      h += `<div class="holdnum" id="hold">${fmtTime((Date.now() - s.holdStart) / 1000)}</div>
        <button class="btn primary huge" data-act="setDone">${ic('check')} Done</button>`;
    } else {
      h += `<button class="btn primary huge" data-act="holdStart">Start hold</button>`;
    }
  } else {
    h += `<button class="btn primary huge" data-act="setDone">${ic('check')} Set done</button>`;
  }
  h += `<div class="sub">
      <button class="btn" data-act="busyOpen">${ic('swap')} Machine busy?</button>
      ${s.lastQid ? `<button class="btn" data-act="undo">${ic('undo')} Undo set</button>` : `<button class="btn" data-act="listOpen">${ic('list')} Exercises</button>`}
    </div></div></div>`;
  return h;
}

function viewSummary() {
  const s = session, entry = buildEntry();
  const totalSets = entry.exercises.reduce((a, e) => a + e.weights.length, 0);
  return `<div class="screen">
    <div class="big-emoji">💪</div>
    <div style="text-align:center"><h1 style="font-size:30px;letter-spacing:-.02em">Workout complete</h1><div class="mu">${esc(s.dayName)}</div></div>
    <div class="stats">
      <div class="stat"><b>${fmtDur(entry.dur)}</b><span>Time</span></div>
      <div class="stat"><b>${entry.exercises.length}</b><span>Exercises</span></div>
      <div class="stat"><b>${totalSets}</b><span>Sets</span></div></div>
    <div class="card">${entry.exercises.map(e => `<div class="sumrow"><div>${esc(e.name)}${e.swapped ? ' <span class="badge">swapped</span>' : ''}</div><div class="w">${esc(fmtWeights(e.weights, e.unit))}</div></div>`).join('')}</div>
    <div style="margin-top:auto;display:flex;flex-direction:column;gap:10px">
      <button class="btn primary big" data-act="finishSave">Save &amp; finish</button>
      <button class="btn ghost" data-act="undo">${ic('undo')} Undo last set</button></div></div>`;
}

/* ---------- workout sheets ---------- */
function busySheet() {
  const s = session, q = cur();
  const others = s.queue.some((x, i) => i !== s.idx && !isComplete(x));
  const sg = suggestions(q);
  const group = groupOf(q.ex);
  const opt = e => `<button class="opt" data-act="swap" data-lib="${esc(e.id)}">${libThumb(e, '')}<div><div class="n">${esc(e.name)}</div><div class="m"><span class="badge">${esc(EQUIP[e.equip] || e.equip)}</span>${q.ex.lib && LIB[q.ex.lib] && LIB[q.ex.lib].pattern === e.pattern ? 'Same movement' : esc(GROUPS[e.group] || '')}</div></div></button>`;
  let h = `<div class="grab"></div><h3>Machine busy?</h3><p class="sub2">Swap it for something similar, or come back to it later.</p>`;
  if (others) h += `<button class="opt" data-act="later"><div class="ph">${ic('clock')}</div><div><div class="n">Do it later</div><div class="m">Move to the end and start the next one</div></div></button>`;
  if (q.orig && q.setsDone.length === 0) h += `<button class="opt" data-act="revert"><div class="ph">${ic('undo')}</div><div><div class="n">Back to ${esc(q.orig.ex.name)}</div><div class="m">Undo the swap</div></div></button>`;
  if (!group) {
    h += `<p class="sub2">Pick a muscle group for this exercise in <b>Edit plan</b> to get swap ideas.</p>`;
  } else {
    h += `<div class="lbl" style="margin:12px 0 8px">Try instead</div>` + (sg.top.length ? sg.top.map(opt).join('') : `<p class="sub2">No other exercises left for this muscle group.</p>`);
    if (sg.more.length) {
      h += busyAll ? `<div class="lbl" style="margin:12px 0 8px">More ${esc((GROUPS[group] || '').toLowerCase())}</div>` + sg.more.map(opt).join('')
        : `<button class="btn ghost sm" style="width:100%" data-act="busyMore">Show ${sg.more.length} more</button>`;
    }
  }
  return h + `<button class="btn ghost" style="margin-top:10px" data-act="closeSheet">Close</button>`;
}

function listSheet() {
  const s = session;
  return `<div class="grab"></div><h3>Today's exercises</h3><p class="sub2">Tap one to jump to it.</p>` +
    s.queue.map((q, i) => {
      const done = isComplete(q), part = q.setsDone.length;
      const st = done ? `<span class="st">${ic('check')}</span>` : part ? `<span class="st mu">${part}/${q.ex.sets}</span>` : `<span class="st mu">${q.ex.sets} sets</span>`;
      return `<button class="opt ${i === s.idx ? 'cur' : ''} ${done ? 'done' : ''}" data-act="jump" data-i="${i}">${thumb(q.ex, '')}<div><div class="n">${esc(q.ex.name)}</div><div class="m">${esc(repsLabel(q.ex))}${q.ex.weight && !q.ex.timed ? ' · ' + disp(q.ex.weight, unitOf(q.ex)) + ' ' + unitOf(q.ex) : ''}</div></div>${st}</button>`;
    }).join('') + `<button class="btn ghost" style="margin-top:6px" data-act="closeSheet">Close</button>`;
}

function endSheet() {
  const any = session.queue.some(q => q.setsDone.length || (q.orig && q.orig.setsDone.length));
  return `<div class="grab"></div><h3>End workout?</h3><p class="sub2">${any ? 'Your finished sets can be saved to History.' : 'Nothing has been logged yet.'}</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${any ? `<button class="btn primary" data-act="endSave">Finish &amp; save</button>` : ''}
      <button class="btn danger" data-act="discardNow">Discard workout</button>
      <button class="btn ghost" data-act="closeSheet">Keep going</button></div>`;
}

/* The picture, big, with the form tip. */
function figSheet() {
  const q = cur(), ex = q.ex;
  const note = (ex.swapped && q.orig ? `Swapped in for ${q.orig.ex.name}. ` : '') + (ex.notes || '');
  return `<div class="grab"></div>${figure(ex, 'big')}
    <h3 style="margin-top:14px">${esc(ex.name)}</h3>
    <p class="sub2">${esc(repsLabel(ex))} · ${ex.sets} sets${note ? ' · ' + esc(note) : ''}</p>
    <button class="btn ghost" data-act="closeSheet">Close</button>`;
}

/* Every saved session of the current exercise, weight by set, in both units. */
function exHistSheet() {
  const q = cur(), ex = q.ex, k = keyOf(ex), u = unitOf(ex), o = otherUnit(u);
  const rows = [];
  if (!ex.timed && q.setsDone.length) rows.push({ label: 'Today', ws: q.setsDone.map(s => s.w) });
  history.forEach(h => (h.exercises || []).forEach(x => {
    if (rows.length < 10 && histKey(x) === k && x.weights && x.weights.length) {
      rows.push({ label: new Date(h.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }), ws: x.weights });
    }
  }));
  const line = (ws, unit) => ws.map(w => disp(w, unit)).join(' · ') + ' ' + unit;
  return `<div class="grab"></div><h3>${esc(ex.name)}</h3><p class="sub2">Weight by set, newest first.</p>` +
    (rows.length && !ex.timed
      ? rows.map(r => `<div class="hrow"><div class="hd">${esc(r.label)}</div><div class="hw"><b>${esc(line(r.ws, u))}</b>${r.ws.every(w => !w) ? '' : `<span>${esc(line(r.ws, o))}</span>`}</div></div>`).join('')
      : `<p class="sub2">${ex.timed ? 'Holds are timed, so there are no weights to show.' : 'Nothing saved for this exercise yet. It shows up here after you tap Save &amp; finish.'}</p>`) +
    `<button class="btn ghost" style="margin-top:10px" data-act="closeSheet">Close</button>`;
}

/* ---------- history ---------- */
function viewHistory() {
  let h = `<div class="screen"><div class="head"><button class="icon-btn" data-act="goHome" aria-label="Back">${ic('back')}</button><h1 style="flex:1;margin-left:4px">History</h1></div>`;
  if (!history.length) h += `<div class="card empty">No finished workouts yet.<br>They show up here after you tap <b>Save &amp; finish</b>.</div>`;
  history.forEach(e => {
    const d = new Date(e.date);
    const sets = e.exercises.reduce((a, x) => a + x.weights.length, 0);
    const open = histOpen[e.id];
    h += `<button class="hist" style="width:100%;text-align:left" data-act="histToggle" data-id="${e.id}">
      <div class="hh"><div class="hn">${esc(e.dayName)}</div><div class="hm">${esc(d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))}</div></div>
      <div class="hm">${fmtDur(e.dur)} · ${e.exercises.length} exercises · ${sets} sets</div>
      ${open ? `<div class="hx">${e.exercises.map(x => {
        const u = x.unit || 'kg';
        const alt = x.weights.every(w => !w) ? '' : `<span class="alt">${esc(fmtWeights(x.weights, otherUnit(u)))}</span>`;
        return `<div><b>${esc(x.name)}</b> — ${esc(fmtWeights(x.weights, u))}${alt}</div>`;
      }).join('')}</div>` : ''}</button>`;
  });
  return h + `</div>`;
}

/* ---------- plan editor ---------- */
function viewEditor() {
  if (!plan.days.find(d => d.id === edDay)) edDay = plan.days[0] && plan.days[0].id;
  const day = findDay(edDay);
  let h = `<div class="screen"><div class="head"><button class="icon-btn" data-act="goHome" aria-label="Back">${ic('back')}</button><h1 style="flex:1;margin-left:4px">Edit plan</h1></div>
    <div class="tabs">${plan.days.map((d, i) => `<button class="tab ${d.id === edDay ? 'on' : ''}" data-act="edTab" data-id="${d.id}">Day ${i + 1}</button>`).join('')}<button class="tab" data-act="edAddDay" aria-label="Add day">+ Add day</button></div>`;

  if (day) {
    h += `<div class="card">
      <div class="field"><label>Day name</label><input id="dayName" value="${esc(day.name)}"></div>
      <div class="field" style="margin-bottom:0"><label>Usually on</label><select id="dayWd">
        <option value="">No fixed day</option>${WEEKDAYS.map((w, i) => `<option value="${i}" ${String(day.weekday) === String(i) ? 'selected' : ''}>${w}</option>`).join('')}</select></div></div>
      <div class="sect">Exercises</div>`;
    day.exercises.forEach((e, i) => {
      h += `<div class="excard">
        <button class="row" style="flex:1;min-width:0;gap:12px;align-items:center;text-align:left" data-act="edEx" data-id="${e.id}">
          ${thumb(e, 'th')}<div class="body"><div class="n">${esc(e.name)}</div>
          <div class="m">${e.sets} × ${esc(repsLabel(e))} · ${e.rest}s${e.timed ? '' : ' · ' + disp(e.weight, unitOf(e)) + ' ' + unitOf(e)}</div></div></button>
        <div class="mv"><button data-act="edMove" data-id="${e.id}" data-d="-1" aria-label="Move up" ${i === 0 ? 'disabled style="opacity:.3"' : ''}>${ic('up')}</button>
          <button data-act="edMove" data-id="${e.id}" data-d="1" aria-label="Move down" ${i === day.exercises.length - 1 ? 'disabled style="opacity:.3"' : ''}>${ic('down')}</button></div></div>`;
    });
    h += `<button class="btn ghost" data-act="edAddEx">${ic('plus')} Add exercise</button>
      <button class="btn danger" style="margin-top:4px" data-act="edDelDay">${ic('trash')} Delete this day</button>`;
  } else {
    h += `<div class="card empty">No days yet. Tap <b>+ Add day</b>.</div>`;
  }

  h += `<div class="sect">Settings</div><div class="card" style="padding:6px 16px">
      <div class="switch" style="cursor:default"><span>Unit for new exercises<br><small class="mu">Both units always show while training</small></span><div class="seg" style="width:130px"><button class="${settings.unit === 'kg' ? 'on' : ''}" data-act="unit" data-u="kg">kg</button><button class="${settings.unit === 'lb' ? 'on' : ''}" data-act="unit" data-u="lb">lb</button></div></div>
      <div class="switch" style="cursor:default"><span>Exercise pictures<br><small class="mu">Tap the picture while training for a big photo</small></span><div class="seg" style="width:150px"><button class="${settings.pictures !== 'photo' ? 'on' : ''}" data-act="pics" data-v="drawing">Drawing</button><button class="${settings.pictures === 'photo' ? 'on' : ''}" data-act="pics" data-v="photo">Photo</button></div></div>
      <button class="switch ${settings.prefill ? 'on' : ''}" data-act="tog" data-k="prefill"><span>Start each set at last time's weight<br><small class="mu">Follows your increases set by set</small></span><span class="sw"></span></button>
      <button class="switch ${settings.sound ? 'on' : ''}" data-act="tog" data-k="sound"><span>Warning beeps during rest<br><small class="mu">3 beeps at 15 s, 2 at 10 s, 1 at 5 s, then a long one. Only sounds while the app is open on screen.</small></span><span class="sw"></span></button>
      <div class="switch" style="cursor:default"><span>Beep volume</span><div class="seg" style="width:200px"><button class="${settings.alarmVol === 'normal' ? 'on' : ''}" data-act="vol" data-v="normal">Normal</button><button class="${(settings.alarmVol || 'loud') === 'loud' ? 'on' : ''}" data-act="vol" data-v="loud">Loud</button><button class="${settings.alarmVol === 'max' ? 'on' : ''}" data-act="vol" data-v="max">Max</button></div></div>
      <div class="switch" style="cursor:default"><span>Try it with your music on<br><small class="mu">Plays the whole sequence (about 5 s)</small></span><button class="btn sm" data-act="testBeeps">Test beeps</button></div>
      <button class="switch ${settings.vibrate ? 'on' : ''}" data-act="tog" data-k="vibrate"><span>Vibrate (Android only)</span><span class="sw"></span></button>
      <button class="switch ${settings.awake ? 'on' : ''}" data-act="tog" data-k="awake"><span>Keep screen on during workout</span><span class="sw"></span></button></div>
    <button class="btn ghost" data-act="backupOpen">Backup &amp; restore</button>
    <button class="btn danger" data-act="resetAsk">Reset plan to the original spreadsheet</button></div>`;
  return h;
}

/* ---------- exercise editor sheets ---------- */
let exDraft = null;
function openExEditor(dayId, exId) {
  const day = findDay(dayId);
  if (exId) {
    const ex = day.exercises.find(e => e.id === exId);
    exDraft = { dayId, isNew: false, ex: clone(ex) };
  } else {
    exDraft = { dayId, isNew: true, ex: { id: uid(), lib: null, name: '', sets: 3, reps: '10-12', rest: 60, weight: 0, unit: settings.unit, step: 0.5, stepLb: 5, notes: '', timed: false, group: '' } };
  }
  showSheet(exEditorSheet);
}
function stepper(f, val, mode) {
  return `<div class="stepper"><button data-act="fstep" data-f="${f}" data-d="-1" aria-label="Less">${ic('minus')}</button>
    <input data-f="${f}" type="number" ${mode ? `inputmode="${mode}" ` : ''}step="any" value="${esc(val)}">
    <button data-act="fstep" data-f="${f}" data-d="1" aria-label="More">${ic('plus')}</button></div>`;
}
function exEditorSheet() {
  const e = exDraft.ex, L = libOf(e), u = unitOf(e);
  return `<div class="grab"></div><h3>${exDraft.isNew ? 'Add exercise' : 'Edit exercise'}</h3>
    <button class="opt" style="margin-top:10px" data-act="pickOpen">${L ? libThumb(L, '') : `<div class="ph">${ic('dumbbell')}</div>`}<div><div class="n">${L ? esc(L.name) : 'Choose exercise &amp; picture'}</div><div class="m">${L ? 'Tap to change the picture' : 'Tap to pick from the list'}</div></div></button>
    <div class="field"><label>Name</label><input data-f="name" value="${esc(e.name)}" placeholder="e.g. Incline Dumbbell Press" autocapitalize="words"></div>
    <div class="f2"><div class="field"><label>Sets</label>${stepper('sets', e.sets)}</div>
      <div class="field"><label>${e.timed ? 'Seconds' : 'Reps'}</label><input data-f="reps" value="${esc(e.reps)}" placeholder="8-10"></div></div>
    <div class="f2"><div class="field"><label>Rest (sec)</label>${stepper('rest', e.rest)}</div>
      <div class="field"><label>Weight (${u})</label>${stepper('weight', fmtIn(e.weight, u), '')}</div></div>
    <div class="f2"><div class="field"><label>Machine shows</label><div class="seg"><button class="${u === 'kg' ? 'on' : ''}" data-act="exUnit" data-u="kg">kg</button><button class="${u === 'lb' ? 'on' : ''}" data-act="exUnit" data-u="lb">lb</button></div></div>
      <div class="field"><label>+/− step (${u})</label><input data-f="stepdisp" type="number" step="any" value="${stepOf(e)}"></div></div>
    ${L ? '' : `<div class="field"><label>Muscle group</label><select data-f="group"><option value="">— for swap ideas —</option>${Object.entries(GROUPS).map(([k, v]) => `<option value="${k}" ${e.group === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>`}
    <div class="field"><label>Notes</label><input data-f="notes" value="${esc(e.notes)}" placeholder="Form tip (optional)"></div>
    <button class="switch ${e.timed ? 'on' : ''}" data-act="togTimed"><span>Timed hold (like a plank)</span><span class="sw"></span></button>
    <div class="row" style="margin-top:14px"><button class="btn ghost" data-act="closeSheet">Cancel</button><button class="btn primary" data-act="exSave">Save</button></div>
    ${exDraft.isNew ? '' : `<button class="btn danger" style="margin-top:10px" data-act="exDelete">${ic('trash')} Delete exercise</button>`}`;
}

let pickQ = '';
function pickList() {
  const q = pickQ.trim().toLowerCase();
  let h = '';
  Object.entries(GROUPS).forEach(([g, label]) => {
    const items = LIBRARY.filter(e => e.group === g && (!q || (e.name + ' ' + label + ' ' + (EQUIP[e.equip] || '')).toLowerCase().includes(q)));
    if (!items.length) return;
    h += `<div class="lbl" style="margin:12px 0 8px">${label}</div>` + items.map(e =>
      `<button class="opt ${exDraft.ex.lib === e.id ? 'cur' : ''}" data-act="pick" data-lib="${esc(e.id)}">${libThumb(e, '')}<div><div class="n">${esc(e.name)}</div><div class="m"><span class="badge">${esc(EQUIP[e.equip] || e.equip)}</span></div></div></button>`).join('');
  });
  return h || `<p class="empty">Nothing matches “${esc(pickQ)}”.</p>`;
}
function pickerSheet() {
  return `<div class="grab"></div><h3>Choose exercise</h3>
    <div class="field" style="margin-top:8px"><input id="pickSearch" type="search" placeholder="Search…" value="${esc(pickQ)}" autocomplete="off"></div>
    <button class="opt" data-act="pickNone"><div class="ph">${ic('dumbbell')}</div><div><div class="n">No picture (my own exercise)</div></div></button>
    <div id="pickList">${pickList()}</div>
    <button class="btn ghost" style="margin-top:6px" data-act="pickBack">Back</button>`;
}

function backupSheet() {
  return `<div class="grab"></div><h3>Backup &amp; restore</h3>
    <p class="sub2">Your plan, weights and history live only on this phone. Copy the backup text into Notes or an email to yourself. If you ever switch phones, paste it back here.</p>
    <button class="btn primary" data-act="copyBackup">Copy backup text</button>
    <div class="field" style="margin-top:16px"><label>Restore from backup</label><textarea id="restoreTxt" placeholder="Paste backup text here"></textarea></div>
    <div class="row"><button class="btn ghost" data-act="closeSheet">Close</button><button class="btn" data-act="restore">Restore</button></div>`;
}

/* =====================================================================
   Actions (one place for every button)
   ===================================================================== */
const A = {
  closeSheet: () => closeSheet(),
  goHome: () => setView('home'),
  goEditor: () => setView('editor'),
  goHistory: () => setView('history'),
  histToggle: b => { histOpen[b.dataset.id] = !histOpen[b.dataset.id]; render(); },
  confirmOk: () => { const cb = confirmCb; confirmCb = null; closeSheet(); if (cb) cb(); },

  start: b => {
    const go = () => startWorkout(b.dataset.day);
    if (session) confirmSheet('Replace current workout?', 'The workout in progress will be discarded.', 'Start new', true, go);
    else go();
  },
  resume: () => { unlockAudio(); requestWake(); setView('workout'); },
  discardAsk: () => confirmSheet('Discard workout?', 'Nothing from it will be saved to History.', 'Discard', true, discardSession),

  // Step in the unit the machine uses (so 5 lb really is 5 lb), then store as kg.
  wstep: b => {
    const ex = cur().ex, u = unitOf(ex);
    const next = Math.round((toUnit(ex.weight, u) + Number(b.dataset.d) * stepOf(ex)) * 1000) / 1000;
    setWeightKg(fromUnit(next, u));
  },
  wstepset: b => {
    const q = cur(), s = Number(b.dataset.s);
    if (unitOf(q.ex) === 'lb') q.ex.stepLb = s; else q.ex.step = s;
    persistEx(q); saveSession(); refreshWeightUI();
  },
  // ± turns "added weight" into "assisted" and back. From 0 it starts at one step assisted.
  wflip: () => { const ex = cur().ex; setWeightKg(ex.weight ? -ex.weight : -fromUnit(stepOf(ex), unitOf(ex))); },
  exHist: () => showSheet(exHistSheet),
  figOpen: () => showSheet(figSheet),
  pickDay: b => { selDayId = b.dataset.day; render(); },
  setDone: () => { unlockAudio(); setDone(); },
  holdStart: () => { unlockAudio(); session.holdStart = Date.now(); session.holdBeeped = false; saveSession(); render(); },
  skipRest: () => endRest(false),
  restAdj: b => {
    const s = session, d = Number(b.dataset.d);
    s.restEnd += d * 1000; s.restTotal = Math.max(5, s.restTotal + d);
    const left = Math.ceil((s.restEnd - Date.now()) / 1000);
    s.fired = { 5: left <= 5, 10: left <= 10, 15: left <= 15 }; // +15 s re-arms the warnings that are ahead again
    saveSession();
    if (s.restEnd - Date.now() <= 0) endRest(false); else onTick();
  },
  undo: () => undoLast(),

  endAsk: () => showSheet(endSheet),
  endSave: () => { closeSheet(); finishLine(); },
  discardNow: () => discardSession(),
  finishSave: () => finishSave(),

  listOpen: () => showSheet(listSheet),
  jump: b => {
    session.idx = Number(b.dataset.i); session.holdStart = 0;
    if (session.phase === 'done') session.phase = 'work';
    saveSession(); closeSheet(); render();
  },
  busyOpen: () => { busyAll = false; showSheet(busySheet); },
  busyMore: () => { busyAll = true; refreshSheet(); },
  swap: b => swapTo(b.dataset.lib),
  revert: () => revertSwap(),
  later: () => doLater(),

  /* editor */
  edTab: b => { edDay = b.dataset.id; render(); },
  edAddDay: () => {
    const d = { id: uid(), name: 'New day', weekday: null, exercises: [] };
    plan.days.push(d); savePlan(); edDay = d.id; render();
  },
  edDelDay: () => {
    const day = findDay(edDay);
    confirmSheet('Delete “' + day.name + '”?', 'The day and its exercises will be removed from the plan.', 'Delete', true, () => {
      plan.days = plan.days.filter(d => d.id !== day.id); savePlan(); edDay = plan.days[0] && plan.days[0].id; render();
    });
  },
  edEx: b => openExEditor(edDay, b.dataset.id),
  edAddEx: () => openExEditor(edDay, null),
  edMove: b => {
    const day = findDay(edDay), i = day.exercises.findIndex(e => e.id === b.dataset.id), j = i + Number(b.dataset.d);
    if (j < 0 || j >= day.exercises.length) return;
    [day.exercises[i], day.exercises[j]] = [day.exercises[j], day.exercises[i]];
    savePlan(); render();
  },
  unit: b => { settings.unit = b.dataset.u; saveSettings(); render(); },
  pics: b => { settings.pictures = b.dataset.v; saveSettings(); render(); },
  vol: b => { settings.alarmVol = b.dataset.v; saveSettings(); render(); unlockAudio(); beeps(1); }, // one beep to preview the level
  testBeeps: () => testBeeps(),
  tog: b => { const k = b.dataset.k; settings[k] = !settings[k]; saveSettings(); render(); },
  resetAsk: () => confirmSheet('Reset the plan?', 'This puts back the 5 days from your spreadsheet. Your weights for each exercise will be cleared. History is kept.', 'Reset plan', true, () => {
    plan = clone(DEFAULT_PLAN); savePlan(); edDay = plan.days[0].id; render(); toast('Plan reset');
  }),

  fstep: b => {
    const f = b.dataset.f, d = Number(b.dataset.d), e = exDraft.ex;
    const inp = $(`#sheet input[data-f="${f}"]`);
    if (f === 'weight') {
      const u = unitOf(e);
      e.weight = fromUnit(Math.round((toUnit(Number(e.weight) || 0, u) + d * stepOf(e)) * 1000) / 1000, u);
      if (inp) inp.value = fmtIn(e.weight, u);
      return;
    }
    let v = (Number(e[f]) || 0) + d * (f === 'rest' ? 15 : 1);
    v = f === 'sets' ? Math.max(1, Math.round(v)) : Math.max(0, v);
    e[f] = v;
    if (inp) inp.value = v;
  },
  exUnit: b => { exDraft.ex.unit = b.dataset.u; refreshSheet(); },
  togTimed: () => { exDraft.ex.timed = !exDraft.ex.timed; refreshSheet(); },
  pickOpen: () => { pickQ = ''; showSheet(pickerSheet); },
  pickBack: () => showSheet(exEditorSheet),
  pickNone: () => { exDraft.ex.lib = null; showSheet(exEditorSheet); },
  pick: b => {
    const L = LIB[b.dataset.lib], e = exDraft.ex, old = libOf(e);
    if (!e.name.trim() || (old && e.name === old.name)) e.name = L.name;
    if (exDraft.isNew) { e.timed = L.pattern === 'plank'; if (e.timed) e.reps = '45-60'; }
    e.lib = L.id; e.group = '';
    if (exDraft.isNew && lastW[L.id]) e.weight = lastW[L.id];
    if (exDraft.isNew && lastU[L.id]) e.unit = lastU[L.id];
    showSheet(exEditorSheet);
  },
  exSave: () => {
    const e = exDraft.ex, day = findDay(exDraft.dayId), L = libOf(e);
    e.name = e.name.trim() || (L ? L.name : 'Exercise');
    e.sets = Math.max(1, Math.round(Number(e.sets) || 1));
    e.rest = Math.max(0, Math.round(Number(e.rest) || 0));
    e.weight = Number(e.weight) || 0;
    e.unit = unitOf(e);
    e.step = Number(e.step) > 0 ? Number(e.step) : 0.5;
    e.stepLb = Number(e.stepLb) > 0 ? Number(e.stepLb) : 5;
    e.reps = String(e.reps || '').trim();
    if (exDraft.isNew) day.exercises.push(e);
    else { const i = day.exercises.findIndex(x => x.id === e.id); if (i >= 0) day.exercises[i] = e; }
    lastW[keyOf(e)] = e.weight; lastU[keyOf(e)] = e.unit; saveW(); saveU();
    savePlan(); closeSheet(); render();
  },
  exDelete: () => {
    const e = exDraft.ex, day = findDay(exDraft.dayId);
    confirmSheet('Delete “' + e.name + '”?', 'It will be removed from this day.', 'Delete', true, () => {
      day.exercises = day.exercises.filter(x => x.id !== e.id); savePlan(); render();
    });
  },

  backupOpen: () => showSheet(backupSheet),
  copyBackup: async () => {
    const txt = JSON.stringify({ app: 'gym-workout', v: 2, plan, settings, weights: lastW, units: lastU, history });
    try { await navigator.clipboard.writeText(txt); toast('Backup copied'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Backup copied'); } catch (e2) { toast('Could not copy'); }
      ta.remove();
    }
  },
  restore: () => {
    const raw = ($('#restoreTxt') || {}).value || '';
    try {
      let d = JSON.parse(raw);
      if (d.app !== 'gym-workout' || !d.plan || !Array.isArray(d.plan.days)) throw new Error('bad');
      if (!(d.v >= 2)) d = convertLegacy(d); // backup from the first version of the app
      plan = d.plan; savePlan();
      if (d.settings) { settings = Object.assign(settings, d.settings); saveSettings(); }
      if (d.weights) { lastW = d.weights; saveW(); }
      if (d.units) { lastU = d.units; saveU(); }
      if (Array.isArray(d.history)) { history = d.history; saveHistory(); }
      edDay = plan.days[0] && plan.days[0].id;
      closeSheet(); render(); toast('Backup restored');
    } catch (e) { toast('That text is not a valid backup'); }
  }
};

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const fn = A[b.dataset.act];
  if (fn) fn(b, e);
});

/* typing in fields */
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'pickSearch') { pickQ = t.value; $('#pickList').innerHTML = pickList(); return; }
  if (t.id === 'dayName') { const d = findDay(edDay); if (d) { d.name = t.value; savePlan(); } return; }
  if (t.dataset && t.dataset.f && exDraft) {
    const f = t.dataset.f, ex = exDraft.ex, num = parseFloat(String(t.value).replace(',', '.'));
    if (f === 'weight') ex.weight = fromUnit(Number.isFinite(num) ? num : 0, unitOf(ex)); // typed in the exercise's unit
    else if (f === 'stepdisp') { if (num > 0) { if (unitOf(ex) === 'lb') ex.stepLb = num; else ex.step = num; } }
    else ex[f] = t.value;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  const typed = parseFloat(String(t.value).replace(',', '.'));
  if (t.id === 'wk') { setWeightKg(typed); return; }
  if (t.id === 'wl') { setWeightKg(typed * LB); return; }
  if (t.id === 'dayWd') { const d = findDay(edDay); if (d) { d.weekday = t.value === '' ? null : Number(t.value); savePlan(); } return; }
  if (t.dataset && t.dataset.f === 'group' && exDraft) exDraft.ex.group = t.value;
});
// Touching a weight box also chooses which unit the − / + buttons and step chips use.
document.addEventListener('focusin', e => {
  const id = e.target.id;
  if (id === 'wk' || id === 'wl') { setActiveUnit(id === 'wl' ? 'lb' : 'kg'); setTimeout(() => e.target.select(), 0); }
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.target.id === 'wk' || e.target.id === 'wl')) e.target.blur(); });

/* =====================================================================
   Start-up
   ===================================================================== */
render();
if (view === 'workout' && session) requestWake();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline mode unavailable; app still works online */ });
}

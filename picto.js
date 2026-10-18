/* Pictograms: little stick figures that move between the start and the end of an exercise.
   Drawn from a few joint angles, so there are no picture files to download.

   Side view (default): the figure faces right.
     hip: [x, y]        torso: degrees leaning forward from straight up (negative = leaning back / lying)
     arm / leg:         { a, b }  absolute angle of upper + lower segment, 0 = straight down, 90 = forward, 180 = up
                   or   { to: [x, y], bend: 1 | -1 }  reach a point (hand / foot) and let the elbow / knee bend
     arm2 / leg2:       the far limb, drawn dimmer
   Front view ({ view: 'front' }): arm / leg = { a, b } for the right side, mirrored for the left;
     angles are 0 = straight down, positive = outward.

   Props (bars, benches, cables ...) are listed per exercise; `at` pins one to hand / foot / etc. */
const PICTO = (() => {
  const L = { torso: 26, neck: 4, head: 6, ua: 14, fa: 13, th: 20, sh: 19, foot: 7, shw: 9, hpw: 5 };
  const R = d => d * Math.PI / 180;
  const down = (deg, len) => [Math.sin(R(deg)) * len, Math.cos(R(deg)) * len];
  const up = (deg, len) => [Math.sin(R(deg)) * len, -Math.cos(R(deg)) * len];
  const add = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const f1 = n => Math.round(n * 10) / 10;
  const P = arr => arr.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');

  // two-bone reach: where does the middle joint (elbow / knee) go to reach `target`?
  function ik(root, target, l1, l2, bend) {
    const dx = target[0] - root[0], dy = target[1] - root[1];
    const d = Math.hypot(dx, dy) || 0.001;
    const dc = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.5), l1 + l2 - 0.01);
    const base = Math.atan2(dy, dx);
    const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc))));
    const mid = [root[0] + l1 * Math.cos(base + bend * a), root[1] + l1 * Math.sin(base + bend * a)];
    return [mid, [root[0] + dc * dx / d, root[1] + dc * dy / d]];
  }
  function limb(root, s, l1, l2, defBend) {
    if (!s) return null;
    if (s.to) { const [mid, end] = ik(root, s.to, l1, l2, s.bend == null ? defBend : s.bend); return [root, mid, end]; }
    const mid = add(root, down(s.a, l1));
    return [root, mid, add(mid, down(s.b, l2))];
  }

  // smooth blend of two poses
  function lerp(a, b, t) {
    if (typeof a === 'number') return typeof b === 'number' ? a + (b - a) * t : a;
    if (Array.isArray(a)) return a.map((v, i) => lerp(v, b ? b[i] : v, t));
    if (a && typeof a === 'object') { const o = {}; for (const k in a) o[k] = k === 'bend' || !b || !(k in b) ? a[k] : lerp(a[k], b[k], t); return o; }
    return a;
  }

  /* ---------- drawing ---------- */
  function poly(cls, pts) { return `<polyline class="${cls}" points="${P(pts)}"/>`; }

  function solveSide(p) {
    const hip = p.hip, ta = p.torso || 0;
    const sh = add(hip, up(ta, L.torso));
    const head = add(sh, up(ta + (p.neck || 0), L.neck + L.head));
    const legs = [p.leg2, p.leg].map(s => limb(hip, s, L.th, L.sh, -1));
    const arms = [p.arm2, p.arm].map(s => limb(sh, s, L.ua, L.fa, 1));
    const toe = (lg, s) => lg && add(lg[2], down((s.foot == null ? 90 : s.foot), L.foot));
    const J = { hip, sh, head, hand: arms[1] && arms[1][2], hand2: arms[0] && arms[0][2], elbow: arms[1] && arms[1][1],
      foot: legs[1] && legs[1][2], foot2: legs[0] && legs[0][2], knee: legs[1] && legs[1][1] };
    return { J, legs, arms, toes: [toe(legs[0], p.leg2 || {}), toe(legs[1], p.leg || {})], sh, head, hip };
  }

  function solveFront(p) {
    const hip = p.hip, lean = p.torso || 0;
    const sh = add(hip, up(lean, L.torso));
    const head = add(sh, up(lean, L.neck + L.head));
    const side = (c, dir, spec, l1, l2) => { if (!spec) return null; const m = add(c, [dir * Math.sin(R(spec.a)) * l1, Math.cos(R(spec.a)) * l1]); return [c, m, add(m, [dir * Math.sin(R(spec.b)) * l2, Math.cos(R(spec.b)) * l2])]; };
    const sl = [sh[0] - L.shw, sh[1]], sr = [sh[0] + L.shw, sh[1]], hl = [hip[0] - L.hpw, hip[1]], hr = [hip[0] + L.hpw, hip[1]];
    const aR = p.armR || p.arm, aL = p.armL || p.arm, lR = p.legR || p.leg, lL = p.legL || p.leg;
    const arms = [side(sl, -1, aL, L.ua, L.fa), side(sr, 1, aR, L.ua, L.fa)];
    const legs = [side(hl, -1, lL, L.th, L.sh), side(hr, 1, lR, L.th, L.sh)];
    const J = { hip, sh, head, hand: arms[1] && arms[1][2], hand2: arms[0] && arms[0][2], foot: legs[1] && legs[1][2], foot2: legs[0] && legs[0][2] };
    return { J, legs, arms, sl, sr, hl, hr, sh, head, hip };
  }

  function prop(pr, J) {
    const at = pr.at ? J[pr.at] : null;
    if (pr.at && !at) return '';
    const o = pr.o || [0, 0];
    const rel = pt => (at ? [at[0] + pt[0] + o[0], at[1] + pt[1] + o[1]] : pt);
    switch (pr.k) {
      case 'bb': { const c = rel([0, 0]); return `<circle class="pl" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${pr.r || 7}"/><circle class="pd" cx="${f1(c[0])}" cy="${f1(c[1])}" r="2"/>`; }
      case 'db': { const c = rel([0, 0]); return `<circle class="pw" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${pr.r || 4.4}"/>`; }
      case 'line': return poly('p' + (pr.w ? ' w' + pr.w : ''), pr.pts.map(rel));
      case 'rect': { const c = rel([pr.x, pr.y]); return `<rect class="pf" x="${f1(c[0])}" y="${f1(c[1])}" width="${pr.w}" height="${pr.h}" rx="${pr.rx == null ? 2 : pr.rx}"/>`; }
      case 'dot': { const c = rel(pr.c || [0, 0]); return `<circle class="pf" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${pr.r || 2}"/>`; }
      case 'cable': { const c = rel([0, 0]); return `<polyline class="p cb" points="${P([pr.from, c])}"/><circle class="p" cx="${pr.from[0]}" cy="${pr.from[1]}" r="2.6"/>`; }
      case 'circle': { const c = rel(pr.c || [0, 0]); return `<circle class="p w3" cx="${f1(c[0])}" cy="${f1(c[1])}" r="${pr.r || 6}"/>`; }
      case 'arrow': return `<path class="pa" d="${pr.d}"/>`;
      default: return '';
    }
  }

  function render(spec, t) {
    const a = spec.a, b = spec.b || spec.a;
    const pose = t > 0 && spec.b ? lerp(a, b, t) : a;
    const S = spec.view === 'front' ? solveFront(pose) : solveSide(pose);
    const props = spec.props || [];
    const back = props.filter(pr => !pr.front).map(pr => prop(pr, S.J)).join('');
    const front = props.filter(pr => pr.front).map(pr => prop(pr, S.J)).join('');
    let body = '';
    if (spec.view === 'front') {
      body += S.legs.map(l => l && poly('b', l)).join('');
      body += poly('b', [S.hip, S.sh]) + poly('b', [S.sl, S.sr]) + poly('b', [S.hl, S.hr]);
      body += S.arms.map(l => l && poly('b', l)).join('');
    } else {
      body += S.legs[0] ? poly('b2', [S.legs[0][0], S.legs[0][1], S.legs[0][2], S.toes[0]]) : '';
      body += S.arms[0] ? poly('b2', S.arms[0]) : '';
      body += S.legs[1] ? poly('b', [S.legs[1][0], S.legs[1][1], S.legs[1][2], S.toes[1]]) : '';
      body += poly('b', [S.hip, S.sh]);
      body += S.arms[1] ? poly('b', S.arms[1]) : '';
    }
    const head = `<circle class="hd" cx="${f1(S.head[0])}" cy="${f1(S.head[1])}" r="${L.head}"/>`;
    const floor = spec.floor === false ? '' : `<line class="fl" x1="6" y1="92" x2="144" y2="92"/>`;
    return floor + back + body + head + front;
  }

  // Zoom each drawing to fit its tile: measure everything drawn across the movement, then frame it at 3:2.
  function viewBox(spec) {
    if (spec._vb) return spec._vb;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const upd = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
    [0, 0.5, 1].forEach(t => {
      const s = render(spec, spec.b ? t : 0);
      for (const m of s.matchAll(/points="([^"]+)"/g)) m[1].split(' ').forEach(p => { const [x, y] = p.split(',').map(Number); upd(x - 2.5, y - 2.5); upd(x + 2.5, y + 2.5); });
      for (const m of s.matchAll(/<circle[^>]*cx="([-\d.]+)" cy="([-\d.]+)" r="([-\d.]+)"/g)) { const r = +m[3]; upd(+m[1] - r, +m[2] - r); upd(+m[1] + r, +m[2] + r); }
      for (const m of s.matchAll(/<rect[^>]*x="([-\d.]+)" y="([-\d.]+)" width="([-\d.]+)" height="([-\d.]+)"/g)) { upd(+m[1], +m[2]); upd(+m[1] + +m[3], +m[2] + +m[4]); }
    });
    if (spec.floor !== false) y1 = Math.max(y1, 93.5);
    const pad = 4;
    let H = y1 - y0 + 2 * pad, W = H * 1.5;
    if (x1 - x0 + 2 * pad > W) { W = x1 - x0 + 2 * pad; H = W / 1.5; }
    const vx = (x0 + x1) / 2 - W / 2, vy = y1 + pad - H;
    return (spec._vb = [vx, vy, W, H].map(n => Math.round(n * 10) / 10).join(' '));
  }
  const svg = (spec, t, cls, key) => `<svg class="pg ${cls || ''}" viewBox="${viewBox(spec)}"${key ? ` data-pk="${key}"` : ''} aria-hidden="true">${render(spec, t || 0)}</svg>`;

  // one shared animation clock for every moving pictogram on screen
  const ease = x => x * x * (3 - 2 * x);
  function phase(ms) {
    const p = (ms % 2600) / 2600;
    if (p < 0.12) return 0;
    if (p < 0.47) return ease((p - 0.12) / 0.35);
    if (p < 0.59) return 1;
    if (p < 0.94) return 1 - ease((p - 0.59) / 0.35);
    return 0;
  }
  let timer = null, last = 0;
  function tick(now) {
    const els = document.querySelectorAll('svg.pg[data-pk]');
    if (!els.length) { timer = null; return; }
    if (now - last >= 33) { // about 30 frames a second is plenty and saves battery
      last = now;
      const t = phase(now);
      els.forEach(el => { const s = PICTO.specs[el.dataset.pk]; if (s && s.b) el.innerHTML = render(s, t); });
    }
    timer = requestAnimationFrame(tick);
  }
  function start() { if (!timer) timer = requestAnimationFrame(tick); }

  return { svg, render, start, specs: {}, map: {}, L };
})();

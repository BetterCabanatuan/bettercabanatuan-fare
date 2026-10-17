// Frame-deterministic motion core. Every visual is a pure function of time t (seconds).
const W = 1920, H = 1080, FPS = 60, DURATION = 30;
const C = {
  blue: '#1B3F8B', deep: '#0C2459', night: '#081A42', logo: '#0032A0', yellow: '#F5C518',
  cream: '#FFF4D6', ink: '#15181C', teal: '#0F766E', orange: '#C2410C', grey: '#6B7280', panel: '#fbfbfb',
};
const stage = document.getElementById('stage');

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (a, b, t) => Array.isArray(a) ? a.map((v, i) => lerp(v, b[i], t)) : lerp(a, b, t);
function cubic(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
  const dx = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) { const e = sx(t) - x; const d = dx(t); if (Math.abs(e) < 1e-6 || !d) break; t -= e / d; }
    return sy(clamp(t));
  };
}
const E = {
  out: cubic(0.16, 1, 0.3, 1),        // expo-ish entrance
  out2: cubic(0.22, 1, 0.36, 1),
  in: cubic(0.7, 0, 0.84, 0),          // exits
  inOut: cubic(0.65, 0, 0.35, 1),      // camera moves
  soft: cubic(0.4, 0, 0.2, 1),
  lin: x => x,
  back: x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
};
const prog = (t, a, b, ease = E.out) => ease(clamp((t - a) / (b - a)));
function kf(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, ease] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t <= t1) return mix(v0, v1, (ease || E.inOut)(clamp((t - t0) / (t1 - t0))));
  }
  return keys[keys.length - 1][1];
}
// Damped spring step response: 0 -> 1 with overshoot.
function spring(t, t0, freq = 2.4, damp = 0.42) {
  const x = t - t0; if (x <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * x) * (Math.cos(wd * x) + (damp * w / wd) * Math.sin(wd * x));
}
const win = (t, a, b) => t >= a && t < b;

// ---------- DOM ----------
function el(tag, css = {}, parent = stage, html) {
  const e = document.createElement(tag);
  e.style.position = 'absolute'; e.style.left = '0'; e.style.top = '0';
  Object.assign(e.style, css);
  if (html !== undefined) e.innerHTML = html;
  parent.appendChild(e);
  return e;
}
function svgEl(tag, attrs = {}, parent) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function img(src, w, parent, css = {}) {
  const i = el('img', { width: w + 'px', ...css }, parent); i.src = src; return i;
}
const cache = new WeakMap();
function set(e, props) {
  let c = cache.get(e); if (!c) { c = {}; cache.set(e, c); }
  for (const k in props) { const v = props[k]; if (c[k] !== v) { c[k] = v; e.style[k] = v; } }
}
function show(e, on) { set(e, { display: on ? '' : 'none' }); }
const px = v => v.toFixed(2) + 'px';
const tr = (x, y, s = 1, r = 0) => `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${r.toFixed(3)}deg) scale(${s.toFixed(4)})`;

// ---------- Web Mercator camera (matches MapLibre, 512px tiles) ----------
function wm(ll, z) {
  const s = 512 * Math.pow(2, z), r = ll[1] * Math.PI / 180;
  return [(ll[0] + 180) / 360 * s, (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * s];
}
function unwm(p, z) {
  const s = 512 * Math.pow(2, z);
  const lng = p[0] / s * 360 - 180;
  const n = Math.PI - 2 * Math.PI * p[1] / s;
  return [lng, 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)))];
}
function projector(cam, w, h) {
  const c = wm(cam.center, cam.zoom);
  return ll => { const p = wm(ll, cam.zoom); return [w / 2 + p[0] - c[0], h / 2 + p[1] - c[1]]; };
}
// Zoom between two cameras keeping the destination point gliding smoothly to centre.
function flyCam(a, b, p) {
  const z = lerp(a.zoom, b.zoom, p);
  const A = wm(a.center, 0), B = wm(b.center, 0);
  const d0 = [(A[0] - B[0]) * Math.pow(2, a.zoom), (A[1] - B[1]) * Math.pow(2, a.zoom)];
  const k = Math.pow(2, z);
  const c = [B[0] + d0[0] * (1 - p) / k, B[1] + d0[1] * (1 - p) / k];
  return { center: unwm(c, 0), zoom: z };
}

// ---------- polyline helpers ----------
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
function partial(pts, f) {
  if (f >= 1) return { pts, head: pts[pts.length - 1] };
  const L = polyLen(pts) * clamp(f); let acc = 0; const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const s = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + s >= L) { const u = s ? (L - acc) / s : 0; const h = [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)]; out.push(h); return { pts: out, head: h }; }
    acc += s; out.push(pts[i]);
  }
  return { pts: out, head: pts[pts.length - 1] };
}
const dOf = pts => pts.length ? 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') : 'M0 0';
function pointAt(pts, f) { return partial(pts, f).head; }

// ---------- components ----------
// Browser window. Content area is 1440x900 CSS px, like the captures.
function makeBrowser(parent) {
  const root = el('div', { width: '1440px', height: '944px', transformOrigin: '0 0', borderRadius: '16px', overflow: 'hidden', background: '#fff',
    boxShadow: '0 60px 120px -30px rgba(3,10,30,.65), 0 30px 60px -30px rgba(3,10,30,.5), 0 0 0 1px rgba(255,255,255,.08)', willChange: 'transform' }, parent);
  const bar = el('div', { width: '1440px', height: '44px', background: '#EEF0F4', borderBottom: '1px solid #DADFE6', boxSizing: 'border-box' }, root);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => el('div', { left: 18 + i * 20 + 'px', top: '16px', width: '12px', height: '12px', borderRadius: '50%', background: c }, bar));
  const pill = el('div', { left: '420px', top: '8px', width: '600px', height: '28px', borderRadius: '8px', background: '#fff', boxShadow: 'inset 0 0 0 1px #E2E6EC', overflow: 'hidden' }, bar);
  el('div', { left: '12px', top: '7px', width: '14px', height: '14px' }, pill, '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6B7280" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>');
  const url = el('div', { left: '34px', top: '0', height: '28px', lineHeight: '28px', fontSize: '13px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap', letterSpacing: '0.01em' }, pill);
  const content = el('div', { top: '44px', width: '1440px', height: '900px', overflow: 'hidden', background: '#fff' }, root);
  return { root, content, url, setUrl(s) { if (url.textContent !== s) url.textContent = s; } };
}
// Place a browser so content point (fx, fy) sits at screen (tx, ty), zoomed by z.
const BASE = 0.94;
function focusCam(fx, fy, z, tx = W / 2, ty = 504) {
  const s = BASE * z;
  return { x: tx - s * (fx - 720), y: ty - s * (fy + 44 - 472), s };
}
function placeBrowser(b, cam, rot = {}) {
  const { rx = 0, ry = 0, rz = 0, op = 1, blur = 0 } = rot;
  set(b.root, {
    transform: `translate3d(${cam.x.toFixed(2)}px,${cam.y.toFixed(2)}px,0) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${cam.s.toFixed(4)}) translate(-720px,-472px)`,
    opacity: op.toFixed(3), filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none',
  });
}

const CURSOR_SVG = '<svg width="30" height="36" viewBox="-2 -2 22 28"><path d="M0 0L0 20.5L5.2 15.8L8.6 23.6L12 22.1L8.7 14.6L15.6 14.4Z" fill="#fff" stroke="#111" stroke-width="1.5" stroke-linejoin="round"/></svg>';
function makeCursor(parent) {
  const c = el('div', { width: '30px', height: '36px', transformOrigin: '2px 2px', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,.28))', zIndex: 50 }, parent, CURSOR_SVG);
  const ring = el('div', { width: '60px', height: '60px', marginLeft: '-30px', marginTop: '-30px', borderRadius: '50%', border: '3px solid rgba(27,63,139,.55)', boxSizing: 'border-box', zIndex: 49 }, parent);
  // path: [[t, x, y], ...]; clicks: [t, ...]
  return {
    update(t, path, clicks, z = 1, vis = 1) {
      const p = kf(t, path.map(([tt, x, y, e]) => [tt, [x, y], e || E.inOut]));
      // Slight arc between waypoints so the hand reads as human.
      let arc = 0;
      for (let i = 1; i < path.length; i++) if (t > path[i - 1][0] && t < path[i][0]) { const u = (t - path[i - 1][0]) / (path[i][0] - path[i - 1][0]); arc = Math.sin(Math.PI * u) * Math.min(40, Math.hypot(path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]) * 0.12); }
      let press = 1, rr = 0, ro = 0;
      for (const ct of clicks) {
        if (t > ct - 0.08 && t < ct + 0.22) press = Math.min(press, 1 - 0.18 * Math.sin(Math.PI * clamp((t - ct + 0.08) / 0.3)));
        if (t >= ct && t < ct + 0.55) { const u = (t - ct) / 0.55; rr = E.out(u); ro = 1 - u; }
      }
      const inv = 1 / z;
      set(c, { transform: tr(p[0], p[1] - arc, press * inv), opacity: vis.toFixed(3) });
      set(ring, { transform: `translate3d(${p[0]}px,${p[1] - arc}px,0) scale(${(0.2 + rr * 0.9) * inv})`, opacity: (ro * vis).toFixed(3) });
    },
  };
}

// Map view: stacked plates + SVG overlay, driven by a camera in lng/lat + zoom.
function makeMap(parent, w, h, plates) {
  const box = el('div', { width: w + 'px', height: h + 'px', overflow: 'hidden', background: '#f2f2f0' }, parent);
  const imgs = plates.map(p => { const i = el('img', { width: p.w + 'px', transformOrigin: '0 0', willChange: 'transform,opacity' }, box); i.src = 'cap/' + p.name + '.png'; return { ...p, i }; });
  const svg = svgEl('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
  svg.style.position = 'absolute'; svg.style.left = '0'; svg.style.top = '0'; svg.style.overflow = 'visible';
  box.appendChild(svg);
  const over = el('div', { width: w + 'px', height: h + 'px' }, box);
  return {
    box, svg, over, w, h,
    render(cam) {
      const P = projector(cam, w, h);
      imgs.forEach((p, idx) => {
        const k = Math.pow(2, cam.zoom - p.zoom);
        const c = P(p.center);
        const L = c[0] - p.w / 2 * k, T = c[1] - p.h / 2 * k, R = L + p.w * k, B = T + p.h * k;
        const unc = Math.max(0, L) + Math.max(0, T) + Math.max(0, w - R) + Math.max(0, h - B);
        const a = idx === 0 ? 1 : clamp((k - 0.62) / 0.22) * clamp(1 - unc / 24);
        set(p.i, { transform: `translate3d(${L.toFixed(2)}px,${T.toFixed(2)}px,0) scale(${k.toFixed(5)})`, opacity: a.toFixed(3), display: a > 0.002 ? '' : 'none' });
      });
      return P;
    },
  };
}
// A line with optional white casing, drawn on progressively.
function makeLine(svg, { color, width, casing = 0, opacity = 1, dash }) {
  const g = svgEl('g', {}, svg);
  const cs = casing ? svgEl('path', { fill: 'none', stroke: '#fff', 'stroke-width': casing, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g) : null;
  const p = svgEl('path', { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity }, g);
  if (dash) p.setAttribute('stroke-dasharray', dash);
  return {
    g, p,
    draw(pts, f = 1, op = 1, w2) {
      const part = partial(pts, f); const d = f <= 0 ? 'M0 0' : dOf(part.pts);
      p.setAttribute('d', d); if (cs) cs.setAttribute('d', d);
      g.setAttribute('opacity', (f <= 0 ? 0 : op).toFixed(3));
      if (w2 !== undefined) p.setAttribute('stroke-width', w2);
      return part.head;
    },
  };
}
// A/B pins exactly like the app's PinIcon.
function makePin(parent, which, size = 32) {
  const a = which === 'A';
  const wrap = el('div', { width: size + 'px', height: size + 'px', marginLeft: -size / 2 + 'px', marginTop: -size / 2 + 'px' }, parent);
  const shadow = el('div', { left: '3px', top: size - 4 + 'px', width: size - 6 + 'px', height: '8px', borderRadius: '50%', background: 'rgba(0,0,0,.25)', filter: 'blur(3px)' }, wrap);
  const ring = el('div', { left: '0', top: '0', width: size + 'px', height: size + 'px', borderRadius: '50%', border: `2px solid ${a ? C.ink : C.yellow}`, boxSizing: 'border-box' }, wrap);
  const dot = el('div', { width: size + 'px', height: size + 'px', borderRadius: '50%', background: a ? C.ink : C.yellow, color: a ? '#fff' : C.ink,
    boxShadow: `0 0 0 2px ${a ? '#fff' : C.ink}, 0 4px 8px rgba(0,0,0,.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: size * 0.44 + 'px' }, wrap, which);
  return {
    wrap,
    // Drop from above with squash on landing and a shockwave ring.
    update(t, t0, x, y, vis = 1) {
      const fall = prog(t, t0, t0 + 0.32, E.in);
      const land = t - (t0 + 0.32);
      const sq = land > 0 ? Math.exp(-land * 9) * Math.sin(land * 30) * 0.22 : 0;
      const yOff = -(1 - fall) * 70;
      const sx = 1 + sq, sy = 1 - sq;
      const op = (t >= t0 ? 1 : 0) * vis;
      set(wrap, { transform: `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`, opacity: op.toFixed(3) });
      set(dot, { transform: `translateY(${yOff.toFixed(2)}px) scale(${sx.toFixed(3)},${sy.toFixed(3)})`, transformOrigin: '50% 100%' });
      set(shadow, { opacity: (0.3 + 0.7 * fall).toFixed(3), transform: `scale(${(0.5 + 0.5 * fall).toFixed(3)})` });
      const r = clamp(land / 0.6);
      set(ring, { opacity: land > 0 ? (1 - r).toFixed(3) : '0', transform: `scale(${1 + r * 1.8})` });
    },
  };
}

// Slot-style odometer. Digits roll with a vertical motion blur proportional to speed.
let filterId = 0;
const defs = (() => { const s = svgEl('svg', { width: 0, height: 0 }); s.style.position = 'absolute'; document.body.appendChild(s); return svgEl('defs', {}, s); })();
function makeOdometer(parent, { size = 48, weight = 700, color = C.yellow, ls = -1.2, prefix = '₱', digits = '00.00' }) {
  const box = el('div', { height: size + 'px', lineHeight: size + 'px', fontSize: size + 'px', fontWeight: weight, color, letterSpacing: ls + 'px', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', display: 'flex' }, parent);
  box.style.position = 'absolute';
  const mk = txt => { const s = document.createElement('span'); s.textContent = txt; s.style.display = 'inline-block'; box.appendChild(s); return s; };
  if (prefix) mk(prefix);
  const cols = [];
  for (const ch of digits) {
    if (ch === '.' || ch === ',') { mk(ch); continue; }
    const wrap = document.createElement('span');
    Object.assign(wrap.style, { display: 'inline-block', position: 'relative', overflow: 'hidden', height: size + 'px' });
    const sizer = document.createElement('span'); sizer.textContent = '0'; sizer.style.visibility = 'hidden'; wrap.appendChild(sizer);
    const strip = document.createElement('span');
    Object.assign(strip.style, { position: 'absolute', left: '0', top: '0', display: 'flex', flexDirection: 'column' });
    for (let k = 0; k < 40; k++) { const d = document.createElement('span'); d.textContent = String(k % 10); d.style.height = size + 'px'; strip.appendChild(d); }
    wrap.appendChild(strip); box.appendChild(wrap);
    const id = 'mb' + (filterId++);
    const f = svgEl('filter', { id, x: '-20%', y: '-50%', width: '140%', height: '200%' }, defs);
    const g = svgEl('feGaussianBlur', { stdDeviation: '0 0' }, f);
    cols.push({ strip, g, id, last: null });
  }
  return {
    box, cols,
    // pos[i] is a float digit position (can exceed 9: wraps visually), vel in digits/sec for blur.
    setCols(pos, vel) {
      cols.forEach((c, i) => {
        const p = ((pos[i] % 10) + 10) % 10 + 10;
        set(c.strip, { transform: `translateY(${(-p * size).toFixed(2)}px)` });
        const b = Math.min(10, Math.abs(vel[i] || 0) * size * 0.006);
        c.g.setAttribute('stdDeviation', `0 ${b.toFixed(2)}`);
        set(c.strip, { filter: b > 0.2 ? `url(#${c.id})` : 'none' });
      });
    },
  };
}
// Roll each column from 'from' to 'to' digit with extra spins, staggered right-to-left.
function odoRoll(odo, t, t0, dur, from, to, spins, stagger = 0.06) {
  const n = odo.cols.length, pos = [], vel = [];
  for (let i = 0; i < n; i++) {
    const s = t0 + (n - 1 - i) * stagger;
    const total = (to[i] - from[i] + 10) % 10 + 10 * (spins[i] || 0);
    const u = clamp((t - s) / dur), e = E.out(u);
    const e2 = E.out(clamp((t + 1 / 120 - s) / dur));
    pos.push(from[i] + total * e);
    vel.push(total * (e2 - e) * 120);
  }
  odo.setCols(pos, vel);
}

// Words that rise out of a mask.
function makeWords(parent, text, css) {
  const line = el('div', { whiteSpace: 'nowrap', ...css }, parent);
  const words = text.split(' ').map((w, i, a) => {
    const m = document.createElement('span');
    Object.assign(m.style, { display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.12em', marginBottom: '-0.12em', marginRight: i < a.length - 1 ? '0.26em' : '0' });
    const s = document.createElement('span'); s.textContent = w; s.style.display = 'inline-block';
    m.appendChild(s); line.appendChild(m); return s;
  });
  return {
    line, words,
    update(t, t0, stagger = 0.07, dur = 0.7, out = null) {
      words.forEach((w, i) => {
        const p = prog(t, t0 + i * stagger, t0 + i * stagger + dur, E.out);
        const o = out ? prog(t, out + i * 0.03, out + i * 0.03 + 0.35, E.in) : 0;
        set(w, { transform: `translate3d(0,${((1 - p) * 105 - o * 105).toFixed(2)}%,0) rotate(${((1 - p) * 4).toFixed(2)}deg)`, opacity: (p > 0 ? 1 : 0) + '' });
      });
    },
  };
}
// Image crop shown as a div (for cascading cards etc.).
function crop(parent, src, sx, sy, w, h, fullW, fullH) {
  return el('div', { width: w + 'px', height: h + 'px', backgroundImage: `url(${src})`, backgroundSize: `${fullW}px ${fullH}px`, backgroundPosition: `${-sx}px ${-sy}px` }, parent);
}

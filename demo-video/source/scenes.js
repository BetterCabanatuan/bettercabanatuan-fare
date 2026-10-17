// Pamasahe Cabanatuan — 30 s product demo. One master timeline; times are global seconds.
const HEADER_H = 99.25, PANEL_H = 900 - HEADER_H;
const CT = [120.96897, 15.47244]; // Central Transport Terminal
const tripCam = { center: D.jeep.ab.center, zoom: D.jeep.ab.zoom };
const z0 = D.jeep.plates[0];
const wideCam = { center: z0.center, zoom: z0.zoom - 1.12 };
const fmtUrlAB = '?a=15.47244,120.96897&b=15.46573,120.95390';

// ---------- background ----------
const bg = el('div', { width: W + 'px', height: H + 'px', background: C.deep });
const bgGlow = el('div', { width: W + 'px', height: H + 'px', background: 'radial-gradient(1200px 800px at 50% 38%, rgba(70,110,210,.55), rgba(12,36,89,0) 70%)' });
const motif = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` });
motif.style.position = 'absolute'; stage.appendChild(motif);
const ringPts = (() => {
  const P = projector({ center: [120.975, 15.49], zoom: 11.9 }, W, H);
  return D.ring.map(P);
})();
const motifPaths = [0, 1, 2].map(i => svgEl('path', { d: dOf(ringPts) + 'Z', fill: 'none', stroke: '#fff', 'stroke-width': 1.6 - i * 0.4, opacity: 0.075 - i * 0.02 }, motif));
const vignette = el('div', { width: W + 'px', height: H + 'px', background: 'radial-gradient(1500px 1000px at 50% 45%, rgba(0,0,0,0) 55%, rgba(2,8,26,.55) 100%)' });

// ---------- S1 intro layer ----------
const L1 = el('div', { width: W + 'px', height: H + 'px' });
const introSvg = svgEl('svg', { width: W, height: H, viewBox: `0 0 ${W} ${H}` }, null);
introSvg.style.position = 'absolute'; L1.appendChild(introSvg);
svgEl('filter', { id: 'glow', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs).innerHTML = '<feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>';
const introRoute = (() => {
  const P = projector({ center: D.trike.center, zoom: D.trike.zoom }, D.trike.w, D.trike.h);
  const pts = D.trike.road.map(P);
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const k = 1040 / (x1 - x0);
  const ox = 960 - (x0 + x1) / 2 * k, oy = 770 - (y0 + y1) / 2 * k;
  const f = p => [p[0] * k + ox, p[1] * k + oy];
  return { pts: pts.map(f), a: f(P(D.trike.a)), b: f(P(D.trike.b)) };
})();
const introGlow = svgEl('path', { fill: 'none', stroke: C.yellow, 'stroke-width': 22, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.18, filter: 'url(#glow)' }, introSvg);
const introLine = svgEl('path', { fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, introSvg);
const introHead = el('div', { width: '44px', height: '44px', marginLeft: '-22px', marginTop: '-22px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 18%, rgba(245,197,24,.75) 30%, rgba(245,197,24,0) 70%)' }, L1);
const introPinA = makePin(L1, 'A', 56), introPinB = makePin(L1, 'B', 56);
const h1a = makeWords(L1, 'Magkano ang', { top: '150px', width: W + 'px', textAlign: 'center', fontSize: '150px', fontWeight: '800', letterSpacing: '-0.045em', color: '#fff', lineHeight: '1' });
const h1b = makeWords(L1, 'pamasahe?', { top: '300px', width: W + 'px', textAlign: 'center', fontSize: '150px', fontWeight: '800', letterSpacing: '-0.045em', color: C.yellow, lineHeight: '1' });
const h1sub = makeWords(L1, 'How much is the fare? Check it before you pay.', { top: '488px', width: W + 'px', textAlign: 'center', fontSize: '30px', fontWeight: '600', color: 'rgba(255,255,255,.72)', letterSpacing: '-0.01em' });
const introChip = el('div', { height: '76px', borderRadius: '38px', background: C.ink, boxShadow: '0 20px 50px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', padding: '0 30px 0 26px', gap: '18px', whiteSpace: 'nowrap' }, L1);
introChip.style.position = 'absolute';
el('div', { position: 'relative', fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,.6)', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: '1.25' }, introChip, 'Tricycle<br>2.5 km');
const introOdoHost = el('div', { position: 'relative', width: '176px', height: '52px' }, introChip);
const introOdo = makeOdometer(introOdoHost, { size: 52, weight: 800, ls: -1.5, digits: '00.00' });

// ---------- main browser ----------
const LB = el('div', { width: W + 'px', height: H + 'px', perspective: '2600px', perspectiveOrigin: '50% 45%' });
const B = makeBrowser(LB);
const pages = {};
const page = name => (pages[name] = el('div', { width: '1440px', height: '900px', overflow: 'hidden', background: '#fff' }, B.content));
const dimOf = p => el('div', { width: '1440px', height: '900px', background: '#0b1020', opacity: 0, zIndex: 40 }, p);

// Home
const pHome = page('home');
const homeImg = img('cap/home-full.png', 1440, pHome);
const homeFx = el('div', { width: '1440px', height: '1728px' }, pHome);
const boardBars = D.home.amounts.map(a => el('div', { left: a.x + 'px', top: a.y + a.h + 4 + 'px', width: a.w + 'px', height: '5px', borderRadius: '3px', background: C.yellow, transformOrigin: '0 50%' }, homeFx));
const boardRing = el('div', { left: D.home.board.x - 8 + 'px', top: D.home.board.y - 8 + 'px', width: D.home.board.w + 16 + 'px', height: D.home.board.h + 16 + 'px', borderRadius: '24px', border: `3px solid ${C.yellow}`, boxSizing: 'border-box' }, homeFx);
const trustTitles = D.home.cards.filter(c => /source|labelled|correction/.test(c.t));
const marks = trustTitles.map(c => el('div', { left: c.x - 6 + 'px', top: c.y + 2 + 'px', width: c.w * 0.98 + 12 + 'px', height: c.h - 2 + 'px', borderRadius: '4px', background: 'rgba(245,197,24,.42)', mixBlendMode: 'multiply', transformOrigin: '0 50%' }, homeFx));
const homeDim = dimOf(pHome);

// Planner (shared by tricycle and jeep scenes)
const pPlan = page('planner');
const hdrT = img('cap/header-trike.png', 1440, pPlan), hdrJ = img('cap/header-jeep.png', 1440, pPlan);
const panelBox = el('div', { top: HEADER_H + 'px', width: '440px', height: PANEL_H + 'px', overflow: 'hidden', background: C.panel }, pPlan);
const scroller = el('div', { width: '440px', height: '3328px' }, panelBox);
const PIMG = {};
for (const k of ['t0', 't1', 't2', 't3', 'j0', 'j1']) PIMG[k] = img(`cap/panel-${k}.png`, 440, scroller, { opacity: 0 });
// Jeep cards, cascading in over a blank patch.
const cardRects = D.panel.panelJ0.buttons.filter(b => /^Cabanatuan – /.test(b.t) && b.r.y < 1500).map(b => b.r);
const cardPatch = el('div', { left: '0', top: '500px', width: '440px', height: '1000px', background: C.panel, opacity: 0 }, scroller);
const cards = cardRects.map(r => ({ r, a: crop(scroller, 'cap/panel-j0.png', r.x, r.y, r.width, r.height, 440, 3328), b: crop(scroller, 'cap/panel-j1.png', r.x, r.y, r.width, r.height, 440, 3328) }));
cards.forEach(c => { [c.a, c.b].forEach(e => set(e, { left: c.r.x + 'px', top: c.r.y + 'px', opacity: 0, borderRadius: '14px' })); });
// Fare number, redrawn as a live odometer over the capture.
const F = D.fare;
const farePatch = el('div', { left: F.r.x - 2 + 'px', top: F.r.y - 4 + 'px', width: F.r.w + 8 + 'px', height: F.r.h + 8 + 'px', background: '#0a0a0a', opacity: 0 }, scroller);
const fareOdo = makeOdometer(scroller, { size: 48, weight: 700, ls: -1.2, digits: '00.00' });
set(fareOdo.box, { left: F.r.x + 'px', top: F.r.y + 'px', opacity: 0 });
const pressFlash = el('div', { borderRadius: '10px', background: 'rgba(0,0,0,.18)', opacity: 0 }, scroller);
const plannerRipple = el('div', { width: '80px', height: '80px', marginLeft: '-40px', marginTop: '-40px', borderRadius: '50%', background: 'rgba(27,63,139,.18)', opacity: 0 }, scroller);

// Map
const mapPlates = [...D.jeep.plates, { name: 'plate-jeep-ab', center: D.jeep.ab.center, zoom: D.jeep.ab.zoom, w: D.jeep.ab.w, h: D.jeep.ab.h }];
const MAP = makeMap(pPlan, 1000, 828, mapPlates);
set(MAP.box, { left: '440px', top: HEADER_H + 'px' });
const orient = line => (Math.hypot(line[0][0] - CT[0], line[0][1] - CT[1]) <= Math.hypot(line.at(-1)[0] - CT[0], line.at(-1)[1] - CT[1]) ? line : [...line].reverse());
const routes = D.jeep.routes.map(r => ({ id: r.id, line: orient(r.line) }));
routes.forEach(r => { const e = r.line.at(-1); r.ang = (Math.atan2(e[0] - CT[0], e[1] - CT[1]) * 180 / Math.PI + 360) % 360; });
[...routes].sort((a, b) => a.ang - b.ang).forEach((r, i) => (r.order = i));
const routeLines = routes.map(() => makeLine(MAP.svg, { color: C.teal, width: 3.5 }));
const roadLine = makeLine(MAP.svg, { color: C.blue, width: 6, casing: 9 });
const tripData = Object.fromEntries(D.jeep.trip.map(t => [t.id, t.line]));
const pickedLine = makeLine(MAP.svg, { color: C.orange, width: 5, casing: 8 });
const rideLine = makeLine(MAP.svg, { color: C.blue, width: 6, casing: 9 });
const walkA = makeLine(MAP.svg, { color: C.grey, width: 3, dash: '3 4.5', opacity: 0.9 });
const walkB = makeLine(MAP.svg, { color: C.grey, width: 3, dash: '3 4.5', opacity: 0.9 });
const heads = routes.map(() => el('div', { width: '22px', height: '22px', marginLeft: '-11px', marginTop: '-11px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0 22%, rgba(20,184,166,.7) 34%, rgba(20,184,166,0) 70%)', opacity: 0 }, MAP.over));
const JEEP_ICON = '<svg viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V11a3 3 0 0 1 3-3h13l6 6v8"/><path d="M3 22h26"/><path d="M8 13h12M21 8v6h6"/><circle cx="10" cy="24" r="2.5"/><circle cx="23" cy="24" r="2.5"/><path d="M9 5h10"/></svg>';
const terminals = D.jeep.markers.filter(m => m.kind === 'terminal').map(m => ({ ll: m.ll, e: el('div', { width: '30px', height: '30px', marginLeft: '-15px', marginTop: '-15px', borderRadius: '8px', background: C.ink, boxShadow: '0 0 0 2px #fff, 0 4px 10px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, MAP.over, JEEP_ICON) }));
const ends = D.jeep.markers.filter(m => m.kind === 'end').map(m => {
  const e = el('div', { width: '0', height: '0' }, MAP.over);
  el('div', { left: '-9px', top: '-9px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: `0 0 0 2.5px ${C.ink}, 0 3px 6px rgba(0,0,0,.2)` }, e);
  el('div', { left: '0', top: '14px', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '700', color: C.ink, background: 'rgba(255,255,255,.92)', padding: '1px 6px', borderRadius: '4px', boxShadow: '0 1px 2px rgba(0,0,0,.12)' }, e, m.t);
  const r = routes.find(r => Math.hypot(r.line.at(-1)[0] - m.ll[0], r.line.at(-1)[1] - m.ll[1]) < 0.02) || routes[0];
  return { ll: m.ll, e, r };
});
const pinA = makePin(MAP.over, 'A'), pinB = makePin(MAP.over, 'B');
const distTag = el('div', { whiteSpace: 'nowrap', fontSize: '15px', fontWeight: '700', color: '#fff', background: C.ink, padding: '8px 14px', borderRadius: '999px', boxShadow: '0 8px 20px rgba(0,0,0,.25)', transformOrigin: '50% 120%' }, MAP.over, '2.5 km road · billed 3 km');
const routeCount = el('div', { left: '24px', top: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px 10px 12px', borderRadius: '999px', background: 'rgba(21,24,28,.92)', color: '#fff', fontSize: '18px', fontWeight: '700', boxShadow: '0 10px 30px rgba(0,0,0,.25)', whiteSpace: 'nowrap' }, MAP.over);
const rcIcon = el('div', { position: 'relative', width: '34px', height: '34px', borderRadius: '50%', background: C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }, routeCount, JEEP_ICON);
const rcOdoHost = el('div', { position: 'relative', width: '30px', height: '26px' }, routeCount);
const rcOdo = makeOdometer(rcOdoHost, { size: 26, weight: 800, color: C.yellow, ls: -0.5, prefix: '', digits: '00' });
el('div', { position: 'relative' }, routeCount, 'jeepney routes');
const plannerDim = dimOf(pPlan);

// Annotation callout (video layer, inside content so it rides the camera).
function callout(parent, html, { w = 300 } = {}) {
  const e = el('div', { width: w + 'px', padding: '14px 18px', borderRadius: '16px', background: C.ink, color: '#fff', fontSize: '16px', lineHeight: '1.35', fontWeight: '600', boxShadow: '0 18px 40px rgba(0,0,0,.3)', transformOrigin: '0 50%', opacity: 0, zIndex: 45 }, parent, html);
  return e;
}
const coShared = callout(pPlan, '<div style="font-size:12px;letter-spacing:.14em;color:#F5C518;font-weight:800;margin-bottom:4px">2 PASSENGERS</div>Shared rate applies:<br><b style="font-size:20px">₱15.00 each · ₱30.00</b>', { w: 270 });
const coJeep = callout(pPlan, '<div style="font-size:12px;letter-spacing:.14em;color:#F5C518;font-weight:800;margin-bottom:4px">CABANATUAN – LICAB · TRADITIONAL</div><b style="font-size:20px">₱14.00</b> regular<br><b style="font-size:20px">₱11.20</b> student · senior · PWD <span style="color:#F5C518">(20% off)</span>', { w: 330 });

// TODA directory
const pToda = page('toda');
const todaImg = img('cap/toda.png', 1440, pToda), todaTyped = img('cap/toda-typed.png', 1440, pToda, { opacity: 0 });
const T = D.toda;
const typePatch = el('div', { left: T.input.x + 34 + 'px', top: T.input.y + 8 + 'px', width: '120px', height: T.input.height - 16 + 'px', background: '#fff' }, pToda);
const caret = el('div', { width: '1.5px', height: '20px', background: C.ink, top: T.input.y + 12 + 'px' }, pToda);
const spot = el('div', { left: T.cards[0].x + 'px', top: T.cards[0].y + 'px', width: T.cards[0].width + 'px', height: T.cards[0].height + 'px', borderRadius: '16px', boxShadow: '0 0 0 3px #F5C518, 0 0 0 3000px rgba(11,16,32,.38)', opacity: 0 }, pToda);
const todaDim = dimOf(pToda);
// TODA submit (tall page)
const pSubmit = page('submit');
const submitImg = img('cap/toda-submit-full.png', 1440, pSubmit);
const submitFx = el('div', { width: '1440px', height: '2400px' }, pSubmit);
const pinT = (() => {
  const e = el('div', { width: '40px', height: '52px', marginLeft: '-20px', marginTop: '-50px' }, submitFx, `<svg viewBox="0 0 40 52" width="40" height="52"><ellipse cx="20" cy="49" rx="8" ry="3" fill="rgba(0,0,0,.25)"/><path d="M20 2C10.6 2 3 9.6 3 19c0 12.5 17 29 17 29s17-16.5 17-29C37 9.6 29.4 2 20 2z" fill="${C.blue}" stroke="#fff" stroke-width="2.5"/><circle cx="20" cy="19" r="6.5" fill="#fff"/></svg>`);
  return e;
})();
const submitDim = dimOf(pSubmit);
// Suggest a route (tall page)
const pSuggest = page('suggest');
const suggestImg = img('cap/suggest-full.png', 1440, pSuggest);
const suggestFx = el('div', { width: '1440px', height: '2700px' }, pSuggest);
const sPinA = makePin(suggestFx, 'A'), sPinB = makePin(suggestFx, 'B');
const sendFlash = el('div', { left: D.suggest.submit.x + 'px', top: D.suggest.submit.y + 'px', width: D.suggest.submit.w + 'px', height: D.suggest.submit.h + 'px', borderRadius: '10px', background: 'rgba(255,255,255,.35)', opacity: 0 }, suggestFx);
const suggestDim = dimOf(pSuggest);
// Language flip (slats)
const pLang = page('lang');
const SLATS = 12, SH = 900 / SLATS;
const slats = Array.from({ length: SLATS }, (_, i) => {
  const s = el('div', { top: i * SH + 'px', width: '1440px', height: SH + 'px', transformStyle: 'preserve-3d', transformOrigin: '50% 50%' }, pLang);
  const front = crop(s, 'cap/home-full.png', 0, i * SH, 1440, SH, 1440, 1728);
  const back = crop(s, 'cap/home-tl-full.png', 0, i * SH, 1440, SH, 1440, 1853);
  set(front, { backfaceVisibility: 'hidden' }); set(back, { backfaceVisibility: 'hidden', transform: 'rotateX(180deg)' });
  return s;
});
const langDim = dimOf(pLang);
const cursor = makeCursor(B.content);

// ---------- review card (community scene) ----------
const LR = el('div', { width: W + 'px', height: H + 'px' });
const review = el('div', { width: '520px', padding: '28px 30px', borderRadius: '24px', background: '#fff', boxShadow: '0 40px 90px rgba(3,10,30,.45)', transformOrigin: '50% 50%', fontFamily: 'Manrope' }, LR,
  `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:14px;font-weight:800;letter-spacing:.16em;color:#6B7280">SUGGESTED JEEP ROUTE</div><div class="st" style="font-size:14px;font-weight:700;color:#4A3600;background:#FFF4D6;border:1px solid #E0A800;border-radius:999px;padding:4px 12px">Pending review</div></div>
   <div style="margin-top:16px;display:flex;align-items:center;gap:14px;font-size:34px;font-weight:800;color:#15181C;letter-spacing:-.02em"><span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#15181C;color:#fff;font-size:15px;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff,0 0 0 4px #15181C">A</span>Central Terminal</div>
   <div style="margin:8px 0 8px 16px;width:3px;height:26px;background:repeating-linear-gradient(#6B7280 0 4px,transparent 4px 9px)"></div>
   <div style="display:flex;align-items:center;gap:14px;font-size:34px;font-weight:800;color:#15181C;letter-spacing:-.02em"><span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#F5C518;color:#15181C;font-size:15px;align-items:center;justify-content:center;box-shadow:0 0 0 2px #15181C">B</span>Talavera market</div>
   <div style="margin-top:18px;padding-top:16px;border-top:1px solid #E5E7EB;display:flex;gap:26px;font-size:17px;color:#374151;font-weight:600"><span>Traditional jeep</span><span>Paid ₱20</span><span>via Maharlika Hwy</span></div>`);
const stamp = el('div', { padding: '12px 22px', borderRadius: '14px', border: `5px solid ${C.teal}`, color: C.teal, fontSize: '40px', fontWeight: '800', letterSpacing: '0.08em', background: 'rgba(255,255,255,.94)', whiteSpace: 'nowrap', transformOrigin: '50% 50%' }, LR, '✓ VERIFIED');
const adminTag = el('div', { padding: '10px 16px', borderRadius: '999px', background: C.ink, color: '#fff', fontSize: '16px', fontWeight: '700', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '10px' }, LR, '<span style="width:26px;height:26px;border-radius:50%;background:#F5C518;color:#15181C;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:800">AD</span>Checked by an admin');

// ---------- phones ----------
const LP = el('div', { width: W + 'px', height: H + 'px', perspective: '2200px' });
function makePhone(parent, srcs, dark = false) {
  const root = el('div', { width: '410px', height: '908px', marginLeft: '-205px', marginTop: '-454px', borderRadius: '62px', background: 'linear-gradient(145deg,#2a2d33,#0d0e10 40%,#1c1e22)', boxShadow: '0 50px 100px -20px rgba(0,0,0,.55), inset 0 0 0 1.5px rgba(255,255,255,.18)', transformStyle: 'preserve-3d' }, parent);
  const scr = el('div', { left: '10px', top: '10px', width: '390px', height: '888px', borderRadius: '52px', overflow: 'hidden', background: '#000' }, root);
  const bars = [];
  const imgs = srcs.map((s, i) => {
    const holder = el('div', { width: '390px', height: '888px', opacity: i ? 0 : 1 }, scr);
    const bar = el('div', { width: '390px', height: '44px', background: s.dark ? '#0a0a0a' : C.cream, color: s.dark ? '#fff' : C.ink, fontSize: '16px', fontWeight: '700' }, holder,
      '<span style="position:absolute;left:44px;top:13px">9:41</span><span style="position:absolute;right:34px;top:15px;width:26px;height:12px;border-radius:4px;border:1.5px solid currentColor;opacity:.85"></span>');
    const im = img('cap/' + s.src, 390, holder, { top: '44px' });
    bars.push(bar);
    return holder;
  });
  el('div', { left: '140px', top: '20px', width: '130px', height: '36px', borderRadius: '20px', background: '#000' }, root);
  const sheen = el('div', { left: '10px', top: '10px', width: '390px', height: '888px', borderRadius: '52px', background: 'linear-gradient(115deg, rgba(255,255,255,0) 35%, rgba(255,255,255,.22) 48%, rgba(255,255,255,0) 60%)', backgroundSize: '300% 100%', mixBlendMode: 'screen' }, root);
  const tap = el('div', { width: '70px', height: '70px', marginLeft: '-35px', marginTop: '-35px', borderRadius: '50%', background: 'rgba(255,255,255,.55)', opacity: 0 }, scr);
  return { root, imgs, sheen, tap, scr };
}
const phoneDriver = makePhone(LP, [{ src: 'm-fare.png' }, { src: 'm-driver.png', dark: true }]);
const outroPhones = [makePhone(LP, [{ src: 'm-home.png' }]), makePhone(LP, [{ src: 'm-planner.png' }]), makePhone(LP, [{ src: 'm-toda.png' }])];
const S4text = el('div', { width: '760px', left: '150px', top: '330px' }, LP);
const s4a = makeWords(S4text, 'Show the driver.', { top: '0', fontSize: '112px', fontWeight: '800', letterSpacing: '-0.045em', color: C.ink, lineHeight: '1' });
const s4b = makeWords(S4text, 'Keep the fare open so you', { top: '150px', fontSize: '34px', fontWeight: '600', color: 'rgba(21,24,28,.72)', letterSpacing: '-0.01em' });
const s4c = makeWords(S4text, 'and the driver see the same number.', { top: '196px', fontSize: '34px', fontWeight: '600', color: 'rgba(21,24,28,.72)', letterSpacing: '-0.01em' });
const s4tag = el('div', { top: '-62px', fontSize: '18px', fontWeight: '800', letterSpacing: '.18em', color: C.ink, opacity: 0 }, S4text, '₱30.00 · 2 PASSENGERS · 2.5 KM');

// ---------- outro ----------
const LO = el('div', { width: W + 'px', height: H + 'px' });
const logoBox = el('div', { left: '960px', top: '330px', width: '320px', height: '250px', marginLeft: '-160px', marginTop: '-125px' }, LO);
logoBox.innerHTML = D.logo.replace('<svg ', '<svg width="320" height="250" ');
const logoSvg = logoBox.querySelector('svg');
const logoEls = [...logoSvg.children];
const raysPath = logoEls[0];
const rayDs = raysPath.getAttribute('d').split(/(?=M)/).filter(Boolean);
raysPath.remove();
const rays = rayDs.map(d => { const p = svgEl('path', { d, fill: '#F2C91D' }); logoSvg.insertBefore(p, logoSvg.firstChild); p.style.transformOrigin = '90px 31px'; p.style.transformBox = 'view-box'; return p; });
const [coin, pesoA, pesoB, city] = logoEls.slice(1);
[coin, pesoA, pesoB, city].forEach(e => { e.style.transformBox = 'view-box'; });
coin.style.transformOrigin = '90px 31px'; city.style.transformOrigin = '64px 100px';
const pesoLens = [pesoA, pesoB].map(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; return L; });
const word = makeWords(LO, 'Pamasahe', { top: '488px', width: W + 'px', textAlign: 'center', fontSize: '104px', fontWeight: '800', letterSpacing: '-0.04em', color: '#fff', lineHeight: '1' });
const wordSub = el('div', { top: '612px', width: W + 'px', textAlign: 'center', fontSize: '22px', fontWeight: '800', letterSpacing: '0.42em', color: C.yellow, paddingLeft: '0.42em' }, LO, 'CABANATUAN CITY');
const tag1 = makeWords(LO, 'Alamin ang tamang pamasahe.', { top: '690px', width: W + 'px', textAlign: 'center', fontSize: '40px', fontWeight: '700', letterSpacing: '-0.02em', color: '#fff' });
const tag2 = makeWords(LO, 'Know the right fare before you ride.', { top: '748px', width: W + 'px', textAlign: 'center', fontSize: '26px', fontWeight: '600', color: 'rgba(255,255,255,.62)' });
const credit = el('div', { top: '960px', width: W + 'px', textAlign: 'center', fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,.5)', letterSpacing: '.04em' }, LO, 'Community-made with BetterCabanatuan  ·  English & Tagalog  ·  Jeep · Tricycle · TODA');

// ---------- fx layer: iris + wipes ----------
const LF = el('div', { width: W + 'px', height: H + 'px', pointerEvents: 'none' });
const irisRing = el('div', { borderRadius: '50%', border: `16px solid ${C.yellow}`, boxSizing: 'border-box', opacity: 0 }, LF);
const yellowDisc = el('div', { borderRadius: '50%', background: C.yellow, opacity: 0 }, LF);
const slab = el('div', { left: '-600px', top: '-200px', width: '3200px', height: '1480px', background: C.deep, transform: 'skewX(-14deg)', opacity: 0 }, LF);
const slabEdge = el('div', { top: '-200px', width: '40px', height: '1480px', background: C.yellow, transform: 'skewX(-14deg)', opacity: 0 }, LF);
const flash = el('div', { width: W + 'px', height: H + 'px', background: '#fff', opacity: 0 }, LF);

// ---------- HUD ----------
const HUD = el('div', { width: W + 'px', height: H + 'px', pointerEvents: 'none' });
const hudShade = el('div', { top: '860px', width: W + 'px', height: '220px', background: 'linear-gradient(rgba(8,26,66,0), rgba(8,26,66,.78) 55%, rgba(8,26,66,.92))', backdropFilter: 'blur(10px)', webkitMaskImage: 'linear-gradient(transparent, #000 45%)', maskImage: 'linear-gradient(transparent, #000 45%)' }, HUD);
const CH = [
  { t0: 2.35, t1: 5.62, n: '01', title: 'Fare board', sub: "Today's legal fares, each with its source and date." },
  { t0: 5.62, t1: 11.0, n: '02', title: 'Tricycle fare', sub: 'Pick two places. See the fare and how it adds up.' },
  { t0: 11.0, t1: 13.62, n: '03', title: 'Show the driver', sub: 'One big number, readable from the driver’s seat.' },
  { t0: 13.62, t1: 18.82, n: '04', title: 'Jeep routes', sub: 'Every mapped jeepney route, with student, senior and PWD fares.' },
  { t0: 18.82, t1: 22.25, n: '05', title: 'TODA directory', sub: 'Find the TODA that serves your barangay, or add one.' },
  { t0: 22.25, t1: 24.62, n: '06', title: 'Community-checked', sub: 'Residents suggest routes and TODAs. An admin checks each one.' },
  { t0: 24.62, t1: 26.7, n: '07', title: 'English · Tagalog', sub: 'Every screen, every label, in both languages.' },
];
const hudLeft = el('div', { left: '96px', top: '958px', width: '1000px', height: '100px', overflow: 'hidden' }, HUD);
const hudItems = CH.map(c => {
  const g = el('div', { width: '1000px', height: '100px' }, hudLeft);
  const n = el('div', { top: '6px', fontSize: '16px', fontWeight: '800', letterSpacing: '.2em', color: C.yellow }, g, c.n);
  const ti = el('div', { left: '52px', top: '-4px', fontSize: '34px', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, g, c.title);
  const su = el('div', { left: '52px', top: '42px', fontSize: '20px', fontWeight: '600', whiteSpace: 'nowrap', opacity: 0.72 }, g, c.sub);
  return { g, n, ti, su };
});
const prog0 = 1180, prog1 = 1824, progY = 1004;
const hudTrack = el('div', { left: prog0 + 'px', top: progY - 1.5 + 'px', width: prog1 - prog0 + 'px', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,.22)' }, HUD);
const hudFill = el('div', { left: prog0 + 'px', top: progY - 1.5 + 'px', width: prog1 - prog0 + 'px', height: '3px', borderRadius: '2px', background: C.yellow, transformOrigin: '0 50%' }, HUD);
const hudStops = CH.map((c, i) => el('div', { left: prog0 + i * (prog1 - prog0) / (CH.length - 1) - 7 + 'px', top: progY - 7 + 'px', width: '14px', height: '14px', borderRadius: '50%', boxSizing: 'border-box', border: '3px solid rgba(255,255,255,.5)', background: C.deep }, HUD));
const hudBug = el('div', { top: progY - 15 + 'px', width: '30px', height: '30px', marginLeft: '-15px', borderRadius: '9px', background: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(245,197,24,.45)' }, HUD,
  JEEP_ICON.replace('stroke="#fff"', 'stroke="#15181C"').replace('width="18" height="18"', 'width="20" height="20"'));
const hudLabel = el('div', { left: prog0 + 'px', top: progY - 40 + 'px', fontSize: '14px', fontWeight: '800', letterSpacing: '.2em', color: 'rgba(255,255,255,.6)' }, HUD, 'PAMASAHE CABANATUAN');

// =====================================================================
// Timeline
// =====================================================================
function toScreen(cam, x, y) { return [cam.x + cam.s * (x - 720), cam.y + cam.s * (y + 44 - 472)]; }

// Browser camera: keyframes of [t, [fx, fy, z]].
const camKeys = [
  [1.95, [720, 450, 0.8]],
  [2.95, [720, 450, 1], E.out],
  [3.2, [720, 450, 1]],
  [3.9, [1026, 368, 1.55]],
  [4.4, [1026, 368, 1.6], E.lin],
  [5.2, [720, 450, 1]],
  [5.9, [720, 450, 1]],
  [6.6, [560, 430, 1.12]],
  [7.15, [560, 440, 1.12]],
  [7.9, [760, 460, 1.04]],
  [8.6, [720, 504, 1.3]],
  [10.3, [720, 504, 1.3]],
  [10.78, [219, 838, 2.8], E.in],
  // jeep
  [13.6, [720, 450, 1]],
  [14.45, [520, 420, 1.1]],
  [14.75, [520, 420, 1.1]],
  [15.4, [930, 515, 1.16]],
  [16.7, [940, 515, 1.2], E.lin],
  [17.55, [760, 480, 1.18]],
  [18.3, [700, 470, 1.32]],
  [18.62, [720, 450, 1.0]],
  // toda
  [19.2, [720, 450, 1.0]],
  [19.8, [640, 360, 1.38]],
  [20.6, [640, 380, 1.38]],
  [21.0, [860, 320, 1.15]],
  [21.5, [720, 450, 1.08]],
  [22.1, [720, 420, 1.2]],
  // suggest
  [22.6, [720, 450, 1.0]],
  [23.1, [720, 470, 1.14]],
  [23.7, [600, 560, 1.18]],
  [24.4, [720, 450, 0.92]],
  // language
  [24.95, [720, 450, 1.0]],
  [25.4, [1000, 220, 1.3]],
  [25.55, [1000, 220, 1.3]],
  [26.35, [620, 340, 1.18]],
  [26.6, [620, 340, 1.18]],
];
function browserState(t) {
  const [fx, fy, z] = kf(t, camKeys);
  let cam = focusCam(fx, fy, z);
  let rot = { rx: 0, ry: 0, rz: 0, op: 1 };
  // Entrance from the iris.
  if (t < 2.95) { const p = prog(t, 1.95, 2.95, E.out); rot.rx = (1 - p) * 30; rot.rz = (1 - p) * -5; cam.y += (1 - p) * 170; }
  // Exit into the yellow button.
  if (t > 10.3 && t < 13.6) { rot.op = 1 - prog(t, 10.95, 11.05, E.lin); }
  // Return from the left for the jeep scene.
  if (t >= 13.7 && t < 14.5) { const p = prog(t, 13.76, 14.45, E.out); cam.x -= (1 - p) * 1900; rot.ry = (1 - p) * 26; }
  // Recede into the outro.
  if (t > 26.55) { const p = prog(t, 26.6, 27.3, E.in); cam.s *= 1 - 0.45 * p; cam.y += p * 260; rot.rx = p * 32; rot.op = 1 - prog(t, 26.9, 27.3, E.lin); }
  return { cam, rot, z };
}

// Page visibility and transitions.
function pushPage(t, from, to, ta, dur = 0.45, dir = 1, up = false) {
  const p = prog(t, ta, ta + dur, E.inOut);
  if (up) {
    set(pages[from], { transform: `translate3d(0,${(-p * 240).toFixed(1)}px,0)` });
    set(pages[to], { transform: `translate3d(0,${((1 - p) * 900).toFixed(1)}px,0)`, boxShadow: '0 -30px 60px rgba(0,0,0,.18)' });
  } else {
    set(pages[from], { transform: `translate3d(${(-p * 420 * dir).toFixed(1)}px,0,0)` });
    set(pages[to], { transform: `translate3d(${((1 - p) * 1440 * dir).toFixed(1)}px,0,0)`, boxShadow: '-30px 0 60px rgba(0,0,0,.18)' });
  }
  return p;
}
const dims = { home: homeDim, planner: plannerDim, toda: todaDim, submit: submitDim, suggest: suggestDim, lang: langDim };

function fades(t, seq, dur = 0.12) {
  const out = {};
  seq.forEach(([, k]) => (out[k] = 0));
  let cur = -1;
  for (let i = 0; i < seq.length; i++) if (t >= seq[i][0]) cur = i;
  if (cur < 0) { out[seq[0][1]] = 1; return out; }
  out[seq[cur][1]] = clamp((t - seq[cur][0]) / dur);
  if (cur > 0) out[seq[cur - 1][1]] = 1;
  return out;
}

function render(t) {
  // ---- background ----
  const bgCol = t < 10.9 || t >= 13.75 ? C.deep : C.yellow;
  set(bg, { background: bgCol });
  set(bgGlow, { opacity: t >= 10.9 && t < 13.75 ? '0' : '1' });
  motifPaths.forEach((p, i) => {
    const s = 1.05 + i * 0.22 + t * 0.01, r = t * (0.6 + i * 0.25) - i * 8;
    p.setAttribute('transform', `translate(960 540) rotate(${r.toFixed(2)}) scale(${s.toFixed(3)}) translate(-960 -540)`);
  });
  set(motif, { opacity: t >= 10.9 && t < 13.75 ? '0' : '1' });

  // ---- S1 intro ----
  const s1 = t < 2.6;
  show(L1, s1);
  if (s1) {
    const R = introRoute;
    introPinA.update(t, 0.05, R.a[0], R.a[1]);
    const f = prog(t, 0.25, 1.25, E.inOut);
    const part = partial(R.pts, f);
    introLine.setAttribute('d', f > 0 ? dOf(part.pts) : 'M0 0'); introGlow.setAttribute('d', f > 0 ? dOf(part.pts) : 'M0 0');
    set(introHead, { transform: `translate3d(${part.head[0]}px,${part.head[1]}px,0) scale(${(f > 0 && f < 1 ? 1 : 0.0001)})` });
    introPinB.update(t, 1.05, R.b[0], R.b[1]);
    h1a.update(t, 0.3); h1b.update(t, 0.48); h1sub.update(t, 0.95, 0.03, 0.6);
    const mid = pointAt(R.pts, 0.52);
    const cp = spring(t, 1.25, 2.2, 0.5);
    set(introChip, { transform: `translate3d(${mid[0] - 175}px,${mid[1] - 120}px,0) scale(${cp.toFixed(4)})`, opacity: t > 1.25 ? '1' : '0', transformOrigin: '50% 100%' });
    odoRoll(introOdo, t, 1.3, 0.75, [0, 0, 0, 0], [2, 0, 0, 0], [1, 2, 3, 3], 0.07);
    const fadeOut = prog(t, 1.95, 2.4, E.in);
    set(L1, { opacity: (1 - fadeOut * 0.0).toFixed(3) });
  }
  // Iris through pin B.
  const irisP = prog(t, 1.95, 2.55, E.in);
  const R0 = 30, R1 = 2300, rad = lerp(R0, R1, irisP);
  const [bx, by] = introRoute.b;
  if (t >= 1.95 && t < 2.6) {
    set(LB, { clipPath: `circle(${rad.toFixed(1)}px at ${bx}px ${by}px)` });
    set(irisRing, { opacity: '1', left: bx - rad - 8 + 'px', top: by - rad - 8 + 'px', width: 2 * rad + 16 + 'px', height: 2 * rad + 16 + 'px' });
  } else {
    set(LB, { clipPath: 'none' }); set(irisRing, { opacity: '0' });
  }
  set(bg, { background: t < 1.95 ? C.deep : bgCol });

  // ---- main browser ----
  const bOn = t >= 1.95 && t < 27.3 && !(t > 11.06 && t < 13.76);
  show(LB, bOn);
  const { cam, rot, z } = browserState(t);
  if (bOn) placeBrowser(B, cam, rot);

  // Pages.
  const pv = {
    home: t < 6.1, planner: t >= 5.6 && t < 19.3, toda: t >= 18.8 && t < 21.5, submit: t >= 21.0 && t < 22.7, suggest: t >= 22.2 && t < 25.05, lang: t >= 24.6,
  };
  for (const k in pages) { show(pages[k], pv[k]); set(pages[k], { transform: 'none', boxShadow: 'none' }); set(dims[k], { opacity: '0' }); }
  let url = '/';
  // home -> planner
  if (t >= 5.6 && t < 6.1) { const p = pushPage(t, 'home', 'planner', 5.6); set(homeDim, { opacity: (p * 0.3).toFixed(3) }); }
  // planner -> toda (nav click)
  if (t >= 18.8 && t < 19.3) { const p = pushPage(t, 'planner', 'toda', 18.8); set(plannerDim, { opacity: (p * 0.3).toFixed(3) }); }
  if (t >= 21.0 && t < 21.5) { const p = pushPage(t, 'toda', 'submit', 21.03, 0.45, 1, true); set(todaDim, { opacity: (p * 0.3).toFixed(3) }); }
  if (t >= 22.2 && t < 22.7) { const p = pushPage(t, 'submit', 'suggest', 22.2); set(submitDim, { opacity: (p * 0.3).toFixed(3) }); }
  if (t >= 24.6 && t < 25.05) { const p = pushPage(t, 'suggest', 'lang', 24.6, 0.45, -1); set(suggestDim, { opacity: (p * 0.3).toFixed(3) }); }

  // ---- home ----
  if (pv.home) {
    const scroll = kf(t, [[4.4, 0], [5.25, 828]]);
    set(homeImg, { transform: `translate3d(0,${-scroll}px,0)` });
    set(homeFx, { transform: `translate3d(0,${-scroll}px,0)` });
    boardBars.forEach((b, i) => { const p = prog(t, 3.55 + i * 0.13, 3.95 + i * 0.13); const o = 1 - prog(t, 4.5, 4.8, E.lin); set(b, { transform: `scaleX(${p.toFixed(4)})`, opacity: o.toFixed(3) }); });
    const rp = prog(t, 3.4, 3.9); set(boardRing, { opacity: (rp * (1 - prog(t, 4.45, 4.75, E.lin))).toFixed(3), transform: `scale(${(1.04 - 0.04 * rp).toFixed(4)})` });
    marks.forEach((m, i) => set(m, { transform: `scaleX(${prog(t, 5.0 + i * 0.12, 5.4 + i * 0.12).toFixed(4)})` }));
    url = '/';
  }

  // ---- planner ----
  if (pv.planner) {
    const jeep = t >= 14.62;
    url = jeep ? '/fare?mode=jeep&a=15.47244,120.96897&b=15.46573,120.95390' : t >= 7.16 ? '/fare' + fmtUrlAB : t >= 6.62 ? '/fare?a=15.47244,120.96897' : '/fare';
    set(hdrJ, { opacity: clamp((t - 14.62) / 0.12).toFixed(3) });
    // Panel states.
    const op = fades(t, [[0, 't0'], [6.62, 't1'], [7.2, 't2'], [9.42, 't3'], [13.0, 't2'], [14.62, 'j0']]);
    if (t >= 13.0 && t < 14.62) { op.t3 = 0; op.t2 = 1; }
    for (const k in PIMG) set(PIMG[k], { opacity: (op[k] || 0).toFixed(3), zIndex: k[0] === 'j' ? 2 : 1 });
    const scroll = t < 13 ? kf(t, [[7.95, 0], [8.55, 470]]) : 0;
    set(scroller, { transform: `translate3d(0,${-scroll}px,0)` });
    // Fare odometer.
    const fareOn = t >= 7.2 && t < 13;
    set(farePatch, { opacity: fareOn ? '1' : '0' }); set(fareOdo.box, { opacity: fareOn ? '1' : '0' });
    if (fareOn) {
      if (t < 9.42) odoRoll(fareOdo, t, 8.3, 0.8, [0, 0, 0, 0], [2, 0, 0, 0], [1, 2, 3, 3], 0.07);
      else {
        const u = clamp((t - 9.45) / 0.55), e = E.back(u), e2 = E.back(clamp((t + 1 / 120 - 9.45) / 0.55));
        fareOdo.setCols([2 + e, 0, 0, 0], [(e2 - e) * 120, 0, 0, 0]);
      }
    }
    // Press feedback on "+" and "Show the driver".
    const plusR = D.panel.panelT2.buttons.find(b => b.t === 'Add a regular passenger').r;
    const showR = D.panel.panelT2.buttons.find(b => b.t === 'Show the driver').r;
    const pressAt = (r, tc) => { const u = clamp((t - tc + 0.05) / 0.3); return { r, a: Math.sin(Math.PI * u) }; };
    const pr = t < 10 ? pressAt(plusR, 9.4) : pressAt(showR, 10.55);
    set(pressFlash, { left: pr.r.x + 'px', top: pr.r.y + 'px', width: pr.r.width + 'px', height: pr.r.height + 'px', opacity: (pr.a * 0.9).toFixed(3) });
    // Chip ripples.
    const chipA = D.panel.panelT0.buttons.find(b => b.t === 'Central Transport Terminal').r, chipB = D.panel.panelT0.buttons.find(b => b.t === 'SM City').r;
    const jeepBtn = D.panel.panelT0.buttons.find(b => b.t === 'Jeep').r;
    const rip = [[6.62, chipA], [7.16, chipB], [14.62, jeepBtn], [17.95, cardRects[0]]].find(([tc]) => t >= tc && t < tc + 0.5);
    if (rip) { const u = (t - rip[0]) / 0.5; const r = rip[1]; set(plannerRipple, { left: r.x + r.width / 2 + 'px', top: r.y + r.height / 2 + 'px', transform: `scale(${(0.3 + E.out(u) * 2.4).toFixed(3)})`, opacity: (1 - u).toFixed(3) }); }
    else set(plannerRipple, { opacity: '0' });
    // Jeep cards cascade.
    const cascade = t >= 14.62;
    set(cardPatch, { opacity: cascade ? (op.j0 || 0).toFixed(3) : '0', zIndex: 3 });
    cards.forEach((c, i) => {
      const p = prog(t, 14.72 + i * 0.07, 15.25 + i * 0.07);
      const sel = clamp((t - 17.95) / 0.15);
      set(c.a, { opacity: cascade ? (p * (1 - sel)).toFixed(3) : '0', transform: `translate3d(0,${((1 - p) * 26).toFixed(2)}px,0)`, zIndex: 4 });
      set(c.b, { opacity: cascade && i === 0 ? (p * sel).toFixed(3) : '0', transform: `translate3d(0,${((1 - p) * 26).toFixed(2)}px,0)`, zIndex: 5 });
    });

    // ---- map camera ----
    let mcam = tripCam;
    if (t >= 14.75 && t < 15.65) mcam = flyCam(tripCam, wideCam, prog(t, 14.75, 15.65, E.inOut));
    else if (t >= 15.65 && t < 16.75) mcam = wideCam;
    else if (t >= 16.75 && t < 17.65) mcam = flyCam(wideCam, tripCam, prog(t, 16.75, 17.65, E.inOut));
    const P = MAP.render(mcam);
    const zoomK = Math.pow(2, mcam.zoom - tripCam.zoom);
    // Jeep routes radiate from the terminal.
    routes.forEach((r, i) => {
      const s = 15.3 + r.order * 0.05;
      const f = jeep ? prog(t, s, s + 0.8, E.soft) : 0;
      const settle = prog(t, 16.9, 17.6, E.inOut);
      const pts = r.line.map(P);
      const head = routeLines[i].draw(pts, f, lerp(0.95, 0.6, settle), lerp(3.6, 3, settle));
      set(heads[i], { transform: `translate3d(${head[0]}px,${head[1]}px,0)`, opacity: f > 0 && f < 1 ? '1' : '0' });
    });
    terminals.forEach((m, i) => { const p = P(m.ll); const s = jeep ? spring(t, 15.2 + i * 0.03, 2.6, 0.45) : 0; set(m.e, { transform: `translate3d(${p[0]}px,${p[1]}px,0) scale(${(s * lerp(0.7, 1, clamp(zoomK * 8))).toFixed(4)})` }); });
    ends.forEach(m => {
      const p = P(m.ll); const s = 15.3 + m.r.order * 0.05 + 0.75;
      const a = jeep ? spring(t, s, 2.6, 0.5) * (1 - prog(t, 16.8, 17.2, E.lin)) : 0;
      set(m.e, { transform: `translate3d(${p[0]}px,${p[1]}px,0) scale(${a.toFixed(4)})`, opacity: a > 0.01 ? '1' : '0' });
    });
    const rcA = jeep ? prog(t, 15.2, 15.6) * (1 - prog(t, 16.75, 17.05, E.in)) : 0;
    set(routeCount, { opacity: rcA.toFixed(3), transform: `translate3d(${((1 - rcA) * -20).toFixed(2)}px,0,0)` });
    odoRoll(rcOdo, t, 15.3, 1.1, [0, 0], [1, 5], [0, 1], 0.12);
    // Tricycle road line.
    const roadPts = D.trike.road.map(P);
    const roadF = prog(t, 7.25, 7.95, E.inOut);
    const roadOp = 1 - prog(t, 17.98, 18.2, E.lin);
    roadLine.draw(roadPts, roadF, roadOp);
    // Trip pick.
    const pickF = prog(t, 17.98, 18.5, E.inOut);
    pickedLine.draw(tripData['picked-routeActive'].map(P), pickF, 1);
    rideLine.draw(tripData['ride-ride'].map(P), prog(t, 18.1, 18.5, E.inOut), 1);
    walkA.draw(tripData['walk-a-walk'].map(P), prog(t, 18.3, 18.45, E.lin), 1);
    walkB.draw(tripData['walk-b-walk'].map(P), prog(t, 18.35, 18.5, E.lin), 1);
    // Pins.
    const pa = P(D.trike.a), pb = P(D.trike.b);
    const pinVis = clamp(zoomK * 6);
    pinA.update(t, 6.66, pa[0], pa[1], pinVis); pinB.update(t, 7.2, pb[0], pb[1], pinVis);
    const mid = pointAt(roadPts, 0.45);
    const dt = t < 13 ? spring(t, 7.95, 2.4, 0.5) : 0;
    set(distTag, { transform: `translate3d(${mid[0] - 105}px,${mid[1] - 58}px,0) scale(${dt.toFixed(4)})`, opacity: dt > 0.01 ? '1' : '0' });
    // Callouts.
    const cs = t < 13 ? spring(t, 9.55, 2.2, 0.55) * (1 - prog(t, 10.25, 10.45, E.in)) : 0;
    set(coShared, { left: '470px', top: 99 + 940 - 470 + 'px', transform: `scale(${cs.toFixed(4)})`, opacity: cs > 0.01 ? '1' : '0' });
    const cj = spring(t, 18.15, 2.2, 0.55) * (1 - prog(t, 18.55, 18.75, E.in));
    set(coJeep, { left: '458px', top: 99 + 520 + 'px', transform: `scale(${cj.toFixed(4)})`, opacity: cj > 0.01 ? '1' : '0' });
  }

  // ---- TODA ----
  if (pv.toda) {
    url = '/toda';
    const typed = 'Sumacab';
    const n = Math.floor(clamp((t - 19.65) / 0.5) * typed.length + 0.0001);
    set(todaTyped, { opacity: t >= 19.58 ? '1' : '0' });
    const ctx = render.ctx || (render.ctx = document.createElement('canvas').getContext('2d'));
    ctx.font = `400 ${T.fs} Manrope`;
    const wN = ctx.measureText(typed.slice(0, n)).width;
    const x0 = T.input.x + parseFloat(T.pl);
    set(typePatch, { left: x0 + wN + 'px', width: Math.max(0, 140 - wN) + 'px', opacity: t >= 19.58 ? '1' : '0' });
    const blink = t >= 19.58 && (t < 20.2 || Math.floor((t - 20.2) / 0.4) % 2 === 0) && t < 20.7;
    set(caret, { left: x0 + wN + 1 + 'px', opacity: blink ? '1' : '0' });
    const sp = prog(t, 20.2, 20.5) * (1 - prog(t, 20.8, 21.0, E.lin));
    set(spot, { opacity: sp.toFixed(3) });
  }
  if (pv.submit) {
    url = '/toda/submit';
    const scroll = kf(t, [[21.45, 0], [21.95, 826]]);
    set(submitImg, { transform: `translate3d(0,${-scroll}px,0)` }); set(submitFx, { transform: `translate3d(0,${-scroll}px,0)` });
    const m = D.todaSubmit.maps[0];
    const d = prog(t, 21.95, 22.25, E.in), land = t - 22.25;
    const sq = land > 0 ? Math.exp(-land * 9) * Math.sin(land * 30) * 0.2 : 0;
    set(pinT, { transform: `translate3d(${m.x + m.w / 2}px,${m.y + m.h / 2 - (1 - d) * 80}px,0) scale(${1 + sq},${1 - sq})`, opacity: t >= 21.95 ? '1' : '0', transformOrigin: '50% 100%' });
  }
  if (pv.suggest) {
    url = '/fare/suggest';
    const scroll = kf(t, [[22.5, 0], [22.95, 420], [23.25, 420], [23.6, 1899]]);
    set(suggestImg, { transform: `translate3d(0,${-scroll}px,0)` }); set(suggestFx, { transform: `translate3d(0,${-scroll}px,0)` });
    const [m1, m2] = D.suggest.maps;
    sPinA.update(t, 22.92, m1.x + m1.w * 0.42, m1.y + m1.h * 0.55);
    sPinB.update(t, 23.05, m2.x + m2.w * 0.36, m2.y + m2.h * 0.3);
    const sf = Math.sin(Math.PI * clamp((t - 23.72) / 0.3));
    set(sendFlash, { opacity: (sf * 0.9).toFixed(3) });
    set(suggestDim, { opacity: (prog(t, 23.8, 24.1) * 0.45 * (1 - prog(t, 24.55, 24.75, E.lin))).toFixed(3) });
  }
  if (pv.lang) {
    const flipAt = 25.45;
    url = t >= flipAt ? '/tl' : '/';
    slats.forEach((s, i) => {
      const p = prog(t, flipAt + i * 0.045, flipAt + i * 0.045 + 0.55, E.inOut);
      set(s, { transform: `rotateX(${(-180 * p).toFixed(2)}deg)`, zIndex: p > 0 && p < 1 ? 10 : 1 });
    });
  }
  B.setUrl(url);

  // ---- cursor (content coords) ----
  const cursorPath = [
    [6.0, 980, 820], [6.55, 145, 516 + HEADER_H], [6.75, 150, 520 + HEADER_H], [7.1, 300, 516 + HEADER_H], [7.6, 330, 560 + HEADER_H],
    [9.0, 380, 610], [9.36, 376, 539 - 470 + HEADER_H], [9.6, 380, 560], [10.45, 219, 1185 + 24 - 470 + HEADER_H],
    [14.0, 700, 700], [14.58, 316, 127 + HEADER_H], [14.9, 330, 160 + HEADER_H], [17.6, 260, 640], [17.92, 219, 504 + 74 + HEADER_H], [18.4, 300, 640], [18.72, 1080, 67],
    [19.2, 900, 500], [19.52, 520, 269], [20.6, 760, 300], [20.98, 1139, 201], [21.5, 1000, 500],
    [22.6, 1100, 700], [23.7, D.suggest.submit.x + 80, D.suggest.submit.y + 22 - 1899], [24.0, D.suggest.submit.x + 140, 700],
    [24.9, 900, 500], [25.38, 1193, 67], [26.6, 1100, 300],
  ];
  const clicks = [6.62, 7.16, 9.4, 10.55, 14.62, 17.95, 18.75, 19.55, 21.0, 23.75, 25.4];
  const cVis = (t >= 6.0 && t < 10.75) || (t >= 14.0 && t < 18.85) || (t >= 19.2 && t < 21.1) || (t >= 22.6 && t < 23.95) || (t >= 24.9 && t < 25.7);
  cursor.update(t, cursorPath, clicks, z, cVis ? 1 : 0);

  // ---- yellow dive (into "Show the driver") ----
  if (t >= 10.55 && t < 11.15) {
    const [sx, sy] = toScreen(cam, 219, 1185 + 24 - 470 + HEADER_H);
    const r = lerp(10, 2400, prog(t, 10.62, 11.02, E.in));
    set(yellowDisc, { opacity: '1', left: sx - r + 'px', top: sy - r + 'px', width: 2 * r + 'px', height: 2 * r + 'px' });
  } else set(yellowDisc, { opacity: '0' });

  // ---- S4 phone ----
  const s4 = t >= 10.95 && t < 13.85;
  show(LP, s4 || t >= 26.8);
  set(phoneDriver.root, { display: s4 ? '' : 'none' });
  set(S4text, { display: s4 ? '' : 'none' });
  if (s4) {
    const up = spring(t, 11.05, 1.6, 0.62);
    const turn = prog(t, 12.4, 13.3, E.inOut);
    const out = prog(t, 13.35, 13.8, E.in);
    const x = 1330 + out * 900, y = 512 + (1 - up) * 900;
    const ry = lerp(-24, -10, up) + turn * 30 + out * 30;
    set(phoneDriver.root, { transform: `translate3d(${x}px,${y}px,0) rotateY(${ry.toFixed(2)}deg) rotateZ(${((1 - up) * 8 + out * 10).toFixed(2)}deg) scale(0.9)` });
    const dlg = prog(t, 12.05, 12.32, E.out);
    set(phoneDriver.imgs[1], { opacity: dlg.toFixed(3), transform: `scale(${(0.94 + 0.06 * dlg).toFixed(4)})` });
    const tp = clamp((t - 11.92) / 0.4);
    set(phoneDriver.tap, { left: '195px', top: 435 + 44 + 'px', opacity: tp > 0 && tp < 1 ? (1 - tp).toFixed(3) : '0', transform: `scale(${(0.4 + tp * 1.6).toFixed(3)})` });
    set(phoneDriver.sheen, { backgroundPosition: `${(100 - turn * 100).toFixed(1)}% 0` });
    s4a.update(t, 11.25, 0.08, 0.7, 13.35); s4b.update(t, 11.5, 0.03, 0.6, 13.38); s4c.update(t, 11.58, 0.03, 0.6, 13.4);
    set(s4tag, { opacity: (prog(t, 12.3, 12.6) * (1 - prog(t, 13.35, 13.55, E.lin))).toFixed(3), transform: `translate3d(${((1 - prog(t, 12.3, 12.7)) * -20).toFixed(1)}px,0,0)` });
  }
  // Blue slab wipe back to the stage.
  if (t >= 13.35 && t < 13.85) {
    const p = prog(t, 13.38, 13.78, E.inOut);
    const x = lerp(-3400, -600, p);
    set(slab, { opacity: '1', transform: `translate3d(${x}px,0,0) skewX(-14deg)` });
    set(slabEdge, { opacity: '1', left: x + 3200 - 20 + 'px', transform: 'skewX(-14deg)' });
  } else { set(slab, { opacity: '0' }); set(slabEdge, { opacity: '0' }); }

  // ---- S7 review card ----
  const s7 = t >= 23.75 && t < 24.85;
  show(LR, s7);
  if (s7) {
    const [sx, sy] = toScreen(cam, D.suggest.submit.x + 80, D.suggest.submit.y + 22 - 1899);
    const p = prog(t, 23.78, 24.2, E.out);
    const out = prog(t, 24.5, 24.8, E.in);
    const cx = lerp(sx, 1180, p), cy = lerp(sy, 470, p) - out * 60;
    set(review, { transform: `translate3d(${(cx - 290).toFixed(1)}px,${(cy - 150).toFixed(1)}px,0) scale(${(lerp(0.2, 1, p) * (1 - 0.15 * out)).toFixed(4)}) rotate(${((1 - p) * -6).toFixed(2)}deg)`, opacity: (clamp(p * 3) * (1 - out)).toFixed(3) });
    const st = review.querySelector('.st');
    if (t >= 24.18) { st.textContent = 'Live on the fare map'; st.style.background = '#E6F4F1'; st.style.borderColor = C.teal; st.style.color = C.teal; }
    else { st.textContent = 'Pending review'; st.style.background = C.cream; st.style.borderColor = '#E0A800'; st.style.color = '#4A3600'; }
    const sp = prog(t, 24.1, 24.22, E.in);
    const land = t - 24.22, wob = land > 0 ? Math.exp(-land * 10) * Math.sin(land * 40) * 0.06 : 0;
    set(stamp, { transform: `translate3d(1290px,560px,0) scale(${(lerp(2.4, 1, sp) + wob).toFixed(4)}) rotate(-9deg)`, opacity: (sp * (1 - out)).toFixed(3) });
    const at = prog(t, 24.25, 24.5);
    set(adminTag, { transform: `translate3d(${(940 + (1 - at) * -30).toFixed(1)}px,672px,0)`, opacity: (at * (1 - out)).toFixed(3) });
  }

  // ---- S9 outro ----
  const s9 = t >= 26.8;
  show(LO, s9);
  outroPhones.forEach((ph, i) => set(ph.root, { display: s9 ? '' : 'none' }));
  if (s9) {
    outroPhones.forEach((ph, i) => {
      const s = spring(t, 26.85 + i * 0.09, 1.7, 0.6);
      const off = prog(t, 28.1 + i * 0.06, 28.6 + i * 0.06, E.in);
      const x = 960 + (i - 1) * 430, y = 540 + (i === 1 ? -16 : 34) + (1 - s) * 1000 + off * 1100 + Math.sin(t * 2 + i) * 6;
      set(ph.root, { transform: `translate3d(${x}px,${y}px,0) rotateY(${((i - 1) * -16).toFixed(2)}deg) rotateZ(${((i - 1) * 6 * s).toFixed(2)}deg) scale(${(0.88 * (i === 1 ? 1.05 : 1)).toFixed(3)})`, zIndex: i === 1 ? 3 : 1 });
      set(ph.sheen, { backgroundPosition: `${(100 - prog(t, 27.3, 28.1, E.inOut) * 100).toFixed(1)}% 0` });
    });
    // Logo assembles.
    rays.forEach((r, i) => { const p = spring(t, 28.35 + i * 0.012, 2.4, 0.55); r.style.transform = `scale(${p.toFixed(4)})`; r.style.opacity = p > 0.01 ? 1 : 0; });
    const cp = spring(t, 28.3, 2.6, 0.45); coin.style.transform = `scale(${cp.toFixed(4)})`;
    [pesoA, pesoB].forEach((p, i) => { p.style.strokeDashoffset = pesoLens[i] * (1 - prog(t, 28.45 + i * 0.1, 28.8 + i * 0.1, E.inOut)); });
    const cy = prog(t, 28.25, 28.85, E.out); city.style.transform = `translateY(${((1 - cy) * 60).toFixed(2)}px) scaleY(${(0.6 + 0.4 * cy).toFixed(3)})`; city.style.opacity = cy;
    set(logoBox, { transform: `translate3d(0,${((1 - prog(t, 28.25, 29.0)) * 20).toFixed(1)}px,0)` });
    word.update(t, 28.6, 0.06, 0.7);
    const ws = prog(t, 28.85, 29.4);
    set(wordSub, { opacity: ws.toFixed(3), letterSpacing: lerp(0.8, 0.42, ws).toFixed(3) + 'em' });
    tag1.update(t, 29.0, 0.04, 0.6); tag2.update(t, 29.2, 0.03, 0.6);
    set(credit, { opacity: (prog(t, 29.4, 29.8) * 0.9).toFixed(3) });
  }

  // ---- HUD ----
  const hudOn = t > 2.3 && t < 26.85;
  const hudA = prog(t, 2.35, 2.8) * (1 - prog(t, 26.55, 26.85, E.in));
  set(HUD, { opacity: hudOn ? hudA.toFixed(3) : '0' });
  if (hudOn) {
    const onYellow = t >= 11.0 && t < 13.7;
    const ink = onYellow ? C.ink : '#fff';
    set(hudShade, { opacity: onYellow ? '0' : '1' });
    hudItems.forEach((h, i) => {
      const c = CH[i];
      const pin = prog(t, c.t0 + 0.12, c.t0 + 0.7), pout = prog(t, c.t1 - 0.3, c.t1 + 0.05, E.in);
      const y = (1 - pin) * 70 - pout * 50;
      set(h.g, { transform: `translate3d(0,${y.toFixed(2)}px,0)`, opacity: (t >= c.t0 && t < c.t1 + 0.1 ? clamp(pin * 1.6) * (1 - pout) : 0).toFixed(3) });
      set(h.ti, { color: ink }); set(h.su, { color: ink }); set(h.n, { color: onYellow ? C.ink : C.yellow });
      set(h.su, { transform: `translate3d(0,${((1 - prog(t, c.t0 + 0.08, c.t0 + 0.65)) * 40).toFixed(2)}px,0)` });
    });
    const gp = clamp((t - 2.35) / (26.6 - 2.35));
    // Bug travels stop to stop, dwelling at each chapter.
    let bugP = 0;
    CH.forEach((c, i) => { if (t >= c.t0) bugP = i + prog(t, c.t1 - 0.45, c.t1 + 0.1, E.inOut) * (i < CH.length - 1 ? 1 : 0); });
    const bx2 = prog0 + bugP / (CH.length - 1) * (prog1 - prog0);
    set(hudFill, { transform: `scaleX(${((bx2 - prog0) / (prog1 - prog0)).toFixed(4)})`, background: onYellow ? C.ink : C.yellow });
    set(hudBug, { left: bx2 + 'px', background: onYellow ? C.ink : C.yellow });
    hudBug.firstChild.setAttribute('stroke', onYellow ? C.yellow : C.ink);
    hudStops.forEach((s, i) => set(s, { borderColor: i <= bugP + 0.01 ? (onYellow ? C.ink : C.yellow) : (onYellow ? 'rgba(21,24,28,.35)' : 'rgba(255,255,255,.5)'), background: onYellow ? C.yellow : C.deep }));
    set(hudTrack, { background: onYellow ? 'rgba(21,24,28,.2)' : 'rgba(255,255,255,.22)' });
    set(hudLabel, { color: onYellow ? 'rgba(21,24,28,.6)' : 'rgba(255,255,255,.6)' });
  }

  // Final fade.
  set(flash, { background: '#000', opacity: prog(t, 29.82, 30, E.lin).toFixed(3) });
}
window.render = render;
window.ready = (async () => {
  await document.fonts.ready;
  await Promise.all(['400', '500', '600', '700', '800'].map(w => document.fonts.load(`${w} 40px Manrope`)));
  await Promise.all([...document.images].map(i => i.decode().catch(() => null)));
  const bgImgs = new Set();
  document.querySelectorAll('div').forEach(d => { const m = d.style.backgroundImage.match(/url\("?([^")]+)"?\)/); if (m) bgImgs.add(m[1]); });
  await Promise.all([...bgImgs].map(src => { const i = new Image(); i.src = src; return i.decode().catch(() => null); }));
  render(0);
  return true;
})();

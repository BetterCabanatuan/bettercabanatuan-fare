const fs = require('fs');
const { launch, BASE, waitMap } = require('./lib');
const OUT = __dirname + '/cap/';
const meta = JSON.parse(fs.readFileSync(OUT + 'meta.json'));
const HIDE = 'nextjs-portal{display:none!important} .maplibregl-map .pointer-events-none.absolute.inset-x-0{display:none!important} .maplibregl-marker{display:none!important} .maplibregl-ctrl-bottom-right,.maplibregl-ctrl-top-right{visibility:hidden!important}';
async function settle(p) {
  await p.waitForTimeout(1500);
  await p.waitForFunction(() => window.__map.areTilesLoaded() && !window.__map.isMoving(), null, { timeout: 60000 });
  await p.waitForTimeout(800);
  await p.waitForFunction(() => window.__map.areTilesLoaded(), null, { timeout: 60000 });
}
(async () => {
  const b = await launch();
  // Route bounds from the captured jeep sources.
  const lines = Object.entries(meta.jeepAB.sources).filter(([id]) => /cab-.*-route$/.test(id)).map(([, s]) => s.geojson.geometry.coordinates);
  const all = lines.flat();
  const bounds = [[Math.min(...all.map(c => c[0])), Math.min(...all.map(c => c[1]))], [Math.max(...all.map(c => c[0])), Math.max(...all.map(c => c[1]))]];
  meta.routeBounds = bounds;
  const ctx = await b.newContext({ viewport: { width: 2440, height: 1700 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/fare?mode=jeep', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: HIDE });
  await waitMap(p);
  await p.evaluate(() => { const m = window.__map; for (const l of m.getStyle().layers) if (l.id.startsWith('route-layer-') && !l.id.includes('boundary')) m.setLayoutProperty(l.id, 'visibility', 'none'); });
  meta.plates = [];
  const trip = meta.jeepAB.center;
  const cams = [
    { name: 'plate-z0', fit: true },
    { name: 'plate-z1', center: trip, zoom: 11.0 },
    { name: 'plate-z2', center: trip, zoom: 12.8 },
    { name: 'plate-z3', center: trip, zoom: 14.4 },
  ];
  for (const cam of cams) {
    await p.evaluate(({ cam, bounds }) => {
      const m = window.__map;
      if (cam.fit) m.fitBounds(bounds, { padding: 120, duration: 0 }); else m.jumpTo({ center: cam.center, zoom: cam.zoom });
    }, { cam, bounds });
    await settle(p);
    const st = await p.evaluate(() => { const m = window.__map; return { box: m.getContainer().getBoundingClientRect().toJSON(), center: m.getCenter().toArray(), zoom: m.getZoom() }; });
    await p.screenshot({ path: OUT + cam.name + '.png', clip: st.box });
    meta.plates.push({ name: cam.name, ...st });
    console.log(cam.name, st.zoom, st.box.width, st.box.height);
  }
  await ctx.close();

  // Fare card styles + phone fare card.
  {
    const ctx2 = await b.newContext({ viewport: { width: 1440, height: 3400 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const q = await ctx2.newPage();
    await q.goto(BASE + '/fare', { waitUntil: 'networkidle' });
    await waitMap(q);
    const sec = q.locator('section[aria-labelledby=planner-heading]');
    await sec.getByRole('button', { name: 'Central Transport Terminal', exact: true }).click();
    await q.waitForTimeout(800);
    await sec.getByRole('button', { name: 'SM City', exact: true }).click();
    await q.getByText('Tricycle fare', { exact: true }).last().waitFor();
    await q.waitForTimeout(1200);
    meta.fareStyle = await sec.evaluate(s => {
      const o = s.getBoundingClientRect();
      const el = [...s.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === '₱20.00' && getComputedStyle(e).fontSize === '48px');
      let card = el; while (card && getComputedStyle(card).backgroundColor === 'rgba(0, 0, 0, 0)') card = card.parentElement;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      return { r: { x: r.x - o.x, y: r.y - o.y, w: r.width, h: r.height }, card: { x: cr.x - o.x, y: cr.y - o.y, w: cr.width, h: cr.height, bg: getComputedStyle(card).backgroundColor, radius: getComputedStyle(card).borderRadius },
        font: cs.font, ls: cs.letterSpacing, color: cs.color, fvn: cs.fontVariantNumeric, lh: cs.lineHeight, cls: el.className };
    });
    console.log(meta.fareStyle);
    await ctx2.close();
  }
  {
    const ctx3 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const q = await ctx3.newPage();
    await q.goto(BASE + '/fare', { waitUntil: 'networkidle' });
    await q.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
    await waitMap(q);
    const sec = q.locator('section[aria-labelledby=planner-heading]');
    await sec.getByRole('button', { name: 'Central Transport Terminal', exact: true }).tap();
    await q.waitForTimeout(800);
    await sec.getByRole('button', { name: 'SM City', exact: true }).tap();
    await q.getByText('Tricycle fare', { exact: true }).last().waitFor();
    await q.waitForTimeout(1500);
    await sec.locator('button[aria-label="Add a regular passenger"]').tap();
    await q.waitForTimeout(500);
    await q.getByText('Tricycle fare', { exact: true }).last().evaluate(e => { const y = e.getBoundingClientRect().top + window.scrollY - 160; window.scrollTo(0, y); });
    await q.waitForTimeout(600);
    await q.screenshot({ path: OUT + 'm-fare.png' });
    await ctx3.close();
  }
  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta, null, 1));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });

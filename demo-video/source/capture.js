const fs = require('fs');
const { launch, BASE, waitMap } = require('./lib');
const OUT = __dirname + '/cap/';
const meta = {};
const HIDE_DEV = 'nextjs-portal{display:none!important} *{caret-color:transparent!important}';

async function newPage(b, opts) {
  const ctx = await b.newContext({ reducedMotion: 'reduce', ...opts });
  const p = await ctx.newPage();
  return p;
}
async function go(p, path, map = false) {
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: HIDE_DEV });
  await p.evaluate(() => document.fonts.ready);
  if (map) await waitMap(p);
  await p.waitForTimeout(400);
}
const rect = (p, sel) => p.locator(sel).first().evaluate(e => e.getBoundingClientRect().toJSON());
async function settleMap(p) {
  await p.waitForTimeout(1800);
  await p.waitForFunction(() => window.__map.areTilesLoaded() && !window.__map.isMoving(), null, { timeout: 30000 });
  await p.waitForTimeout(600);
}
const chip = (p, name) => p.locator('section[aria-labelledby=planner-heading]').getByRole('button', { name, exact: true }).first();

// Everything about the live map we need to redraw it ourselves.
async function mapState(p) {
  return p.evaluate(() => {
    const m = window.__map;
    const box = m.getContainer().getBoundingClientRect().toJSON();
    const sources = {};
    for (const [id, s] of Object.entries(m.style.sourceCaches || {})) { /* noop */ }
    for (const id of Object.keys(m.getStyle().sources)) {
      const src = m.getSource(id);
      if (src && src.type === 'geojson' && src._data) sources[id] = src._data;
    }
    const layers = m.getStyle().layers.filter(l => l.type === 'line' && l.source && sources[l.source]).map(l => ({ id: l.id, source: l.source, paint: l.paint, layout: l.layout }));
    const markers = [...m.getContainer().querySelectorAll('.maplibregl-marker')].map(e => {
      const r = e.getBoundingClientRect();
      const c = [r.x + r.width / 2 - box.x, r.y + r.height / 2 - box.y];
      const ll = m.unproject(c);
      return { text: e.textContent.trim().slice(0, 40), html: e.innerHTML.length, w: r.width, h: r.height, px: c, lnglat: [ll.lng, ll.lat] };
    });
    return { box, center: m.getCenter().toArray(), zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch(), sources, layers, markers };
  });
}
async function cleanPlate(p, file) {
  await p.evaluate(() => {
    const m = window.__map;
    for (const l of m.getStyle().layers) if (l.id.startsWith('route-layer-') && !l.id.includes('boundary')) m.setLayoutProperty(l.id, 'visibility', 'none');
    document.body.classList.add('__clean');
  });
  await p.addStyleTag({ content: 'body.__clean .maplibregl-marker{display:none!important} body.__clean .maplibregl-map [role=status], body.__clean .maplibregl-map .pointer-events-none.absolute{visibility:hidden!important}' });
  await settleMap(p);
  const box = await p.evaluate(() => window.__map.getContainer().getBoundingClientRect().toJSON());
  await p.screenshot({ path: OUT + file, clip: box });
}
async function restore(p) {
  await p.evaluate(() => {
    const m = window.__map;
    for (const l of m.getStyle().layers) if (l.id.startsWith('route-layer-')) m.setLayoutProperty(l.id, 'visibility', 'visible');
    document.body.classList.remove('__clean');
  });
}
async function fitAll(p, padding = 60) {
  await p.evaluate((padding) => {
    const m = window.__map;
    let b = null;
    for (const id of Object.keys(m.getStyle().sources)) {
      if (!id.includes('-route')) continue;
      const d = m.getSource(id)._data; if (!d) continue;
      const coords = (d.geometry || d.features?.[0]?.geometry)?.coordinates || [];
      for (const c of coords) { b = b ? b.extend(c) : new (m.getBounds().constructor)(c, c); }
    }
    if (b) m.fitBounds(b, { padding, duration: 0 });
  }, padding);
  await settleMap(p);
}

(async () => {
  const b = await launch();
  const D = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 };

  // Home, both languages.
  for (const [name, path] of [['home', '/'], ['home-tl', '/tl']]) {
    const p = await newPage(b, D);
    await go(p, path);
    await p.screenshot({ path: OUT + name + '-full.png', fullPage: true });
    meta[name] = await p.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      h1: document.querySelector('h1').getBoundingClientRect().toJSON(),
      board: [...document.querySelectorAll('main *')].find(e => /^(Fare board|Talaan ng pamasahe)$/i.test(e.textContent.trim()) && e.children.length === 0)?.closest('div[class*=rounded]')?.getBoundingClientRect().toJSON(),
      buttons: [...document.querySelectorAll('main a')].slice(0, 6).map(a => ({ t: a.textContent.trim(), r: a.getBoundingClientRect().toJSON() })),
      sections: [...document.querySelectorAll('main section, main > div')].map(s => ({ t: s.textContent.trim().slice(0, 30), r: s.getBoundingClientRect().toJSON() })),
      toggle: [...document.querySelectorAll('header a, header button')].map(a => ({ t: a.textContent.trim(), r: a.getBoundingClientRect().toJSON() })),
    }));
    await p.context().close();
  }

  // Tricycle planner map pass.
  {
    const p = await newPage(b, D);
    const osrm = [];
    p.on('response', async r => { if (r.url().includes('routing.openstreetmap.de')) { try { osrm.push(await r.json()); } catch {} } });
    await go(p, '/fare', true);
    await p.screenshot({ path: OUT + 'trike-view-empty.png' });
    meta.trikeEmptyMap = await mapState(p);
    await chip(p, 'Central Transport Terminal').click();
    await settleMap(p);
    await chip(p, 'SM City').click();
    await p.waitForFunction(() => window.__map.getStyle().layers.some(l => l.id.includes('planner-road')), null, { timeout: 30000 });
    await settleMap(p);
    await p.screenshot({ path: OUT + 'trike-view-ab.png' });
    await p.screenshot({ path: OUT + 'header-trike.png', clip: { x: 0, y: 0, width: 1440, height: 99.25 } });
    meta.trike = await mapState(p);
    meta.trike.osrm = osrm.at(-1)?.routes?.[0]?.geometry?.coordinates;
    await cleanPlate(p, 'plate-trike.png');
    await p.context().close();
  }

  // Jeep planner map pass.
  {
    const p = await newPage(b, D);
    await go(p, '/fare?mode=jeep', true);
    await chip(p, 'Central Transport Terminal').click();
    await settleMap(p);
    await chip(p, 'SM City').click();
    await p.waitForFunction(() => window.__map.getStyle().layers.some(l => l.id.includes('planner-road')), null, { timeout: 30000 });
    await settleMap(p);
    await p.screenshot({ path: OUT + 'jeep-view-ab.png' });
    await p.screenshot({ path: OUT + 'header-jeep.png', clip: { x: 0, y: 0, width: 1440, height: 99.25 } });
    meta.jeepAB = await mapState(p);
    await cleanPlate(p, 'plate-jeep-ab.png');
    await restore(p);
    // Pick the first trip.
    await p.locator('section[aria-labelledby=planner-heading]').getByText('Cabanatuan – Licab').first().click();
    await settleMap(p);
    await p.screenshot({ path: OUT + 'jeep-view-trip.png' });
    meta.jeepTrip = await mapState(p);
    await cleanPlate(p, 'plate-jeep-trip.png');
    await restore(p);
    await fitAll(p, 40);
    await p.screenshot({ path: OUT + 'jeep-view-all.png' });
    meta.jeepAll = await mapState(p);
    await cleanPlate(p, 'plate-jeep-all.png');
    await p.context().close();
  }

  // Planner side panels at full height.
  {
    const T = { viewport: { width: 1440, height: 3400 }, deviceScaleFactor: 2 };
    const panelShot = async (p, file) => {
      await p.waitForTimeout(500);
      const sec = p.locator('section[aria-labelledby=planner-heading]');
      await sec.screenshot({ path: OUT + file });
      return sec.evaluate(s => {
        const o = s.getBoundingClientRect();
        const rel = e => { const r = e.getBoundingClientRect(); return { x: r.x - o.x, y: r.y - o.y, width: r.width, height: r.height }; };
        return {
          size: { w: o.width, h: o.height },
          buttons: [...s.querySelectorAll('button')].map(e => ({ t: (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 50), r: rel(e) })),
          inputs: [...s.querySelectorAll('input')].map(e => ({ id: e.id, v: e.value, r: rel(e) })),
          money: [...s.querySelectorAll('*')].filter(e => e.children.length === 0 && /₱\d/.test(e.textContent)).map(e => ({ t: e.textContent.trim(), r: rel(e), fs: getComputedStyle(e).fontSize, fw: getComputedStyle(e).fontWeight, c: getComputedStyle(e).color })),
          headings: [...s.querySelectorAll('h1,h2,h3,p,li')].map(e => ({ t: e.textContent.trim().slice(0, 60), r: rel(e) })),
        };
      });
    };
    const p = await newPage(b, T);
    await go(p, '/fare', true);
    meta.panelT0 = await panelShot(p, 'panel-t0.png');
    await chip(p, 'Central Transport Terminal').click();
    meta.panelT1 = await panelShot(p, 'panel-t1.png');
    await chip(p, 'SM City').click();
    await p.getByText('Tricycle fare', { exact: true }).last().waitFor();
    await p.waitForTimeout(1500);
    meta.panelT2 = await panelShot(p, 'panel-t2.png');
    await p.locator('section[aria-labelledby=planner-heading] button[aria-label*="regular" i]').filter({ hasNotText: '-' }).last().click();
    meta.panelT3 = await panelShot(p, 'panel-t3.png');
    // Jeep panels.
    await p.locator('section[aria-labelledby=planner-heading]').getByRole('button', { name: 'Jeep', exact: true }).click();
    await p.waitForTimeout(2000);
    meta.panelJ0 = await panelShot(p, 'panel-j0.png');
    await p.locator('section[aria-labelledby=planner-heading]').getByText('Cabanatuan – Licab').first().click();
    await p.waitForTimeout(1200);
    meta.panelJ1 = await panelShot(p, 'panel-j1.png');
    await p.context().close();
  }

  // TODA and community pages.
  {
    const p = await newPage(b, D);
    await go(p, '/toda');
    await p.screenshot({ path: OUT + 'toda.png' });
    await p.screenshot({ path: OUT + 'toda-full.png', fullPage: true });
    meta.toda = await p.evaluate(() => {
      const i = document.querySelector('main input');
      const cs = getComputedStyle(i);
      return { input: i.getBoundingClientRect().toJSON(), pl: cs.paddingLeft, fs: cs.fontSize, color: cs.color,
        cards: [...document.querySelectorAll('main li, main article')].map(e => e.getBoundingClientRect().toJSON()),
        add: [...document.querySelectorAll('main a')].map(a => ({ t: a.textContent.trim(), r: a.getBoundingClientRect().toJSON() })) };
    });
    await p.locator('main input').first().fill('Sumacab');
    await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + 'toda-typed.png' });
    for (const [name, path] of [['toda-submit', '/toda/submit'], ['suggest', '/fare/suggest']]) {
      await go(p, path);
      await p.waitForTimeout(1500);
      await p.screenshot({ path: OUT + name + '.png' });
      await p.screenshot({ path: OUT + name + '-full.png', fullPage: true });
      meta[name] = await p.evaluate(() => ({ height: document.documentElement.scrollHeight, fields: [...document.querySelectorAll('main input, main textarea, main button, main fieldset, main legend')].map(e => ({ tag: e.tagName, t: (e.labels?.[0]?.textContent || e.textContent || e.name || '').trim().slice(0, 40), r: e.getBoundingClientRect().toJSON() })) }));
    }
    await p.context().close();
  }

  // Phone captures.
  {
    const M = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
    const p = await newPage(b, M);
    await go(p, '/');
    await p.screenshot({ path: OUT + 'm-home.png' });
    await go(p, '/toda');
    await p.screenshot({ path: OUT + 'm-toda.png' });
    await go(p, '/fare', true);
    await chip(p, 'Central Transport Terminal').tap();
    await p.waitForTimeout(1200);
    await chip(p, 'SM City').tap();
    await p.getByText('Tricycle fare', { exact: true }).last().waitFor();
    await p.evaluate(() => window.scrollTo(0, 0));
    await settleMap(p);
    await p.screenshot({ path: OUT + 'm-planner.png' });
    await p.locator('section[aria-labelledby=planner-heading] button[aria-label*="regular" i]').last().tap();
    await p.waitForTimeout(500);
    await p.getByText('Tricycle fare', { exact: true }).last().scrollIntoViewIfNeeded();
    await p.evaluate(() => window.scrollBy(0, -120));
    await p.waitForTimeout(400);
    await p.screenshot({ path: OUT + 'm-fare.png' });
    await p.getByRole('button', { name: 'Show the driver' }).tap();
    await p.waitForTimeout(800);
    await p.screenshot({ path: OUT + 'm-driver.png' });
    await go(p, '/fare?mode=jeep', true);
    await chip(p, 'Central Transport Terminal').tap();
    await p.waitForTimeout(1200);
    await chip(p, 'SM City').tap();
    await p.waitForTimeout(1500);
    await p.evaluate(() => window.scrollTo(0, 0));
    await settleMap(p);
    await p.screenshot({ path: OUT + 'm-jeep.png' });
    await p.context().close();
  }

  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta, null, 1));
  await b.close();
  console.log('done');
})().catch(e => { console.error(e); fs.writeFileSync(OUT + 'meta.partial.json', JSON.stringify(meta, null, 1)); process.exit(1); });

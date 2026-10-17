const fs = require('fs');
const { launch, BASE } = require('./lib');
const OUT = __dirname + '/cap/';
const meta = JSON.parse(fs.readFileSync(OUT + 'meta.json'));
(async () => {
  const b = await launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  for (const [name, path] of [['toda-submit', '/toda/submit'], ['suggest', '/fare/suggest']]) {
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(1500);
    meta[name].maps = await p.evaluate(() => [...document.querySelectorAll('.maplibregl-map')].map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }));
    meta[name].submit = await p.evaluate(() => { const e = [...document.querySelectorAll('main button')].find(b => /review/i.test(b.textContent)); const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; });
    meta[name].h1 = await p.evaluate(() => { const r = document.querySelector('h1').getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; });
    console.log(name, meta[name].maps, meta[name].submit);
  }
  await p.goto(BASE + '/', { waitUntil: 'networkidle' });
  meta.home.boardRect = await p.evaluate(() => { const e = [...document.querySelectorAll('*')].find(e => e.textContent.trim() === 'Fare board' && e.children.length === 0); let c = e; for (let i = 0; i < 6 && c; i++) { if (c.getBoundingClientRect().height > 300) break; c = c.parentElement; } const r = c.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  meta.home.amounts = await p.evaluate(() => [...document.querySelectorAll('main *')].filter(e => e.children.length === 0 && /^₱\d+\.\d\d$/.test(e.textContent.trim())).map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height }; }));
  meta.home.cards = await p.evaluate(() => [...document.querySelectorAll('main h2, main h3')].map(e => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), x: r.x, y: r.y, w: r.width, h: r.height }; }));
  console.log(meta.home.boardRect, meta.home.amounts, meta.home.cards);
  fs.writeFileSync(OUT + 'meta.json', JSON.stringify(meta, null, 1));
  await b.close();
})();

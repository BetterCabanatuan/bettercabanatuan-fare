const { chromium } = require('playwright');
const EXE = '/Users/gem/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
(async () => {
  const times = process.argv.slice(2).map(Number);
  const b = await chromium.launch({ executablePath: EXE, args: ['--allow-file-access-from-files', '--use-angle=metal'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + __dirname + '/comp.html');
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 }).catch(() => {});
  await p.evaluate(() => window.ready).catch(e => errs.push(String(e)));
  for (const t of times) {
    await p.evaluate(t => window.render(t), t).catch(e => errs.push(t + ': ' + e.message));
    await p.screenshot({ path: `${__dirname}/stills/s-${t.toFixed(2)}.png` });
  }
  if (errs.length) console.log('ERRORS', errs.slice(0, 10));
  await b.close();
})();

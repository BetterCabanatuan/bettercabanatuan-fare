const { chromium } = require('playwright');
const EXE = '/Users/gem/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = 'http://localhost:3000';
async function launch() {
  return chromium.launch({ executablePath: EXE, args: ['--use-angle=metal', '--enable-gpu'] });
}
// Finds the MapLibre instance by walking React fibers up from the map container.
const FIND_MAP = `(() => {
  if (window.__map) return true;
  const el = document.querySelector('.maplibregl-map');
  if (!el) return false;
  const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'));
  let f = el[key];
  while (f) {
    let s = f.memoizedState;
    while (s) {
      const v = s.memoizedState;
      if (v && typeof v === 'object' && typeof v.project === 'function' && typeof v.getStyle === 'function') { window.__map = v; return true; }
      s = s.next;
    }
    f = f.return;
  }
  return false;
})()`;
async function waitMap(page) {
  await page.waitForFunction(FIND_MAP, null, { timeout: 30000 });
  await page.waitForFunction(() => window.__map.loaded() && window.__map.areTilesLoaded(), null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.waitForFunction(() => window.__map.areTilesLoaded(), null, { timeout: 30000 });
}
module.exports = { launch, BASE, waitMap, FIND_MAP };

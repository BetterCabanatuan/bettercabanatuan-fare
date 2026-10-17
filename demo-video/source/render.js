// Renders comp.html frame by frame and pipes PNGs into ffmpeg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const EXE = '/Users/gem/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const args = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const FPS = +(args.fps || 60), T0 = +(args.from || 0), T1 = +(args.to || 30), OUT = args.out || 'out/video.mov';
const SUB = +(args.sub || 1); // sub-frames per output frame (motion blur)
(async () => {
  const b = await chromium.launch({ executablePath: EXE, args: ['--allow-file-access-from-files', '--use-angle=metal', '--force-device-scale-factor=1'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + __dirname + '/comp.html');
  await p.evaluate(() => window.ready);
  const rate = FPS * SUB;
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(rate), '-c:v', 'png', '-i', '-',
    ...(SUB > 1 ? ['-vf', `tmix=frames=${SUB}:weights=${Array(SUB).fill(1).join(' ')},select='not(mod(n\\,${SUB}))',setpts=N/${FPS}/TB`, '-r', String(FPS)] : []),
    '-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round((T1 - T0) * rate);
  const start = Date.now();
  for (let i = 0; i < n; i++) {
    // Sub-frames are centred on the output frame time (180-degree-ish shutter).
    const t = T0 + (i - (SUB - 1) / 2) / rate * (SUB > 1 ? 0.5 : 1) + (SUB > 1 ? (i % SUB) * 0 : 0);
    const tt = SUB > 1 ? T0 + Math.floor(i / SUB) / FPS + ((i % SUB) - (SUB - 1) / 2) / rate : T0 + i / FPS;
    await p.evaluate(t => window.render(t), Math.max(0, tt));
    const buf = await p.screenshot({ type: 'png' });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`\r${i}/${n} ${((Date.now() - start) / (i + 1)).toFixed(0)}ms/frame`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log('\ndone', ((Date.now() - start) / 1000).toFixed(1) + 's', errs.slice(0, 5));
  await b.close();
})();

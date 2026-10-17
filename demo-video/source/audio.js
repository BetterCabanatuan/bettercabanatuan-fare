// Synthesised score + sound design, locked to the video timeline. Writes out/audio.wav (48 kHz stereo).
const fs = require('fs');
const SR = 48000, DUR = 30, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const add = (i, v, pan = 0) => { if (i < 0 || i >= N) return; L[i] += v * Math.min(1, 1 - pan); R[i] += v * Math.min(1, 1 + pan); };
const BPM = 120, BEAT = 60 / BPM;

// ---------- instruments ----------
function kick(t, g = 0.9) {
  const n = SR * 0.45; let ph = 0;
  for (let k = 0; k < n; k++) { const x = k / SR; const f = 45 + 95 * Math.exp(-x * 28); ph += 2 * Math.PI * f / SR; add(Math.round(t * SR) + k, Math.sin(ph) * Math.exp(-x * 7.5) * g); }
}
function hat(t, g = 0.12, dec = 55, pan = 0.2) {
  const n = SR * 0.08; let lp = 0, prev = 0;
  for (let k = 0; k < n; k++) { const w = rnd(); const hp = w - prev; prev = w; lp = hp; add(Math.round(t * SR) + k, lp * Math.exp(-k / SR * dec) * g, pan); }
}
function clap(t, g = 0.22) {
  const n = SR * 0.25; let b = 0;
  for (let k = 0; k < n; k++) { const x = k / SR; const env = (x < 0.03 ? (Math.floor(x / 0.01) % 2 ? 0.6 : 1) : 1) * Math.exp(-x * 22); b = b * 0.6 + rnd() * 0.4; add(Math.round(t * SR) + k, (rnd() - b) * env * g, -0.1); }
}
function tone(t, f, d, g, { type = 'sine', att = 0.005, rel = 0.1, pan = 0, vib = 0, glide = 0 } = {}) {
  const n = SR * (d + rel); let ph = 0;
  for (let k = 0; k < n; k++) {
    const x = k / SR;
    const env = Math.min(1, x / att) * (x > d ? Math.exp(-(x - d) / rel * 3) : 1);
    const ff = f * (1 + glide * Math.exp(-x * 30)) * (1 + vib * Math.sin(2 * Math.PI * 5 * x));
    ph += 2 * Math.PI * ff / SR;
    let v;
    if (type === 'sine') v = Math.sin(ph);
    else if (type === 'tri') v = 2 / Math.PI * Math.asin(Math.sin(ph));
    else v = Math.sin(ph) + 0.3 * Math.sin(2 * ph) + 0.12 * Math.sin(3 * ph);
    add(Math.round(t * SR) + k, v * env * g, pan);
  }
}
function pluck(t, f, g = 0.08, pan = 0) { // Karplus-Strong
  const p = Math.round(SR / f); const buf = Float32Array.from({ length: p }, () => rnd());
  const n = SR * 0.6; let idx = 0;
  for (let k = 0; k < n; k++) { const a = buf[idx], b = buf[(idx + 1) % p]; buf[idx] = (a + b) * 0.497; add(Math.round(t * SR) + k, a * g, pan); idx = (idx + 1) % p; }
}
function noiseSweep(t, d, g, f0, f1, { pan = 0, shape = 'swell' } = {}) {
  // Resonant band-pass noise whose centre sweeps f0 -> f1: whooshes and risers.
  const n = SR * d; let y1 = 0, y2 = 0;
  for (let k = 0; k < n; k++) {
    const u = k / n; const f = f0 * Math.pow(f1 / f0, u);
    const w = 2 * Math.PI * f / SR, q = 3.5, alpha = Math.sin(w) / (2 * q);
    const x = rnd();
    const y = (alpha * x + 2 * Math.cos(w) * y1 - (1 - alpha) * y2) / (1 + alpha) * 1.0;
    y2 = y1; y1 = y;
    const env = shape === 'swell' ? Math.pow(u, 2) * (u < 0.95 ? 1 : (1 - u) / 0.05) : Math.sin(Math.PI * u) ** 2;
    add(Math.round(t * SR) + k, y * env * g * 6, pan * (u - 0.5) * 2);
  }
}
function click(t, g = 0.35) { for (let k = 0; k < SR * 0.012; k++) add(Math.round(t * SR) + k, (rnd() * 0.5 + Math.sin(k / SR * 2 * Math.PI * 3200)) * Math.exp(-k / SR * 500) * g); tone(t, 1400, 0.01, g * 0.25, { rel: 0.03 }); }
function pop(t, g = 0.4, f = 520) { tone(t, f, 0.03, g, { glide: 1.2, rel: 0.12 }); tone(t, f * 2, 0.02, g * 0.2, { glide: 1.2, rel: 0.06 }); }
function ticks(t0, t1, rate0, rate1, g = 0.08) { let t = t0; while (t < t1) { const u = (t - t0) / (t1 - t0); click(t, g * (1 - 0.5 * u)); t += 1 / lerp(rate0, rate1, u); } }
const lerp = (a, b, u) => a + (b - a) * u;
function thud(t, g = 0.8) { kick(t, g); noiseSweep(t, 0.18, 0.18, 900, 200, { shape: 'hit' }); }
function chime(t, notes, g = 0.12, step = 0.06) { notes.forEach((f, i) => { tone(t + i * step, f, 0.05, g, { type: 'tri', rel: 1.4, pan: (i / notes.length - 0.5) * 0.8 }); tone(t + i * step, f * 2, 0.04, g * 0.3, { rel: 0.9 }); }); }

// ---------- score ----------
// A major, bars of 2 s: A  F#m  D  E
const prog = [[220, 277.18, 329.63], [185, 220, 277.18], [146.83, 185, 220], [164.81, 207.65, 246.94]];
const bassN = [55, 46.25, 73.42 / 2 * 2, 41.2 * 2];
const start = 2.5, end = 26.8;
// Intro: pad swell + riser into the iris.
prog[0].forEach((f, i) => tone(0, f, 2.3, 0.05, { type: 'saw', att: 1.2, rel: 0.6, pan: (i - 1) * 0.5, vib: 0.002 }));
noiseSweep(0.4, 1.6, 0.05, 300, 5000);
for (let b = 0; b < 4; b++) tone(b * 0.5, 55, 0.4, 0.12, { rel: 0.2 });
// Groove.
for (let t = start, bi = 0; t < end; t += BEAT, bi++) {
  const bar = Math.floor((t - start) / 2) % 4;
  if (!(t > 10.95 && t < 11.45)) kick(t, 0.75);
  hat(t + BEAT / 2, 0.075); hat(t + BEAT / 4, 0.035, 90, -0.3); hat(t + 3 * BEAT / 4, 0.035, 90, 0.3);
  if (bi % 2 === 1) clap(t, 0.16);
  if (bi % 4 === 0) { prog[bar].forEach((f, i) => tone(t, f, 1.9, 0.028, { type: 'saw', att: 0.08, rel: 0.4, pan: (i - 1) * 0.6, vib: 0.003 })); tone(t, bassN[bar], 1.85, 0.2, { type: 'tri', att: 0.01, rel: 0.1 }); }
  // Arpeggio from the tricycle scene on.
  if (t >= 5.6) for (let s = 0; s < 4; s++) { const ch = prog[bar]; pluck(t + s * BEAT / 4, ch[(bi * 4 + s) % 3] * 2, 0.05, s % 2 ? 0.35 : -0.35); }
}
// Outro: big chord + chime.
thud(28.3, 0.9);
[220, 277.18, 329.63, 440].forEach((f, i) => tone(28.3, f, 1.4, 0.05, { type: 'saw', att: 0.02, rel: 0.4, pan: (i - 1.5) * 0.4 }));
tone(28.3, 55, 1.5, 0.25, { type: 'tri', rel: 0.3 });
chime(28.35, [880, 1108.73, 1318.51, 1760, 2217.46], 0.07, 0.07);
noiseSweep(26.4, 1.9, 0.05, 200, 6000);

// ---------- sound design ----------
pop(0.37, 0.35, 480); pop(1.37, 0.35, 620);
ticks(1.3, 2.0, 40, 8, 0.06);
noiseSweep(1.9, 0.6, 0.12, 400, 4000, { shape: 'hit', pan: 1 });
thud(2.5, 0.5);
[6.62, 7.16, 9.4, 10.55, 14.62, 17.95, 18.75, 19.55, 21.0, 23.75, 25.4].forEach(c => click(c, 0.3));
pop(6.98, 0.3, 500); pop(7.52, 0.3, 660); pop(22.27, 0.28, 560); pop(23.24, 0.25, 500); pop(23.37, 0.25, 660);
noiseSweep(7.25, 0.7, 0.03, 2000, 6000, { shape: 'hit' });
ticks(8.3, 9.15, 45, 8, 0.05); ticks(9.45, 9.9, 30, 8, 0.05);
pop(7.95, 0.18, 900); pop(9.55, 0.18, 900);
// Transitions.
[[5.55, 0.5], [10.6, 0.5], [13.36, 0.45], [18.78, 0.5], [21.0, 0.5], [22.18, 0.5], [24.55, 0.5], [26.6, 0.7]].forEach(([t, d], i) => noiseSweep(t, d, 0.1, 300, 3500, { shape: 'hit', pan: i % 2 ? -1 : 1 }));
noiseSweep(10.5, 0.55, 0.06, 500, 7000); thud(11.05, 0.45);
pop(12.05, 0.25, 760);
// Jeep routes radiate: a rising shimmer.
for (let i = 0; i < 15; i++) tone(15.3 + i * 0.05, 440 * Math.pow(2, (i % 8) / 8 + (i >= 8 ? 1 : 0) * 0.5), 0.05, 0.03, { type: 'tri', rel: 0.6, pan: (i / 14 - 0.5) * 1.2 });
ticks(15.3, 16.4, 20, 10, 0.03);
noiseSweep(14.75, 0.9, 0.04, 3000, 400, { shape: 'hit' }); noiseSweep(16.75, 0.9, 0.04, 400, 3000, { shape: 'hit' });
// Typing.
for (let k = 0; k < 7; k++) click(19.65 + k * 0.0714 + (k % 2) * 0.01, 0.18);
// Stamp.
thud(24.22, 0.85); clap(24.22, 0.25); chime(24.3, [659.25, 880], 0.05, 0.08);
// Slats flip.
for (let i = 0; i < 12; i++) click(25.6 + i * 0.045, 0.12);
noiseSweep(25.45, 0.9, 0.05, 1500, 5000, { shape: 'hit' });

// ---------- master: gentle glue + fade ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.05) * (t > 29.6 ? Math.max(0, (30 - t) / 0.4) : 1);
  L[i] = Math.tanh(L[i] * 1.1) * fade; R[i] = Math.tanh(R[i] * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { buf.writeInt16LE(Math.round(L[i] * gain * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * gain * 32767), 46 + i * 4); }
fs.writeFileSync('out/audio.wav', buf);
console.log('audio ok, peak', peak.toFixed(2));

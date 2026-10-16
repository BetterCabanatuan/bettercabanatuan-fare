// Usage: node scripts/generate-jeep-route-lines.mjs [route-id ...] [--raw-dir=/scratch/dir]  (regenerates jeep route lines from each route's waypoints)
//
// For every route in data/jeepney/routes.json that has two or more `waypoints`, this asks the
// FOSSGIS OSRM car router for the outbound line (terminal → via towns → destination) and the
// return line (the same waypoints reversed), simplifies each line (Douglas–Peucker, ~20 m),
// rounds coordinates to 5 decimals and writes `directions`, `status: "approximate"` and
// `lineNote` back. Routing data: OpenStreetMap contributors (ODbL). Plain Node 24, no deps.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROUTES_FILE = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "jeepney", "routes.json");
const OSRM = "https://routing.openstreetmap.de/routed-car/route/v1/driving/";
const USER_AGENT = "pamasahe-dev/0.1 (Pamasahe Cabanatuan route presets)";
const DELAY_MS = 1100; // FOSSGIS asks for at most one request per second.
const TOLERANCE_M = 20;

const args = process.argv.slice(2);
const rawDir = args.find((a) => a.startsWith("--raw-dir="))?.slice("--raw-dir=".length);
const onlyIds = new Set(args.filter((a) => !a.startsWith("--")));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const round5 = (n) => Math.round(n * 1e5) / 1e5;

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

const lengthKm = (line) => line.slice(1).reduce((sum, point, i) => sum + haversineKm(line[i], point), 0);

/** Douglas–Peucker on a local equirectangular projection (metres), iterative. */
function simplify(line, toleranceM) {
  if (line.length < 3) return line;
  const lat0 = (line.reduce((s, [, lat]) => s + lat, 0) / line.length) * (Math.PI / 180);
  const mx = 111_320 * Math.cos(lat0);
  const my = 110_540;
  const xy = line.map(([lng, lat]) => [lng * mx, lat * my]);
  const keep = new Uint8Array(line.length);
  keep[0] = keep[line.length - 1] = 1;
  const stack = [[0, line.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1;
    let maxI = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = xy[i];
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
      if (d > maxD) [maxD, maxI] = [d, i];
    }
    if (maxD > toleranceM) {
      keep[maxI] = 1;
      stack.push([a, maxI], [maxI, b]);
    }
  }
  return line.filter((_, i) => keep[i]);
}

async function route(positions, tag) {
  const coords = positions.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const url = `${OSRM}${coords}?overview=full&geometries=geojson&steps=true`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    const text = await response.text();
    if (response.ok) {
      if (rawDir) writeFileSync(join(rawDir, `${tag}.json`), text);
      const body = JSON.parse(text);
      if (body.code !== "Ok") throw new Error(`${tag}: OSRM ${body.code} ${body.message ?? ""}`);
      // Jeepneys do not use expressways: flag any motorway or toll step so a waypoint can steer around it.
      const flagged = body.routes[0].legs
        .flatMap((leg) => leg.steps)
        .filter(
          (step) =>
            /expressway|expwy|\b(nlex|sctex|tplex|cllex)\b/i.test(`${step.name} ${step.ref ?? ""}`) ||
            step.intersections.some((x) => x.classes?.some((c) => c === "motorway" || c === "toll")),
        )
        .map((step) => step.name || step.ref || "unnamed");
      if (flagged.length) console.warn(`${tag}: WARNING uses motorway/toll roads: ${[...new Set(flagged)].join(", ")}`);
      return { line: body.routes[0].geometry.coordinates, km: body.routes[0].distance / 1000, snaps: body.waypoints };
    }
    console.warn(`${tag}: HTTP ${response.status}, retrying`);
    await sleep(DELAY_MS * 5 * attempt);
  }
  throw new Error(`${tag}: OSRM request failed`);
}

/** Compact JSON: objects indented, arrays of numbers or of number pairs kept on one line. */
function format(value, indent = "") {
  const inner = indent + "  ";
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const flat = value.every((v) => typeof v !== "object" || v === null || (Array.isArray(v) && v.every((n) => typeof n === "number")));
    if (flat) return `[${value.map((v) => JSON.stringify(v)).join(",")}]`.replace(/\],\[/g, "], [");
    return `[\n${value.map((v) => inner + format(v, inner)).join(",\n")}\n${indent}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${format(v, inner)}`).join(",\n")}\n${indent}}`;
  }
  return JSON.stringify(value);
}

const data = JSON.parse(readFileSync(ROUTES_FILE, "utf8"));
const today = new Date().toLocaleDateString("sv"); // local YYYY-MM-DD
if (rawDir) mkdirSync(rawDir, { recursive: true });

let first = true;
for (const r of data.routes) {
  if (!Array.isArray(r.waypoints) || r.waypoints.length < 2) continue;
  if (onlyIds.size && !onlyIds.has(r.id)) continue;

  const positions = r.waypoints.map((w) => w.position);
  const destination = r.name.split(/\s+[–-]\s+/).slice(1).join(" – ") || r.waypoints.at(-1).name;
  const directions = [];
  for (const [id, label, pts] of [
    ["outbound", `To ${destination}`, positions],
    ["return", "To Cabanatuan", [...positions].reverse()],
  ]) {
    if (!first) await sleep(DELAY_MS);
    first = false;
    const { line, km, snaps } = await route(pts, `${r.id}-${id}`);
    const simplified = simplify(line, TOLERANCE_M).map(([lng, lat]) => [round5(lng), round5(lat)]);
    const deduped = simplified.filter((p, i) => i === 0 || p[0] !== simplified[i - 1][0] || p[1] !== simplified[i - 1][1]);
    const maxSnapM = Math.max(...snaps.map((s) => s.distance));
    console.log(
      `${r.id} ${id}: ${km.toFixed(1)} km, ${line.length} → ${deduped.length} points, simplified ${lengthKm(deduped).toFixed(1)} km, max snap ${maxSnapM.toFixed(0)} m`,
    );
    directions.push({ id, label, line: deduped });
  }

  r.status = "approximate";
  delete r.verifiedOn;
  r.terminalPosition ??= positions[0];
  r.directions = directions;
  r.lineNote = `Approximate: routed along main roads between the waypoints with OSRM on OpenStreetMap data (ODbL), generated ${today}. Not an official route line.`;
}

writeFileSync(ROUTES_FILE, format(data) + "\n");
console.log(`Wrote ${ROUTES_FILE}`);

const fs = require('fs');
const m = require('./cap/meta.json');
const bnd = require('/Users/gem/projects/bettercabanatuan-fare/data/geo/cabanatuan-boundary.json');
const pick = (st) => ({ center: st.center, zoom: st.zoom, w: st.box.width, h: st.box.height });
const src = (st, re) => Object.entries(st.sources).filter(([id]) => re.test(id)).map(([id, s]) => ({ id: id.replace('route-source-planner-', ''), line: s.geojson.geometry.coordinates }));
const ring = (() => { const g = bnd.geometry || bnd.features?.[0]?.geometry || bnd; const c = g.coordinates || bnd; return g.type === 'MultiPolygon' ? c[0][0] : g.type === 'Polygon' ? c[0] : c; })();
const D = {
  trike: { ...pick(m.trike), road: m.trike.osrm, a: m.trike.markers[0].lnglat, b: m.trike.markers[1].lnglat },
  jeep: {
    ab: pick(m.jeepAB),
    routes: src(m.jeepAB, /^route-source-planner-cab-.*-route$/),
    trip: src(m.jeepTrip, /(picked-routeActive|ride-ride|walk-a-walk|walk-b-walk)$/),
    markers: m.jeepAB.markers.map(k => ({ t: k.text, ll: k.lnglat, kind: k.text === 'A' || k.text === 'B' ? 'pin' : k.text ? 'end' : 'terminal' })),
    plates: m.plates.map(p => ({ name: p.name, center: p.center, zoom: p.zoom, w: p.box.width, h: p.box.height })),
  },
  panel: Object.fromEntries(['panelT0', 'panelT1', 'panelT2', 'panelT3', 'panelJ0', 'panelJ1'].map(k => [k, { buttons: m[k].buttons, size: m[k].size }])),
  fare: m.fareStyle,
  home: { amounts: m.home.amounts, board: m.home.boardRect, cards: m.home.cards, toggle: m.home.toggle, buttons: m.home.buttons },
  toda: m.toda, todaSubmit: { maps: m['toda-submit'].maps, submit: m['toda-submit'].submit, height: m['toda-submit'].height },
  suggest: { maps: m.suggest.maps, submit: m.suggest.submit, height: m.suggest.height },
  ring,
};
fs.writeFileSync('data.js', 'window.D=' + JSON.stringify(D) + ';');
console.log('routes', D.jeep.routes.length, 'trip', D.jeep.trip.map(t => t.id + ':' + t.line.length), 'ring', ring.length, 'road', D.trike.road.length);
D.logo = fs.readFileSync('cap/logo.svg', 'utf8');
fs.writeFileSync('data.js', 'window.D=' + JSON.stringify(D) + ';');

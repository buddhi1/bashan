'use strict';
/*
 * ShapeToVec+ explainer (~76 s, loops). Every scene is SVG built once and redrawn from a single clock,
 * so playback can pause, seek and jump between scenes. Works offline: no external libraries or fonts.
 *
 *   ?t=12  start at 12 s     ?pause  start paused     ?clean  hide controls (for screen recording)
 *   keys: Space play/pause, ← → scenes, Home restart, L loop, F fullscreen
 */

const NS = 'http://www.w3.org/2000/svg';
const C = {
  ink: '#13293D', text: '#1F2933', muted: '#52606D', grey: '#AAB4BE', rule: '#CBD2D9', surface: '#F1F5F9',
  iae: '#1E8A57', iaeT: '#E7F4EC', bae: '#6B3FA0', baeT: '#F1EAF8', warn: '#B9480F', warnT: '#FCEDE4',
  gold: '#F2B544', goldT: '#FBE9C2', goldLine: '#D99A1E', lake: '#3E78B2', lakeLine: '#1F4E79', headSub: '#C9D6E3',
};

// ---------------------------------------------------------------- helpers
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs || {}) {
    if (k === 'text') e.textContent = attrs[k];
    else e.setAttribute(k, attrs[k]);
  }
  if (parent) parent.appendChild(e);
  return e;
}
function txt(parent, x, y, s, size, attrs) {
  return el('text', { x, y, 'font-size': size, fill: C.text, ...attrs, text: s }, parent);
}
// runs: strings or {t, b (bold), c (colour), i (italic), sub (subscript)}
function rich(parent, x, y, runs, size, attrs) {
  const t = el('text', { x, y, 'font-size': size, fill: C.text, ...attrs }, parent);
  let shifted = false;
  for (const r of runs) {
    const o = typeof r === 'string' ? { t: r } : r;
    const s = el('tspan', {}, t);
    s.textContent = o.t;
    if (o.b) s.setAttribute('font-weight', 700);
    if (o.c) s.setAttribute('fill', o.c);
    if (o.i) s.setAttribute('font-style', 'italic');
    if (o.sub) { s.setAttribute('dy', size * 0.22); s.setAttribute('font-size', size * 0.68); shifted = true; }
    else if (shifted) { s.setAttribute('dy', -size * 0.22); shifted = false; }
  }
  return t;
}
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const seg = (t, a, d) => ease(clamp((t - a) / d));
const lerp = (a, b, p) => a + (b - a) * p;
// fade a node in at time a (and optionally out at time out)
function show(node, t, a, d = 0.5, out) {
  let p = seg(t, a, d);
  if (out !== undefined) p *= 1 - seg(t, out, 0.4);
  node.setAttribute('opacity', p.toFixed(3));
  return p;
}
const move = (node, x, y, s = 1) => node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// smooth blob: radius = R * (1 + harmonics 2..n), optional rotation and stretch
function blobPts(cx, cy, R, harm, rot = 0, sx = 1, sy = 1, n = 72) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    let r = 1;
    harm.forEach(([a, b], k) => { r += a * Math.cos((k + 2) * (t + rot)) + b * Math.sin((k + 2) * (t + rot)); });
    r = Math.max(r, 0.3);
    pts.push([cx + R * r * Math.cos(t) * sx, cy + R * r * Math.sin(t) * sy]);
  }
  return pts;
}
const pathOf = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';

// ---------------------------------------------------------------- shared pieces
function background(g, color = '#FFFFFF') { el('rect', { x: 0, y: 0, width: 1920, height: 1080, fill: color }, g); }
function header(g, n, title, color = C.ink) {
  const h = el('g', {}, g);
  el('circle', { cx: 168, cy: 122, r: 32, fill: color }, h);
  txt(h, 168, 134, n, 34, { 'text-anchor': 'middle', 'font-weight': 700, fill: '#fff' });
  txt(h, 222, 140, title, 56, { 'font-weight': 700, fill: color });
  txt(g, 1780, 92, 'ShapeToVec+  ·  Poster S-45', 24, { 'text-anchor': 'end', fill: C.muted, 'font-weight': 700 });
  return h;
}
function badge(parent, x, y, letter, r = 22) {
  const b = el('g', {}, parent);
  el('circle', { cx: x, cy: y, r, fill: C.ink, stroke: '#fff', 'stroke-width': 3 }, b);
  txt(b, x, y + r * 0.36, letter, r * 1.05, { 'text-anchor': 'middle', 'font-weight': 700, fill: '#fff' });
  return b;
}

// the poster's example: quadtree extent (8 x 8 units) with a centred polygon
const G = window.GEOM;
const LETTERS = ['A', 'B', 'C', 'D'];
function drawGrid(parent, gx, gy, size) {
  const k = size / 8;
  const g = el('g', {}, parent);
  el('rect', { x: gx, y: gy, width: size, height: size, fill: '#fff' }, g);
  const cells = G.cells.map((c) => el('rect', {
    x: gx + c.x * k, y: gy + c.y * k, width: c.s * k, height: c.s * k, fill: '#fff', stroke: C.grey, 'stroke-width': 2,
  }, g));
  const polyG = el('g', {}, g);
  const poly = el('path', {
    d: pathOf(G.poly.map(([x, y]) => [gx + x * k, gy + y * k])),
    fill: C.lake, 'fill-opacity': 0.42, stroke: C.lakeLine, 'stroke-width': 4,
  }, polyG);
  return { g, cells, polyG, poly, k };
}

// gold outlines and A-D badges on the four example cells (badge spots in grid units, as on the poster)
function pickMarks(parent, grid) {
  const k = grid.k, gx = 140, gy = 240;
  const picks = G.picked.map((c) => el('rect', {
    x: gx + c.x * k + 5, y: gy + c.y * k + 5, width: c.s * k - 10, height: c.s * k - 10, fill: 'none', stroke: C.goldLine, 'stroke-width': 6,
  }, parent));
  const spots = [[4.55, 0.55], [0.55, 2.55], [2.5, 2.5, [2.5, 3.0]], [3.51, 2.28, [3.25, 3.0]]];
  const badges = spots.map(([x, y, to], i) => {
    const bg = el('g', {}, parent);
    if (to) el('line', { x1: gx + x * k, y1: gy + y * k, x2: gx + to[0] * k, y2: gy + to[1] * k, stroke: C.ink, 'stroke-width': 3 }, bg);
    badge(bg, gx + x * k, gy + y * k, LETTERS[i], 22);
    return bg;
  });
  return { picks, badges };
}

// ---------------------------------------------------------------- data for the scenes
const rng = mulberry32(7);
const QH = [[0.2, 0.06], [0.09, -0.07], [0.035, 0.02]]; // query shape harmonics
const RANK = { 8: 1, 15: 2, 20: 3 };                       // database tiles that resemble the query
const DB = [];
for (let i = 0; i < 24; i++) {
  if (RANK[i]) {
    const n = [0.025, 0.045, 0.065][RANK[i] - 1];
    DB.push({ h: QH.map(([a, b]) => [a + (rng() - 0.5) * 2 * n, b + (rng() - 0.5) * 2 * n]), R: 50 * (1 + (rng() - 0.5) * 0.08), rot: 0, sx: 1, rank: RANK[i] });
  } else {
    DB.push({
      h: [[(rng() - 0.5) * 0.55, (rng() - 0.5) * 0.55], [(rng() - 0.5) * 0.32, (rng() - 0.5) * 0.32], [(rng() - 0.5) * 0.16, (rng() - 0.5) * 0.16]],
      R: 34 + rng() * 22, rot: rng() * 6.28, sx: 0.6 + rng() * 0.75, rank: 0,
    });
  }
}

// Table 1, Sports dataset (1.75M polygons, 3K cells): recall@50
const RESULTS = [
  { name: 'ShapeToVec float32', short: 'float32', c: 1, r: 96, col: C.warn, base: true, lab: [16, -22, 'start'] },
  { name: 'ShapeToVec 1-bit', short: '1-bit', c: 32, r: 63, col: C.muted, base: true, lab: [-22, 8, 'end'] },
  { name: 'IAE-ARE', c: 4, r: 96, col: C.iae, lab: [18, -20, 'start'] },
  { name: 'IAE-LogARE', c: 4, r: 92, col: C.iae, lab: [20, 30, 'start'] },
  { name: 'BAE-4bit', c: 8, r: 94, col: C.bae, lab: [20, 32, 'start'] },
  { name: 'BAE-2bit', c: 16, r: 83, col: C.bae, lab: [20, 8, 'start'] },
  { name: 'BAE-2level', c: 16, r: 78, col: C.bae, lab: [20, 8, 'start'] },
  { name: 'BAE-1bit', c: 32, r: 74, col: C.bae, lab: [-22, 8, 'end'] },
];
// index size at 90M Overture polygons (GB)
const MEMORY = [
  ['Float32', '32 bits', 1260, '1+ TB', C.warn], ['IAE (ARE, LogARE)', '8 bits', 320, '320 GB', C.iae],
  ['BAE-4bit', '4 bits', 167, '167 GB', C.bae], ['BAE-2bit, 2level', '2 bits', 91, '91 GB', C.bae], ['BAE-1bit', '1 bit', 52, '52 GB', C.bae],
];

// ---------------------------------------------------------------- scenes
const scenes = [
  // 0 ---------------------------------------------------------- title
  {
    name: 'Title', dur: 4,
    build(g) {
      background(g, C.ink);
      const s = {};
      s.lake = el('path', {
        d: pathOf(blobPts(1615, 560, 185, QH)), fill: 'none', stroke: C.gold, 'stroke-width': 8, pathLength: 1, 'stroke-dasharray': 1,
      }, g);
      s.title = txt(g, 150, 470, 'ShapeToVec+', 170, { 'font-weight': 700, fill: '#fff' });
      s.sub = txt(g, 155, 560, 'Compact signatures for shape-similarity search over millions of polygons', 40, { fill: C.headSub });
      s.auth = txt(g, 155, 660, 'Buddhi Ashan M. K.  ·  Ruban Sampath  ·  Sushil K. Prasad  —  UT San Antonio', 32, { fill: '#fff' });
      s.tag = el('g', {}, g);
      el('rect', { x: 155, y: 735, width: 330, height: 74, rx: 16, fill: C.gold }, s.tag);
      txt(s.tag, 320, 784, 'Poster S-45', 38, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
      return s;
    },
    render(t, s) {
      s.lake.setAttribute('stroke-dashoffset', (1 - seg(t, 0.2, 2.2)).toFixed(3));
      s.lake.setAttribute('fill', C.lake);
      s.lake.setAttribute('fill-opacity', (0.35 * seg(t, 2.0, 1)).toFixed(3));
      const p = seg(t, 0.1, 0.9);
      show(s.title, t, 0.1, 0.9); move(s.title, 0, (1 - p) * 30);
      show(s.sub, t, 0.7); show(s.auth, t, 1.2); show(s.tag, t, 1.6);
    },
  },

  // 1 ---------------------------------------------------------- what is shape similarity search
  {
    name: 'Shape search', dur: 10,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '1', 'Shape similarity search: find polygons that look alike');
      // query
      s.q = el('g', {}, g);
      el('rect', { x: 140, y: 230, width: 460, height: 310, rx: 22, fill: C.surface }, s.q);
      txt(s.q, 172, 278, 'Query shape', 30, { 'font-weight': 700, fill: C.ink });
      el('path', { d: pathOf(blobPts(370, 410, 95, QH)), fill: C.lake, 'fill-opacity': 0.55, stroke: C.lakeLine, 'stroke-width': 4 }, s.q);
      // database
      s.dbLabel = txt(g, 780, 208, 'Polygon database (millions of lakes, parks, land use …)', 28, { 'font-weight': 700, fill: C.muted });
      s.tiles = DB.map((d, i) => {
        const x = 780 + (i % 6) * 172, y = 230 + Math.floor(i / 6) * 172;
        const tg = el('g', {}, g);
        const rect = el('rect', { x, y, width: 150, height: 150, rx: 16, fill: '#fff', stroke: C.rule, 'stroke-width': 2 }, tg);
        el('path', { d: pathOf(blobPts(x + 75, y + 75, d.R, d.h, d.rot, d.sx, 1)), fill: C.lake, 'fill-opacity': 0.5, stroke: C.lakeLine, 'stroke-width': 2.5 }, tg);
        const b = d.rank ? badge(tg, x + 128, y + 24, '#' + d.rank, 21) : null;
        return { tg, rect, b, d, x };
      });
      s.beam = el('rect', { x: 0, y: 222, width: 8, height: 680, rx: 4, fill: C.gold }, g);
      // Jaccard panel
      s.j = el('g', {}, g);
      el('rect', { x: 140, y: 580, width: 460, height: 340, rx: 22, fill: C.surface }, s.j);
      txt(s.j, 172, 626, 'How alike? Jaccard similarity', 30, { 'font-weight': 700, fill: C.ink });
      const top = DB.find((d) => d.rank === 1);
      const qp = blobPts(370, 750, 80, QH), cp = blobPts(370, 750, 80 * top.R / 50, top.h);
      const defs = el('defs', {}, g);
      const clip = el('clipPath', { id: 'qclip' }, defs);
      el('path', { d: pathOf(qp) }, clip);
      el('path', { d: pathOf(qp), fill: C.lake, 'fill-opacity': 0.45, stroke: C.lakeLine, 'stroke-width': 3 }, s.j);
      s.cand = el('path', { d: pathOf(cp), fill: C.gold, 'fill-opacity': 0.35, stroke: C.goldLine, 'stroke-width': 3 }, s.j);
      s.inter = el('path', { d: pathOf(cp), fill: C.ink, 'fill-opacity': 0.55, 'clip-path': 'url(#qclip)' }, s.j);
      s.formula = rich(s.j, 370, 895, ['J = ', { t: 'overlap', b: true, c: C.ink }, '  ÷  ', { t: 'union', b: true, c: C.lakeLine }], 34, { 'text-anchor': 'middle' });
      return s;
    },
    render(t, s) {
      show(s.head, t, 0); show(s.q, t, 0.3); show(s.dbLabel, t, 0.8);
      const bx = lerp(770, 1800, clamp((t - 3.0) / 2.0));
      s.beam.setAttribute('x', bx.toFixed(1));
      show(s.beam, t, 2.9, 0.3, 5.0);
      const found = seg(t, 5.2, 0.8);
      s.tiles.forEach(({ tg, rect, b, d, x }, i) => {
        const appear = seg(t, 0.8 + i * 0.06, 0.4);
        const near = t > 3 && t < 5.2 ? clamp(1 - Math.abs(bx - (x + 75)) / 90) : 0;
        tg.setAttribute('opacity', (appear * (d.rank ? 1 : 1 - 0.65 * found)).toFixed(3));
        rect.setAttribute('stroke', d.rank && found > 0 ? C.goldLine : near > 0 ? C.gold : C.rule);
        rect.setAttribute('stroke-width', (2 + (d.rank ? 5 * found : 3 * near)).toFixed(1));
        if (b) b.setAttribute('opacity', seg(t, 5.4 + d.rank * 0.25, 0.4).toFixed(3));
      });
      show(s.j, t, 6.6);
      s.cand.setAttribute('transform', `translate(${(220 * (1 - seg(t, 7.0, 1.2))).toFixed(1)} 0)`);
      show(s.inter, t, 8.3, 0.6);
      show(s.formula, t, 8.8);
    },
  },

  // 2 ---------------------------------------------------------- ShapeToVec
  {
    name: 'ShapeToVec', dur: 14,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '2', 'ShapeToVec (prior work): polygon → vector → graph index');
      s.grid = drawGrid(g, 140, 240, 560);
      const k = s.grid.k, cx = 140 + 4 * k, cy = 240 + 4 * k;
      s.cross = el('g', {}, g);
      el('line', { x1: cx - 34, y1: cy, x2: cx + 34, y2: cy, stroke: C.warn, 'stroke-width': 4 }, s.cross);
      el('line', { x1: cx, y1: cy - 34, x2: cx, y2: cy + 34, stroke: C.warn, 'stroke-width': 4 }, s.cross);
      s.crossLab = txt(g, 140, 860, 'Centre each polygon, then grid it with one global quadtree', 26, { fill: C.muted, 'font-weight': 700 });
      // cell highlight overlays (for the vector fill)
      s.hi = G.cells.map((c) => el('rect', { x: 140 + c.x * k, y: 240 + c.y * k, width: c.s * k, height: c.s * k, fill: C.gold, 'fill-opacity': 0.55 }, g));
      // vector strip
      s.vecLab = rich(g, 780, 268, [{ t: 'One vector per polygon: ', b: true, c: C.ink }, 'overlap area of each cell, ', { t: 'float32 (32 bits each)', b: true, c: C.warn }], 28);
      const n = G.cells.length, gap = 8, sw = (1000 - (n - 1) * gap) / n;
      s.slots = G.cells.map((c, i) => {
        const x = 780 + i * (sw + gap), sg = el('g', {}, g);
        const v = c.w * c.r;
        el('rect', { x, y: 292, width: sw, height: 80, rx: 8, fill: v > 0 ? C.lake : '#fff', 'fill-opacity': v > 0 ? 0.15 + 0.5 * c.r : 1, stroke: C.warn, 'stroke-width': 2.5 }, sg);
        txt(sg, x + sw / 2, 341, v > 0 ? v.toFixed(2) : '0', 22, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
        return sg;
      });
      // HNSW
      s.hnsw = el('g', {}, g);
      txt(s.hnsw, 780, 450, 'HNSW graph index · weighted-Jaccard distance', 28, { 'font-weight': 700, fill: C.ink });
      const nodes = [[820, 520], [900, 600], [990, 500], [1060, 590], [1140, 510], [880, 680], [1000, 660], [1110, 680], [1200, 600], [960, 560], [1220, 500], [820, 610]];
      const edges = [[0, 2], [0, 11], [11, 1], [1, 9], [9, 2], [2, 4], [9, 3], [3, 4], [4, 10], [10, 8], [3, 8], [1, 5], [5, 6], [6, 3], [6, 7], [7, 8], [11, 5]];
      edges.forEach(([a, b]) => el('line', { x1: nodes[a][0], y1: nodes[a][1], x2: nodes[b][0], y2: nodes[b][1], stroke: C.rule, 'stroke-width': 3 }, s.hnsw));
      s.path = [0, 2, 9, 3, 8].map((ni, j, arr) => j === 0 ? null : el('line', {
        x1: nodes[arr[j - 1]][0], y1: nodes[arr[j - 1]][1], x2: nodes[ni][0], y2: nodes[ni][1], stroke: C.gold, 'stroke-width': 7, 'stroke-linecap': 'round',
      }, s.hnsw)).slice(1);
      nodes.forEach(([x, y], i) => el('circle', { cx: x, cy: y, r: 13, fill: i === 8 ? C.goldLine : C.ink }, s.hnsw));
      // memory
      s.mem = el('g', {}, g);
      rich(s.mem, 780, 770, [{ t: '90M polygons', b: true, c: C.ink }, ' × 3K cells × 4 bytes'], 30);
      el('rect', { x: 780, y: 795, width: 1000, height: 56, rx: 10, fill: C.surface }, s.mem);
      s.bar = el('rect', { x: 780, y: 795, width: 0, height: 56, rx: 10, fill: C.lake }, s.mem);
      const lx = 780 + 1000 * 1000 / 1400;
      el('line', { x1: lx, y1: 782, x2: lx, y2: 866, stroke: C.ink, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, s.mem);
      txt(s.mem, lx, 770, '1 TB server RAM', 24, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
      s.memLab = rich(g, 780, 905, [{ t: '1+ TB of vectors: ', b: true, c: C.warn }, 'more than one server can hold'], 30);
      // recall cards
      s.cards = [[C.warnT, C.warn, '96%', 'float32: accurate, too big'], [C.surface, C.muted, '63%', '1-bit: fits, but inaccurate']].map(([bg, col, big, lab], i) => {
        const cg = el('g', {}, g), y = 470 + i * 140;
        el('rect', { x: 1330, y, width: 450, height: 120, rx: 18, fill: bg }, cg);
        txt(cg, 1360, y + 80, big, 64, { 'font-weight': 700, fill: col });
        txt(cg, 1520, y + 58, 'recall@50', 24, { fill: C.muted });
        txt(cg, 1520, y + 90, lab, 24, { 'font-weight': 700, fill: C.text });
        return cg;
      });
      return s;
    },
    render(t, s) {
      show(s.head, t, 0);
      show(s.grid.polyG, t, 0.2);
      const k = s.grid.k, slide = seg(t, 1.0, 1.2);
      move(s.grid.polyG, (1 - slide) * 1.6 * k, (1 - slide) * -1.2 * k);
      show(s.cross, t, 0.9, 0.4, 3.0);
      show(s.crossLab, t, 1.0);
      G.cells.forEach((c, i) => {
        const order = { 4: 0, 2: 1, 1: 2, 0.5: 3 }[c.s];
        s.grid.cells[i].setAttribute('opacity', seg(t, 2.3 + order * 0.35, 0.35).toFixed(3));
        const a = 4.3 + i * 0.17;
        s.hi[i].setAttribute('opacity', (seg(t, a, 0.12) * (1 - seg(t, a + 0.3, 0.3))).toFixed(3));
        s.slots[i].setAttribute('opacity', seg(t, a, 0.25).toFixed(3));
      });
      show(s.vecLab, t, 4.1);
      show(s.hnsw, t, 6.8);
      s.path.forEach((p, j) => p.setAttribute('opacity', seg(t, 7.4 + j * 0.4, 0.25).toFixed(3)));
      show(s.mem, t, 9.0);
      const gb = 1260 * seg(t, 9.4, 1.6);
      s.bar.setAttribute('width', (1000 * gb / 1400).toFixed(1));
      s.bar.setAttribute('fill', gb > 1000 ? C.warn : C.lake);
      show(s.memLab, t, 11.0);
      s.cards.forEach((cg, i) => show(cg, t, 11.8 + i * 0.6));
    },
  },

  // 3 ---------------------------------------------------------- ShapeToVec+: decouple overlap area = cell area x occupancy
  {
    name: 'Decouple area', dur: 13,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '3', 'ShapeToVec+: split each overlap area in two');
      s.grid = drawGrid(g, 140, 240, 560);
      Object.assign(s, pickMarks(g, s.grid));
      s.why = [
        rich(g, 140, 862, [{ t: 'Cell area', b: true, c: C.goldLine }, ' depends only on the grid → store once'], 27),
        rich(g, 140, 908, [{ t: 'Occupancy', b: true, c: C.lakeLine }, ' differs per polygon → the vector'], 27),
      ];
      const X0 = 800, CW = 200, GAP = 20, BH = 80, colX = (i) => X0 + i * (CW + GAP);
      s.cols = el('g', {}, g);
      LETTERS.forEach((L, i) => txt(s.cols, colX(i) + CW / 2, 232, L, 36, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink }));
      // row 1: true overlap area -> cell area x occupancy
      s.lab1 = rich(g, X0, 266, [{ t: 'True overlap area', b: true, c: C.warn }, ' (ShapeToVec stores it, float32)'], 27);
      s.lab1b = rich(g, X0, 266, ['= ', { t: 'cell area w', b: true, c: C.goldLine }, '  ×  ', { t: 'occupancy level r', b: true, c: C.lakeLine }], 27);
      s.row1 = el('g', {}, g);
      s.vals = []; s.eqs = [];
      G.picked.forEach((c, i) => {
        el('rect', { x: colX(i), y: 282, width: CW, height: BH, rx: 12, fill: '#fff', stroke: C.warn, 'stroke-width': 3 }, s.row1);
        s.vals.push(txt(s.row1, colX(i) + CW / 2, 335, (c.w * c.r).toFixed(2), 38, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink }));
        s.eqs.push(rich(s.row1, colX(i) + CW / 2, 334, [{ t: String(c.w), b: true, c: C.goldLine }, ' × ', { t: Math.round(100 * c.r) + '%', b: true, c: C.lakeLine }], 34, { 'text-anchor': 'middle' }));
      });
      // destinations: lookup table and per-polygon vector
      s.lutLab = rich(g, X0, 512, [{ t: 'Lookup table', b: true, c: C.ink }, ': cell area w, stored once for all polygons'], 27);
      s.vecLab = rich(g, X0, 700, [{ t: 'Per-polygon vector', b: true, c: C.lakeLine }, ': occupancy level r (0–100% of the cell covered)'], 27);
      s.slots = el('g', {}, g);
      [528, 716].forEach((y) => LETTERS.forEach((L, i) => el('rect', { x: colX(i), y, width: CW, height: BH, rx: 12, fill: 'none', stroke: C.grey, 'stroke-width': 2, 'stroke-dasharray': '8 8' }, s.slots)));
      const chip = (x, y, fill, stroke, text, col, bar) => {
        const cg = el('g', {}, g);
        el('rect', { x, y, width: CW, height: BH, rx: 12, fill, stroke, 'stroke-width': 3 }, cg);
        if (bar !== undefined) el('rect', { x: x + 6, y: y + 6, width: (CW - 12) * bar, height: BH - 12, rx: 7, fill: C.lake, 'fill-opacity': 0.28 }, cg);
        txt(cg, x + CW / 2, y + BH / 2 + 13, text, 38, { 'text-anchor': 'middle', 'font-weight': 700, fill: col });
        return cg;
      };
      // each chip flies from its token in row 1 (w on the left, r on the right) to its row
      s.fly = [];
      G.picked.forEach((c, i) => {
        const cx = colX(i) + CW / 2;
        s.fly.push({ node: chip(colX(i), 528, C.goldT, C.ink, String(c.w), C.ink), from: [cx - 42, 322], to: [cx, 568], delay: i * 0.18 });
        s.fly.push({ node: chip(colX(i), 716, '#fff', C.lakeLine, Math.round(100 * c.r) + '%', C.lakeLine, c.r), from: [cx + 40, 322], to: [cx, 756], delay: 0.5 + i * 0.18 });
      });
      // query time
      s.q = el('g', {}, g);
      el('rect', { x: 800, y: 840, width: 980, height: 150, rx: 18, fill: C.surface }, s.q);
      txt(s.q, 830, 882, 'At query time, w comes back from the lookup table:', 26, { 'font-weight': 700, fill: C.muted });
      rich(s.q, 830, 950, [
        { t: 'J', i: true }, { t: 'w', sub: true }, ' = Σ ', { t: 'w', b: true, c: C.goldLine }, ' · min(', { t: 'r', i: true }, { t: 'A', sub: true }, ', ', { t: 'r', i: true }, { t: 'B', sub: true },
        ')  ÷  Σ ', { t: 'w', b: true, c: C.goldLine }, ' · max(', { t: 'r', i: true }, { t: 'A', sub: true }, ', ', { t: 'r', i: true }, { t: 'B', sub: true }, ')',
      ], 40);
      txt(s.q, 1750, 950, 'metric-correct', 28, { 'text-anchor': 'end', 'font-weight': 700, fill: C.iae });
      return s;
    },
    render(t, s) {
      show(s.head, t, 0); show(s.grid.g, t, 0);
      s.picks.forEach((p, i) => show(p, t, 0.4 + i * 0.15, 0.4));
      s.badges.forEach((b, i) => show(b, t, 0.5 + i * 0.15, 0.4));
      show(s.cols, t, 1.0);
      show(s.row1, t, 1.2);
      const split = seg(t, 3.0, 0.8);
      s.lab1.setAttribute('opacity', (seg(t, 1.2, 0.5) * (1 - split)).toFixed(3));
      s.lab1b.setAttribute('opacity', split.toFixed(3));
      s.vals.forEach((v) => v.setAttribute('opacity', (1 - split).toFixed(3)));
      s.eqs.forEach((e) => e.setAttribute('opacity', (split * (1 - 0.75 * seg(t, 8.6, 0.6))).toFixed(3)));
      s.row1.setAttribute('opacity', (seg(t, 1.2, 0.5) * (1 - 0.55 * seg(t, 8.6, 0.6))).toFixed(3));
      show(s.slots, t, 4.6);
      show(s.lutLab, t, 4.8); show(s.vecLab, t, 5.3);
      s.fly.forEach(({ node, from, to, delay }) => {
        const p = seg(t, 5.4 + delay, 1.0);
        const x = lerp(from[0], to[0], p), y = lerp(from[1], to[1], p), sc = lerp(0.3, 1, p);
        node.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(3)}) translate(${-to[0]} ${-to[1]})`);
        node.setAttribute('opacity', clamp(p * 3).toFixed(3));
      });
      show(s.why[0], t, 6.4); show(s.why[1], t, 7.2);
      show(s.q, t, 9.4);
    },
  },

  // 4 ---------------------------------------------------------- precision of r -> integer or bit codes
  {
    name: 'Precision → codes', dur: 12,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '4', 'Pick the precision of r: integer or bit codes');
      // occupancy vector (left)
      s.vec = el('g', {}, g);
      el('rect', { x: 140, y: 230, width: 540, height: 600, rx: 22, fill: C.surface }, s.vec);
      txt(s.vec, 170, 280, 'Occupancy vector r', 30, { 'font-weight': 700, fill: C.lakeLine });
      const BW = 90, B0 = 190, BY = 740, BHM = 380;
      G.picked.forEach((c, i) => {
        const x = B0 + i * (BW + 32);
        el('rect', { x, y: BY - BHM, width: BW, height: BHM, rx: 10, fill: '#fff', stroke: C.rule, 'stroke-width': 2 }, s.vec);
        el('rect', { x, y: BY - BHM * c.r, width: BW, height: BHM * c.r, rx: 10, fill: C.lake, 'fill-opacity': 0.6 }, s.vec);
        txt(s.vec, x + BW / 2, BY - BHM - 14, Math.round(100 * c.r) + '%', 30, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
        txt(s.vec, x + BW / 2, BY + 44, LETTERS[i], 32, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
      });
      s.note = rich(g, 140, 890, ['The ', { t: 'lookup table', b: true, c: C.goldLine }, ' stays the same for every code'], 28);
      // ladder (right)
      const X0 = 800, CW = 150, GAP = 16, BH = 74, colX = (i) => X0 + i * (CW + GAP);
      s.cols = el('g', {}, g);
      LETTERS.forEach((L, i) => txt(s.cols, colX(i) + CW / 2, 230, L, 34, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink }));
      const r = G.picked.map((c) => c.r);
      const rows = [
        { lab: [{ t: 'IAE-ARE', b: true, c: C.iae }, ' · 8-bit integer ⌊255·r⌋ · 256 levels'], vals: r.map((v) => String(Math.floor(255 * v))), q: r.map((v) => Math.floor(255 * v) / 255), col: C.iae, tint: C.iaeT, info: ['8 bits', '4×'] },
        { lab: [{ t: 'BAE-4bit', b: true, c: C.bae }, ' · 16 levels'], vals: null, q: r.map((v) => Math.round(15 * v) / 15), col: C.bae, tint: C.baeT, info: ['4 bits', '8×'] },
        { lab: [{ t: 'BAE-2level', b: true, c: C.bae }, ' · 01 touched, 11 over half'], vals: r.map((v) => (v > 0.5 ? '11' : '01')), q: r.map((v) => (v > 0.5 ? 1 : 0.5)), col: C.bae, tint: C.baeT, info: ['2 bits', '16×'] },
        { lab: [{ t: 'BAE-1bit', b: true, c: C.bae }, ' · touched or not'], vals: r.map(() => '1'), q: r.map(() => 1), col: C.bae, tint: C.baeT, info: ['1 bit', '32×'] },
      ];
      s.rows = rows.map((row, ri) => {
        const y = 255 + ri * 165, rg = el('g', {}, g);
        rich(rg, X0, y + 12, row.lab, 27);
        const chips = row.q.map((q, i) => {
          const cg = el('g', {}, rg);
          el('rect', { x: colX(i), y: y + 30, width: CW, height: BH, rx: 12, fill: '#fff', stroke: row.col, 'stroke-width': 3 }, cg);
          el('rect', { x: colX(i) + 6, y: y + 36, width: (CW - 12) * q, height: BH - 12, rx: 7, fill: row.tint }, cg);
          if (row.vals) txt(cg, colX(i) + CW / 2, y + 30 + BH / 2 + 13, row.vals[i], 36, { 'text-anchor': 'middle', 'font-weight': 700, fill: row.col });
          return cg;
        });
        const ig = el('g', {}, rg);
        el('rect', { x: 1490, y: y + 30, width: 290, height: BH, rx: 37, fill: row.col }, ig);
        rich(ig, 1635, y + 30 + BH / 2 + 11, [{ t: row.info[0] }, '  ·  ', { t: row.info[1] + ' smaller', b: true }], 28, { 'text-anchor': 'middle', fill: '#fff' });
        return { rg, chips, ig, y };
      });
      // precision arrow
      s.arrow = el('g', {}, g);
      el('line', { x1: 750, y1: 310, x2: 750, y2: 870, stroke: C.muted, 'stroke-width': 5 }, s.arrow);
      el('path', { d: 'M736,318 L750,288 L764,318 Z', fill: C.muted }, s.arrow);
      el('path', { d: 'M736,862 L750,892 L764,862 Z', fill: C.muted }, s.arrow);
      txt(s.arrow, 750, 276, 'precise', 22, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.muted });
      txt(s.arrow, 750, 924, 'compact', 22, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.muted });
      // 1-bit loses detail
      const y1 = s.rows[3].y;
      s.loss = el('g', {}, g);
      [0, 2].forEach((i) => el('rect', { x: colX(i) - 6, y: y1 + 24, width: CW + 12, height: BH + 12, rx: 16, fill: 'none', stroke: C.warn, 'stroke-width': 4, 'stroke-dasharray': '10 7' }, s.loss));
      rich(s.loss, X0, y1 + 150, [{ t: '17% and 90% both become 1', b: true, c: C.warn }, ': less detail, lower recall'], 27);
      s.foot = rich(g, 140, 1010, [{ t: 'IAE', b: true, c: C.iae }, ': integer min/max with SIMD   ·   ', { t: 'BAE', b: true, c: C.bae }, ': bitwise AND + lookup-table weights'], 28);
      return s;
    },
    render(t, s) {
      show(s.head, t, 0); show(s.vec, t, 0.3); show(s.cols, t, 1.2); show(s.arrow, t, 1.4);
      s.rows.forEach((row, ri) => {
        const a = 1.6 + ri * 1.5;
        show(row.rg, t, a, 0.4);
        row.chips.forEach((cg, i) => {
          const p = seg(t, a + 0.2 + i * 0.12, 0.4);
          const box = cg.firstChild, cx = +box.getAttribute('x') + 75, cy = +box.getAttribute('y') + 37;
          cg.setAttribute('transform', `translate(${cx} ${cy}) scale(${(0.5 + 0.5 * p).toFixed(3)}) translate(${-cx} ${-cy})`);
          cg.setAttribute('opacity', p.toFixed(3));
        });
        show(row.ig, t, a + 0.8, 0.4);
      });
      show(s.note, t, 7.6);
      show(s.loss, t, 8.4);
      show(s.foot, t, 9.6);
    },
  },

  // 5 ---------------------------------------------------------- core result: recall vs compression
  {
    name: 'Result: recall', dur: 10,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '5', 'Same accuracy, far smaller signatures', C.iae);
      s.sub = txt(g, 222, 196, 'Sports dataset · 1.75M polygons · 3K cells · recall@50 (Table 1)', 28, { fill: C.muted, 'font-weight': 700 });
      const X0 = 300, X1 = 1240, Y0 = 880, Y1 = 270;
      const px = (c) => X0 + (Math.log2(c) / 5) * (X1 - X0);
      const py = (r) => Y0 - ((r - 60) / 40) * (Y0 - Y1);
      s.px = px; s.py = py;
      s.axes = el('g', {}, g);
      [60, 70, 80, 90, 100].forEach((r) => {
        el('line', { x1: X0, y1: py(r), x2: X1 + 40, y2: py(r), stroke: C.rule, 'stroke-width': 2 }, s.axes);
        txt(s.axes, X0 - 18, py(r) + 9, r + '%', 26, { 'text-anchor': 'end', fill: C.muted });
      });
      [1, 4, 8, 16, 32].forEach((c) => txt(s.axes, px(c), Y0 + 42, c + '×', 28, { 'text-anchor': 'middle', fill: C.muted, 'font-weight': 700 }));
      txt(s.axes, (X0 + X1) / 2, Y0 + 88, 'Compression vs float32 (smaller signatures →)', 28, { 'text-anchor': 'middle', fill: C.ink, 'font-weight': 700 });
      txt(s.axes, 200, (Y0 + Y1) / 2, 'Recall@50', 28, { 'text-anchor': 'middle', fill: C.ink, 'font-weight': 700, transform: `rotate(-90 200 ${(Y0 + Y1) / 2})` });
      // callouts (drawn under the points)
      s.same = el('g', {}, g);
      el('line', { x1: px(1), y1: py(96), x2: px(4), y2: py(96), stroke: C.iae, 'stroke-width': 4, 'stroke-dasharray': '10 8' }, s.same);
      txt(s.same, (px(1) + px(4)) / 2, py(96) + 46, 'same 96%, 4× smaller', 28, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.iae });
      s.gain = el('g', {}, g);
      el('line', { x1: px(32) + 46, y1: py(63) - 4, x2: px(32) + 46, y2: py(74) + 20, stroke: C.bae, 'stroke-width': 5 }, s.gain);
      el('path', { d: `M${px(32) + 34},${py(74) + 26} L${px(32) + 46},${py(74) + 6} L${px(32) + 58},${py(74) + 26} Z`, fill: C.bae }, s.gain);
      txt(s.gain, px(32) + 70, py(68.5) + 10, '+11 pts', 34, { 'font-weight': 700, fill: C.bae });
      txt(s.gain, px(32) + 70, py(68.5) + 44, 'same 32× size', 24, { 'font-weight': 700, fill: C.bae });
      // points
      s.pts = RESULTS.map((d) => {
        const pg = el('g', {}, g), x = px(d.c), y = py(d.r);
        if (d.base) el('circle', { cx: x, cy: y, r: 15, fill: '#fff', stroke: d.col, 'stroke-width': 6 }, pg);
        else el('circle', { cx: x, cy: y, r: 15, fill: d.col }, pg);
        txt(pg, x + d.lab[0], y + d.lab[1], `${d.short || d.name} ${d.r}%`, 26, { 'text-anchor': d.lab[2], 'font-weight': 700, fill: d.col });
        return { pg, d };
      });
      // legend
      s.leg = el('g', {}, g);
      el('rect', { x: 1420, y: 300, width: 380, height: 270, rx: 20, fill: C.surface }, s.leg);
      [[C.warn, 'ShapeToVec (prior)', true], [C.iae, 'IAE · 8-bit', false], [C.bae, 'BAE · 4 → 1-bit', false]].forEach(([col, lab, ring], i) => {
        const y = 365 + i * 72;
        el('circle', { cx: 1465, cy: y - 9, r: 14, fill: ring ? '#fff' : col, stroke: col, 'stroke-width': ring ? 6 : 0 }, s.leg);
        txt(s.leg, 1495, y, lab, 28, { 'font-weight': 700, fill: C.text });
      });
      s.qps = el('g', {}, g);
      el('rect', { x: 1420, y: 610, width: 380, height: 170, rx: 20, fill: C.iaeT }, s.qps);
      txt(s.qps, 1450, 690, '10.5K', 64, { 'font-weight': 700, fill: C.ink });
      txt(s.qps, 1450, 735, 'queries/sec with IAE-ARE', 26, { 'font-weight': 700, fill: C.text });
      txt(s.qps, 1450, 766, '7× faster than float32', 24, { fill: C.muted });
      return s;
    },
    render(t, s) {
      show(s.head, t, 0); show(s.sub, t, 0.2); show(s.axes, t, 0.3); show(s.leg, t, 0.6);
      s.pts.forEach(({ pg, d }, i) => {
        const a = d.base ? 1.0 + i * 0.4 : 2.4 + (i - 2) * 0.35;
        const p = seg(t, a, 0.45);
        const x = s.px(d.c), y = s.py(d.r);
        pg.setAttribute('transform', `translate(${x} ${y}) scale(${(0.3 + 0.7 * p).toFixed(3)}) translate(${-x} ${-y})`);
        pg.setAttribute('opacity', p.toFixed(3));
      });
      show(s.same, t, 5.0); show(s.gain, t, 6.0); show(s.qps, t, 7.2);
    },
  },

  // 6 ---------------------------------------------------------- core result: memory at 90M
  {
    name: 'Result: memory', dur: 7,
    build(g) {
      background(g);
      const s = {};
      s.head = header(g, '6', '90M polygons now fit in one server', C.iae);
      s.sub = txt(g, 222, 196, 'Index size at 90M Overture Maps polygons', 28, { fill: C.muted, 'font-weight': 700 });
      const BX = 840, BMAX = 860, VMAX = 1260;
      s.bars = MEMORY.map(([name, bits, gb, lab, col], i) => {
        const y = 300 + i * 125, rg = el('g', {}, g);
        txt(rg, 260, y + 50, name, 36, { 'font-weight': 700, fill: C.text });
        txt(rg, 650, y + 50, bits, 32, { fill: C.muted });
        const bar = el('rect', { x: BX, y: y + 8, width: 0, height: 62, rx: 8, fill: col }, rg);
        const val = txt(rg, BX, y + 52, lab, 34, { 'font-weight': 700, fill: C.text });
        return { rg, bar, val, gb };
      });
      const lx = BX + BMAX * 1000 / VMAX;
      s.line = el('g', {}, g);
      el('line', { x1: lx, y1: 280, x2: lx, y2: 925, stroke: C.ink, 'stroke-width': 4, 'stroke-dasharray': '12 10' }, s.line);
      txt(s.line, lx, 265, '1 TB server RAM', 26, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
      s.BX = BX; s.BMAX = BMAX; s.VMAX = VMAX;
      s.note = rich(g, 260, 990, [{ t: '4–32× smaller indexes', b: true, c: C.iae }, ', with the same weighted-Jaccard metric'], 34);
      return s;
    },
    render(t, s) {
      show(s.head, t, 0); show(s.sub, t, 0.2); show(s.line, t, 0.4);
      s.bars.forEach((b, i) => {
        show(b.rg, t, 0.5 + i * 0.3, 0.3);
        const w = s.BMAX * b.gb / s.VMAX * seg(t, 0.7 + i * 0.3, 1.0);
        b.bar.setAttribute('width', w.toFixed(1));
        b.val.setAttribute('x', (s.BX + w + 16).toFixed(1));
      });
      show(s.note, t, 3.4);
    },
  },

  // 7 ---------------------------------------------------------- takeaway
  {
    name: 'Takeaway', dur: 6,
    build(g) {
      background(g, C.ink);
      const s = {};
      s.l1 = txt(g, 150, 330, 'Store occupancy, not area.', 104, { 'font-weight': 700, fill: '#fff' });
      s.l2 = txt(g, 155, 410, 'A lookup table of true cell areas keeps weighted Jaccard metric-correct.', 38, { fill: C.headSub });
      s.chips = [['4–32×', 'smaller signatures'], ['96%', 'recall at 4× (= float32)'], ['90M', 'polygons on one server']].map(([big, small], i) => {
        const cg = el('g', {}, g), x = 155 + i * 420;
        el('rect', { x, y: 500, width: 390, height: 190, rx: 22, fill: 'rgba(255,255,255,0.08)', stroke: C.gold, 'stroke-width': 3 }, cg);
        txt(cg, x + 30, 600, big, 76, { 'font-weight': 700, fill: C.gold });
        txt(cg, x + 30, 655, small, 30, { fill: '#fff' });
        return cg;
      });
      s.end = el('g', {}, g);
      el('rect', { x: 155, y: 790, width: 360, height: 92, rx: 18, fill: C.gold }, s.end);
      txt(s.end, 335, 851, 'Poster S-45', 46, { 'text-anchor': 'middle', 'font-weight': 700, fill: C.ink });
      el('rect', { x: 1500, y: 540, width: 260, height: 260, rx: 18, fill: '#fff' }, s.end);
      el('image', { href: 'assets/qr_paper_doi.png', x: 1515, y: 555, width: 230, height: 230 }, s.end);
      txt(s.end, 1630, 850, 'Scan for the paper', 30, { 'text-anchor': 'middle', 'font-weight': 700, fill: '#fff' });
      return s;
    },
    render(t, s) {
      const p = seg(t, 0.1, 0.8);
      show(s.l1, t, 0.1, 0.8); move(s.l1, 0, (1 - p) * 30);
      show(s.l2, t, 0.6);
      s.chips.forEach((c, i) => show(c, t, 1.2 + i * 0.35));
      show(s.end, t, 2.6);
    },
  },
];

// ---------------------------------------------------------------- engine
const stage = document.getElementById('stage');
const starts = [];
let total = 0;
for (const sc of scenes) { starts.push(total); total += sc.dur; }
for (const sc of scenes) { sc.g = el('g', { style: 'display:none' }, stage); sc.st = sc.build(sc.g); }

const params = new URLSearchParams(location.search);
let time = clamp(parseFloat(params.get('t')) || 0, 0, total - 0.01);
let playing = !params.has('pause');
let looping = true;
let lastFrame = null;
let current = -1;

const sceneAt = (t) => { let i = scenes.length - 1; while (i > 0 && t < starts[i]) i--; return i; };

function draw() {
  const i = sceneAt(time);
  if (i !== current) {
    if (current >= 0) scenes[current].g.style.display = 'none';
    scenes[i].g.style.display = '';
    current = i;
  }
  const sc = scenes[i], lt = time - starts[i];
  const fade = Math.min(clamp(lt / 0.35), clamp((sc.dur - lt) / 0.35));
  sc.g.setAttribute('opacity', fade.toFixed(3));
  sc.render(lt, sc.st);
  updateUI(i, lt);
}

function frame(now) {
  if (playing && lastFrame !== null) {
    time += Math.min((now - lastFrame) / 1000, 0.1);
    if (time >= total) {
      if (looping) time -= total;
      else { time = total - 0.001; setPlaying(false); }
    }
  }
  lastFrame = now;
  draw();
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- controls
const frameEl = document.getElementById('frame');
const segBox = document.getElementById('segments');
const playBtn = document.getElementById('play');
const loopBtn = document.getElementById('loop');
const clockEl = document.getElementById('clock');
const fills = scenes.map((sc, i) => {
  const d = document.createElement('div');
  d.className = 'seg';
  d.style.flex = String(sc.dur);
  d.dataset.label = sc.name;
  const f = document.createElement('span');
  d.appendChild(f);
  d.addEventListener('click', (e) => {
    const r = d.getBoundingClientRect();
    seek(starts[i] + sc.dur * clamp((e.clientX - r.left) / r.width, 0, 0.999));
  });
  segBox.appendChild(d);
  return f;
});
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function updateUI(i, lt) {
  fills.forEach((f, j) => { f.style.width = (j < i ? 100 : j > i ? 0 : (100 * lt) / scenes[j].dur) + '%'; });
  clockEl.textContent = `${fmt(time)} / ${fmt(total)}`;
}
function setPlaying(p) {
  playing = p;
  playBtn.innerHTML = p ? '&#10073;&#10073;' : '&#9654;';
  poke();
}
const seek = (t) => { time = clamp(t, 0, total - 0.001); poke(); };
const jump = (d) => {
  const i = sceneAt(time), lt = time - starts[i];
  const target = d < 0 && lt > 1.5 ? i : clamp(i + d, 0, scenes.length - 1);
  seek(starts[target]);
};
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else frameEl.requestFullscreen?.();
}

let idleTimer = null;
function poke() {
  frameEl.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (playing) frameEl.classList.add('idle'); }, 2500);
}

playBtn.addEventListener('click', () => setPlaying(!playing));
document.getElementById('prev').addEventListener('click', () => jump(-1));
document.getElementById('next').addEventListener('click', () => jump(1));
document.getElementById('full').addEventListener('click', toggleFull);
loopBtn.addEventListener('click', () => { looping = !looping; loopBtn.classList.toggle('on', looping); });
stage.addEventListener('click', () => setPlaying(!playing));
window.addEventListener('mousemove', poke);
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'k') { e.preventDefault(); setPlaying(!playing); }
  else if (e.key === 'ArrowRight' || e.key === 'PageDown') jump(1);
  else if (e.key === 'ArrowLeft' || e.key === 'PageUp') jump(-1);
  else if (e.key === 'Home') seek(0);
  else if (e.key === 'f' || e.key === 'F') toggleFull();
  else if (e.key === 'l' || e.key === 'L') loopBtn.click();
  else return;
  poke();
});

if (params.has('clean')) document.getElementById('controls').style.display = 'none';
setPlaying(playing);
requestAnimationFrame(frame);

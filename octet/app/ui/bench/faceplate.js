// Faceplates: one SVG group per device, drawn from its catalog entry. The
// built-in drawings are a Catalyst 2960-Plus, an ISR 4321 and a desktop PC.
// A model with an `image` is drawn from that image, with its ports laid
// over it, so any photo of a front panel becomes a working device.

const NS = 'http://www.w3.org/2000/svg';
export const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
const text = (parent, attrs, t) => { const e = el('text', attrs, parent); e.textContent = t; return e; };

function rj45(g, p, flip) {
  const { x, y, w, h } = p;
  el('rect', { x: x - 1, y: y - 1, width: w + 2, height: h + 2, rx: 1.6, fill: 'var(--b-metal-lo)' }, g);
  el('rect', { x, y, width: w, height: h, rx: 1, fill: 'var(--b-recess)' }, g);
  el('rect', { x: x + w / 2 - 3.5, y: flip ? y + h - 4 : y, width: 7, height: 4, fill: 'var(--b-metal-lo)' }, g);
  const cy = flip ? y + 2 : y + h - 4.5;
  for (let i = 0; i < 8; i++) el('rect', { x: x + 3 + i * ((w - 6) / 8), y: cy, width: 1, height: 2.6, fill: 'var(--b-gold)', opacity: .7 }, g);
}
function sfpCage(g, p) {
  el('rect', { x: p.x - 1, y: p.y - 1, width: p.w + 2, height: p.h + 2, rx: 1.4, fill: 'url(#b-sfp)' }, g);
  el('rect', { x: p.x + 2, y: p.y + 2, width: p.w - 4, height: p.h - 4, rx: .8, fill: 'var(--b-recess)' }, g);
}
function smartSerial(g, p) {
  const { x, y, w, h } = p;
  el('path', { d: `M${x} ${y}h${w}l-2 ${h}h${-(w - 4)}z`, fill: 'var(--b-metal-lo)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, g);
  el('path', { d: `M${x + 3} ${y + 3}h${w - 6}l-1.4 ${h - 6}h${-(w - 8.8)}z`, fill: 'var(--b-recess)' }, g);
  el('circle', { cx: x - 4, cy: y + h / 2, r: 1.6, fill: 'var(--b-metal-hi)' }, g);
  el('circle', { cx: x + w + 4, cy: y + h / 2, r: 1.6, fill: 'var(--b-metal-hi)' }, g);
}
function db9(g, p) {
  const { x, y, w, h } = p;
  el('path', { d: `M${x} ${y}h${w}l-3 ${h}h${-(w - 6)}z`, fill: 'var(--b-recess)', stroke: 'var(--b-edge2)', 'stroke-width': .8 }, g);
  for (let i = 0; i < 5; i++) el('circle', { cx: x + 6 + i * 4.5, cy: y + 4.5, r: .9, fill: 'var(--b-gold)', opacity: .7 }, g);
  for (let i = 0; i < 4; i++) el('circle', { cx: x + 8.2 + i * 4.5, cy: y + 9.5, r: .9, fill: 'var(--b-gold)', opacity: .7 }, g);
}
function ears(g, m) {
  for (const ex of [-16, m.w]) {
    el('rect', { x: ex, y: 4, width: 16, height: m.h - 8, rx: 2, fill: 'url(#b-ear)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, g);
    el('circle', { cx: ex + 8, cy: 14, r: 2.6, fill: 'var(--b-recess)' }, g);
    el('circle', { cx: ex + 8, cy: m.h - 14, r: 2.6, fill: 'var(--b-recess)' }, g);
  }
}
function chassis(g, m) {
  el('rect', { x: 0, y: 0, width: m.w, height: m.h, rx: 3, fill: 'url(#b-metal)', stroke: 'var(--b-edge2)', 'stroke-width': .8, class: 'body' }, g);
  el('rect', { x: 1, y: 1, width: m.w - 2, height: 1.2, fill: 'oklch(100% 0 0 / .08)' }, g);
}
function button(g, b) {
  const bg = el('g', { class: 'btn', 'data-button': b.id }, g);
  el('title', {}, bg).textContent = b.title || b.id;
  el('circle', { cx: b.x, cy: b.y, r: b.r + 3, fill: 'transparent' }, bg);
  el('circle', { cx: b.x, cy: b.y, r: b.r, fill: 'var(--b-metal-lo)', stroke: 'var(--b-edge2)', 'stroke-width': .8, class: 'cap' }, bg);
  if (b.id === 'power') el('path', { d: `M${b.x} ${b.y - 3.4}v3.6M${b.x - 2.4} ${b.y - 1.8}a3.4 3.4 0 1 0 4.8 0`, fill: 'none', stroke: 'var(--b-silk)', 'stroke-width': .9, 'stroke-linecap': 'round', 'pointer-events': 'none' }, bg);
}

const DRAW = {
  isr4321(face, m) {
    el('rect', { x: 18, y: 10, width: 150, height: 46, rx: 2, fill: 'var(--b-metal-lo)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, face);
    text(face, { x: 24, y: 19, class: 'silk' }, 'NIM-2T');
    text(face, { x: 24, y: 51, class: 'silk' }, 'NIM 1   SERIAL');
    el('circle', { cx: 160, cy: 15, r: 1.6, fill: 'var(--b-metal-hi)' }, face);
    text(face, { x: 456, y: 22, class: 'silk big' }, 'ISR 4321');
  },
  c2960(face) {
    text(face, { x: 18, y: 18, class: 'silk big' }, 'CATALYST 2960-Plus');
    text(face, { x: 150, y: 47, class: 'silk', 'text-anchor': 'middle' }, 'MODE');
  },
  pc(face, m, d) {
    el('rect', { x: 12, y: 10, width: m.w - 24, height: 26, rx: 4, fill: 'var(--b-recess)' }, face);
    d.screen = text(face, { x: 22, y: 27, class: 'silk name' }, d.id);
    d.screenIp = text(face, { x: m.w - 22, y: 27, class: 'silk', 'text-anchor': 'end' }, '');
    el('rect', { x: 92, y: 50, width: 9, height: 13, rx: 1.4, fill: 'var(--b-recess)' }, face);
    el('rect', { x: 108, y: 50, width: 9, height: 13, rx: 1.4, fill: 'var(--b-recess)' }, face);
    text(face, { x: 104, y: 73, class: 'silk', 'text-anchor': 'middle' }, 'USB');
  },
};

export const GLYPH = {
  router: '<path d="M8.6 16h5.4M18 14.8l4.6-2.8M18 17.2l4.6 2.8M20.6 11.5l2 .5-.6 2M20.6 20.5l2-.5-.6-2"/><rect x="5" y="8.5" width="22" height="15" rx="2.2"/><circle cx="16" cy="16" r="2.3"/>',
  switch: '<rect x="5" y="9.5" width="22" height="13" rx="2.2"/><path d="M9 13.4h6M13.6 12.1l1.4 1.3-1.4 1.3M23 13.4h-6M18.4 12.1L17 13.4l1.4 1.3"/><path d="M8 18.2h16" stroke-dasharray="2.4 1.2"/>',
  pc: '<rect x="4.5" y="5.5" width="23" height="15.5" rx="2.2"/><path d="M12.5 26h7M16 21v5M9.5 10.6l2.7 2.3-2.7 2.3M14.3 15.5h4.5"/>',
};

// Draws device `d` (from the engine) into `parent`. Returns its group.
export function drawDevice(parent, d) {
  const m = d.m;
  const g = el('g', { class: 'dev', 'data-dev': d.id }, parent);
  const face = el('g', { class: 'face', filter: 'url(#b-shadow)' }, g);
  if (m.image) {
    el('image', { href: m.image, x: 0, y: 0, width: m.w, height: m.h, preserveAspectRatio: 'none', class: 'body' }, face);
  } else {
    if (m.rack) ears(face, m);
    chassis(face, m);
    if (DRAW[m.draw]) DRAW[m.draw](face, m, d);
  }
  for (const l of m.lights || []) {
    el('circle', { cx: l.x, cy: l.y, r: m.kind === 'switch' ? 2.1 : 2.3, class: 'led', fill: 'var(--b-led-off)', 'data-light': l.id }, face);
    text(face, { x: l.x, y: l.y + 11, class: 'silk', 'text-anchor': 'middle' }, l.id);
  }
  for (const b of m.buttons || []) button(face, b);
  d.portEls = {};
  for (const p of m.ports) {
    const pg = el('g', { class: 'port' + (p.type === 'decor' ? ' decor' : ''), 'data-dev': d.id, 'data-port': p.key }, face);
    if (!m.image) {
      if (p.type === 'eth' || p.type === 'con' || p.type === 'decor') rj45(pg, p, p.row === 1);
      else if (p.type === 'sfp') sfpCage(pg, p);
      else if (p.type === 'serial') smartSerial(pg, p);
      else if (p.type === 'com') db9(pg, p);
      if (p.type === 'con') el('rect', { x: p.x - 1, y: p.y - 1, width: p.w + 2, height: p.h + 2, rx: 1.6, fill: 'none', stroke: 'var(--b-console)', 'stroke-width': .9, opacity: .7 }, pg);
    } else el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, fill: 'transparent' }, pg);
    el('rect', { x: p.x - 3, y: p.y - 3, width: p.w + 6, height: p.h + 6, rx: 3, class: 'hl' }, pg);
    if (p.led) {
      const ly = m.kind === 'switch' ? (p.row === 1 ? p.y + p.h + 3.5 : p.y - 6) : p.y - 7;
      p.ledY = ly;
      d.portEls[p.key] = el('rect', { x: p.x + p.w / 2 - 3, y: ly, width: 6, height: 2.6, rx: .8, class: 'led', fill: 'var(--b-led-off)' }, pg);
    }
    const ty = m.kind === 'switch' ? (p.row === 1 ? p.y + p.h + 11 : p.y - 8.5) : p.y + p.h + 9;
    if (p.label) text(pg, { x: p.x + p.w / 2, y: ty, class: m.kind === 'switch' && p.type === 'eth' ? 'plab' : 'silk', 'text-anchor': 'middle' }, p.label);
  }
  d.tag = text(face, { x: 0, y: -10, class: 'tagname' }, d.hostname);
  const tk = el('g', { class: 'token', 'data-dev': d.id }, g);
  el('rect', { x: -62, y: -24, width: 124, height: 48, rx: 14, class: 'body tk-bg' }, tk);
  const gl = el('g', { class: 'g', transform: 'translate(-54 -16)' }, tk);
  gl.innerHTML = GLYPH[m.kind] || GLYPH.pc;
  d.tokenText = text(tk, { x: -14, y: 5 }, d.hostname);
  d.g = g; d.token = tk;
  return g;
}

export const DEFS = `
  <pattern id="b-dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="var(--b-dot)"/></pattern>
  <linearGradient id="b-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--b-metal-hi)"/><stop offset=".12" stop-color="var(--b-metal)"/><stop offset="1" stop-color="var(--b-metal-lo)"/></linearGradient>
  <linearGradient id="b-ear" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="var(--b-metal-lo)"/><stop offset="1" stop-color="var(--b-metal)"/></linearGradient>
  <linearGradient id="b-sfp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="oklch(55% 0.01 250)"/><stop offset="1" stop-color="oklch(38% 0.01 250)"/></linearGradient>
  <filter id="b-shadow" x="-10%" y="-30%" width="120%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="black" flood-opacity=".45"/></filter>`;

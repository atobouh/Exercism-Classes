// Faceplates: one SVG group per device, drawn from its catalog entry. The
// built-in drawings are Cisco ISRs, Catalysts, a hub, and end devices.
// A model with an `image` is drawn from that image, with its ports laid
// over it, so any photo of a front panel becomes a working device.

import { SFPS } from './catalog.js';

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
function usbPort(g, p) {
  el('rect', { x: p.x, y: p.y, width: p.w, height: p.h, rx: p.type === 'usb' ? .8 : 1.6, fill: 'var(--b-recess)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, g);
  el('rect', { x: p.x + 2, y: p.y + (p.type === 'usb' ? 2 : p.h / 2 - 1), width: p.w - 4, height: p.type === 'usb' ? 2.4 : 2, fill: 'var(--b-metal-hi)' }, g);
}
// Wi-Fi: no socket, just the waves. Nothing plugs in; it joins by SSID.
function radio(g, p) {
  const cx = p.x + p.w / 2, cy = p.y + p.h * 0.75;
  el('circle', { cx, cy, r: 1.8, fill: 'var(--b-silk)' }, g);
  for (const r of [5, 9]) el('path', { d: `M${cx - r * 0.8} ${cy - r * 0.6}A${r} ${r} 0 0 1 ${cx + r * 0.8} ${cy - r * 0.6}`, fill: 'none', stroke: 'var(--b-silk)', 'stroke-width': 1.2, 'stroke-linecap': 'round' }, g);
}
// A transceiver in a cage: its bale handle shows, coloured like the real
// ones (black for SX, blue for LX).
function transceiver(g, p, t) {
  el('rect', { x: p.x + 1, y: p.y + 1, width: p.w - 2, height: p.h - 2, rx: .8, fill: 'oklch(70% 0.01 250)' }, g);
  el('rect', { x: p.x + 4, y: p.y + 3, width: p.w - 8, height: p.h - 6, rx: .6, fill: 'var(--b-recess)' }, g);
  el('path', { d: `M${p.x + 2} ${p.y + p.h}v3h${p.w - 4}v-3`, fill: 'none', stroke: t.fiber === 'smf' ? 'oklch(60% 0.15 250)' : 'oklch(25% 0.01 250)', 'stroke-width': 1.6 }, g);
}
// A card slot: a blank cover, or the card that's in it.
function slot(g, s, mod) {
  el('rect', { x: s.x, y: s.y, width: s.w, height: s.h, rx: 2, fill: mod ? 'var(--b-metal-lo)' : 'none', stroke: 'var(--b-edge2)', 'stroke-width': .6, 'stroke-dasharray': mod ? 'none' : '3 2' }, g);
  text(g, { x: s.x + 6, y: s.y + 9, class: 'silk' }, mod || s.name);
  if (!mod) text(g, { x: s.x + s.w / 2, y: s.y + s.h / 2 + 3, class: 'silk', 'text-anchor': 'middle', opacity: .55 }, 'empty');
  else text(g, { x: s.x + 6, y: s.y + s.h - 4, class: 'silk' }, s.name);
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
  isr(face, m) {
    text(face, { x: m.lights[0].x - 6, y: 22, class: 'silk big' }, m.label);
    if (m.side) text(face, { x: m.lights[0].x - 6, y: 56, class: 'silk' }, m.side + ' PANEL');
  },
  hub(face, m) {
    text(face, { x: 16, y: 16, class: 'silk' }, m.label);
  },
  c2960(face, m) {
    text(face, { x: 18, y: 18, class: 'silk big' }, m.label || 'CATALYST 2960-Plus');
    text(face, { x: 150, y: 47, class: 'silk', 'text-anchor': 'middle' }, 'MODE');
  },
  server(face, m, d) {
    for (let i = 0; i < 4; i++) el('rect', { x: 14 + i * 30, y: 12, width: 24, height: 42, rx: 2, fill: 'var(--b-metal-lo)', stroke: 'var(--b-edge2)', 'stroke-width': .5 }, face);
    d.screen = text(face, { x: 14, y: 64, class: 'silk' }, '');
    d.screenIp = text(face, { x: m.w - 14, y: 64, class: 'silk', 'text-anchor': 'end' }, '');
  },
  printer(face, m, d) {
    el('rect', { x: 14, y: 8, width: m.w - 28, height: 10, rx: 2, fill: 'var(--b-recess)' }, face);
    el('rect', { x: 30, y: 60, width: 90, height: 8, rx: 1.5, fill: 'oklch(95% 0.005 80)' }, face);
    d.screen = text(face, { x: 16, y: 40, class: 'silk name' }, d.id);
    d.screenIp = text(face, { x: 16, y: 54, class: 'silk' }, '');
  },
  // an access point: a rounded puck, its status light in the middle of the lid
  ap(face, m, d) {
    el('rect', { x: 10, y: 6, width: m.w - 20, height: 40, rx: 20, fill: 'oklch(93% 0.004 250)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, face);
    text(face, { x: m.w - 52, y: 42, class: 'silk', fill: 'oklch(45% 0.01 250)' }, 'CISCO');
    d.screen = text(face, { x: 60, y: 30, class: 'silk name', fill: 'oklch(30% 0.01 250)' }, '');
    d.screenIp = text(face, { x: 60, y: 42, class: 'silk', fill: 'oklch(40% 0.01 250)' }, '');
  },
  appliance(face, m, d) {
    text(face, { x: 22, y: 22, class: 'silk big' }, m.label);
    d.screenIp = text(face, { x: 22, y: 50, class: 'silk' }, '');
  },
  phone(face, m, d) {
    el('rect', { x: 12, y: 8, width: 90, height: 40, rx: 4, fill: 'var(--b-recess)' }, face);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) el('rect', { x: 112 + c * 18, y: 8 + r * 11, width: 14, height: 8, rx: 2, fill: 'var(--b-metal-lo)' }, face);
    d.screen = text(face, { x: 20, y: 24, class: 'silk name' }, d.id);
    d.screenIp = text(face, { x: 20, y: 38, class: 'silk' }, '');
  },
  mobile(face, m, d) {
    el('rect', { x: 10, y: 8, width: m.w - 52, height: 68, rx: 7, fill: 'var(--b-recess)', stroke: 'var(--b-edge2)', 'stroke-width': .6 }, face);
    d.screen = text(face, { x: 18, y: 30, class: 'silk name' }, d.id);
    d.screenIp = text(face, { x: 18, y: 46, class: 'silk' }, '');
  },
  pc(face, m, d) {
    el('rect', { x: 12, y: 10, width: m.w - 24, height: 26, rx: 4, fill: 'var(--b-recess)' }, face);
    d.screen = text(face, { x: 22, y: 27, class: 'silk name' }, d.id);
    d.screenIp = text(face, { x: m.w - 22, y: 27, class: 'silk', 'text-anchor': 'end' }, '');
  },
};

export const GLYPH = {
  router: '<path d="M8.6 16h5.4M18 14.8l4.6-2.8M18 17.2l4.6 2.8M20.6 11.5l2 .5-.6 2M20.6 20.5l2-.5-.6-2"/><rect x="5" y="8.5" width="22" height="15" rx="2.2"/><circle cx="16" cy="16" r="2.3"/>',
  switch: '<rect x="5" y="9.5" width="22" height="13" rx="2.2"/><path d="M9 13.4h6M13.6 12.1l1.4 1.3-1.4 1.3M23 13.4h-6M18.4 12.1L17 13.4l1.4 1.3"/><path d="M8 18.2h16" stroke-dasharray="2.4 1.2"/>',
  pc: '<rect x="4.5" y="5.5" width="23" height="15.5" rx="2.2"/><path d="M12.5 26h7M16 21v5M9.5 10.6l2.7 2.3-2.7 2.3M14.3 15.5h4.5"/>',
  laptop: '<rect x="7" y="7.5" width="18" height="12.5" rx="1.8"/><path d="M4 23.5h24l-2-3.5H6z"/>',
  server: '<rect x="7" y="5" width="18" height="22" rx="2"/><path d="M10.5 10h11M10.5 14.5h11M10.5 19h6"/><circle cx="21" cy="22.5" r="1"/>',
  hub: '<rect x="4" y="11" width="24" height="10" rx="2"/><path d="M8 16h.01M12 16h.01M16 16h.01M20 16h.01M24 16h.01" stroke-width="2.4"/>',
  ap: '<circle cx="16" cy="21" r="2"/><path d="M10.5 16a7.8 7.8 0 0 1 11 0M7 12.5a12.7 12.7 0 0 1 18 0"/><rect x="8" y="24" width="16" height="3.5" rx="1.7"/>',
  firewall: '<rect x="5" y="8" width="22" height="16" rx="1.6"/><path d="M5 13.3h22M5 18.6h22M12 8v5.3M20 13.3v5.3M12 18.6V24"/>',
  wlc: '<rect x="4" y="16" width="24" height="9" rx="1.8"/><path d="M11 11.5a7 7 0 0 1 10 0M8 8.5a11 11 0 0 1 16 0"/>',
  phone: '<rect x="5" y="7" width="22" height="18" rx="2"/><rect x="8" y="10" width="9" height="7" rx="1"/><path d="M20 10.5h4M20 14h4M20 17.5h4M8 21h16"/>',
  mobile: '<rect x="10" y="4" width="12" height="24" rx="2.2"/><path d="M14.5 24.5h3"/>',
  printer: '<path d="M10 11V5.5h12V11M10 22H6.5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 6.5 11h19a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H22"/><rect x="10" y="18" width="12" height="8.5" rx="1"/>',
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
  for (const s of m.slots || []) { const sg = el('g', { class: 'slot', 'data-dev': d.id, 'data-slot': s.id }, face); slot(sg, s, (d.modules || {})[s.id]); }
  d.portEls = {};
  for (const p of m.ports) {
    const pg = el('g', { class: 'port' + (p.type === 'decor' ? ' decor' : ''), 'data-dev': d.id, 'data-port': p.key }, face);
    if (!m.image) {
      if (p.type === 'eth' || p.type === 'con' || p.type === 'decor') rj45(pg, p, p.row === 1);
      else if (p.type === 'sfp') { sfpCage(pg, p); const t = (d.sfp || {})[p.key]; if (t && SFPS[t]) transceiver(pg, p, SFPS[t]); }
      else if (p.type === 'usb' || p.type === 'usbcon') usbPort(pg, p);
      else if (p.type === 'serial') smartSerial(pg, p);
      else if (p.type === 'com') db9(pg, p);
      else if (p.type === 'radio') radio(pg, p);
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
  gl.innerHTML = GLYPH[m.glyph] || GLYPH[m.kind] || GLYPH.pc;
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

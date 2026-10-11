// The engine: a small simulated network that behaves like the real thing
// for the CCNA basics. No drawing in here, so it runs the same in a page, in
// a test or in a grader.
//
//   const net = createNetwork(lab)      // a lab object (see README.md)
//   net.plug('straight', 'PC-A NIC', 'S1 F0/1')
//   net.exec('R1', 'show ip interface brief')
//   net.tick(16)                        // advance the clock, in milliseconds
//   net.on('log', (device, text) => ...)
//
// Covered: interfaces and addressing, link and line protocol, spanning tree
// listening/learning timers, PortFast, VLANs, access and trunk ports, 802.1Q
// with router subinterfaces, static and default routes, ARP, MAC learning,
// CDP neighbours, serial links with DCE clocking, console cables, power,
// interface cards, SFP transceivers and fiber, hubs, and layer 3 switches.
//
//   net.simulate('PC-A', '10.0.0.2')    // the same ping, frame by frame, and why it stops

import { CATALOG, CABLES, MODULES, SFPS } from './catalog.js';

/* ---------- addresses ---------- */
export const ipn = s => s.split('.').reduce((a, o) => a * 256 + (+o), 0);
export const isIp = s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || '') && s.split('.').every(o => +o <= 255);
export const maskLen = m => isIp(m) ? ipn(m).toString(2).replace(/0+$/, '').length : 0;
export const validMask = m => isIp(m) && /^1*0*$/.test(ipn(m).toString(2).padStart(32, '0'));
const and = (a, m) => (ipn(a) & ipn(m)) >>> 0;
export const sameNet = (a, b, m) => isIp(a) && isIp(b) && validMask(m) && and(a, m) === and(b, m);
const ntoa = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
export const netOf = (a, m) => ntoa(and(a, m));
export const short = n => n.replace('TenGigabitEthernet', 'Te').replace('TwentyFiveGigE', 'Twe').replace('HundredGigE', 'Hu').replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa').replace('Serial', 'Se').replace('Loopback', 'Lo');

const IFT = [['FastEthernet', 'f'], ['GigabitEthernet', 'g'], ['Serial', 's'], ['Vlan', 'v'], ['Loopback', 'l'], ['TenGigabitEthernet', 't'], ['TwentyFiveGigE', 'tw'], ['HundredGigE', 'h']];
const STP_LISTEN = 15000, STP_FORWARD = 30000;
const NO_IF = ['console', 'com', 'aux', 'usb', 'pcport']; // ports that aren't interfaces
const isCon = c => !!(CABLES[c.type] || {}).console;
// A model with the cards in its slots: the card's ports join the faceplate.
function modelOf(base, modules) {
  const ports = [...base.ports];
  for (const s of base.slots || []) if (modules[s.id]) ports.push(...MODULES[modules[s.id]].ports(s));
  return { ...base, ports };
}

export function createNetwork(lab, opts = {}) {
  const listeners = { log: [], change: [], say: [] };
  const emit = (ev, ...a) => listeners[ev].forEach(f => f(...a));
  let clock = 0, macN = 0x10;
  const mac = oui => { macN++; const h = oui + macN.toString(16).padStart(6, '0'); return `${h.slice(0, 4)}.${h.slice(4, 8)}.${h.slice(8, 12)}`; };
  const iface = (over) => Object.assign({ shutdown: false, ip: '', mask: '', mode: 'access', vlan: 1, native: 1, allowed: null, portfast: false, clock: 0, desc: '', phys: false, proto: false, upSince: 0, medium: '', act: 0, encap: 0 }, over);

  /* ---------- devices ---------- */
  const devs = [];
  const ouiOf = kind => kind === 'router' ? '00d097' : kind === 'switch' ? '0019e8' : kind === 'hub' ? '00e0b0' : '005079';
  function addDevice(def) {
    const base = CATALOG[def.model];
    if (!base) throw new Error(`device ${def.id}: unknown model ${def.model}`);
    const modules = { ...(base.modules || {}), ...(def.modules || {}) };
    for (const [slot, mod] of Object.entries(modules)) if (!(base.slots || []).some(s => s.id === slot && s.takes.includes(mod))) throw new Error(`device ${def.id}: no ${slot} slot for a ${mod}`);
    const m = modelOf(base, modules);
    const d = { id: def.id, model: def.model, m, kind: m.kind, modules, sfp: { ...(def.sfp || {}) }, routing: false, x: def.x || 0, y: def.y || 0, ifs: {}, hostname: def.hostname || def.id, power: true, boot: clock + 1800 + devs.length * 300, routes: [], arp: {}, macs: {}, vlans: { 1: 'default' }, gw: '', secret: '', ip: def.ip || '', mask: def.mask || '', pcgw: def.gateway || def.gw || '', ledMode: 'stat', locked: !!def.locked };
    if (d.kind === 'hub') d.boot = 0; // a hub has nothing to boot
    d.dhcp = !!def.dhcp; d.wifi = def.wifi ? { ssid: def.wifi.ssid || '', key: def.wifi.key || '' } : null; d.dns = def.dns || '';
    syncIfs(d);
    if (m.kind === 'switch') d.ifs.Vlan1 = iface({ shutdown: true, svi: true, mac: mac(ouiOf(d.kind)) });
    devs.push(d);
    return d;
  }
  function syncIfs(d) { // an interface for every physical port, as cards come and go
    for (const p of d.m.ports) if (!NO_IF.includes(p.iface) && !d.ifs[p.iface]) d.ifs[p.iface] = iface({ shutdown: d.kind === 'router' && !!(d.m.defaults || {}).shutdown, mac: mac(ouiOf(d.kind)) });
  }
  const D = id => devs.find(d => d.id === id);
  // an open lab adds and removes devices while it runs
  const PREFIX = { router: 'R', switch: 'S', pc: 'PC-', hub: 'Hub-', ap: 'AP-' };
  function freeId(model) {
    const pre = CATALOG[model].prefix ? CATALOG[model].prefix + '-' : PREFIX[CATALOG[model].kind] || 'D';
    for (let n = 1; ; n++) if (!D(pre + n)) return pre + n;
  }
  function add(def) {
    if (!CATALOG[def.model]) throw new Error(`unknown model ${def.model}`);
    const id = def.id || freeId(def.model);
    if (!/^[A-Za-z][\w-]{0,23}$/.test(id)) throw new Error(`bad name ${id}`);
    if (D(id)) throw new Error(`${id} is already on the bench`);
    const d = addDevice({ ...def, id });
    evalLinks(); emit('change');
    return d;
  }
  function removeDevice(id) {
    const d = D(id); if (!d) return;
    for (let i = cables.length - 1; i >= 0; i--) { const c = cables[i]; if ([c.a, c.b].some(e => e && e.dev === id)) cables.splice(i, 1); }
    devs.splice(devs.indexOf(d), 1);
    delete sessions[id];
    evalLinks(); emit('change');
  }
  function copyDevice(id) { // a second one, set up the same, with its own name and MACs
    const src = D(id); if (!src) return null;
    const sd = JSON.parse(JSON.stringify(snapshot().devices.find(x => x.id === id)));
    const d = add({ model: src.model, x: src.x + 40, y: src.y + 40, modules: sd.modules, sfp: sd.sfp });
    Object.assign(d, { routing: sd.routing, ip: sd.ip, mask: sd.mask, pcgw: sd.pcgw, routes: sd.routes, vlans: sd.vlans, gw: sd.gw, secret: sd.secret });
    for (const [n, f] of Object.entries(sd.ifs)) d.ifs[n] = Object.assign(d.ifs[n] || iface({}), f, { mac: d.ifs[n] ? d.ifs[n].mac : mac(ouiOf(d.kind)), phys: false, proto: false, upSince: clock });
    evalLinks(); emit('change');
    return d;
  }
  /* ---------- cards and transceivers ---------- */
  function insertModule(devId, slotId, mod) {
    const d = D(devId), s = (d.m.slots || []).find(x => x.id === slotId);
    if (!s) throw new Error(`${d.hostname} has no ${slotId} slot`);
    if (!MODULES[mod] || !s.takes.includes(mod)) throw new Error(`A ${mod} doesn't fit the ${s.name} slot. It takes ${s.takes.join(' or ')}.`);
    if (d.modules[slotId]) throw new Error(`The ${s.name} slot already holds a ${d.modules[slotId]}.`);
    if (d.power) throw new Error(`Switch ${d.hostname} off first. A ${mod} isn't hot-swappable: inserting it with the power on can damage the card.`);
    d.modules[slotId] = mod; d.m = modelOf(CATALOG[d.model], d.modules); syncIfs(d);
    evalLinks(); emit('change');
  }
  function removeModule(devId, slotId) {
    const d = D(devId), mod = d.modules[slotId]; if (!mod) return;
    const s = d.m.slots.find(x => x.id === slotId);
    if (d.power) throw new Error(`Switch ${d.hostname} off first. A ${mod} isn't hot-swappable.`);
    const gone = MODULES[mod].ports(s);
    for (let i = cables.length - 1; i >= 0; i--) { const c = cables[i]; if ([c.a, c.b].some(e => e && e.dev === devId && gone.some(p => p.key === e.port))) cables.splice(i, 1); }
    for (const p of gone) for (const n of Object.keys(d.ifs)) if (n === p.iface || d.ifs[n].parent === p.iface) delete d.ifs[n];
    delete d.modules[slotId]; d.m = modelOf(CATALOG[d.model], d.modules);
    evalLinks(); emit('change');
  }
  function insertSfp(devId, key, t) { // transceivers are hot-swappable
    const d = D(devId), p = d.m.ports.find(x => x.key === key);
    if (!p || p.type !== 'sfp') throw new Error(`${key} isn't an SFP cage`);
    if (!SFPS[t]) throw new Error(`unknown transceiver ${t}`);
    if (d.sfp[key]) throw new Error(`That cage already holds a ${d.sfp[key]}.`);
    d.sfp[key] = t; evalLinks(); emit('change');
  }
  function removeSfp(devId, key) {
    const d = D(devId); if (!d.sfp[key]) return;
    if (occupied({ dev: devId, port: key })) throw new Error('Unplug the fiber first: its LC connector latches into the transceiver.');
    delete d.sfp[key]; evalLinks(); emit('change');
  }
  function renameDevice(id, to) {
    const d = D(id); if (!d || id === to) return;
    if (!/^[A-Za-z][\w-]{0,23}$/.test(to)) throw new Error(`bad name ${to}`);
    if (D(to)) throw new Error(`${to} is already on the bench`);
    d.id = to; if (d.hostname === id) d.hostname = to;
    for (const c of cables) for (const e of [c.a, c.b, c.dce]) if (e && e.dev === id) e.dev = to;
    if (sessions[id]) { sessions[to] = sessions[id]; delete sessions[id]; }
    emit('change');
  }
  const portOf = end => end && D(end.dev) && D(end.dev).m.ports.find(p => p.key === end.port);

  /* ---------- cables ---------- */
  const cables = [];
  let cid = 0;
  function parseEnd(s) { // "R1 G0/0/0" or { dev, port }
    if (typeof s !== 'string') return s;
    const [dev, port] = s.trim().split(/\s+/);
    const d = D(dev); if (!d) throw new Error(`no device ${dev}`);
    const p = d.m.ports.find(x => x.key.toLowerCase() === (port || '').toLowerCase());
    if (!p) throw new Error(`${dev} has no port ${port}`);
    return { dev: d.id, port: p.key };
  }
  const occupied = end => cables.find(c => [c.a, c.b].some(x => x && x.dev === end.dev && x.port === end.port));
  function fits(type, end) { const p = portOf(end); return !!p && CABLES[type].fits.includes(p.type); }
  function canPlug(type, end, other) {
    const p = portOf(end);
    if (!p || p.type === 'decor') return 'nothing plugs in there';
    if (!fits(type, end)) return 'misfit';
    if (occupied(end)) return 'taken';
    if (other && other.dev === end.dev) return 'same';
    if (p.type === 'sfp' && !D(end.dev).sfp[end.port]) return 'nosfp';
    if (CABLES[type].console && other) { const a = portOf(other).type, b = p.type; if (a === b) return 'misfit'; }
    return '';
  }
  function plug(type, a, b, extra = {}) {
    a = a && parseEnd(a); b = b && parseEnd(b);
    for (const [e, o] of [[a, b], [b, a]]) if (e) { const why = canPlug(type, e, o); if (why) throw new Error(why); }
    const c = { id: extra.id || ++cid, type, a: a || null, b: b || null, dce: extra.dce ? parseEnd(extra.dce) : (type === 'serial' ? (a || null) : null) };
    cid = Math.max(cid, c.id);
    cables.push(c); evalLinks(); emit('change');
    return c;
  }
  function attach(c, end, e) { // seat one end of an existing cable
    e = parseEnd(e);
    const why = canPlug(c.type, e, c[end === 'a' ? 'b' : 'a']); if (why) throw new Error(why);
    c[end] = e; if (c.type === 'serial' && !c.dce) c.dce = e;
    evalLinks(); emit('change');
  }
  function detach(c, end) { if (c.dce && c[end] && c.dce.dev === c[end].dev && c.dce.port === c[end].port) c.dce = null; c[end] = null; evalLinks(); emit('change'); }
  function remove(c) { const i = cables.indexOf(c); if (i >= 0) cables.splice(i, 1); evalLinks(); emit('change'); }

  /* ---------- clock and logs ---------- */
  const later = [];
  const sessions = {};
  function sess(d) { return sessions[d.id] || (sessions[d.id] = { lines: [], mode: d.kind === 'pc' ? 'pc' : 'user', ifc: null, vlan: null, hist: [] }); }
  function say(d, text, cls = '') { const s = sess(d); s.lines.push({ text, cls }); if (s.lines.length > 800) s.lines.splice(0, 200); emit('say', d.id, text, cls); }
  function stamp() { const t = new Date(Date.now()); const p = n => String(n).padStart(2, '0'); return `*${t.toLocaleString('en-US', { month: 'short' })} ${String(t.getDate()).padStart(2, ' ')} ${p(t.getHours())}:${p(t.getMinutes())}:${p(t.getSeconds())}.${String(t.getMilliseconds()).padStart(3, '0')}`; }
  function log(d, msg) { if (d.kind === 'pc' || d.kind === 'hub' || d.kind === 'ap' || quiet) return; say(d, `${stamp()}: ${msg}`, 'log'); emit('log', d.id, msg); }
  let quiet = false;

  /* ---------- links ---------- */
  // Everything at the far end of (device, interface): one cable, or every
  // client an access point's radio serves.
  function peersOf(devId, ifname) {
    const d = D(devId);
    if (d.kind === 'ap' && radioOf(d) === ifname) return devs.filter(c => c.kind !== 'ap' && radioOf(c) && apFor(c) === d).map(c => ({ dev: c.id, port: { iface: radioOf(c), key: 'WLAN', type: 'radio' }, cable: wcable(c, d) }));
    const p = peerOf(devId, ifname); return p ? [p] : [];
  }
  function peerOf(devId, ifname) {
    const dv = D(devId);
    if (dv && dv.kind !== 'ap' && radioOf(dv) === ifname) { const ap = apFor(dv); return ap ? { dev: ap.id, port: { iface: radioOf(ap), key: 'RADIO', type: 'radio' }, cable: wcable(dv, ap) } : null; }
    for (const c of cables) {
      if (!c.a || !c.b || isCon(c)) continue;
      for (const [x, y] of [['a', 'b'], ['b', 'a']]) {
        const p = portOf(c[x]);
        if (c[x].dev === devId && p.iface === ifname && D(devId).ifs[ifname] && D(devId).ifs[ifname].medium === p.type) return { dev: c[y].dev, port: portOf(c[y]), cable: c };
      }
    }
    return null;
  }
  const isOn = d => d.power && clock >= d.boot;
  function evalLinks() {
    for (const d of devs) for (const f of Object.values(d.ifs)) { f._phys = false; f._medium = ''; }
    for (const c of cables) {
      if (!c.a || !c.b || isCon(c)) continue;
      for (const e of ['a', 'b']) { const d = D(c[e].dev), p = portOf(c[e]), f = d.ifs[p.iface]; if (f && (p.type === 'sfp' || !f._medium)) f._medium = p.type; }
    }
    // radios: an access point's is up once it has an SSID; a client's once it has joined one
    for (const d of devs) { const r = radioOf(d), f = r && d.ifs[r]; if (!f) continue; f._medium = 'radio'; f._phys = d.kind === 'ap' ? isOn(d) && !!(d.wifi && d.wifi.ssid) && !f.shutdown : !!apFor(d) && !f.shutdown; }
    for (const c of cables) {
      if (!c.a || !c.b || isCon(c)) continue;
      const da = D(c.a.dev), db = D(c.b.dev), pa = portOf(c.a), pb = portOf(c.b), fa = da.ifs[pa.iface], fb = db.ifs[pb.iface];
      if (!fa || !fb || fa._medium !== pa.type || fb._medium !== pb.type) continue;
      const fiber = CABLES[c.type].fiber, optics = !fiber || [[da, c.a], [db, c.b]].every(([d, e]) => (SFPS[d.sfp[e.port]] || {}).fiber === fiber);
      fa._phys = fb._phys = optics && !fa.shutdown && !fb.shutdown && isOn(da) && isOn(db);
    }
    for (const d of devs) {
      for (const [n, f] of Object.entries(d.ifs)) {
        if (f.svi || f.sub || f.loop) continue;
        f.medium = f._medium;
        if (f.wasShut && !f.shutdown && !f._phys && !f.phys) { f.wasShut = false; log(d, `%LINK-3-UPDOWN: Interface ${n}, changed state to down`); }
        if (f._phys) f.wasShut = false;
        let proto = f._phys;
        if (proto && n.startsWith('Serial')) { const pe = peerOf(d.id, n); proto = !!(pe && pe.cable.dce && D(pe.cable.dce.dev).ifs[portOf(pe.cable.dce).iface].clock); }
        if (f._phys !== f.phys) { f.phys = f._phys; if (!f.shutdown || !f.phys) log(d, `%LINK-3-UPDOWN: Interface ${n}, changed state to ${f.phys ? 'up' : 'down'}`); if (f.phys) f.upSince = clock; }
        if (proto !== f.proto) { const was = f.proto; f.proto = proto; if (!was && proto) f.upSince = clock; later.push({ at: clock + 900, fn: () => log(d, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to ${proto ? 'up' : 'down'}`) }); }
      }
      for (const [n, f] of Object.entries(d.ifs)) {
        let pr;
        if (f.svi) pr = !f.shutdown && isOn(d) && Object.values(d.ifs).some(g => !g.svi && !g.routed && g.proto && (g.mode === 'trunk' || g.vlan === +n.slice(4)));
        else if (f.sub) { const pf = d.ifs[f.parent]; pr = !!pf && pf.proto && !f.shutdown && !pf.shutdown; f.phys = pr; }
        else if (f.loop) { pr = !f.shutdown && isOn(d); f.phys = pr; }
        else continue;
        if (pr !== f.proto) { f.proto = pr; if (f.svi) f.phys = pr; log(d, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to ${pr ? 'up' : 'down'}`); }
      }
    }
  }
  function forwarding(d, n) {
    const f = d.ifs[n]; if (!f || !f.proto) return false;
    if (d.kind !== 'switch' || f.svi || f.routed) return true;
    return f.portfast || clock - f.upSince >= STP_FORWARD;
  }
  function stpState(d, n) {
    const f = d.ifs[n]; if (!f || !f.proto) return 'down';
    if (d.kind !== 'switch' || forwarding(d, n)) return 'forwarding';
    return clock - f.upSince < STP_LISTEN ? 'listening' : 'learning';
  }

  /* ---------- layer 2 ---------- */
  // Every frame a broadcast from (device, interface) makes, as a tree: each
  // edge is one cable crossed, from `a` to `b`, with the VLAN the frame is in,
  // whether it's tagged on that cable, and the edge it came in on (`parent`).
  // `ends` are the layer 3 interfaces it reaches, with the edge that got there.
  const allows = (f, v) => !f.allowed || f.allowed.includes(v);
  function walk(devId, ifname) {
    const ends = [], edges = [], seen = new Set(), q = [];
    const start = D(devId);
    const enter = (dId, n, vlan, tagged, e) => {
      const d = D(dId), f = d.ifs[n];
      if (d.kind === 'hub' || d.kind === 'ap') {
        if (d.kind === 'ap' && d.ip && !ends.some(x => x.dev === dId)) ends.push({ dev: dId, n: nicOf(d), e });
        const k = dId + '|' + n + '|' + vlan + '|' + tagged; if (!seen.has(k)) { seen.add(k); q.push({ dId, n, v: vlan, tagged, hub: true, e, from: e >= 0 ? edges[e].a.dev : null }); } return;
      }
      if (d.kind === 'switch' && f.routed) { if (!tagged && f.ip) ends.push({ dev: dId, n, e }); return; }
      if (d.kind === 'switch') {
        const v = f.mode === 'access' ? (tagged ? null : f.vlan) : tagged ? vlan : f.native;
        if (v == null || (f.mode === 'trunk' && !allows(f, v))) return;
        const k = dId + '|' + n + '|' + v; if (seen.has(k)) return; seen.add(k);
        q.push({ dId, n, v, e });
      } else if (d.kind === 'router') {
        if (tagged) { const sub = Object.entries(d.ifs).find(([, g]) => g.sub && g.parent === n && g.encap === vlan); if (sub) ends.push({ dev: dId, n: sub[0], e }); }
        else { if (f.ip) ends.push({ dev: dId, n, e }); const sub = Object.entries(d.ifs).find(([, g]) => g.sub && g.parent === n && g.encap === 1 && g.nativeTag); if (sub) ends.push({ dev: dId, n: sub[0], e }); }
      } else ends.push({ dev: dId, n, e });
    };
    const leave = (dId, n, vlan, tagged, parent, skip) => {
      const d = D(dId);
      if (!forwarding(d, n)) return;
      for (const pe of peersOf(dId, n)) {
        if (pe.dev === skip) continue;
        const pd = D(pe.dev);
        if (!forwarding(pd, pe.port.iface)) continue;
        edges.push({ a: { dev: dId, n }, b: { dev: pe.dev, n: pe.port.iface }, cable: pe.cable, vlan, tagged, parent, depth: parent < 0 ? 0 : edges[parent].depth + 1 });
        enter(pe.dev, pe.port.iface, vlan, tagged, edges.length - 1);
      }
    };
    const f0 = start.ifs[ifname];
    if (start.kind === 'switch' && f0 && f0.svi) {
      const v = +ifname.slice(4);
      for (const [n, f] of Object.entries(start.ifs)) if (!f.svi && ((f.mode === 'trunk' && allows(f, v)) || (f.mode !== 'trunk' && f.vlan === v))) leave(devId, n, v, f.mode === 'trunk' && v !== f.native, -1);
    } else if (f0 && f0.sub) leave(devId, f0.parent, f0.encap, !f0.nativeTag, -1);
    else leave(devId, ifname, 1, false, -1);
    while (q.length) {
      const q0 = q.shift(), { dId, n: inIf, v, tagged, hub, e } = q0, d = D(dId);
      // a hub repeats every bit to every other port; an access point also between its own clients
      if (hub) { const from = q0.from; for (const n of Object.keys(d.ifs)) if (n !== inIf || (d.kind === 'ap' && n === radioOf(d))) leave(dId, n, v, tagged, e, from); continue; }
      const svi = d.ifs['Vlan' + v];
      if (svi && svi.proto && svi.ip && dId !== devId) ends.push({ dev: dId, n: 'Vlan' + v, e });
      for (const [n, f] of Object.entries(d.ifs)) {
        if (f.svi || f.routed || n === inIf) continue;
        if (f.mode === 'trunk') { if (allows(f, v)) leave(dId, n, v, v !== f.native, e); }
        else if (f.vlan === v) leave(dId, n, v, false, e);
      }
    }
    return { ends, edges };
  }
  // The same, flat: the layer 3 ends, and every [device, interface] a frame touched.
  function segment(devId, ifname) {
    const w = walk(devId, ifname);
    return { ends: w.ends.map(x => ({ dev: x.dev, n: x.n })), path: w.edges.flatMap(e => [[e.a.dev, e.a.n], [e.b.dev, e.b.n]]) };
  }
  // The edges from the sender to edge `i`, in order.
  const chainTo = (edges, i) => { const out = []; for (; i >= 0; i = edges[i].parent) out.unshift(edges[i]); return out; };

  /* ---------- layer 3 ---------- */
  // An end device's network card: FastEthernet0, or its own (a Wi-Fi card, say).
  const nicOf = d => d.m.nic || 'FastEthernet0';
  const pcIf = d => d.ifs[nicOf(d)];
  function ipsOf(d) {
    if (d.kind === 'pc' || d.kind === 'ap') return d.ip ? [{ n: nicOf(d), ip: d.ip, mask: d.mask, up: !!(pcIf(d) && pcIf(d).proto) }] : [];
    return Object.entries(d.ifs).filter(([, f]) => f.ip).map(([n, f]) => ({ n, ip: f.ip, mask: f.mask, up: f.proto && !f.shutdown }));
  }
  function owner(ip) { for (const d of devs) for (const a of ipsOf(d)) if (a.ip === ip) return { dev: d, a }; return null; }
  const routes = d => d.kind === 'router' || d.routing;
  // Static routes (distance 1) and OSPF (110): the longest match wins, then the lower distance.
  function candidates(d, dst) {
    const st = d.routes.map(r => ({ ...r, ad: 1, proto: 'static' }));
    const os = d.ospf ? d.ospf.routes.map(r => ({ ...r, ad: 110, proto: 'ospf' })) : [];
    return [...st, ...os].filter(r => sameNet(dst, r.net, r.mask)).sort((x, y) => maskLen(y.mask) - maskLen(x.mask) || x.ad - y.ad);
  }
  function route(d, dst) {
    if (!isOn(d)) return null;
    const addrs = ipsOf(d).filter(a => a.up);
    if (d.kind === 'pc' || d.kind === 'ap') {
      const a = addrs[0]; if (!a) return null;
      if (sameNet(a.ip, dst, a.mask)) return { n: a.n, nh: dst, src: a.ip };
      if (d.pcgw && sameNet(a.ip, d.pcgw, a.mask)) return { n: a.n, nh: d.pcgw, src: a.ip };
      return null;
    }
    for (const a of addrs) if (sameNet(a.ip, dst, a.mask)) return { n: a.n, nh: dst, src: a.ip, proto: 'connected' };
    if (routes(d)) {
      for (const r of candidates(d, dst)) {
        if (r.n) { const f = d.ifs[r.n]; if (f && f.proto && !f.shutdown) return { n: r.n, nh: r.via, src: f.ip, proto: r.proto, net: r.net, mask: r.mask }; continue; }
        if (isIp(r.via)) { const a = addrs.find(a => sameNet(a.ip, r.via, a.mask)); if (a) return { n: a.n, nh: r.via, src: a.ip, proto: r.proto, net: r.net, mask: r.mask }; }
        else { const f = d.ifs[r.via]; if (f && f.proto) return { n: r.via, nh: dst, src: f.ip, proto: r.proto, net: r.net, mask: r.mask }; }
      }
    }
    if (d.kind === 'switch' && !d.routing && d.gw) { const a = addrs[0]; if (a && sameNet(a.ip, d.gw, a.mask)) return { n: a.n, nh: d.gw, src: a.ip }; }
    return null;
  }
  function macOf(d, n) { return d.kind === 'pc' || d.kind === 'ap' ? pcIf(d).mac : (d.ifs[n].sub ? d.ifs[d.ifs[n].parent].mac : d.ifs[n].mac); }
  const mine = (d, ip) => ipsOf(d).some(a => a.ip === ip && a.up);
  // Does (device, interface) answer ARP for `ip`? Its own addresses, and the
  // addresses NAT hands out on an outside interface.
  const answers = (d, n, ip) => isOn(d) && (ipsOf(d).some(a => a.n === n && a.ip === ip && a.up) || natOwns(d, n, ip));

  // A packet ({ src, dst, proto, id }) from `d`, hop by hop. `inN` is the
  // interface it arrived on (none when `d` sends it). ACLs and NAT act as on
  // a real router: inbound ACL, NAT outside-to-inside, routing, outbound ACL,
  // NAT inside-to-outside.
  function deliver(d, pkt, ttl = 8, marks = [], inN = null) {
    if (inN) {
      const deny = acl(d, inN, 'in', pkt); if (deny) return { ok: false, why: 'acl', at: d.id, n: inN, deny, marks, pkt };
      natIn(d, inN, pkt);
      if (mine(d, pkt.dst)) return { ok: true, marks, pkt, last: d.id };
      if (!routes(d) || ttl <= 0) return { ok: false, why: ttl <= 0 && routes(d) ? 'ttl' : 'drop', marks, at: d.id, pkt };
    } else if (mine(d, pkt.dst)) return { ok: true, marks, pkt, last: d.id };
    const r = route(d, pkt.dst);
    if (!r) return { ok: false, why: 'noroute', marks, at: d.id, pkt };
    if (pkt.src == null) pkt.src = r.src;
    if (inN) {
      const deny = acl(d, r.n, 'out', pkt); if (deny) return { ok: false, why: 'acl', at: d.id, n: r.n, deny, marks, pkt };
      const nf = natOut(d, inN, r.n, pkt); if (nf && nf.fail) return { ok: false, why: 'nat', at: d.id, text: nf.fail, marks, pkt };
    }
    const seg = segment(d.id, r.n);
    const hit = seg.ends.find(e => answers(D(e.dev), e.n, r.nh));
    marks.push(...seg.path);
    if (!hit) return { ok: false, why: 'arp', marks, at: d.id, n: r.n, pkt };
    const nd = D(hit.dev);
    d.arp[r.nh] = { mac: macOf(nd, hit.n), n: r.n };
    learn(seg.path, d, r.n);
    return deliver(nd, pkt, inN ? ttl - 1 : ttl, marks, hit.n);
  }
  function learn(path, src, n) {
    const smac = macOf(src, n);
    for (let i = 0; i < path.length; i += 2) {
      const [dId, ifn] = path[i + 1]; const d = D(dId);
      if (d.kind === 'switch' && !d.ifs[ifn].routed) { const f = d.ifs[ifn]; d.macs[smac] = { vlan: f.mode === 'access' ? f.vlan : f.native, port: ifn }; }
    }
  }
  const pinged = new Set(), tried = new Set();
  let icmpId = 0;
  function ping(d, dst) {
    tried.add(d.id + '>' + dst);
    const id = ++icmpId;
    const there = deliver(d, { src: null, dst, proto: 'icmp', id });
    flash(there.marks);
    if (!there.ok) return { ok: false, why: there.why, at: there.at, n: there.n, deny: there.deny };
    // the reply goes back to whatever source the destination saw (NAT may have changed it)
    const back = deliver(D(there.last), { src: there.pkt.dst, dst: there.pkt.src, proto: 'icmp', id, reply: true });
    flash(back.marks);
    if (back.ok) pinged.add(d.id + '>' + dst);
    return { ok: back.ok, why: back.ok ? '' : back.why, at: back.at, n: back.n, deny: back.deny, reply: true };
  }
  function flash(marks) { const until = clock + 600; for (const [dId, n] of marks) { const f = D(dId).ifs[n]; if (f) f.act = until; } }
  // Run `fn` and put every table back as it was: for "would this work?" and the simulation.
  function sandbox(fn) {
    const keep = devs.map(x => JSON.stringify({ arp: x.arp, macs: x.macs, nat: x.nat || null, acls: x.acls || null, dhcp: x.dhcp || null, act: Object.values(x.ifs).map(f => f.act) }));
    try { return fn(); } finally {
      devs.forEach((x, i) => { const k = JSON.parse(keep[i]); x.arp = k.arp; x.macs = k.macs; if (k.nat) x.nat = k.nat; if (k.acls) x.acls = k.acls; if (k.dhcp) x.dhcp = k.dhcp; Object.values(x.ifs).forEach((f, j) => { f.act = k.act[j]; }); });
    }
  }

  /* ---------- access lists ---------- */
  // d.acls[name] = { ext, entries: [{ seq, permit, proto, src, dst, text, hits }] }
  // An address spec is { ip, wc } (any is 0.0.0.0 255.255.255.255).
  const ANY = { ip: '0.0.0.0', wc: '255.255.255.255' };
  const specMatch = (s, ip) => !s || ((ipn(ip) & ~ipn(s.wc)) >>> 0) === ((ipn(s.ip) & ~ipn(s.wc)) >>> 0);
  const specText = s => !s || s.wc === '255.255.255.255' ? 'any' : s.wc === '0.0.0.0' ? `host ${s.ip}` : `${s.ip} ${s.wc}`;
  const aclKind = name => /^\d+$/.test(name) ? ((+name >= 1 && +name <= 99) || (+name >= 1300 && +name <= 1999) ? 'std' : (+name >= 100 && +name <= 199) || (+name >= 2000 && +name <= 2699) ? 'ext' : null) : null;
  // Reads "permit 10.0.0.0 0.0.0.255" or "deny icmp host 1.1.1.1 any echo".
  function parseAce(words, ext) {
    const w = [...words], action = (w.shift() || '').toLowerCase();
    if (action !== 'permit' && action !== 'deny') return { err: "% Invalid input detected at '^' marker." };
    const spec = () => {
      const t = (w.shift() || '').toLowerCase();
      if (t === 'any') return ANY;
      if (t === 'host') { const ip = w.shift(); return isIp(ip) ? { ip, wc: '0.0.0.0' } : null; }
      if (!isIp(t)) return null;
      if (isIp(w[0])) return { ip: t, wc: w.shift() };
      return ext ? null : { ip: t, wc: '0.0.0.0' };
    };
    const port = () => { if (['eq', 'neq', 'gt', 'lt'].includes((w[0] || '').toLowerCase())) { const op = w.shift().toLowerCase(), p = w.shift(); return p ? { op, port: p } : null; } if ((w[0] || '').toLowerCase() === 'range') { w.shift(); return { op: 'range', port: w.shift() + ' ' + w.shift() }; } return undefined; };
    if (!ext) { const src = spec(); if (!src || w.length) return { err: "% Invalid input detected at '^' marker." }; return { permit: action === 'permit', proto: 'ip', src, text: `${action} ${src.wc === '0.0.0.0' ? src.ip : specText(src)}${src.wc !== '0.0.0.0' && src !== ANY ? '' : ''}` }; }
    const proto = (w.shift() || '').toLowerCase();
    if (!['ip', 'icmp', 'tcp', 'udp'].includes(proto)) return { err: "% Invalid input detected at '^' marker." };
    const src = spec(); if (!src) return { err: "% Invalid input detected at '^' marker." };
    const sp = port(); const dst = spec(); if (!dst) return { err: "% Invalid input detected at '^' marker." };
    const dp = port(); const icmpType = proto === 'icmp' && w[0] ? w.shift().toLowerCase() : null;
    if (w.length && !['log'].includes(w[0].toLowerCase())) return { err: "% Invalid input detected at '^' marker." };
    const text = `${action} ${proto} ${specText(src)}${sp ? ` ${sp.op} ${sp.port}` : ''} ${specText(dst)}${dp ? ` ${dp.op} ${dp.port}` : ''}${icmpType ? ' ' + icmpType : ''}`;
    return { permit: action === 'permit', proto, src, dst, sport: sp, dport: dp, icmpType, text };
  }
  function addAce(d, name, ext, words) {
    const e = parseAce(words, ext); if (e.err) return e;
    d.acls = d.acls || {};
    const a = d.acls[name] = d.acls[name] || { ext, entries: [] };
    if (a.ext !== ext) return err(`% Access list ${name} is ${a.ext ? 'extended' : 'standard'}`);
    e.seq = (a.entries.length ? a.entries[a.entries.length - 1].seq : 0) + 10; e.hits = 0;
    a.entries.push(e);
    return null;
  }
  // Is this packet allowed on (device, interface, direction)? Null, or why not.
  // Pings are ICMP: tcp and udp entries never match them. An access list that
  // doesn't exist permits everything, as on IOS.
  function acl(d, n, dir, pkt) {
    const f = d.ifs && d.ifs[n]; if (!f) return null;
    const name = dir === 'in' ? f.aclIn : f.aclOut; if (!name) return null;
    const a = (d.acls || {})[name]; if (!a) return null;
    for (const e of a.entries) {
      const typeOk = !e.icmpType || (e.icmpType === 'echo' ? !pkt.reply : e.icmpType === 'echo-reply' ? !!pkt.reply : true);
      const proto = e.proto === 'ip' || e.proto === pkt.proto;
      if (proto && typeOk && specMatch(e.src, pkt.src) && specMatch(e.dst, pkt.dst)) {
        e.hits++;
        return e.permit ? null : { acl: name, line: e.seq, text: e.text, n, dir };
      }
    }
    return { acl: name, line: 0, text: 'deny any (the implicit deny at the end of every access list)', n, dir, implicit: true };
  }
  const aclSays = (d, x) => `Denied by access list ${x.acl} on ${d.hostname} ${short(x.n)} (${x.dir}): ${x.implicit ? x.text : `line ${x.line}, ${x.text}`}.`;

  /* ---------- NAT ---------- */
  // d.nat = { statics: [{ local, global }], pools: { NAME: { start, end, mask } },
  //           rules: [{ acl, pool, iface, overload }], table: [...], hits, misses }
  const natOf = d => d.nat || (d.nat = { statics: [], pools: {}, rules: [], table: [], hits: 0, misses: 0 });
  const ntoa2 = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
  const maskN32 = p => p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
  // Addresses this router answers ARP for on an outside interface because NAT uses them.
  function natOwns(d, n, ip) {
    if (!d.nat || !d.ifs || !d.ifs[n] || d.ifs[n].nat !== 'outside') return false;
    const f = d.ifs[n];
    if (d.nat.statics.some(s => s.global === ip)) return !f.ip || sameNet(f.ip, ip, f.mask);
    return Object.values(d.nat.pools).some(p => ipn(ip) >= ipn(p.start) && ipn(ip) <= ipn(p.end));
  }
  // Outside to inside: a packet for a global address goes to its inside host.
  function natIn(d, inN, pkt) {
    if (!d.nat || !d.ifs[inN] || d.ifs[inN].nat !== 'outside') return null;
    const t = d.nat.table.find(x => x.global === pkt.dst && (x.kind === 'static' || x.id == null || x.id === pkt.id));
    const s = t || d.nat.statics.find(x => x.global === pkt.dst);
    if (!s) return null;
    const from = pkt.dst; pkt.dst = s.local; d.nat.hits++;
    return `${d.hostname} translates the destination ${from} back to ${s.local} (NAT, ${s.kind === 'pat' ? 'overload' : s.kind || 'static'}).`;
  }
  // Inside to outside: the source becomes a global address.
  function natOut(d, inN, outN, pkt) {
    if (!d.nat || !d.ifs[inN] || !d.ifs[outN] || d.ifs[inN].nat !== 'inside' || d.ifs[outN].nat !== 'outside') return null;
    const nat = d.nat, local = pkt.src;
    const st = nat.statics.find(x => x.local === local);
    if (st) { pkt.src = st.global; nat.hits++; if (!nat.table.some(x => x.kind === 'static' && x.local === local)) nat.table.push({ kind: 'static', local, global: st.global }); return { note: `${d.hostname} translates the source ${local} to ${st.global} (static NAT).` }; }
    for (const r of nat.rules) {
      const a = (d.acls || {})[r.acl];
      if (!a) continue;
      const okay = a.entries.find(e => specMatch(e.src, local));
      if (!okay || !okay.permit) continue;
      const same = nat.table.find(x => x.local === local && x.kind !== 'static' && (x.kind === 'dynamic' || x.id === pkt.id));
      if (same) { pkt.src = same.global; nat.hits++; return { note: `${d.hostname} translates the source ${local} to ${same.global} (NAT${same.kind === 'pat' ? ', overload' : ''}).` }; }
      let global = null;
      if (r.iface) global = (d.ifs[r.iface] || {}).ip;
      else if (r.overload) global = (nat.pools[r.pool] || {}).start;
      else {
        const p = nat.pools[r.pool]; if (!p) continue;
        for (let n = ipn(p.start); n <= ipn(p.end); n++) { const ip = ntoa2(n); if (!nat.table.some(x => x.global === ip && x.kind === 'dynamic') && !nat.statics.some(x => x.global === ip)) { global = ip; break; } }
        if (!global) { nat.misses++; return { fail: `${d.hostname} drops the packet: NAT pool ${r.pool} has no free address (add overload, or a bigger pool).` }; }
      }
      if (!global) continue;
      const kind = r.overload || r.iface ? 'pat' : 'dynamic';
      nat.table.push({ kind, local, global, id: kind === 'pat' ? pkt.id : null, outside: pkt.dst, proto: pkt.proto });
      pkt.src = global; nat.misses++;
      return { note: `${d.hostname} translates the source ${local} to ${global} (${kind === 'pat' ? 'PAT, overload' : 'dynamic NAT'}).` };
    }
    return null;
  }

  /* ---------- OSPF ---------- */
  // d.ospfCfg = { pid, nets: [{ ip, wc, area }], passive: [names], rid, defOrig, ref }
  // Worked out again every half second of clock: neighbors on each enabled
  // interface (same subnet and area, not passive), FULL four seconds after
  // they first see each other, then shortest paths over interface costs.
  const OSPF_FULL = 4000;
  const wcMatch = (ip, net, wc) => ((ipn(ip) & ~ipn(wc)) >>> 0) === ((ipn(net) & ~ipn(wc)) >>> 0);
  function ospfIfs(d) {
    const c = d.ospfCfg; if (!c || !isOn(d)) return [];
    const out = [];
    for (const [n, f] of Object.entries(d.ifs)) {
      if (!f.ip || !f.proto || f.shutdown) continue;
      const net = c.nets.find(x => wcMatch(f.ip, x.ip, x.wc));
      const area = f.ospfArea != null ? f.ospfArea : net ? net.area : null;
      if (area == null) continue;
      const bw = f.bw || (n.startsWith('Serial') ? 1544 : n.startsWith('Fast') ? 100000 : 1000000);
      const cost = f.ospfCost || (f.loop ? 1 : Math.max(1, Math.floor((c.ref || 100) * 1000 / bw)));
      out.push({ n, ip: f.ip, mask: f.mask, area, cost, passive: c.passive.includes(n) || f.loop, pri: f.ospfPri ?? 1, loop: !!f.loop });
    }
    return out;
  }
  // Chosen once, like IOS: a router-id command, else the highest loopback,
  // else the highest up address; kept until `clear ip ospf process`.
  function ospfRid(d) {
    const c = d.ospfCfg; if (c.rid) return c.rid;
    if (c.auto) return c.auto;
    const r = pickRid(d); if (r !== '0.0.0.0') c.auto = r; return r;
  }
  function pickRid(d) {
    const ips = list => list.sort((a, b) => ipn(b) - ipn(a))[0];
    const lo = Object.values(d.ifs).filter(f => f.loop && f.ip && !f.shutdown).map(f => f.ip);
    return ips(lo) || ips(Object.values(d.ifs).filter(f => f.ip && f.proto).map(f => f.ip)) || '0.0.0.0';
  }
  function ospfRun(instant) {
    const rs = devs.filter(d => d.ospfCfg && isOn(d) && routes(d));
    for (const d of devs) if (!rs.includes(d)) { if (d.ospf && d.ospf.nbrs.length) for (const nb of d.ospf.nbrs) if (nb.state === 'FULL') log(d, `%OSPF-5-ADJCHG: Process ${(d.ospfCfg || {}).pid || 1}, Nbr ${nb.rid} on ${nb.n} from FULL to DOWN, Neighbor Down: Interface down or detached`); d.ospf = null; }
    const info = new Map(rs.map(d => [d.id, { d, rid: ospfRid(d), ifs: ospfIfs(d) }]));
    for (const [, A] of info) {
      const was = (A.d.ospf && A.d.ospf.nbrs) || [], seen = (A.d.ospf && A.d.ospf.seen) || {}, nbrs = [];
      for (const x of A.ifs) {
        if (x.passive) continue;
        for (const e of walk(A.d.id, x.n).ends) {
          const B = info.get(e.dev); if (!B || B === A) continue;
          const y = B.ifs.find(z => z.n === e.n); if (!y || y.passive || y.area !== x.area || !sameNet(x.ip, y.ip, x.mask) || x.mask !== y.mask) continue;
          const key = B.rid + '|' + x.n;
          if (seen[key] == null) seen[key] = instant ? -1e9 : clock;
          nbrs.push({ rid: B.rid, dev: B.d.id, ip: y.ip, n: x.n, area: x.area, pri: y.pri, state: clock - seen[key] >= OSPF_FULL ? 'FULL' : 'INIT', theirN: e.n });
        }
      }
      for (const k of Object.keys(seen)) if (!nbrs.some(nb => nb.rid + '|' + nb.n === k)) delete seen[k];
      for (const nb of nbrs) { const old = was.find(o => o.rid === nb.rid && o.n === nb.n); if (nb.state === 'FULL' && (!old || old.state !== 'FULL') && !instant) log(A.d, `%OSPF-5-ADJCHG: Process ${A.d.ospfCfg.pid}, Nbr ${nb.rid} on ${nb.n} from LOADING to FULL, Loading Done`); }
      for (const old of was) if (old.state === 'FULL' && !nbrs.some(nb => nb.rid === old.rid && nb.n === old.n && nb.state === 'FULL')) log(A.d, `%OSPF-5-ADJCHG: Process ${A.d.ospfCfg.pid}, Nbr ${old.rid} on ${old.n} from FULL to DOWN, Neighbor Down: Dead timer expired`);
      A.nbrs = nbrs; A.seen = seen;
    }
    // DR on each multi-access segment: highest priority, then highest router ID
    for (const [, A] of info) for (const nb of A.nbrs) {
      const peers = A.nbrs.filter(z => z.n === nb.n);
      const all = [{ rid: A.rid, pri: (A.ifs.find(z => z.n === nb.n) || {}).pri ?? 1 }, ...peers].filter(z => z.pri > 0).sort((p, q) => q.pri - p.pri || ipn(q.rid) - ipn(p.rid));
      nb.role = nb.n.startsWith('Serial') ? '-' : all[0] && all[0].rid === nb.rid ? 'DR' : all[1] && all[1].rid === nb.rid ? 'BDR' : 'DROTHER';
    }
    // shortest paths from every router
    for (const [, A] of info) {
      const dist = new Map([[A.d.id, 0]]), first = new Map(), done = new Set();
      for (;;) {
        let u = null; for (const [k, v] of dist) if (!done.has(k) && (u === null || v < dist.get(u))) u = k;
        if (u === null) break; done.add(u);
        const U = info.get(u);
        for (const nb of U.nbrs) {
          if (nb.state !== 'FULL') continue;
          const back = info.get(nb.dev); if (!back.nbrs.some(z => z.dev === u && z.state === 'FULL')) continue;
          const c = dist.get(u) + U.ifs.find(z => z.n === nb.n).cost;
          if (!dist.has(nb.dev) || c < dist.get(nb.dev)) { dist.set(nb.dev, c); first.set(nb.dev, u === A.d.id ? { via: nb.ip, n: nb.n } : first.get(u)); }
        }
      }
      const mineNets = A.ifs.map(x => netOf(x.ip, x.mask) + '/' + x.mask);
      const best = new Map();
      for (const [id, dd] of dist) {
        if (id === A.d.id) continue;
        const X = info.get(id), hop = first.get(id);
        for (const x of X.ifs) {
          const mask = x.loop ? '255.255.255.255' : x.mask, net = x.loop ? x.ip : netOf(x.ip, x.mask), key = net + '/' + mask;
          if (mineNets.includes(key) || Object.values(A.d.ifs).some(f => f.ip && f.proto && netOf(f.ip, f.mask) === net && f.mask === mask)) continue;
          const cost = dd + x.cost;
          if (!best.has(key) || cost < best.get(key).cost) best.set(key, { net, mask, via: hop.via, n: hop.n, cost, area: x.area, from: X.rid });
        }
        if (X.d.ospfCfg.defOrig && (X.d.ospfCfg.defOrig === 'always' || X.d.routes.some(r => r.net === '0.0.0.0')) && !A.d.routes.some(r => r.net === '0.0.0.0')) {
          const cur = best.get('0.0.0.0/0.0.0.0');
          if (!cur || dd < cur.ospfDist) best.set('0.0.0.0/0.0.0.0', { net: '0.0.0.0', mask: '0.0.0.0', via: hop.via, n: hop.n, cost: 1, ospfDist: dd, ext: true, from: X.rid });
        }
      }
      A.d.ospf = { rid: A.rid, nbrs: A.nbrs, seen: A.seen, routes: [...best.values()], ifs: A.ifs };
    }
  }

  /* ---------- DHCP ---------- */
  // A server: d.dhcpPools[name] = { net, mask, gw, dns, domain }, d.dhcpExcl = [[from, to]],
  // d.dhcpBind = { ip: { mac, pool } }. A relay: an interface's `helper`.
  // A client (end device with d.dhcp): Discover, Offer, Request, Ack, all at once.
  function dhcpServe(srv, giaddr, mac) {
    const pools = Object.entries(srv.dhcpPools || {}).filter(([, p]) => p.net && sameNet(p.net, giaddr, p.mask));
    for (const [name, p] of pools) {
      srv.dhcpBind = srv.dhcpBind || {};
      const had = Object.entries(srv.dhcpBind).find(([, b]) => b.mac === mac && b.pool === name);
      if (had) return { ip: had[0], mask: p.mask, gw: p.gw || '', dns: p.dns || '', server: srv, pool: name };
      const lo = ipn(netOf(p.net, p.mask)) + 1, hi = (ipn(netOf(p.net, p.mask)) | (~ipn(p.mask) >>> 0)) >>> 0;
      for (let n = lo; n < hi; n++) {
        const ip = ntoa2(n);
        if ((srv.dhcpExcl || []).some(([a, b]) => n >= ipn(a) && n <= ipn(b || a))) continue;
        if (srv.dhcpBind[ip] || owner(ip) || ip === p.gw) continue;
        srv.dhcpBind[ip] = { mac, pool: name, at: clock };
        return { ip, mask: p.mask, gw: p.gw || '', dns: p.dns || '', server: srv, pool: name };
      }
      return { full: name, server: srv };
    }
    return null;
  }
  // Who answers a Discover from this client: a server on its LAN, or one a relay forwards to.
  function dhcpFind(c) {
    const ends = walk(c.id, nicOf(c)).ends;
    for (const e of ends) {
      const d = D(e.dev), f = d.ifs && d.ifs[e.n]; if (!f || !f.ip || !isOn(d)) continue;
      const here = dhcpServe(d, f.ip, macOf(c, nicOf(c)));
      if (here) return { ...here, via: d, n: e.n };
      if (f.helper) {
        const o = owner(f.helper); if (!o) continue;
        const reach = sandbox(() => deliver(d, { src: f.ip, dst: f.helper, proto: 'udp' }).ok);
        if (!reach) continue;
        const r = dhcpServe(o.dev, f.ip, macOf(c, nicOf(c)));
        if (r) return { ...r, via: d, n: e.n, relay: f.helper };
      }
    }
    return null;
  }
  function dhcpGet(c, quietly) {
    const nic = pcIf(c);
    if (!nic || !nic.proto) return { none: 'no link' };
    const r = dhcpFind(c);
    if (r && r.ip) { c.ip = r.ip; c.mask = r.mask; c.pcgw = r.gw; c.dns = r.dns; c.dhcpFrom = r.server.id; c.apipa = false; if (!quietly) emit('change'); return r; }
    // nothing answered: Windows gives itself a link-local address
    if (!c.ip || !c.apipa) { const h = macOf(c, nicOf(c)).replace(/\./g, ''); c.ip = `169.254.${parseInt(h.slice(8, 10), 16) || 1}.${parseInt(h.slice(10, 12), 16) || 1}`; c.mask = '255.255.0.0'; c.pcgw = ''; c.apipa = true; if (!quietly) emit('change'); }
    return r && r.full ? { full: r.full, server: r.server } : { none: 'no server' };
  }

  /* ---------- wireless ---------- */
  // An access point bridges its radio and its Ethernet port. A wireless
  // client joins the first access point that is on and has its SSID and key.
  const radioOf = d => (d.m.ports.find(p => p.type === 'radio') || {}).iface;
  function apFor(c) {
    if (!c.wifi || !c.wifi.ssid || !isOn(c)) return null;
    return devs.find(a => a.kind === 'ap' && isOn(a) && a.wifi && a.wifi.ssid === c.wifi.ssid && (a.wifi.key || '') === (c.wifi.key || '')) || null;
  }
  const wcable = (c, ap) => ({ id: 'w:' + c.id, type: 'wireless', wireless: true, a: { dev: c.id, port: 'WLAN' }, b: { dev: ap.id, port: 'RADIO' } });

  /* ---------- simulation: a ping, frame by frame ---------- */
  // What a ping from `srcId` to `dst` does, without doing it: every frame on
  // every cable (`frames`, each at a `step`; frames at the same step move
  // together), what each device makes of it (`events`), and, if it fails,
  // where and why (`fail`). The tables are left as they were; call ping()
  // afterwards to make it real.
  const BCAST = 'ffff.ffff.ffff';
  const nameOf = d => d.hostname;
  const at = (d, n) => `${nameOf(d)} ${short(n)}`;
  // Nothing it does stays: NAT tables, ACL counters and ARP go back as they were.
  const simulate = (srcId, dst) => sandbox(() => simulateRaw(srcId, dst));
  const simulateDhcp = id => sandbox(() => simulateRaw(id, null, 'dhcp'));
  function simulateRaw(srcId, dst, mode) {
    const src = D(srcId), frames = [], events = [];
    let step = 0, fail = null;
    const known = new Set(); // ARP entries learned during this ping
    const has = (d, ip) => !!d.arp[ip] || known.has(d.id + '|' + ip);
    const ev = (d, text, kind = '', frame = -1, when = step) => events.push({ step: when, dev: d.id, text, kind, frame });
    // the VLAN a switch puts a frame in as it arrives on n
    const vIn = (sw, n, e) => { const f = sw.ifs[n]; return f.mode === 'trunk' ? (e.tagged ? e.vlan : f.native) : f.vlan; };
    const stop = (d, reason, where = {}) => { fail = { step, dev: d.id, reason, ...where }; ev(d, reason, 'fail'); return false; };
    const tagOf = e => e.tagged ? e.vlan : null;
    // the IP layer and what rides on it: an echo, or a DHCP message over UDP
    const l4 = (ip, kind) => ({ ip: { src: ip.src, dst: ip.dst, ttl: ip.ttl, proto: ip.proto }, ...(ip.proto === 'udp' ? { udp: { sport: ip.sport || 67, dport: ip.dport || 67 }, dhcp: ip.dhcp } : { icmp: { type: kind === 'reply' ? 'Echo reply (0)' : 'Echo request (8)' } }) });
    const put = (e, kind, pdu, s) => { frames.push({ step: s, kind, cable: e.cable.id, from: e.a, to: e.b, pdu: { ...pdu, eth: { ...pdu.eth, vlan: tagOf(e) } } }); return frames.length - 1; };
    // Send along a chain of edges, one cable per step.
    const along = (chain, kind, pdu) => chain.forEach((e, k) => {
      const i = put(e, kind, pdu, step), d = D(e.b.dev), nx = chain[k + 1];
      if (nx && d.kind === 'switch') ev(d, `${nameOf(d)} gets the frame on ${short(e.b.n)} in VLAN ${vIn(d, e.b.n, e)}, sends it toward ${pdu.eth.dst} out ${short(nx.a.n)}${nx.tagged ? `, tagged for VLAN ${nx.vlan}` : ''}.`, kind, i, step + 1);
      else if (nx && d.kind === 'hub') ev(d, `${nameOf(d)} is a hub: it repeats the bits out every other port.`, kind, i, step + 1);
      step++;
    });
    function hop(d, dstIp, kind, ip) {
      // `d` sends the packet `ip` ({ src, dst, ttl, proto, id, reply }); the device it reaches, or false.
      // Each router on the way: inbound ACL, NAT outside-to-inside, routing, outbound ACL, NAT inside-to-outside.
      let inN = null;
      for (let ttl = 0; ttl < 16; ttl++) {
        if (inN) {
          const deny = acl(d, inN, 'in', ip); if (deny) return stop(d, aclSays(d, deny), { iface: inN });
          const back = natIn(d, inN, ip); if (back) ev(d, back, kind);
          if (mine(d, ip.dst)) return d;
          if (!routes(d)) return stop(d, d.kind === 'switch' ? `${nameOf(d)} isn't routing (no \`ip routing\`), so it drops a packet meant for ${ip.dst}.` : `${nameOf(d)} isn't a router, so it drops a packet meant for ${ip.dst}.`);
          ip.ttl--;
          if (ip.ttl <= 0) return stop(d, `The packet's TTL ran out at ${nameOf(d)}: the routes loop.`);
          const nr = route(d, ip.dst);
          ev(d, nr ? `${nameOf(d)} looks up ${ip.dst}: ${nr.nh === ip.dst ? `it's on its own network, out ${short(nr.n)}` : `the ${nr.proto === 'ospf' ? 'OSPF' : 'static'} route${nr.net ? ` to ${nr.net}/${maskLen(nr.mask)}` : ''} says next hop ${nr.nh}, out ${short(nr.n)}`}. TTL ${ip.ttl + 1} becomes ${ip.ttl}.` : `${nameOf(d)} looks up ${ip.dst}.`, kind);
        } else if (mine(d, ip.dst)) return d;
        dstIp = ip.dst;
        const r = route(d, dstIp);
        if (!r) return stop(d, noRoute(d, dstIp));
        if (inN) {
          const deny = acl(d, r.n, 'out', ip); if (deny) return stop(d, aclSays(d, deny), { iface: r.n });
          const nt = natOut(d, inN, r.n, ip); if (nt && nt.fail) return stop(d, nt.fail); if (nt) ev(d, nt.note, kind);
        }
        const ends = walk(d.id, r.n);
        const owner = ends.ends.find(x => answers(D(x.dev), x.n, r.nh));
        const myMac = macOf(d, r.n), via = r.nh === dstIp ? '' : ` through ${r.nh}`;
        if (kind === 'icmp' && d === src) ev(d, `${nameOf(d)} sends an echo request to ${dstIp}${via ? `. It isn't on ${nameOf(d)}'s network, so it goes to the gateway ${r.nh}` : ''}.`, kind);
        if (!has(d, r.nh)) {
          ev(d, `${nameOf(d)} doesn't know the MAC address of ${r.nh}, so it broadcasts an ARP request out ${short(r.n)}: who has ${r.nh}?`, 'arp');
          const arp = { eth: { src: myMac, dst: BCAST, type: 'ARP' }, arp: { op: 'request', senderIp: r.src, senderMac: myMac, targetIp: r.nh, targetMac: '0000.0000.0000' } };
          const base = step;
          let deep = -1;
          const flooded = new Set();
          ends.edges.forEach(e => { const i = put(e, 'arp', arp, base + e.depth); deep = Math.max(deep, e.depth); const sw = D(e.b.dev); if ((sw.kind === 'switch' && !sw.ifs[e.b.n].routed || sw.kind === 'hub') && !flooded.has(sw.id) && ends.edges.some(x => x.parent === ends.edges.indexOf(e))) { flooded.add(sw.id); ev(sw, sw.kind === 'hub' ? `${nameOf(sw)} is a hub: it repeats the broadcast out every other port.` : `${nameOf(sw)} floods the broadcast out every port in VLAN ${vIn(sw, e.b.n, e)} except the one it came in on.`, 'arp', i, base + e.depth + 1); } });
          step = base + deep + 1;
          if (!ends.edges.length) { step = base; const why = whyNoArp(d, r.n, r.nh); return stop(failDev || d, why || `${at(d, r.n)} has no working link, so the ARP request goes nowhere.`, why ? failWhere : { iface: r.n }); }
          if (!owner) { const why = whyNoArp(d, r.n, r.nh); return stop(failDev || d, why || `No ARP reply: nothing on this network answers for ${r.nh}.`, failWhere); }
          const od = D(owner.dev), oMac = macOf(od, owner.n);
          known.add(od.id + '|' + r.src);
          ev(od, `${nameOf(od)} has ${r.nh}: it answers with an ARP reply, ${r.nh} is at ${oMac}.`, 'arp-reply');
          const back = chainTo(ends.edges, owner.e).reverse().map(e => ({ ...e, a: e.b, b: e.a }));
          along(back, 'arp-reply', { eth: { src: oMac, dst: myMac, type: 'ARP' }, arp: { op: 'reply', senderIp: r.nh, senderMac: oMac, targetIp: r.src, targetMac: myMac } });
          known.add(d.id + '|' + r.nh);
          ev(d, `${nameOf(d)} now knows ${r.nh} is at ${oMac}.`, 'arp-reply');
        } else if (!owner) {
          // it knows the MAC already, so the frame goes out: show it as far as it gets
          const why = whyNoArp(d, r.n, r.nh);
          along(trail, kind, { eth: { src: myMac, dst: (d.arp[r.nh] || {}).mac || BCAST, type: 'IPv4' }, ...l4(ip, kind) });
          return stop(failDev || d, why || `${nameOf(d)} sends the frame, but ${r.nh} isn't reachable on this network any more.`, failWhere);
        }
        const od = D(owner.dev), oMac = macOf(od, owner.n);
        along(chainTo(ends.edges, owner.e), kind, { eth: { src: myMac, dst: oMac, type: 'IPv4' }, ...l4(ip, kind) });
        d = od; inN = owner.n;
      }
      return stop(d, 'The packet went round in circles: the routes loop.');
    }

    // Why didn't the ARP request reach `nh`? Follow the cables toward whoever
    // has that address and find the first thing that stops a frame.
    let failDev = null, failWhere = {}, trail = [];
    function whyNoArp(d, n, nh) {
      failDev = null; failWhere = {}; trail = [];
      const o = owner(nh);
      if (!o) return `No ARP reply: no device has the address ${nh}.`;
      const od = o.dev, of = od.kind === 'pc' ? pcIf(od) : od.ifs[o.a.n];
      if (!isOn(od)) { failDev = od; return `${nameOf(od)} is ${od.power ? 'still booting' : 'switched off'}, so nothing answers for ${nh}.`; }
      if (od.kind !== 'pc' && of && of.shutdown) { failDev = od; return `${at(od, o.a.n)} is shut down (administratively down), so nothing answers for ${nh}.`; }
      // the physical path, ignoring VLANs and spanning tree
      const startIfs = d.ifs[n] && d.ifs[n].sub ? [d.ifs[n].parent] : d.ifs[n] && d.ifs[n].svi ? Object.keys(d.ifs).filter(k => !d.ifs[k].svi) : [n];
      const goal = od.id, prev = new Map(), q = [];
      for (const s of startIfs) { const pe = rawPeer(d.id, s); if (pe) { const k = pe.dev + '|' + pe.n; if (!prev.has(k)) { prev.set(k, { from: { dev: d.id, n: s }, cable: pe.cable, back: null }); q.push(k); } } }
      let hit = null;
      while (q.length && !hit) {
        const k = q.shift(), [dev, n2] = k.split('|'), x = D(dev);
        if (dev === goal) { hit = k; break; }
        if (x.kind === 'pc' || x.kind === 'router' || (x.kind === 'switch' && x.ifs[n2] && x.ifs[n2].routed)) continue;
        for (const m of Object.keys(x.ifs)) { if (m === n2 || x.ifs[m].svi) continue; const pe = rawPeer(dev, m); if (!pe) continue; const k2 = pe.dev + '|' + pe.n; if (!prev.has(k2)) { prev.set(k2, { from: { dev, n: m }, cable: pe.cable, back: k }); q.push(k2); } }
      }
      if (!hit) { failDev = d; return `There's no cable path from ${nameOf(d)} to ${nameOf(od)}, so the ARP request for ${nh} never gets there.`; }
      const hops = []; for (let k = hit; k; k = prev.get(k).back) { const p = prev.get(k), [dev, n2] = k.split('|'); hops.unshift({ a: p.from, b: { dev, n: n2 }, cable: p.cable }); }
      // the frame's VLAN as it leaves d
      const f0 = d.ifs[n];
      let vlan = 1, tagged = false;
      if (f0 && f0.sub) { vlan = f0.encap; tagged = !f0.nativeTag; } else if (f0 && f0.svi) { vlan = +n.slice(4); }
      for (let i = 0; i < hops.length; i++) {
        const { a, b, cable } = hops[i], A = D(a.dev), B = D(b.dev), fa = A.ifs[a.n], fb = B.ifs[b.n];
        failWhere = { cable: cable.id, iface: a.n };
        if (A.id === d.id && f0 && f0.svi) { const ap = A.ifs[a.n]; if (ap.mode === 'trunk') tagged = vlan !== ap.native; else if (ap.vlan !== vlan) continue; }
        if (fa.shutdown) { failDev = A; return `${at(A, a.n)} is shut down (administratively down).`; }
        if (!isOn(B)) { failDev = B; return `${nameOf(B)} is ${B.power ? 'still booting' : 'switched off'}.`; }
        if (B.kind !== 'pc' && fb.shutdown) { failDev = B; return `${at(B, b.n)} is shut down (administratively down).`; }
        const fiber = CABLES[cable.type].fiber;
        if (fiber) for (const [X, e] of [[A, cable.a], [B, cable.b]]) { const t = SFPS[X.sfp[e.port]]; if (!t || t.fiber !== fiber) { failDev = X; return `The ${fiber === 'mmf' ? 'multimode' : 'single-mode'} fiber needs a ${fiber === 'mmf' ? '1000BASE-SX' : '1000BASE-LX'} transceiver in ${nameOf(X)} ${e.port}, but ${t ? `it has a ${t.name}` : "the cage is empty"}: wrong transceiver, no light, no link.`; } }
        if (!fa.phys || !fb.phys) { failDev = A; return `The link from ${at(A, a.n)} to ${at(B, b.n)} is down.`; }
        if (a.n.startsWith('Serial') && !fa.proto) { const dce = cable.dce && D(cable.dce.dev); failDev = dce || A; return `The serial line is up, but the line protocol is down: the DCE end${dce ? ` (${nameOf(dce)})` : ''} has no clock rate.`; }
        for (const [X, x] of [[A, a.n], [B, b.n]]) if (!forwarding(X, x)) { failDev = X; return `Spanning tree is still ${stpState(X, x)} on ${at(X, x)}: the port doesn't forward frames yet. Wait, or turn on PortFast.`; }
        trail.push({ a, b, cable, vlan, tagged }); // the frame crosses this cable
        // into B
        if (B.kind === 'switch' && !fb.routed) {
          if (fb.mode === 'access') { if (tagged) { failDev = B; return `A frame tagged for VLAN ${vlan} arrives on ${at(B, b.n)}, an access port, and is dropped. The other end needs to be an access port too, or this one a trunk.`; } vlan = fb.vlan; }
          else { if (!tagged) vlan = fb.native; if (!allows(fb, vlan)) { failDev = B; return `VLAN ${vlan} isn't allowed on the trunk ${at(B, b.n)}.`; } }
          const nx = hops[i + 1];
          if (nx) {
            const fo = B.ifs[nx.a.n];
            if (fo.mode === 'trunk') { if (!allows(fo, vlan)) { failDev = B; failWhere = { cable: nx.cable.id, iface: nx.a.n }; return `VLAN ${vlan} isn't allowed on the trunk ${at(B, nx.a.n)}.`; } tagged = vlan !== fo.native; }
            else { if (fo.vlan !== vlan) { failDev = B; failWhere = { cable: nx.cable.id, iface: nx.a.n }; return `${at(B, nx.a.n)} is in VLAN ${fo.vlan}, but the frame is in VLAN ${vlan}. A switch only forwards a frame within its own VLAN.`; } tagged = false; }
          } else { const svi = B.ifs['Vlan' + vlan]; if (B.id === od.id && !(svi && svi.ip === nh)) { failDev = B; return `${nameOf(B)} gets the frame in VLAN ${vlan}, but its address ${nh} is on ${o.a.n}.`; } }
        } else if (B.kind === 'router' && B.id === od.id) {
          const tf = B.ifs[o.a.n];
          if (tf.sub && tagged && tf.encap !== vlan) { failDev = B; return `The frame arrives tagged for VLAN ${vlan}, but ${at(B, o.a.n)} is set for VLAN ${tf.encap} (encapsulation dot1Q ${tf.encap}).`; }
          if (tf.sub && !tagged && !tf.nativeTag) { failDev = B; return `The frame arrives untagged, but ${at(B, o.a.n)} expects frames tagged for VLAN ${tf.encap}. Make the switch port a trunk.`; }
          if (!tf.sub && tagged) { const sub = Object.entries(B.ifs).find(([, g]) => g.sub && g.parent === b.n && g.encap === vlan); failDev = B; return sub ? `The frame arrives tagged for VLAN ${vlan}, on subinterface ${short(sub[0])}, not on ${short(o.a.n)} where ${nh} lives.` : `The frame arrives tagged for VLAN ${vlan}, but ${nameOf(B)} has no subinterface with encapsulation dot1Q ${vlan} on ${short(b.n)}.`; }
        } else if (B.kind === 'router' && tagged && !Object.values(B.ifs).some(g => g.sub && g.parent === b.n && g.encap === vlan)) { failDev = B; return `${nameOf(B)} has no subinterface for VLAN ${vlan} on ${short(b.n)}.`; }
      }
      failWhere = {};
      return '';
    }
    function noRoute(d, dstIp) {
      if (!isOn(d)) return `${nameOf(d)} is ${d.power ? 'still booting' : 'switched off'}.`;
      if (d.kind === 'pc') {
        if (!d.ip) return `${nameOf(d)} has no IP address.`;
        if (d.apipa) return `${nameOf(d)} has no address from DHCP (it gave itself ${d.ip}): no DHCP server answered on its network.`;
        if (!pcIf(d).proto) return radioOf(d) ? `${nameOf(d)} isn't connected to a wireless network${d.wifi && d.wifi.ssid ? `: no access point broadcasts "${d.wifi.ssid}" with that key` : ': give it an SSID'}.` : `${nameOf(d)}'s network cable has no link.`;
        if (!sameNet(d.ip, dstIp, d.mask) && !d.pcgw) return `${dstIp} isn't on ${nameOf(d)}'s network (${netOf(d.ip, d.mask)}/${maskLen(d.mask)}) and ${nameOf(d)} has no default gateway.`;
        if (d.pcgw && !sameNet(d.ip, d.pcgw, d.mask)) return `${nameOf(d)}'s gateway ${d.pcgw} isn't on its own network (${netOf(d.ip, d.mask)}/${maskLen(d.mask)}).`;
      }
      const down = Object.entries(d.ifs).find(([, f]) => f.ip && sameNet(f.ip, dstIp, f.mask) && !(f.proto && !f.shutdown));
      if (down) return `${at(d, down[0])} is ${down[1].shutdown ? 'shut down' : 'down'}, so its network ${netOf(down[1].ip, down[1].mask)}/${maskLen(down[1].mask)} isn't reachable.`;
      if (d.kind === 'switch' && !d.routing) return `${nameOf(d)} has no default gateway for ${dstIp}.`;
      return `${nameOf(d)} has no route to ${dstIp}: nothing in its routing table matches, and there's no default route.`;
    }

    // DHCP: Discover and Request are broadcasts on the client's LAN; a relay
    // (ip helper-address) carries them to a server elsewhere as unicast.
    function dhcpTrace() {
      const c = src, nic = nicOf(c), cmac = macOf(c, nic), out = { ok: false, frames, events, fail };
      const done = () => ({ ok: !fail, frames, events, fail, steps: Math.max(step, ...frames.map(f => f.step + 1), fail ? fail.step + 1 : 0) });
      if (!pcIf(c) || !pcIf(c).proto) { stop(c, radioOf(c) ? `${nameOf(c)} isn't connected to a wireless network, so its DHCP Discover goes nowhere.` : `${nameOf(c)}'s network cable has no link, so its DHCP Discover goes nowhere.`); return done(); }
      void out;
      const w = walk(c.id, nic), bc = { src: '0.0.0.0', dst: '255.255.255.255', ttl: 128, proto: 'udp', sport: 68, dport: 67 };
      const flood = (msg, what) => {
        const base = step; let deep = -1;
        for (const e of w.edges) { put(e, 'dhcp', { eth: { src: cmac, dst: BCAST, type: 'IPv4' }, ...l4({ ...bc, dhcp: msg }, 'dhcp') }, base + e.depth); deep = Math.max(deep, e.depth); }
        if (what) ev(c, what, 'dhcp', -1, base);
        step = base + deep + 1;
      };
      flood({ op: 'Discover', client: cmac }, `${nameOf(c)} ${c.ip && !c.apipa ? 'asks for an address again' : 'has no address yet'}, so it broadcasts a DHCP Discover from 0.0.0.0 to 255.255.255.255: is there a DHCP server?`);
      const a = dhcpFind(c);
      if (!a || !a.ip) {
        const lan = w.ends.map(e => [D(e.dev), e.n]).find(([d, n]) => d.ifs && d.ifs[n] && d.ifs[n].ip);
        stop(c, a && a.full ? `${a.server.hostname}'s pool ${a.full} has no free address left. ${nameOf(c)} gives itself a 169.254 address (APIPA).`
          : lan ? `No DHCP server answers: ${lan[0].hostname} ${short(lan[1])} has no DHCP pool for this network and no \`ip helper-address\`. ${nameOf(c)} gives itself a 169.254 address (APIPA).`
          : `Nothing on this network answers the Discover: no DHCP server, and no router to relay it. ${nameOf(c)} gives itself a 169.254 address (APIPA).`);
        return done();
      }
      const e0 = w.ends.find(e => e.dev === a.via.id && e.n === a.n), toClient = chainTo(w.edges, e0.e).reverse().map(e => ({ ...e, a: e.b, b: e.a }));
      const gi = a.via.ifs[a.n].ip, smac = macOf(a.via, a.n);
      const offer = { op: 'Offer', yiaddr: a.ip, mask: a.mask, router: a.gw, dns: a.dns, server: a.server.hostname };
      if (a.relay) {
        ev(a.via, `${nameOf(a.via)} hears the broadcast on ${short(a.n)} and relays it (ip helper-address ${a.relay}) to the server, as unicast from ${gi}.`, 'dhcp');
        const there = hop(a.via, a.relay, 'dhcp', { src: gi, dst: a.relay, ttl: 255, proto: 'udp', sport: 67, dport: 67, dhcp: { op: 'Discover (relayed)', giaddr: gi } });
        if (!there) return done();
        ev(there, `${nameOf(there)} picks ${a.ip} from pool ${a.pool} and sends an Offer back to the relay at ${gi}.`, 'dhcp');
        if (!hop(there, gi, 'dhcp', { src: a.relay, dst: gi, ttl: 255, proto: 'udp', sport: 67, dport: 67, dhcp: offer })) return done();
      } else ev(a.via, `${nameOf(a.via)} has a DHCP pool (${a.pool}) for this network. It picks ${a.ip}, the first free address, and offers it.`, 'dhcp');
      along(toClient, 'dhcp', { eth: { src: smac, dst: cmac, type: 'IPv4' }, ...l4({ src: gi, dst: a.ip, ttl: 255, proto: 'udp', sport: 67, dport: 68, dhcp: offer }, 'dhcp') });
      flood({ op: 'Request', requested: a.ip, server: a.server.hostname }, `${nameOf(c)} takes the offer: it broadcasts a DHCP Request for ${a.ip}, so any other server knows it chose this one.`);
      if (a.relay) ev(a.via, `${nameOf(a.via)} relays the Request to ${a.relay}; the server acknowledges.`, 'dhcp');
      along(toClient, 'dhcp', { eth: { src: smac, dst: cmac, type: 'IPv4' }, ...l4({ src: gi, dst: a.ip, ttl: 255, proto: 'udp', sport: 67, dport: 68, dhcp: { ...offer, op: 'Ack' } }, 'dhcp') });
      ev(c, `${nameOf(c)} gets the Ack: its address is ${a.ip}/${maskLen(a.mask)}${a.gw ? `, gateway ${a.gw}` : ''}${a.dns ? `, DNS ${a.dns}` : ''}.`, 'done');
      return done();
    }
    if (mode === 'dhcp') return dhcpTrace();
    // the request, then the reply
    const r0 = route(src, dst);
    const sip = r0 ? r0.src : (ipsOf(src)[0] || {}).ip;
    if (!isIp(dst)) return { ok: false, frames, events: [{ step: 0, dev: src.id, text: `${dst} isn't an IP address.`, kind: 'fail' }], fail: { step: 0, dev: src.id, reason: `${dst} isn't an IP address.` }, steps: 1 };
    const req = { src: sip, dst, ttl: src.kind === 'router' ? 255 : 128, proto: 'icmp', id: 9000 + (++icmpId) };
    const there = hop(src, dst, 'icmp', req);
    let ok = false;
    if (there) {
      ev(there, `${nameOf(there)} has ${req.dst}: it answers with an echo reply to ${req.src}.`, 'reply');
      // back to the source the destination saw: NAT may have changed it
      const back = hop(there, req.src, 'reply', { src: req.dst, dst: req.src, ttl: there.kind === 'router' ? 255 : 128, proto: 'icmp', id: req.id, reply: true });
      if (back) { ok = true; ev(src, `${nameOf(src)} gets the echo reply from ${dst}. The ping works.`, 'done'); }
    }
    return { ok, frames, events, fail, steps: Math.max(step, ...frames.map(f => f.step + 1), fail ? fail.step + 1 : 0) };
  }
  // The device and interface at the far end of the cable in (devId, n), link or not.
  function rawPeer(devId, n) {
    for (const c of cables) {
      if (!c.a || !c.b || isCon(c)) continue;
      for (const [x, y] of [['a', 'b'], ['b', 'a']]) if (c[x].dev === devId && portOf(c[x]).iface === n) { const p = portOf(c[y]); if (!NO_IF.includes(p.iface)) return { dev: c[y].dev, n: p.iface, cable: c }; }
    }
    return null;
  }

  /* ---------- the IOS command line ---------- */
  // `switchport trunk allowed vlan`: a list like 10,20,30-35, or add, remove,
  // except, all or none. `null` means every VLAN.
  const vlanSet = t => { const out = []; for (const part of t.split(',')) { const m = /^(\d+)(?:-(\d+))?$/.exec(part.trim()); if (!m) return null; const a = +m[1], b = +(m[2] || m[1]); if (a < 1 || b > 4094 || a > b) return null; for (let v = a; v <= b; v++) out.push(v); } return out; };
  function allowedList(cur, text) {
    const w = text.trim().split(/\s+/), all = () => Array.from({ length: 4094 }, (_, i) => i + 1);
    if (w[0] === 'all') return { list: null };
    if (w[0] === 'none') return { list: [] };
    const set = vlanSet(['add', 'remove', 'except'].includes(w[0]) ? w.slice(1).join('') : w.join(''));
    if (!set) return { err: "% Invalid input detected at '^' marker." };
    const now = cur || all();
    if (w[0] === 'add') return { list: [...new Set([...now, ...set])].sort((a, b) => a - b) };
    if (w[0] === 'remove') return { list: now.filter(v => !set.includes(v)) };
    if (w[0] === 'except') return { list: all().filter(v => !set.includes(v)) };
    return { list: [...new Set(set)].sort((a, b) => a - b) };
  }
  // 1-9,20,30-35: how IOS writes a VLAN list
  const vlanText = l => { if (!l) return '1-4094'; if (!l.length) return 'none'; const r = []; for (let i = 0; i < l.length; i++) { let j = i; while (j + 1 < l.length && l[j + 1] === l[j] + 1) j++; r.push(j > i ? `${l[i]}-${l[j]}` : `${l[i]}`); i = j; } return r.join(','); };
  const C = [];
  const cmd = (modes, pat, fn, kind) => C.push({ modes: modes.split(' '), w: pat.split(' '), fn, kind });
  const err = t => ({ err: t });
  const cfgDone = d => later.push({ at: clock + 200, fn: () => log(d, '%SYS-5-CONFIG_I: Configured from console by console') });
  function parseIf(d, word) {
    const m = /^([a-z]+)\s*(\d+(?:\/\d+){0,2})(?:\.(\d+))?$/i.exec(word || ''); if (!m) return null;
    const t = IFT.find(([long]) => long.toLowerCase().startsWith(m[1].toLowerCase()));
    if (!t) return null;
    const base = t[0] + m[2];
    if (t[0] === 'Vlan') return d.kind === 'switch' ? base : null;
    if (t[0] === 'Loopback') return /^\d+$/.test(m[2]) && (d.kind === 'router' || (d.kind === 'switch' && d.m.l3)) ? base : null;
    if (!d.ifs[base]) return null;
    if (m[3] !== undefined) return d.kind === 'router' ? base + '.' + m[3] : null;
    return base;
  }
  const kindOk = (c, d) => !c.kind || c.kind === d.kind || (c.kind === 'l3' && d.kind === 'switch' && !!d.m.l3) || (c.kind === 'routing' && (d.kind === 'router' || (d.kind === 'switch' && !!d.m.l3)));
  const EXEC = 'user priv';
  cmd('user', 'enable', (d, s) => { s.mode = 'priv'; });
  cmd('priv', 'disable', (d, s) => { s.mode = 'user'; });
  cmd(EXEC, 'exit', (d, s) => { s.mode = 'user'; return `\n${d.hostname} con0 is now available\n\nPress RETURN to get started.`; });
  cmd('priv', 'configure terminal', (d, s) => { s.mode = 'conf'; return 'Enter configuration commands, one per line.  End with CNTL/Z.'; });
  cmd(EXEC, 'show ip interface brief', showIpBrief);
  cmd(EXEC, 'show interfaces status', showIntStatus, 'switch');
  cmd(EXEC, 'show interfaces trunk', showTrunk, 'switch');
  cmd(EXEC, 'show interfaces <if>', showInt);
  cmd(EXEC, 'show vlan brief', showVlan, 'switch');
  cmd('priv', 'show running-config', d => showRun(d));
  cmd('priv', 'show running-config interface <if>', (d, s, a) => showRun(d, a[0]));
  cmd(EXEC, 'show cdp neighbors', showCdp);
  cmd(EXEC, 'show mac address-table', showMac, 'switch');
  cmd(EXEC, 'show spanning-tree', showStp, 'switch');
  cmd(EXEC, 'show ip route', showRoute, 'routing');
  cmd(EXEC, 'show ip arp', showArp); cmd(EXEC, 'show arp', showArp);
  cmd(EXEC, 'show controllers <if>', showCtl, 'router');
  cmd(EXEC, 'show version', d => `${d.m.software}\n\n${d.hostname} uptime is ${Math.max(0, Math.floor((clock - d.boot) / 60000))} minutes\ncisco ${d.m.platform} processor\n...`);
  cmd(EXEC, 'ping <ip>', (d, s, a) => iosPing(d, a[0]));
  cmd('priv', 'copy running-config startup-config', () => 'Destination filename [startup-config]? \nBuilding configuration...\n[OK]');
  cmd('priv', 'write memory', () => 'Building configuration...\n[OK]');
  cmd('priv', 'reload', d => { powerCycle(d); return 'Proceed with reload? [confirm]\n'; });
  cmd('conf', 'hostname <word>', (d, s, a) => { d.hostname = a[0]; emit('change'); });
  cmd('conf', 'interface <if>', (d, s, a) => {
    const n = a[0];
    if (!d.ifs[n]) {
      if (n.includes('.')) d.ifs[n] = iface({ shutdown: false, sub: true, parent: n.split('.')[0] });
      else if (n.startsWith('Loopback')) d.ifs[n] = iface({ shutdown: false, loop: true, mac: mac('00d097') });
      else d.ifs[n] = iface({ shutdown: true, svi: true, mac: mac('0019e8') });
    }
    s.mode = 'if'; s.ifc = n;
  });
  cmd('conf', 'vlan <num>', (d, s, a) => { const v = +a[0]; if (v < 1 || v > 4094) return err('% Bad VLAN list'); d.vlans[v] = d.vlans[v] || 'VLAN' + String(v).padStart(4, '0'); s.mode = 'vlan'; s.vlan = v; }, 'switch');
  cmd('conf', 'no vlan <num>', (d, s, a) => { delete d.vlans[+a[0]]; }, 'switch');
  cmd('conf', 'ip route <ip> <mask> <hop>', (d, s, a) => { if (!validMask(a[1])) return err('%Inconsistent address and mask'); const net = netOf(a[0], a[1]); d.routes = d.routes.filter(r => !(r.net === net && r.mask === a[1])); d.routes.push({ net, mask: a[1], via: a[2] }); }, 'routing');
  cmd('conf', 'no ip route <ip> <mask> <hop>', (d, s, a) => { d.routes = d.routes.filter(r => !(r.net === netOf(a[0], a[1]) && r.mask === a[1])); }, 'routing');
  cmd('conf', 'ip routing', d => { d.routing = true; }, 'l3');
  cmd('conf', 'no ip routing', d => { d.routing = false; }, 'l3');
  cmd('conf', 'ip default-gateway <ip>', (d, s, a) => { d.gw = a[0]; }, 'switch');
  cmd('conf', 'enable secret <word>', (d, s, a) => { d.secret = a[0]; });
  cmd('conf', 'no ip domain-lookup', () => {});
  cmd('conf', 'service password-encryption', () => {});
  cmd('conf', 'banner motd <rest>', () => {});
  cmd('conf', 'line console <num>', (d, s) => { s.mode = 'line'; });
  cmd('conf', 'line vty <num> <num>', (d, s) => { s.mode = 'line'; });
  for (const p of ['password <word>', 'login', 'logging synchronous', 'exec-timeout <num> <num>', 'transport input <word>']) cmd('line', p, () => {});
  const ifc = (d, s) => d.ifs[s.ifc];
  cmd('if', 'ip address <ip> <mask>', (d, s, a) => {
    const f = ifc(d, s);
    if (d.kind === 'switch' && !f.svi && !f.routed) return err('% Invalid input detected at \'^\' marker.');
    if (!validMask(a[1])) return err('% Bad mask 0x' + (ipn(a[1]) >>> 0).toString(16).toUpperCase() + ' for address ' + a[0]);
    if (maskLen(a[1]) < 31 && ipn(a[0]) === and(a[0], a[1])) return err('Bad mask /' + maskLen(a[1]) + ' for address ' + a[0]);
    if (f.sub && !f.encap) return err('% Configure encapsulation on this interface before configuring an IP address');
    for (const [n, g] of Object.entries(d.ifs)) if (n !== s.ifc && g.ip && sameNet(g.ip, a[0], g.mask)) return err(`% ${netOf(a[0], a[1])} overlaps with ${n}`);
    f.ip = a[0]; f.mask = a[1];
  });
  cmd('if', 'no ip address', (d, s) => { const f = ifc(d, s); f.ip = ''; f.mask = ''; });
  cmd('if', 'shutdown', (d, s) => { const f = ifc(d, s); if (!f.shutdown) { f.shutdown = true; later.push({ at: clock + 300, fn: () => log(d, `%LINK-5-CHANGED: Interface ${s.ifc}, changed state to administratively down`) }); } });
  cmd('if', 'no shutdown', (d, s) => { const f = ifc(d, s); if (f.shutdown) { f.shutdown = false; f.wasShut = true; } });
  cmd('if', 'description <rest>', (d, s, a) => { ifc(d, s).desc = a[0]; });
  cmd('if', 'encapsulation dot1q <num>', (d, s, a) => { const f = ifc(d, s); if (!f.sub) return err('% Invalid input detected at \'^\' marker.'); f.encap = +a[0]; }, 'router');
  cmd('if', 'encapsulation dot1q <num> native', (d, s, a) => { const f = ifc(d, s); if (!f.sub) return err('% Invalid input detected at \'^\' marker.'); f.encap = +a[0]; f.nativeTag = true; }, 'router');
  cmd('if', 'no switchport', (d, s) => { const f = ifc(d, s); if (f.svi) return err('% Invalid input detected at \'^\' marker.'); f.routed = true; f.mode = 'access'; f.vlan = 1; }, 'l3');
  cmd('if', 'switchport', (d, s) => { const f = ifc(d, s); f.routed = false; f.ip = ''; f.mask = ''; }, 'l3');
  cmd('if', 'switchport mode access', (d, s) => { ifc(d, s).mode = 'access'; }, 'switch');
  cmd('if', 'switchport mode trunk', (d, s) => { ifc(d, s).mode = 'trunk'; }, 'switch');
  cmd('if', 'switchport access vlan <num>', (d, s, a) => { const v = +a[0]; if (!d.vlans[v]) { d.vlans[v] = 'VLAN' + String(v).padStart(4, '0'); say(d, '% Access VLAN does not exist. Creating vlan ' + v); } ifc(d, s).vlan = v; }, 'switch');
  cmd('if', 'switchport trunk native vlan <num>', (d, s, a) => { ifc(d, s).native = +a[0]; }, 'switch');
  cmd('if', 'switchport trunk allowed vlan <rest>', (d, s, a) => { const f = ifc(d, s), r = allowedList(f.allowed, a[0]); if (r.err) return err(r.err); f.allowed = r.list; }, 'switch');
  cmd('if', 'no switchport trunk allowed vlan', (d, s) => { ifc(d, s).allowed = null; }, 'switch');
  cmd('if', 'spanning-tree portfast', (d, s) => { ifc(d, s).portfast = true; return '%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION'; }, 'switch');
  cmd('if', 'no spanning-tree portfast', (d, s) => { ifc(d, s).portfast = false; }, 'switch');
  cmd('if', 'clock rate <num>', (d, s, a) => { if (!s.ifc.startsWith('Serial')) return err('% Invalid input detected at \'^\' marker.'); ifc(d, s).clock = +a[0]; }, 'router');
  cmd('if', 'speed <word>', () => {}); cmd('if', 'duplex <word>', () => {});
  cmd('vlan', 'name <word>', (d, s, a) => { d.vlans[s.vlan] = a[0]; }, 'switch');
  /* ---------- OSPF commands ---------- */
  cmd('conf', 'router ospf <num>', (d, s, a) => { if (d.ospfCfg && d.ospfCfg.pid !== +a[0]) return err('% OSPF: only one process is supported here; `no router ospf ' + d.ospfCfg.pid + '` first'); d.ospfCfg = d.ospfCfg || { pid: +a[0], nets: [], passive: [], rid: '', defOrig: false, ref: 100 }; s.mode = 'ospf'; }, 'routing');
  cmd('conf', 'no router ospf <num>', d => { d.ospfCfg = null; ospfRun(); }, 'routing');
  cmd('ospf', 'network <ip> <mask> area <num>', (d, s, a) => { const c = d.ospfCfg; if (!c.nets.some(x => x.ip === a[0] && x.wc === a[1])) c.nets.push({ ip: a[0], wc: a[1], area: +a[2] }); });
  cmd('ospf', 'no network <ip> <mask> area <num>', (d, s, a) => { d.ospfCfg.nets = d.ospfCfg.nets.filter(x => !(x.ip === a[0] && x.wc === a[1])); });
  cmd('ospf', 'router-id <ip>', (d, s, a) => { d.ospfCfg.rid = a[0]; d.ospfCfg.auto = ''; return '% OSPF: Reload or use "clear ip ospf process" command, for this to take effect'; });
  cmd('ospf', 'passive-interface <if>', (d, s, a) => { if (!d.ospfCfg.passive.includes(a[0])) d.ospfCfg.passive.push(a[0]); });
  cmd('ospf', 'no passive-interface <if>', (d, s, a) => { d.ospfCfg.passive = d.ospfCfg.passive.filter(x => x !== a[0]); });
  cmd('ospf', 'default-information originate', d => { d.ospfCfg.defOrig = true; });
  cmd('ospf', 'default-information originate always', d => { d.ospfCfg.defOrig = 'always'; });
  cmd('ospf', 'no default-information originate', d => { d.ospfCfg.defOrig = false; });
  cmd('ospf', 'auto-cost reference-bandwidth <num>', (d, s, a) => { d.ospfCfg.ref = +a[0]; return '% OSPF: Reference bandwidth is changed.\n        Please ensure reference bandwidth is consistent across all routers.'; });
  cmd('if', 'ip ospf cost <num>', (d, s, a) => { ifc(d, s).ospfCost = +a[0]; }, 'routing');
  cmd('if', 'no ip ospf cost', (d, s) => { ifc(d, s).ospfCost = 0; }, 'routing');
  cmd('if', 'ip ospf priority <num>', (d, s, a) => { ifc(d, s).ospfPri = +a[0]; }, 'routing');
  cmd('if', 'ip ospf <num> area <num>', (d, s, a) => { if (!d.ospfCfg) d.ospfCfg = { pid: +a[0], nets: [], passive: [], rid: '', defOrig: false, ref: 100 }; ifc(d, s).ospfArea = +a[1]; }, 'routing');
  cmd('if', 'bandwidth <num>', (d, s, a) => { ifc(d, s).bw = +a[0]; });
  cmd('priv', 'clear ip ospf process', d => { if (d.ospf) d.ospf.seen = {}; if (d.ospfCfg) d.ospfCfg.auto = ''; return 'Reset ALL OSPF processes? [no]: yes'; }, 'routing');
  cmd(EXEC, 'show ip ospf neighbor', d => {
    const o = d.ospf; if (!o) return '';
    return '\nNeighbor ID     Pri   State           Dead Time   Address         Interface\n' + o.nbrs.map(nb => `${nb.rid.padEnd(16)}${String(nb.pri).padStart(3)}   ${(nb.state === 'FULL' ? `FULL/${nb.role === '-' ? ' -' : nb.role}` : 'INIT/DROTHER').padEnd(16)}00:00:3${(nb.rid.length % 9)}    ${nb.ip.padEnd(16)}${nb.n}`).join('\n');
  }, 'routing');
  cmd(EXEC, 'show ip ospf interface brief', d => {
    const o = d.ospf; if (!o) return '';
    return 'Interface    PID   Area            IP Address/Mask    Cost  State Nbrs F/C\n' + o.ifs.map(x => { const nb = o.nbrs.filter(z => z.n === x.n), full = nb.filter(z => z.state === 'FULL').length; const st = x.loop ? 'LOOP' : x.n.startsWith('Serial') ? 'P2P' : nb.length && nb.every(z => z.role === 'DR' || z.role === 'BDR') && nb.some(z => z.role === 'DR') ? (nb.some(z => z.role === 'BDR') ? 'DROTH' : 'BDR') : 'DR'; return `${short(x.n).padEnd(13)}${String(d.ospfCfg.pid).padEnd(6)}${String(x.area).padEnd(16)}${(x.ip + '/' + maskLen(x.mask)).padEnd(19)}${String(x.cost).padEnd(6)}${st.padEnd(6)}${full}/${nb.length}`; }).join('\n');
  }, 'routing');
  cmd(EXEC, 'show ip ospf', d => d.ospf ? ` Routing Process "ospf ${d.ospfCfg.pid}" with ID ${d.ospf.rid}\n Start time: 00:00:10.123, Time elapsed: ${Math.floor(clock / 60000)}:${String(Math.floor(clock / 1000) % 60).padStart(2, '0')}\n Supports only single TOS(TOS0) routes\n Reference bandwidth unit is ${d.ospfCfg.ref || 100} mbps\n    Area BACKBONE(0)\n        Number of interfaces in this area is ${d.ospf.ifs.length}\n        SPF algorithm executed ${1 + d.ospf.nbrs.length} times` : '', 'routing');
  cmd(EXEC, 'show ip protocols', d => {
    if (!d.ospfCfg) return '*** IP Routing is NSF aware ***\n';
    const c = d.ospfCfg;
    return `*** IP Routing is NSF aware ***\n\nRouting Protocol is "ospf ${c.pid}"\n  Outgoing update filter list for all interfaces is not set\n  Incoming update filter list for all interfaces is not set\n  Router ID ${d.ospf ? d.ospf.rid : ospfRid(d)}\n  Number of areas in this router is 1. 1 normal 0 stub 0 nssa\n  Maximum path: 4\n  Routing for Networks:\n${c.nets.map(x => `    ${x.ip} ${x.wc} area ${x.area}`).join('\n')}${c.passive.length ? `\n  Passive Interface(s):\n${c.passive.map(n => '    ' + n).join('\n')}` : ''}\n  Routing Information Sources:\n    Gateway         Distance      Last Update\n${d.ospf ? d.ospf.nbrs.filter(z => z.state === 'FULL').map(z => `    ${z.rid.padEnd(16)}110           00:00:${String(10 + (z.rid.length * 7) % 50)}`).join('\n') : ''}\n  Distance: (default is 110)`;
  }, 'routing');

  /* ---------- ACL commands ---------- */
  const aceShow = (e, ext) => ext ? e.text : (() => { const s = e.src; const what = s.wc === '255.255.255.255' ? 'any' : s.wc === '0.0.0.0' ? s.ip : `${s.ip}, wildcard bits ${s.wc}`; return `${e.permit ? 'permit' : 'deny'} ${what}`; })();
  const showAcls = d => Object.entries(d.acls || {}).map(([name, a]) => `${a.ext ? 'Extended' : 'Standard'} IP access list ${name}\n` + a.entries.map(e => `    ${e.seq} ${aceShow(e, a.ext)}${e.hits ? ` (${e.hits} match${e.hits > 1 ? 'es' : ''})` : ''}`).join('\n')).join('\n');
  cmd('conf', 'access-list <num> <rest>', (d, s, a) => {
    const k = aclKind(a[0]); if (!k) return err("% Invalid input detected at '^' marker.");
    const w = a[1].trim().split(/\s+/); if (w[0].toLowerCase() === 'remark') return;
    return addAce(d, a[0], k === 'ext', w);
  });
  cmd('conf', 'no access-list <num>', (d, s, a) => { if (d.acls) delete d.acls[a[0]]; });
  cmd('conf', 'ip access-list standard <word>', (d, s, a) => { d.acls = d.acls || {}; if (d.acls[a[0]] && d.acls[a[0]].ext) return err(`% A named extended IP access list ${a[0]} exists`); d.acls[a[0]] = d.acls[a[0]] || { ext: false, entries: [] }; s.mode = 'acl'; s.acl = a[0]; s.aclExt = false; });
  cmd('conf', 'ip access-list extended <word>', (d, s, a) => { d.acls = d.acls || {}; if (d.acls[a[0]] && !d.acls[a[0]].ext) return err(`% A named standard IP access list ${a[0]} exists`); d.acls[a[0]] = d.acls[a[0]] || { ext: true, entries: [] }; s.mode = 'acl'; s.acl = a[0]; s.aclExt = true; });
  cmd('conf', 'no ip access-list standard <word>', (d, s, a) => { if (d.acls) delete d.acls[a[0]]; });
  cmd('conf', 'no ip access-list extended <word>', (d, s, a) => { if (d.acls) delete d.acls[a[0]]; });
  cmd('acl', 'permit <rest>', (d, s, a) => addAce(d, s.acl, s.aclExt, ['permit', ...a[0].trim().split(/\s+/)]));
  cmd('acl', 'deny <rest>', (d, s, a) => addAce(d, s.acl, s.aclExt, ['deny', ...a[0].trim().split(/\s+/)]));
  cmd('acl', 'remark <rest>', () => {});
  cmd('acl', 'no <num>', (d, s, a) => { const l = d.acls[s.acl]; l.entries = l.entries.filter(e => e.seq !== +a[0]); });
  cmd('if', 'ip access-group <word> <word>', (d, s, a) => { const dir = a[1].toLowerCase(); if (dir !== 'in' && dir !== 'out') return err("% Invalid input detected at '^' marker."); ifc(d, s)[dir === 'in' ? 'aclIn' : 'aclOut'] = a[0]; }, 'routing');
  cmd('if', 'no ip access-group <word> <word>', (d, s, a) => { const dir = a[1].toLowerCase(); ifc(d, s)[dir === 'in' ? 'aclIn' : 'aclOut'] = ''; }, 'routing');
  cmd('line', 'access-class <word> <word>', () => {});
  cmd(EXEC, 'show access-lists', showAcls);
  cmd(EXEC, 'show ip access-lists', showAcls);
  cmd(EXEC, 'show ip interface <if>', (d, s, a) => { const f = d.ifs[a[0]], [st, pr] = ifStatus(d, a[0]); return `${a[0]} is ${st}, line protocol is ${pr}\n  Internet address is ${f.ip ? f.ip + '/' + maskLen(f.mask) : 'not set'}\n  Broadcast address is 255.255.255.255\n${f.helper ? `  Helper address is ${f.helper}\n` : '  Helper address is not set\n'}  Outgoing Common access list is not set\n  Outgoing access list is ${f.aclOut || 'not set'}\n  Inbound Common access list is not set\n  Inbound  access list is ${f.aclIn || 'not set'}${f.nat ? `\n  IP NAT is enabled, ${f.nat}` : ''}`; });

  /* ---------- NAT commands ---------- */
  cmd('if', 'ip nat inside', (d, s) => { ifc(d, s).nat = 'inside'; natOf(d); }, 'routing');
  cmd('if', 'ip nat outside', (d, s) => { ifc(d, s).nat = 'outside'; natOf(d); }, 'routing');
  cmd('if', 'no ip nat inside', (d, s) => { ifc(d, s).nat = ''; }, 'routing');
  cmd('if', 'no ip nat outside', (d, s) => { ifc(d, s).nat = ''; }, 'routing');
  cmd('conf', 'ip nat inside source static <ip> <ip>', (d, s, a) => { const n = natOf(d); if (n.statics.some(x => x.local === a[0] || x.global === a[1])) return err('% similar static entry already exists'); n.statics.push({ local: a[0], global: a[1] }); }, 'routing');
  cmd('conf', 'no ip nat inside source static <ip> <ip>', (d, s, a) => { const n = natOf(d); n.statics = n.statics.filter(x => !(x.local === a[0] && x.global === a[1])); n.table = n.table.filter(x => !(x.kind === 'static' && x.local === a[0])); }, 'routing');
  cmd('conf', 'ip nat pool <word> <ip> <ip> netmask <mask>', (d, s, a) => { natOf(d).pools[a[0]] = { start: a[1], end: a[2], mask: a[3] }; }, 'routing');
  cmd('conf', 'ip nat pool <word> <ip> <ip> prefix-length <num>', (d, s, a) => { natOf(d).pools[a[0]] = { start: a[1], end: a[2], mask: ntoa2(maskN32(+a[3])) }; }, 'routing');
  cmd('conf', 'no ip nat pool <word>', (d, s, a) => { delete natOf(d).pools[a[0]]; }, 'routing');
  const natRule = (d, r) => { const n = natOf(d); n.rules = n.rules.filter(x => x.acl !== r.acl); n.rules.push(r); };
  cmd('conf', 'ip nat inside source list <word> pool <word>', (d, s, a) => natRule(d, { acl: a[0], pool: a[1], overload: false }), 'routing');
  cmd('conf', 'ip nat inside source list <word> pool <word> overload', (d, s, a) => natRule(d, { acl: a[0], pool: a[1], overload: true }), 'routing');
  cmd('conf', 'ip nat inside source list <word> interface <if> overload', (d, s, a) => natRule(d, { acl: a[0], iface: a[1], overload: true }), 'routing');
  cmd('conf', 'no ip nat inside source list <rest>', (d, s, a) => { const n = natOf(d), acl = a[0].trim().split(/\s+/)[0]; n.rules = n.rules.filter(x => x.acl !== acl); }, 'routing');
  cmd('priv', 'clear ip nat translation *', d => { if (d.nat) d.nat.table = d.nat.table.filter(x => x.kind === 'static'); }, 'routing');
  cmd(EXEC, 'show ip nat translations', d => {
    const t = (d.nat || { table: [] }).table, st = (d.nat || { statics: [] }).statics;
    const rows = t.filter(x => x.kind !== 'static').map(x => x.kind === 'pat' ? `icmp ${(x.global + ':' + x.id).padEnd(22)}${(x.local + ':' + x.id).padEnd(22)}${(x.outside + ':' + x.id).padEnd(22)}${x.outside}:${x.id}` : `icmp ${x.global.padEnd(22)}${x.local.padEnd(22)}${(x.outside || '---').padEnd(22)}${x.outside || '---'}`);
    for (const x of st) rows.push(`---  ${x.global.padEnd(22)}${x.local.padEnd(22)}${'---'.padEnd(22)}---`);
    return 'Pro  Inside global         Inside local          Outside local         Outside global\n' + rows.join('\n');
  }, 'routing');
  cmd(EXEC, 'show ip nat statistics', d => { const n = d.nat || { table: [], statics: [], pools: {}, rules: [], hits: 0, misses: 0 }; const ins = Object.entries(d.ifs).filter(([, f]) => f.nat === 'inside').map(([k]) => k), out = Object.entries(d.ifs).filter(([, f]) => f.nat === 'outside').map(([k]) => k); return `Total active translations: ${n.table.length + n.statics.filter(x => !n.table.some(t => t.kind === 'static' && t.local === x.local)).length} (${n.statics.length} static, ${n.table.filter(x => x.kind !== 'static').length} dynamic; ${n.table.filter(x => x.kind === 'pat').length} extended)\nOutside interfaces:\n  ${out.join(', ') || 'none'}\nInside interfaces:\n  ${ins.join(', ') || 'none'}\nHits: ${n.hits}  Misses: ${n.misses}\nDynamic mappings:\n${n.rules.map(r => `-- Inside Source\n[Id: 1] access-list ${r.acl} ${r.iface ? `interface ${r.iface}` : `pool ${r.pool}`}${r.overload ? ' overload' : ''} refcount ${n.table.filter(x => x.kind !== 'static').length}${r.pool && n.pools[r.pool] ? `\n pool ${r.pool}: netmask ${n.pools[r.pool].mask}\n\tstart ${n.pools[r.pool].start} end ${n.pools[r.pool].end}` : ''}`).join('\n')}`; }, 'routing');

  /* ---------- DHCP commands ---------- */
  cmd('conf', 'ip dhcp excluded-address <ip>', (d, s, a) => { (d.dhcpExcl = d.dhcpExcl || []).push([a[0], a[0]]); }, 'routing');
  cmd('conf', 'ip dhcp excluded-address <ip> <ip>', (d, s, a) => { (d.dhcpExcl = d.dhcpExcl || []).push([a[0], a[1]]); }, 'routing');
  cmd('conf', 'no ip dhcp excluded-address <rest>', (d, s, a) => { const w = a[0].trim().split(/\s+/); d.dhcpExcl = (d.dhcpExcl || []).filter(x => x[0] !== w[0]); }, 'routing');
  cmd('conf', 'ip dhcp pool <word>', (d, s, a) => { d.dhcpPools = d.dhcpPools || {}; d.dhcpPools[a[0]] = d.dhcpPools[a[0]] || { net: '', mask: '', gw: '', dns: '', domain: '' }; s.mode = 'dhcp'; s.pool = a[0]; }, 'routing');
  cmd('conf', 'no ip dhcp pool <word>', (d, s, a) => { if (d.dhcpPools) delete d.dhcpPools[a[0]]; }, 'routing');
  cmd('dhcp', 'network <ip> <mask>', (d, s, a) => { if (!validMask(a[1])) return err('% Invalid input detected at \'^\' marker.'); Object.assign(d.dhcpPools[s.pool], { net: netOf(a[0], a[1]), mask: a[1] }); });
  cmd('dhcp', 'default-router <ip>', (d, s, a) => { d.dhcpPools[s.pool].gw = a[0]; });
  cmd('dhcp', 'dns-server <ip>', (d, s, a) => { d.dhcpPools[s.pool].dns = a[0]; });
  cmd('dhcp', 'domain-name <word>', (d, s, a) => { d.dhcpPools[s.pool].domain = a[0]; });
  cmd('dhcp', 'lease <rest>', () => {});
  cmd('if', 'ip helper-address <ip>', (d, s, a) => { ifc(d, s).helper = a[0]; }, 'routing');
  cmd('if', 'no ip helper-address', (d, s) => { ifc(d, s).helper = ''; }, 'routing');
  cmd('priv', 'clear ip dhcp binding *', d => { d.dhcpBind = {}; }, 'routing');
  cmd(EXEC, 'show ip dhcp binding', d => 'Bindings from all pools not associated with VRF:\nIP address      Client-ID/              Lease expiration        Type       State      Interface\n                Hardware address/\n                User name\n' + Object.entries(d.dhcpBind || {}).map(([ip, b]) => `${ip.padEnd(16)}01${b.mac.replace(/\./g, '').replace(/(..)(?=.)/g, '$1.')}  Mar 02 2026 12:00 AM    Automatic  Active     ${(Object.entries(d.ifs).find(([, f]) => f.ip && sameNet(f.ip, ip, (d.dhcpPools[b.pool] || {}).mask || f.mask)) || ['Unknown'])[0]}`).join('\n'), 'routing');
  cmd(EXEC, 'show ip dhcp pool', d => Object.entries(d.dhcpPools || {}).map(([name, p]) => { const size = p.mask ? Math.max(0, 2 ** (32 - maskLen(p.mask)) - 2) : 0, leased = Object.values(d.dhcpBind || {}).filter(b => b.pool === name).length; return `\nPool ${name} :\n Utilization mark (high/low)    : 100 / 0\n Subnet size (first/next)       : 0 / 0\n Total addresses                : ${size}\n Leased addresses               : ${leased}\n Excluded addresses             : ${(d.dhcpExcl || []).reduce((t, [a, b]) => t + ipn(b) - ipn(a) + 1, 0)}\n Pending event                  : none\n 1 subnet is currently in the pool :\n Current index        IP address range                    Leased/Excluded/Total\n ${p.net ? ntoa2(ipn(p.net) + 1) : ''}         ${p.net ? `${ntoa2(ipn(p.net) + 1)}     - ${ntoa2(((ipn(p.net) | (~ipn(p.mask) >>> 0)) >>> 0) - 1)}` : ''}    ${leased} / 0 / ${size}`; }).join('\n'), 'routing');
  for (const m of ['conf', 'if', 'vlan', 'line', 'ospf', 'acl', 'dhcp']) {
    cmd(m, 'exit', (d, s) => { s.mode = s.mode === 'conf' ? 'priv' : 'conf'; if (s.mode === 'priv') cfgDone(d); });
    cmd(m, 'end', (d, s) => { s.mode = 'priv'; cfgDone(d); });
  }
  for (const m of ['if', 'vlan', 'line', 'ospf', 'acl', 'dhcp']) cmd(m, 'interface <if>', (d, s, a) => C.find(c => c.modes.includes('conf') && c.w.join(' ') === 'interface <if>').fn(d, s, a));

  const HELP = { routing: 'Enable IP routing', show: 'Show running system information', configure: 'Enter configuration mode', terminal: 'Configure from the terminal', enable: 'Turn on privileged commands', disable: 'Turn off privileged commands', ping: 'Send echo messages', interface: 'Select an interface to configure', ip: 'IP configuration', address: 'Set the IP address of an interface', shutdown: 'Shutdown the selected interface', no: 'Negate a command or set its defaults', hostname: "Set system's network name", exit: 'Exit from the current mode', end: 'Exit to privileged mode', brief: 'Brief summary of IP status and configuration', 'running-config': 'Current operating configuration', vlan: 'VLAN commands', switchport: 'Set switching mode characteristics', mode: 'Set trunking mode of the interface', access: 'Set access mode characteristics of the interface', trunk: 'Set trunking characteristics of the interface', route: 'Establish static routes', cdp: 'CDP information', neighbors: 'CDP neighbor entries', 'spanning-tree': 'Spanning Tree Subsystem', portfast: 'Enable an interface to move directly to forwarding on link up', clock: 'Configure serial interface clock', rate: 'Configure serial interface clock speed', copy: 'Copy from one file to another', description: 'Interface specific description', name: 'Ascii name of the VLAN', interfaces: 'Interface status and configuration', status: 'Show interface line status', controllers: 'Interface controller status', 'mac': 'MAC configuration', 'address-table': 'MAC forwarding table', arp: 'ARP table', version: 'System hardware and software status', line: 'Configure a terminal line', secret: 'Assign the privileged level secret', 'default-gateway': 'Specify default gateway (if not routing IP)', write: 'Write running configuration to memory', encapsulation: 'Set encapsulation type for an interface', dot1q: 'IEEE 802.1Q Virtual LAN', reload: 'Halt and perform a cold restart' };
  const tokOk = (t, w, d) => t === '<ip>' || t === '<mask>' ? isIp(w) : t === '<num>' ? /^\d+$/.test(w) : t === '<word>' || t === '<rest>' ? w.length > 0 : t === '<if>' ? !!parseIf(d, w) : t === '<hop>' ? isIp(w) || !!parseIf(d, w) : null;
  const IFWORDS = ['interface', 'interfaces', 'controllers'];
  function words(line, d) {
    const w = line.trim().split(/\s+/).filter(Boolean), out = [];
    for (let i = 0; i < w.length; i++) {
      const prev = (out[out.length - 1] || '').toLowerCase();
      if (/^[a-z]+$/i.test(w[i]) && w[i + 1] && /^\d/.test(w[i + 1]) && prev.length >= 3 && IFWORDS.some(k => k.startsWith(prev)) && parseIf(d, w[i] + w[i + 1])) { out.push(w[i] + w[i + 1]); i++; }
      else out.push(w[i]);
    }
    return out;
  }
  const argsOf = (c, ws, d) => c.w.map((t, i) => !t.startsWith('<') ? undefined : t === '<if>' ? parseIf(d, ws[i]) : t === '<hop>' ? (isIp(ws[i]) ? ws[i] : parseIf(d, ws[i])) : ws[i]).filter((x, i) => c.w[i].startsWith('<'));
  function match(d, mode, ws) {
    let cands = C.filter(c => c.modes.includes(mode) && kindOk(c, d));
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i], lw = w.toLowerCase();
      const rest = cands.find(c => c.w[i] === '<rest>');
      const next = cands.filter(c => c.w[i] !== undefined && c.w[i] !== '<rest>' && (c.w[i].startsWith('<') ? tokOk(c.w[i], w, d) : c.w[i].startsWith(lw)));
      if (rest && !next.length) return { c: rest, args: [...argsOf(rest, ws.slice(0, i), d).slice(0, -1), ws.slice(i).join(' ')] };
      if (!next.length) return { bad: i };
      const kws = [...new Set(next.filter(c => !c.w[i].startsWith('<')).map(c => c.w[i]))];
      if (kws.length > 1 && !kws.includes(lw) && !next.some(c => c.w[i].startsWith('<'))) return { amb: true };
      cands = kws.includes(lw) ? next.filter(c => c.w[i] === lw || c.w[i].startsWith('<')) : next;
    }
    const full = cands.filter(c => c.w.length === ws.length);
    if (!full.length) return { inc: true };
    return { c: full[0], args: argsOf(full[0], ws, d) };
  }
  function help(devId, line) {
    const d = D(devId), mode = sess(d).mode;
    const partial = !/\s$/.test(line) && line.trim().length > 0;
    const ws = words(line, d), idx = partial ? ws.length - 1 : ws.length, pre = partial ? ws.slice(0, -1) : ws;
    let cands = C.filter(c => c.modes.includes(mode) && kindOk(c, d));
    for (let i = 0; i < pre.length; i++) cands = cands.filter(c => c.w[i] && (c.w[i].startsWith('<') ? tokOk(c.w[i], pre[i], d) : c.w[i].startsWith(pre[i].toLowerCase())));
    const last = partial ? ws[ws.length - 1].toLowerCase() : '';
    const opts = [...new Set(cands.map(c => c.w[idx]).filter(Boolean).filter(t => t.startsWith('<') || t.startsWith(last)))];
    if (partial) return { list: opts.filter(t => !t.startsWith('<')), text: opts.filter(t => !t.startsWith('<')).join('  ') || '% Unrecognized command' };
    if (cands.some(c => c.w.length === idx)) opts.push('<cr>');
    const desc = { '<ip>': 'A.B.C.D', '<mask>': 'A.B.C.D', '<num>': '<1-4094>', '<word>': 'WORD', '<rest>': 'LINE', '<if>': 'Interface, like g0/0/0', '<hop>': "Forwarding router's address, or an exit interface", '<cr>': '<cr>' };
    return { list: [], text: opts.map(t => '  ' + (t.startsWith('<') ? desc[t] : t.padEnd(20) + (HELP[t] || ''))).join('\n') || '% Unrecognized command' };
  }
  function prompt(devId) {
    const d = D(devId), s = sess(d), h = d.hostname;
    if (d.kind === 'pc') return 'C:\\>';
    return { user: h + '>', priv: h + '#', conf: h + '(config)#', if: h + (s.ifc && s.ifc.includes('.') ? '(config-subif)#' : '(config-if)#'), vlan: h + '(config-vlan)#', line: h + '(config-line)#', ospf: h + '(config-router)#', dhcp: h + '(dhcp-config)#', acl: h + (s.aclExt ? '(config-ext-nacl)#' : '(config-std-nacl)#') }[s.mode];
  }
  // When a command is real but typed in the wrong mode, IOS only says
  // "Invalid input". A learner also gets a tip saying which mode it needs.
  // Turn tips off with `tips = false` in the lab, or { tips: false }.
  const tips = opts.tips ?? lab.tips ?? true;
  function modeTip(d, mode, ws, line) {
    const fits = to => { const m = match(d, to, ws); return !!(m.c || m.inc); };
    const h = d.hostname, ex = d.kind === 'switch' ? 'interface f0/1' : 'interface g0/0/0';
    if (mode === 'user' && fits('priv')) return `\`${ws[0]}\` works in privileged EXEC mode. Type \`enable\` first: the prompt changes from \`${h}>\` to \`${h}#\`.`;
    if (mode === 'user' && fits('conf')) return `That's a configuration command. Type \`enable\`, then \`configure terminal\`, then try it again.`;
    if (mode === 'priv' && fits('conf')) return `That's a configuration command. Type \`configure terminal\` first.`;
    if ((mode === 'user' || mode === 'priv') && fits('if')) return `That command goes on an interface. Type \`configure terminal\`, then \`${ex}\`.`;
    if (mode !== 'user' && mode !== 'priv' && fits('priv')) return `That runs in privileged EXEC mode. Put \`do\` in front to run it from here: \`do ${line.trim()}\`.`;
    if (mode === 'conf' && fits('if')) return `That command goes on an interface. Choose one first, like \`${ex}\`.`;
    return null;
  }
  function exec(devId, line) {
    const d = D(devId); if (!d) throw new Error(`no device ${devId}`);
    const s = sess(d), pr = prompt(devId);
    if (!quiet) say(d, pr + line, 'cmd');
    if (!line.trim()) return;
    s.hist.push(line);
    if (d.kind === 'pc') { runPC(d, line); emit('change'); return; }
    if (d.kind === 'ap') { say(d, 'This access point is set up with the settings above: the SSID it broadcasts, its key, and an address to manage it by.'); return; }
    if (d.kind === 'hub') return;
    if (!isOn(d) && !quiet) return;
    let ws = words(line, d), mode = s.mode, isDo = false;
    if (/^do$/i.test(ws[0]) && !['user', 'priv'].includes(mode)) { ws = ws.slice(1); mode = 'priv'; isDo = true; }
    const m = match(d, mode, ws);
    if (m.bad !== undefined) { let col = pr.length, idx = 0; const raw = line.split(/(\s+)/); let wi = 0; for (const part of raw) { if (!part.trim()) { idx += part.length; continue; } if (wi === m.bad) break; idx += part.length; wi++; } col += idx; say(d, ' '.repeat(col) + '^\n% Invalid input detected at \'^\' marker.', 'err'); const t = tips && modeTip(d, mode, ws, line); if (t) say(d, t, 'tip'); return; }
    if (m.amb) { say(d, `% Ambiguous command:  "${line.trim()}"`, 'err'); return; }
    if (m.inc) { say(d, '% Incomplete command.', 'err'); return; }
    const r = m.c.fn(d, isDo ? Object.assign({}, s, { mode: 'priv' }) : s, m.args);
    if (r && r.err) say(d, r.err, 'err'); else if (r && !quiet) say(d, r);
    evalLinks(); emit('change');
  }
  function configure(devId, text) { // apply a starting config without noise
    const d = D(devId); if (d.kind === 'pc') return;
    const s = sess(d), was = s.mode; quiet = true;
    s.mode = 'conf';
    for (const line of text.split('\n')) {
      const t = line.replace(/!.*$/, '');
      if (!t.trim()) continue;
      if (/^\S/.test(t)) s.mode = 'conf'; // an unindented line is a top-level command
      exec(devId, t.trim());
    }
    s.mode = was; s.lines = []; quiet = false;
  }

  /* ---------- show commands ---------- */
  function ifStatus(d, n) { const f = d.ifs[n]; return f.shutdown ? ['administratively down', 'down'] : [f.phys || ((f.svi || f.sub) && f.proto) ? 'up' : 'down', f.proto ? 'up' : 'down']; }
  function showIpBrief(d) {
    return 'Interface              IP-Address      OK? Method Status                Protocol\n' + Object.keys(d.ifs).sort(natural).map(n => { const f = d.ifs[n], [st, pr] = ifStatus(d, n); return `${(n + ' ').padEnd(23)}${(f.ip || 'unassigned').padEnd(16)}YES ${(f.ip ? 'manual' : 'unset').padEnd(7)}${st.padEnd(22)}${pr}`; }).join('\n');
  }
  function natural(a, b) { return a.localeCompare(b, undefined, { numeric: true }); }
  function showIntStatus(d) {
    return 'Port      Name               Status       Vlan       Duplex  Speed Type\n' + Object.entries(d.ifs).filter(([, f]) => !f.svi).map(([n, f]) => {
      const st = f.shutdown ? 'disabled' : f.phys ? 'connected' : 'notconnect', gi = n.startsWith('Gig');
      return `${short(n).padEnd(10)}${(f.desc || '').slice(0, 18).padEnd(19)}${st.padEnd(13)}${(f.routed ? 'routed' : f.mode === 'trunk' ? 'trunk' : String(f.vlan)).padEnd(11)}${(f.phys ? 'a-full' : 'auto').padStart(6)}${(f.phys ? (gi ? 'a-1000' : 'a-100') : 'auto').padStart(7)} ${portType(d, n, f)}`;
    }).join('\n');
  }
  function portType(d, n, f) {
    const cage = d.m.ports.find(p => p.iface === n && p.type === 'sfp'), t = cage && d.sfp[cage.key];
    if (cage && (f.medium === 'sfp' || !d.m.ports.some(p => p.iface === n && p.type === 'eth'))) return t ? SFPS[t].type : 'Not Present';
    return n.startsWith('Gig') ? '10/100/1000BaseTX' : '10/100BaseTX';
  }
  function showTrunk(d) {
    const t = Object.entries(d.ifs).filter(([, f]) => !f.svi && f.mode === 'trunk');
    if (!t.length) return '';
    const vl = Object.keys(d.vlans).map(Number).sort((a, b) => a - b);
    return 'Port        Mode             Encapsulation  Status        Native vlan\n' + t.map(([n, f]) => `${short(n).padEnd(12)}${'on'.padEnd(17)}${'802.1q'.padEnd(15)}${(f.proto ? 'trunking' : 'not-trunking').padEnd(14)}${f.native}`).join('\n') +
      '\n\nPort        Vlans allowed on trunk\n' + t.map(([n, f]) => `${short(n).padEnd(12)}${vlanText(f.allowed)}`).join('\n') +
      '\n\nPort        Vlans allowed and active in management domain\n' + t.map(([n, f]) => `${short(n).padEnd(12)}${vlanText(vl.filter(v => allows(f, v)))}`).join('\n') +
      '\n\nPort        Vlans in spanning tree forwarding state and not pruned\n' + t.map(([n, f]) => `${short(n).padEnd(12)}${forwarding(d, n) ? vlanText(vl.filter(v => allows(f, v))) : 'none'}`).join('\n');
  }
  function showInt(d, s, a) {
    const n = a[0], f = d.ifs[n]; if (!f) return err('% Invalid input detected at \'^\' marker.');
    const [st, pr] = ifStatus(d, n), hwmac = f.sub ? d.ifs[f.parent].mac : f.mac;
    const hw = n.startsWith('Serial') ? cardOf(d, n) : n.startsWith('Vlan') ? 'Ethernet SVI' : d.kind === 'router' ? d.m.hw : n.startsWith('Gig') ? 'Gigabit Ethernet' : 'Fast Ethernet';
    return `${n} is ${st}, line protocol is ${pr}\n  Hardware is ${hw}, address is ${hwmac} (bia ${hwmac})${f.desc ? `\n  Description: ${f.desc}` : ''}${f.ip ? `\n  Internet address is ${f.ip}/${maskLen(f.mask)}` : ''}${f.sub ? `\n  Encapsulation 802.1Q Virtual LAN, Vlan ID  ${f.encap || 'not set'}.` : ''}\n  MTU 1500 bytes, BW ${n.startsWith('Serial') ? '1544' : n.startsWith('Gig') ? '1000000' : '100000'} Kbit/sec, DLY 10 usec,\n  ${f.phys ? 'Full-duplex' : 'Auto-duplex'}, ${f.phys ? (n.startsWith('Gig') ? '1000Mb/s' : '100Mb/s') : 'Auto-speed'}\n  ...`;
  }
  function cardOf(d, n) { const s = (d.m.slots || []).find(s => d.modules[s.id] && MODULES[d.modules[s.id]].ports(s).some(p => p.iface === n)); return s ? MODULES[d.modules[s.id]].hw : 'Serial'; }
  function showVlan(d) {
    const ports = v => Object.entries(d.ifs).filter(([, f]) => !f.svi && !f.routed && f.mode === 'access' && f.vlan === +v).map(([n]) => short(n));
    const wrap = arr => { const lines = []; for (let i = 0; i < arr.length; i += 4) lines.push(arr.slice(i, i + 4).join(', ')); return lines.length ? lines : ['']; };
    let out = 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n';
    for (const v of Object.keys(d.vlans).map(Number).sort((a, b) => a - b)) { const w = wrap(ports(v)); out += `${String(v).padEnd(5)}${d.vlans[v].padEnd(33)}active    ${w[0]}\n` + w.slice(1).map(l => ' '.repeat(48) + l + '\n').join(''); }
    return out + '1002 fddi-default                     act/unsup \n1003 token-ring-default               act/unsup \n1004 fddinet-default                  act/unsup \n1005 trnet-default                    act/unsup ';
  }
  function runIf(d, n, f) {
    let o = `interface ${n}\n`;
    if (f.desc) o += ` description ${f.desc}\n`;
    if (f.sub && f.encap) o += ` encapsulation dot1Q ${f.encap}${f.nativeTag ? ' native' : ''}\n`;
    if (f.routed) o += ' no switchport\n';
    else if (d.kind === 'switch' && !f.svi) { if (f.mode === 'trunk') { if (f.native !== 1) o += ` switchport trunk native vlan ${f.native}\n`; if (f.allowed) o += ` switchport trunk allowed vlan ${vlanText(f.allowed)}\n`; o += ' switchport mode trunk\n'; } else { if (f.vlan !== 1) o += ` switchport access vlan ${f.vlan}\n`; if (f.vlan !== 1 || f.portfast) o += ' switchport mode access\n'; } if (f.portfast) o += ' spanning-tree portfast\n'; }
    o += f.ip ? ` ip address ${f.ip} ${f.mask}\n` : (d.kind === 'router' || f.svi || f.routed ? ' no ip address\n' : '');
    if (f.helper) o += ` ip helper-address ${f.helper}\n`;
    if (f.aclIn) o += ` ip access-group ${f.aclIn} in\n`;
    if (f.aclOut) o += ` ip access-group ${f.aclOut} out\n`;
    if (f.nat) o += ` ip nat ${f.nat}\n`;
    if (f.ospfArea != null && d.ospfCfg) o += ` ip ospf ${d.ospfCfg.pid} area ${f.ospfArea}\n`;
    if (f.ospfCost) o += ` ip ospf cost ${f.ospfCost}\n`;
    if (f.ospfPri != null) o += ` ip ospf priority ${f.ospfPri}\n`;
    if (f.bw) o += ` bandwidth ${f.bw}\n`;
    if (f.clock) o += ` clock rate ${f.clock}\n`;
    if (f.shutdown) o += ' shutdown\n';
    return o;
  }
  function showRun(d, only) {
    if (only) { const f = d.ifs[only]; if (!f) return err('% Invalid input detected at \'^\' marker.'); return `Building configuration...\n\nCurrent configuration : ${120 + runIf(d, only, f).length} bytes\n!\n${runIf(d, only, f)}end`; }
    let o = `Building configuration...\n\nCurrent configuration : ${1200 + Object.keys(d.ifs).length * 40} bytes\n!\nversion ${d.kind === 'router' ? '17.9' : '15.2'}\n!\nhostname ${d.hostname}\n!\n${d.secret ? 'enable secret 9 $9$' + 'nhEmQVczB7dqsO$X.HsgL6x1il0RxkOSSvyQYwucySCt7qFm4v7pqCxkKM\n!\n' : ''}`;
    if (d.routing) o += 'ip routing\n!\n';
    for (const [a, b] of d.dhcpExcl || []) o += `ip dhcp excluded-address ${a}${b && b !== a ? ' ' + b : ''}\n`;
    for (const [name, p] of Object.entries(d.dhcpPools || {})) o += `!\nip dhcp pool ${name}\n${p.net ? ` network ${p.net} ${p.mask}\n` : ''}${p.gw ? ` default-router ${p.gw}\n` : ''}${p.dns ? ` dns-server ${p.dns}\n` : ''}${p.domain ? ` domain-name ${p.domain}\n` : ''}`;
    if (d.dhcpPools || d.dhcpExcl) o += '!\n';
    if (d.kind === 'switch') for (const v of Object.keys(d.vlans).filter(v => v !== '1')) o += `vlan ${v}\n name ${d.vlans[v]}\n!\n`;
    for (const n of Object.keys(d.ifs).sort(natural)) o += runIf(d, n, d.ifs[n]) + '!\n';
    if (d.ospfCfg) { const c = d.ospfCfg; o += `router ospf ${c.pid}\n${c.rid ? ` router-id ${c.rid}\n` : ''}${c.ref && c.ref !== 100 ? ` auto-cost reference-bandwidth ${c.ref}\n` : ''}${c.passive.map(n => ` passive-interface ${n}\n`).join('')}${c.nets.map(x => ` network ${x.ip} ${x.wc} area ${x.area}\n`).join('')}${c.defOrig ? ` default-information originate${c.defOrig === 'always' ? ' always' : ''}\n` : ''}!\n`; }
    if (d.nat) { for (const [n, p] of Object.entries(d.nat.pools)) o += `ip nat pool ${n} ${p.start} ${p.end} netmask ${p.mask}\n`; for (const r of d.nat.rules) o += `ip nat inside source list ${r.acl} ${r.iface ? `interface ${r.iface}` : `pool ${r.pool}`}${r.overload ? ' overload' : ''}\n`; for (const x of d.nat.statics) o += `ip nat inside source static ${x.local} ${x.global}\n`; }
    for (const r of d.routes) o += `ip route ${r.net} ${r.mask} ${r.via}\n`;
    for (const [name, a] of Object.entries(d.acls || {})) {
      if (/^\d+$/.test(name)) o += a.entries.map(e => `access-list ${name} ${a.ext ? e.text : aceShow(e, false).replace(/, wildcard bits /, ' ')}\n`).join('');
      else o += `ip access-list ${a.ext ? 'extended' : 'standard'} ${name}\n` + a.entries.map(e => ` ${a.ext ? e.text : aceShow(e, false).replace(/, wildcard bits /, ' ')}\n`).join('');
    }
    if (d.gw) o += `ip default-gateway ${d.gw}\n`;
    return o + '!\nline con 0\nline vty 0 4\n login\n!\nend';
  }
  function showCdp(d) {
    const rows = [];
    const sh = x => x.replace('GigabitEthernet', 'Gig ').replace('FastEthernet', 'Fas ').replace('Serial', 'Ser ');
    for (const n of Object.keys(d.ifs).sort(natural)) {
      const f = d.ifs[n]; if (!f.proto || f.svi || f.sub) continue;
      const pe = peerOf(d.id, n); if (!pe) continue;
      const pd = D(pe.dev); if (pd.kind === 'pc' || pd.kind === 'hub' || !isOn(pd)) continue;
      rows.push(`${pd.hostname.padEnd(17)}${sh(n).padEnd(18)}${'163'.padStart(7)}${(pd.kind === 'router' ? 'R B S I' : pd.m.l3 ? 'R S I' : 'S I').padStart(13)}  ${pd.m.platform.slice(0, 9).padEnd(10)}${sh(pe.port.iface)}`);
    }
    return 'Capability Codes: R - Router, T - Trans Bridge, B - Source Route Bridge\n                  S - Switch, H - Host, I - IGMP, r - Repeater, P - Phone,\n                  D - Remote, C - CVTA, M - Two-port Mac Relay\n\nDevice ID        Local Intrfce     Holdtme    Capability  Platform  Port ID\n' + rows.join('\n') + `\n\nTotal cdp entries displayed : ${rows.length}`;
  }
  function showMac(d) {
    const rows = Object.entries(d.macs).map(([m, e]) => `${String(e.vlan).padStart(4)}    ${m}    DYNAMIC     ${short(e.port)}`);
    return `          Mac Address Table\n-------------------------------------------\n\nVlan    Mac Address       Type        Ports\n----    -----------       --------    -----\n${rows.join('\n')}\nTotal Mac Addresses for this criterion: ${rows.length}`;
  }
  function showStp(d) {
    const vl = Object.keys(d.vlans).map(Number).sort((a, b) => a - b);
    return vl.map(v => {
      const ports = Object.entries(d.ifs).filter(([, f]) => !f.svi && f.proto && (f.mode === 'trunk' || f.vlan === v));
      if (!ports.length) return '';
      const id = d.ifs.Vlan1.mac;
      return `VLAN${String(v).padStart(4, '0')}\n  Spanning tree enabled protocol ieee\n  Root ID    Priority    ${32768 + v}\n             Address     ${id}\n             This bridge is the root\n             Hello Time   2 sec  Max Age 20 sec  Forward Delay 15 sec\n\nInterface           Role Sts Cost      Prio.Nbr Type\n------------------- ---- --- --------- -------- --------------------------------\n` +
        ports.map(([n, f]) => { const st = stpState(d, n); return `${short(n).padEnd(20)}Desg ${({ forwarding: 'FWD', listening: 'LIS', learning: 'LRN' })[st]} ${(n.startsWith('Gig') ? '4' : '19').padEnd(10)}128.${String(d.m.ports.findIndex(p => p.iface === n) + 1).padEnd(4)}${f.portfast ? 'P2p Edge' : 'P2p'}`; }).join('\n');
    }).filter(Boolean).join('\n\n');
  }
  function showRoute(d) {
    let o = 'Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP\n       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area\n       * - candidate default\n\n';
    const def = d.routes.find(r => r.net === '0.0.0.0') || (d.ospf && d.ospf.routes.find(r => r.net === '0.0.0.0'));
    o += def ? `Gateway of last resort is ${isIp(def.via) ? def.via : '0.0.0.0'} to network 0.0.0.0\n\n` : 'Gateway of last resort is not set\n\n';
    const lines = [];
    for (const [n, f] of Object.entries(d.ifs)) if (f.ip && f.proto) { lines.push([netOf(f.ip, f.mask), `C        ${netOf(f.ip, f.mask)}/${maskLen(f.mask)} is directly connected, ${n}`]); lines.push([f.ip, `L        ${f.ip}/32 is directly connected, ${n}`]); }
    for (const r of d.routes) lines.push([r.net, `S${r.net === '0.0.0.0' ? '*' : ' '}       ${r.net}/${maskLen(r.mask)} [1/0] ${isIp(r.via) ? 'via ' + r.via : 'is directly connected, ' + r.via}`]);
    // OSPF, unless a static route for the same prefix wins on distance
    for (const r of d.ospf ? d.ospf.routes : []) if (!d.routes.some(x => x.net === r.net && x.mask === r.mask)) lines.push([r.net, `${r.ext ? 'O*E2' : 'O   '}     ${r.net}/${maskLen(r.mask)} [110/${r.cost}] via ${r.via}, 00:0${1 + (r.cost % 8)}:${String(10 + (r.cost * 7) % 49)}, ${r.n}`]);
    return o + lines.sort((a, b) => ipn(a[0]) - ipn(b[0])).map(l => l[1]).join('\n');
  }
  function showArp(d) {
    const rows = [];
    for (const [n, f] of Object.entries(d.ifs)) if (f.ip && f.proto) rows.push(`Internet  ${f.ip.padEnd(17)}${'-'.padStart(5)}   ${macOf(d, n)}  ARPA   ${n}`);
    for (const [ip, e] of Object.entries(d.arp)) rows.push(`Internet  ${ip.padEnd(17)}${'0'.padStart(5)}   ${e.mac}  ARPA   ${e.n}`);
    return 'Protocol  Address          Age (min)  Hardware Addr   Type   Interface\n' + rows.join('\n');
  }
  function showCtl(d, s, a) {
    const n = a[0]; if (!n.startsWith('Serial')) return err('% Invalid input detected at \'^\' marker.');
    const pe = peerOf(d.id, n), f = d.ifs[n];
    if (!pe) return `Interface ${n}\nHardware is ${cardOf(d, n)}\nNo serial cable attached\n...`;
    const dce = pe.cable.dce && pe.cable.dce.dev === d.id && portOf(pe.cable.dce).iface === n;
    return `Interface ${n}\nHardware is ${cardOf(d, n)}\n${dce ? 'DCE' : 'DTE'} V.35, ${dce ? (f.clock ? 'clock rate ' + f.clock : 'clocks stopped') : 'clocks detected'}.\n...`;
  }
  function iosPing(d, dst) {
    const r0 = route(d, dst), first = r0 && !d.arp[r0.nh];
    const r = ping(d, dst);
    const marks = r.ok ? (first ? '.!!!!' : '!!!!!') : r.why === 'acl' && !r.reply ? 'U.U.U' : '.....', n = (marks.match(/!/g) || []).length;
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${dst}, timeout is 2 seconds:\n${marks}\nSuccess rate is ${n * 20} percent (${n}/5)${n ? ', round-trip min/avg/max = 1/1/2 ms' : ''}`;
  }
  function runPC(d, line) {
    const w = line.trim().split(/\s+/), c = w[0].toLowerCase();
    const dash = m => m.replace(/\./g, '').toUpperCase().match(/../g).join('-');
    if (c === 'ipconfig') {
      const opt = (w[1] || '').toLowerCase();
      if (opt === '/release') { if (!d.dhcp) return say(d, '\nThe operation failed as no adapter is in the state permissible for\nthis operation.'); d.ip = ''; d.mask = ''; d.pcgw = ''; d.apipa = false; d.dhcpTry = clock + 1e12; emit('change'); return say(d, '\nEthernet adapter Ethernet0:\n\n   IPv4 Address. . . . . . . . . . . : 0.0.0.0\n   Subnet Mask . . . . . . . . . . . : 0.0.0.0\n   Default Gateway . . . . . . . . . :'); }
      if (opt === '/renew') {
        if (!d.dhcp) return say(d, '\nThe operation failed as no adapter is in the state permissible for\nthis operation.');
        d.dhcpTry = clock; const r = dhcpGet(d);
        if (!(r && r.ip)) return say(d, `\nAn error occurred while renewing interface Ethernet0 : unable to contact your DHCP server. Request has timed out.${r && r.full ? `\n(Pool ${r.full} on ${r.server.hostname} has no free address.)` : ''}`);
      }
      const all = opt === '/all';
      say(d, `\n${radioOf(d) ? 'Wireless LAN adapter Wi-Fi' : 'Ethernet adapter Ethernet0'}:\n\n   Connection-specific DNS Suffix  . :${all ? `\n   Physical Address. . . . . . . . . : ${dash(pcIf(d).mac)}\n   DHCP Enabled. . . . . . . . . . . : ${d.dhcp ? 'Yes' : 'No'}` : ''}\n   ${d.apipa ? 'Autoconfiguration IPv4 Address. .' : 'IPv4 Address. . . . . . . . . . .'} : ${d.ip || '0.0.0.0'}\n   Subnet Mask . . . . . . . . . . . : ${d.mask || '0.0.0.0'}\n   Default Gateway . . . . . . . . . : ${d.pcgw}${all && d.dhcp && d.dhcpFrom && !d.apipa ? `\n   DHCP Server . . . . . . . . . . . : ${(ipsOf(D(d.dhcpFrom) || { kind: 'pc', ifs: {} })[0] || {}).ip || ''}` : ''}${all && d.dns ? `\n   DNS Servers . . . . . . . . . . . : ${d.dns}` : ''}\n`);
    } else if (c === 'ping' && w[1]) {
      const dst = w[1];
      if (!isIp(dst)) return say(d, `Ping request could not find host ${dst}. Please check the name and try again.`);
      if (!d.ip) return say(d, 'PING: transmit failed. General failure.');
      if (!pcIf(d).proto) return say(d, `\nPinging ${dst} with 32 bytes of data:\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\n\nThe network cable is unplugged.`);
      const r = ping(d, dst);
      let out = `\nPinging ${dst} with 32 bytes of data:\n`, got = 0;
      const unreach = !r.reply && (r.why === 'noroute' || r.why === 'arp') && r.at === d.id;
      // a router's access list answers "administratively prohibited": Windows says net unreachable
      const prohibited = r.why === 'acl' && !r.reply && D(r.at) && D(r.at).ifs[r.n] ? D(r.at).ifs[r.n].ip : '';
      const o = owner(dst), ttl = o && o.dev.kind === 'router' ? 255 : 128;
      for (let i = 0; i < 4; i++) {
        if (r.ok) { out += `Reply from ${dst}: bytes=32 time<1ms TTL=${ttl}\n`; got++; }
        else if (prohibited) out += `Reply from ${prohibited}: Destination net unreachable.\n`;
        else if (unreach) out += `Reply from ${d.ip}: Destination host unreachable.\n`;
        else out += 'Request timed out.\n';
      }
      const recv = unreach || prohibited ? 4 : got;
      out += `\nPing statistics for ${dst}:\n    Packets: Sent = 4, Received = ${recv}, Lost = ${4 - recv} (${(4 - recv) * 25}% loss),`;
      say(d, out, r.ok ? 'ok' : '');
    } else if (c === 'tracert' && w[1]) {
      const dst = w[1], hops = [];
      let cur = d, ok = false;
      for (let ttl = 0; ttl < 8 && cur; ttl++) { const r = deliver(cur, { src: null, dst, proto: 'icmp' }, 0); if (r.ok) { ok = true; hops.push(dst); break; } const rr = route(cur, dst); if (!rr) break; const o = owner(rr.nh); if (!o || deliver(cur, { src: null, dst: rr.nh, proto: 'icmp' }, 0).ok === false) break; hops.push(rr.nh); cur = o.dev; }
      say(d, `\nTracing route to ${dst} over a maximum of 30 hops\n\n` + hops.map((h, i) => `  ${String(i + 1).padStart(2)}    <1 ms    <1 ms    <1 ms  ${h}`).join('\n') + (ok ? '\n\nTrace complete.' : `\n  ${String(hops.length + 1).padStart(2)}     *        *        *     Request timed out.`));
    } else if (c === 'arp' && w[1] === '-a') {
      const rows = Object.entries(d.arp).map(([ip, e]) => `  ${ip.padEnd(22)}${dash(e.mac).toLowerCase().padEnd(22)}dynamic`);
      say(d, rows.length ? `\nInterface: ${d.ip} --- 0x3\n  Internet Address      Physical Address      Type\n${rows.join('\n')}` : 'No ARP Entries Found.');
    } else if (c === 'cls') sess(d).lines = [];
    else if (c === 'help' || c === '?') say(d, 'ipconfig [/all | /renew | /release]   ping <address>   tracert <address>   arp -a   cls');
    else say(d, `'${w[0]}' is not recognized as an internal or external command,\noperable program or batch file.`);
  }
  function setPC(devId, { ip = '', mask = '', gateway = '', dhcp = false }) {
    const d = D(devId);
    if (dhcp) { d.dhcp = true; d.ip = ''; d.mask = ''; d.pcgw = ''; d.apipa = false; d.dhcpTry = clock; const r = dhcpGet(d, true); emit('change'); return r; }
    if (ip && !isIp(ip)) throw new Error("That address isn't four numbers from 0 to 255, like 192.168.10.11.");
    if (mask && !validMask(mask)) throw new Error('A subnet mask is ones then zeros, like 255.255.255.0.');
    if (gateway && !isIp(gateway)) throw new Error("The gateway is the router's address on this LAN, like 192.168.10.1.");
    d.dhcp = false; d.apipa = false; d.ip = ip; d.mask = mask; d.pcgw = gateway; emit('change');
  }
  // An access point's network name and key, or the one a wireless client joins.
  function setWifi(devId, { ssid = '', key = '' }) {
    const d = D(devId);
    if (key && key.length < 8) throw new Error('A WPA2 key is at least 8 characters.');
    d.wifi = { ssid: ssid.trim(), key }; evalLinks(); emit('change');
    return d.kind === 'ap' ? null : apFor(d);
  }

  /* ---------- power ---------- */
  function powerCycle(d) { d.power = true; d.boot = clock + 2600; for (const f of Object.values(d.ifs)) f.upSince = clock; log(d, '%SYS-5-RELOAD: Reload requested by console.'); evalLinks(); emit('change'); }
  function setPower(devId, on) { const d = D(devId); if (on && !d.power) { d.power = true; d.boot = clock + 2600; } else if (!on) d.power = false; evalLinks(); emit('change'); }

  /* ---------- tasks ---------- */
  const consoleFrom = devId => { const c = cables.find(c => isCon(c) && c.a && c.b && [c.a.dev, c.b.dev].includes(devId)); return c ? (c.a.dev === devId ? c.b.dev : c.a.dev) : null; };
  const opened = new Set();
  function checkTask(t) {
    const k = t.check || {};
    if (k.console) return opened.has(k.console);
    if (k.address) { const d = D(k.address.device), n = parseIf(d, k.address.iface) || k.address.iface, f = d.ifs[n]; return !!f && f.ip === k.address.ip && (!k.address.mask || f.mask === k.address.mask) && (k.address.up === undefined || !f.shutdown === k.address.up); }
    if (k.link) { const a = parseEnd(k.link.a); const p = portOf(a); const pe = peerOf(a.dev, p.iface); if (!pe) return false; const [bd, bp] = k.link.b.split(/\s+/); return pe.dev === bd && (!bp || pe.port.key.toLowerCase() === bp.toLowerCase()); }
    if (k.cabled) return k.cabled.every(s => { const a = parseEnd(s[0]); const p = portOf(a); const pe = peerOf(a.dev, p.iface); return pe && pe.dev === s[1]; });
    if (k.pc) { const d = D(k.pc.device); return d.ip === k.pc.ip && (!k.pc.mask || d.mask === k.pc.mask) && (!k.pc.gateway || d.pcgw === k.pc.gateway); }
    if (k.pinged) return pinged.has(k.pinged.from + '>' + k.pinged.to);
    if (k.tried) return tried.has(k.tried.from + '>' + k.tried.to);
    if (k.reach) return deliverQuiet(D(k.reach.from), k.reach.to);
    if (k.vlan) { const d = D(k.vlan.device); return [].concat(k.vlan.vlans || k.vlan.id).every(v => d.vlans[v]); }
    if (k.dhcp) { const d = D(k.dhcp.device || k.dhcp); return !!d && d.dhcp && !!d.ip && !d.apipa; }
    if (k.ospf) { const d = D(k.ospf.device); return !!d && !!d.ospf && d.ospf.nbrs.filter(n => n.state === 'FULL').length >= (k.ospf.neighbors || 1); }
    if (k.route) { const d = D(k.route.device), r = route(d, k.route.to); return !!r && (!k.route.proto || r.proto === k.route.proto); }
    if (k.blocked) return sandbox(() => { const t = deliver(D(k.blocked.from), { src: null, dst: k.blocked.to, proto: 'icmp', id: 0 }); return !t.ok && t.why === 'acl'; });
    if (k.nat) { const d = D(k.nat.device); return !!d && !!d.nat && d.nat.table.some(x => x.kind !== 'static' || !k.nat.dynamic); }
    if (k.wifi) { const d = D(k.wifi.device || k.wifi); return !!d && !!apFor(d); }
    if (k.trunk) { const d = D(k.trunk.device), n = parseIf(d, k.trunk.iface); return !!n && d.ifs[n].mode === 'trunk' && d.ifs[n].proto; }
    return false;
  }
  function deliverQuiet(d, dst) { // would a ping succeed now? doesn't touch lights or tables
    return sandbox(() => {
      const t = deliver(d, { src: null, dst, proto: 'icmp', id: 0 });
      return t.ok && deliver(D(t.last), { src: t.pkt.dst, dst: t.pkt.src, proto: 'icmp', id: 0, reply: true }).ok;
    });
  }
  const tasks = () => (lab.tasks || lab.task || []).map(t => ({ text: t.text, hint: t.hint || '', done: (() => { try { return !!checkTask(t); } catch { return false; } })() })); // a task about a device that's gone isn't done

  /* ---------- build the lab ---------- */
  for (const def of lab.devices || lab.device || []) addDevice(def);
  for (const def of lab.devices || lab.device || []) if (def.config) configure(def.id, def.config);
  for (const c of lab.cables || lab.cable || []) plug(c.type || 'straight', c.a, c.b, { dce: c.dce });
  // labs can start with every device already booted
  if (lab.booted || opts.booted) {
    // already running: powered on and converged, like a network you walk up to
    for (const d of devs) d.boot = 0;
    quiet = true; evalLinks(); later.length = 0; quiet = false;
    for (const d of devs) for (const f of Object.values(d.ifs)) if (f.phys || f.proto) f.upSince = -STP_FORWARD;
    quiet = true; evalLinks(); ospfRun(true); for (const d of devs) if (d.dhcp) dhcpGet(d, true); quiet = false;
  }

  let protoAt = -1e9;
  function tick(ms) {
    clock += ms;
    for (let i = later.length - 1; i >= 0; i--) if (later[i].at <= clock) { const f = later[i].fn; later.splice(i, 1); f(); }
    evalLinks();
    if (clock - protoAt >= 500) {
      protoAt = clock;
      const before = JSON.stringify(devs.map(d => d.ospf ? d.ospf.nbrs.map(n => n.state) : 0));
      ospfRun();
      let changed = before !== JSON.stringify(devs.map(d => d.ospf ? d.ospf.nbrs.map(n => n.state) : 0));
      // DHCP clients without an address keep asking, every two seconds
      for (const d of devs) if (d.dhcp && pcIf(d) && pcIf(d).proto && (!d.ip || d.apipa) && clock - (d.dhcpTry || -1e9) >= 2000) { d.dhcpTry = clock; const was = d.ip; dhcpGet(d, true); if (d.ip !== was) changed = true; }
      if (changed) emit('change');
    }
  }

  function snapshot() {
    return {
      clock, devices: devs.map(d => ({ id: d.id, model: d.model, modules: { ...d.modules }, sfp: { ...d.sfp }, routing: d.routing, x: d.x, y: d.y, hostname: d.hostname, power: d.power, ip: d.ip, mask: d.mask, pcgw: d.pcgw, routes: d.routes, vlans: d.vlans, gw: d.gw, secret: d.secret, acls: d.acls || null, nat: d.nat || null, ospfCfg: d.ospfCfg || null, dhcpPools: d.dhcpPools || null, dhcpExcl: d.dhcpExcl || null, dhcpBind: d.dhcpBind || null, dhcp: !!d.dhcp, apipa: !!d.apipa, dns: d.dns || '', wifi: d.wifi || null, ifs: Object.fromEntries(Object.entries(d.ifs).map(([n, f]) => [n, { shutdown: f.shutdown, ip: f.ip, mask: f.mask, mode: f.mode, vlan: f.vlan, native: f.native, portfast: f.portfast, clock: f.clock, desc: f.desc, encap: f.encap, sub: f.sub, parent: f.parent, svi: f.svi, routed: f.routed, mac: f.mac, nativeTag: f.nativeTag, allowed: f.allowed || null, loop: f.loop || undefined, aclIn: f.aclIn || undefined, aclOut: f.aclOut || undefined, nat: f.nat || undefined, helper: f.helper || undefined, ospfCost: f.ospfCost || undefined, ospfArea: f.ospfArea ?? undefined, ospfPri: f.ospfPri ?? undefined, bw: f.bw || undefined }])) })),
      cables: cables.filter(c => c.a && c.b).map(c => ({ id: c.id, type: c.type, a: c.a, b: c.b, dce: c.dce })),
      opened: [...opened], pinged: [...pinged], tried: [...tried],
    };
  }
  function restore(s) {
    if (!s || !Array.isArray(s.devices)) return;
    for (const sd of s.devices) {
      let d = D(sd.id);
      if (!d) { if (!CATALOG[sd.model]) continue; try { d = addDevice({ id: sd.id, model: sd.model, modules: sd.modules }); } catch { continue; } } // added on an open bench
      if (sd.modules) { d.modules = { ...sd.modules }; d.m = modelOf(CATALOG[d.model], d.modules); syncIfs(d); }
      if (sd.sfp) d.sfp = { ...sd.sfp };
      d.routing = !!sd.routing;
      Object.assign(d, { x: sd.x, y: sd.y, hostname: sd.hostname, power: sd.power !== false, ip: sd.ip, mask: sd.mask, pcgw: sd.pcgw, routes: sd.routes || [], vlans: sd.vlans || d.vlans, gw: sd.gw || '', secret: sd.secret || '', acls: sd.acls || undefined, nat: sd.nat || undefined, ospfCfg: sd.ospfCfg || null, dhcpPools: sd.dhcpPools || undefined, dhcpExcl: sd.dhcpExcl || undefined, dhcpBind: sd.dhcpBind || undefined, dhcp: !!sd.dhcp, apipa: !!sd.apipa, dns: sd.dns || '', wifi: sd.wifi || d.wifi || null });
      for (const [n, f] of Object.entries(sd.ifs || {})) d.ifs[n] = Object.assign(d.ifs[n] || iface({}), f, { phys: false, proto: false, upSince: clock });
    }
    cables.length = 0;
    for (const c of s.cables || []) try { plug(c.type, c.a, c.b, { id: c.id, dce: c.dce }); } catch { /* a port that no longer exists */ }
    (s.opened || []).forEach(x => opened.add(x)); (s.pinged || []).forEach(x => pinged.add(x)); (s.tried || []).forEach(x => tried.add(x));
    evalLinks(); emit('change');
  }

  return {
    lab, devices: devs, cables, catalog: CATALOG, cableTypes: CABLES,
    device: D, portOf, peerOf, segment,
    addDevice: add, removeDevice, renameDevice, copyDevice,
    insertModule, removeModule, insertSfp, removeSfp,
    get clock() { return clock; }, tick,
    plug, attach, detach, remove, canPlug, fits, occupied,
    exec, prompt, help, session: id => sess(D(id)), configure, setPC,
    forwarding: (id, n) => forwarding(D(id), n), stpState: (id, n) => stpState(D(id), n), ifStatus: (id, n) => ifStatus(D(id), n), isOn: id => isOn(D(id)),
    setPower, powerCycle: id => powerCycle(D(id)),
    consoleFrom, markOpened: id => { opened.add(id); emit('change'); },
    tasks, ping: (from, to) => ping(D(from), to), simulate: (from, to) => simulate(from, to), simulateDhcp: id => simulateDhcp(id), setWifi, apFor: id => apFor(D(id)), wireless: () => devs.filter(c => c.kind !== 'ap' && radioOf(c) && apFor(c)).map(c => ({ client: c.id, ap: apFor(c).id })),
    addresses: () => devs.flatMap(d => ipsOf(d).map(a => ({ dev: d.id, n: a.n, ip: a.ip }))),
    snapshot, restore,
    on(ev, fn) { listeners[ev].push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; },
  };
}

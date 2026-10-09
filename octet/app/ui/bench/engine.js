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
// CDP neighbours, serial links with DCE clocking, console cables, power.

import { CATALOG, CABLES } from './catalog.js';

/* ---------- addresses ---------- */
export const ipn = s => s.split('.').reduce((a, o) => a * 256 + (+o), 0);
export const isIp = s => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s || '') && s.split('.').every(o => +o <= 255);
export const maskLen = m => isIp(m) ? ipn(m).toString(2).replace(/0+$/, '').length : 0;
export const validMask = m => isIp(m) && /^1*0*$/.test(ipn(m).toString(2).padStart(32, '0'));
const and = (a, m) => (ipn(a) & ipn(m)) >>> 0;
export const sameNet = (a, b, m) => isIp(a) && isIp(b) && validMask(m) && and(a, m) === and(b, m);
const ntoa = n => [24, 16, 8, 0].map(s => (n >>> s) & 255).join('.');
export const netOf = (a, m) => ntoa(and(a, m));
export const short = n => n.replace('GigabitEthernet', 'Gi').replace('FastEthernet', 'Fa').replace('Serial', 'Se');

const IFT = [['FastEthernet', 'f'], ['GigabitEthernet', 'g'], ['Serial', 's'], ['Vlan', 'v']];
const STP_LISTEN = 15000, STP_FORWARD = 30000;

export function createNetwork(lab, opts = {}) {
  const listeners = { log: [], change: [], say: [] };
  const emit = (ev, ...a) => listeners[ev].forEach(f => f(...a));
  let clock = 0, macN = 0x10;
  const mac = oui => { macN++; const h = oui + macN.toString(16).padStart(6, '0'); return `${h.slice(0, 4)}.${h.slice(4, 8)}.${h.slice(8, 12)}`; };
  const iface = (over) => Object.assign({ shutdown: false, ip: '', mask: '', mode: 'access', vlan: 1, native: 1, portfast: false, clock: 0, desc: '', phys: false, proto: false, upSince: 0, medium: '', act: 0, encap: 0 }, over);

  /* ---------- devices ---------- */
  const devs = [];
  function addDevice(def) {
    const m = CATALOG[def.model];
    if (!m) throw new Error(`device ${def.id}: unknown model ${def.model}`);
    const d = { id: def.id, model: def.model, m, kind: m.kind, x: def.x || 0, y: def.y || 0, ifs: {}, hostname: def.hostname || def.id, power: true, boot: clock + 1800 + devs.length * 300, routes: [], arp: {}, macs: {}, vlans: { 1: 'default' }, gw: '', secret: '', ip: def.ip || '', mask: def.mask || '', pcgw: def.gateway || def.gw || '', ledMode: 'stat', locked: !!def.locked };
    const oui = m.kind === 'router' ? '00d097' : m.kind === 'switch' ? '0019e8' : '005079';
    for (const p of m.ports) if (!['console', 'com', 'aux'].includes(p.iface) && !d.ifs[p.iface]) d.ifs[p.iface] = iface({ shutdown: m.kind === 'pc' ? false : !!(m.defaults || {}).shutdown, mac: mac(oui) });
    if (m.kind === 'switch') d.ifs.Vlan1 = iface({ shutdown: true, svi: true, mac: mac(oui) });
    devs.push(d);
    return d;
  }
  const D = id => devs.find(d => d.id === id);
  // an open lab adds and removes devices while it runs
  const PREFIX = { router: 'R', switch: 'S', pc: 'PC-' };
  function freeId(model) {
    const pre = PREFIX[CATALOG[model].kind] || 'D';
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
    if (type === 'console' && other) { const a = portOf(other).type, b = p.type; if (a === b) return 'misfit'; }
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
  function log(d, msg) { if (d.kind === 'pc' || quiet) return; say(d, `${stamp()}: ${msg}`, 'log'); emit('log', d.id, msg); }
  let quiet = false;

  /* ---------- links ---------- */
  function peerOf(devId, ifname) {
    for (const c of cables) {
      if (!c.a || !c.b || c.type === 'console') continue;
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
      if (!c.a || !c.b || c.type === 'console') continue;
      for (const e of ['a', 'b']) { const d = D(c[e].dev), p = portOf(c[e]), f = d.ifs[p.iface]; if (f && (p.type === 'sfp' || !f._medium)) f._medium = p.type; }
    }
    for (const c of cables) {
      if (!c.a || !c.b || c.type === 'console') continue;
      const da = D(c.a.dev), db = D(c.b.dev), pa = portOf(c.a), pb = portOf(c.b), fa = da.ifs[pa.iface], fb = db.ifs[pb.iface];
      if (!fa || !fb || fa._medium !== pa.type || fb._medium !== pb.type) continue;
      fa._phys = fb._phys = !fa.shutdown && !fb.shutdown && isOn(da) && isOn(db);
    }
    for (const d of devs) {
      for (const [n, f] of Object.entries(d.ifs)) {
        if (f.svi || f.sub) continue;
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
        if (f.svi) pr = !f.shutdown && isOn(d) && Object.values(d.ifs).some(g => !g.svi && g.proto && (g.mode === 'trunk' || g.vlan === +n.slice(4)));
        else if (f.sub) { const pf = d.ifs[f.parent]; pr = !!pf && pf.proto && !f.shutdown && !pf.shutdown; f.phys = pr; }
        else continue;
        if (pr !== f.proto) { f.proto = pr; if (f.svi) f.phys = pr; log(d, `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${n}, changed state to ${pr ? 'up' : 'down'}`); }
      }
    }
  }
  function forwarding(d, n) {
    const f = d.ifs[n]; if (!f || !f.proto) return false;
    if (d.kind !== 'switch' || f.svi) return true;
    return f.portfast || clock - f.upSince >= STP_FORWARD;
  }
  function stpState(d, n) {
    const f = d.ifs[n]; if (!f || !f.proto) return 'down';
    if (d.kind !== 'switch' || forwarding(d, n)) return 'forwarding';
    return clock - f.upSince < STP_LISTEN ? 'listening' : 'learning';
  }

  /* ---------- layer 2 ---------- */
  // Every layer 3 interface a frame can reach from (device, interface), with
  // the hops it took. Frames carry a VLAN and whether they're tagged.
  function segment(devId, ifname) {
    const out = [], seen = new Set(), path = [], q = [];
    const start = D(devId);
    const enter = (dId, n, vlan, tagged) => {
      const d = D(dId), f = d.ifs[n];
      if (d.kind === 'switch') {
        const v = f.mode === 'access' ? (tagged ? null : f.vlan) : tagged ? vlan : f.native;
        if (v == null) return;
        const k = dId + '|' + n + '|' + v; if (seen.has(k)) return; seen.add(k);
        q.push({ dId, n, v });
      } else if (d.kind === 'router') {
        if (tagged) { const sub = Object.entries(d.ifs).find(([, g]) => g.sub && g.parent === n && g.encap === vlan); if (sub) out.push({ dev: dId, n: sub[0] }); }
        else { if (f.ip) out.push({ dev: dId, n }); const sub = Object.entries(d.ifs).find(([, g]) => g.sub && g.parent === n && g.encap === 1 && g.nativeTag); if (sub) out.push({ dev: dId, n: sub[0] }); }
      } else out.push({ dev: dId, n });
    };
    const leave = (dId, n, vlan, tagged) => {
      const d = D(dId);
      if (!forwarding(d, n)) return;
      const pe = peerOf(dId, n); if (!pe) return;
      const pd = D(pe.dev);
      if (!forwarding(pd, pe.port.iface)) return;
      path.push([dId, n], [pe.dev, pe.port.iface]);
      enter(pe.dev, pe.port.iface, vlan, tagged);
    };
    const f0 = start.ifs[ifname];
    if (start.kind === 'switch' && f0 && f0.svi) {
      const v = +ifname.slice(4);
      for (const [n, f] of Object.entries(start.ifs)) if (!f.svi && (f.mode === 'trunk' || f.vlan === v)) leave(devId, n, v, f.mode === 'trunk' && v !== f.native);
    } else if (f0 && f0.sub) leave(devId, f0.parent, f0.encap, true);
    else leave(devId, ifname, 1, false);
    while (q.length) {
      const { dId, n: inIf, v } = q.shift(), d = D(dId);
      const svi = d.ifs['Vlan' + v];
      if (svi && svi.proto && svi.ip && dId !== devId) out.push({ dev: dId, n: 'Vlan' + v });
      for (const [n, f] of Object.entries(d.ifs)) {
        if (f.svi || n === inIf) continue;
        if (f.mode === 'trunk') leave(dId, n, v, v !== f.native);
        else if (f.vlan === v) leave(dId, n, v, false);
      }
    }
    return { ends: out, path };
  }

  /* ---------- layer 3 ---------- */
  const pcIf = d => d.ifs.FastEthernet0;
  function ipsOf(d) {
    if (d.kind === 'pc') return d.ip ? [{ n: 'FastEthernet0', ip: d.ip, mask: d.mask, up: pcIf(d).proto }] : [];
    return Object.entries(d.ifs).filter(([, f]) => f.ip).map(([n, f]) => ({ n, ip: f.ip, mask: f.mask, up: f.proto && !f.shutdown }));
  }
  function owner(ip) { for (const d of devs) for (const a of ipsOf(d)) if (a.ip === ip) return { dev: d, a }; return null; }
  function route(d, dst) {
    if (!isOn(d)) return null;
    const addrs = ipsOf(d).filter(a => a.up);
    if (d.kind === 'pc') {
      const a = addrs[0]; if (!a) return null;
      if (sameNet(a.ip, dst, a.mask)) return { n: a.n, nh: dst, src: a.ip };
      if (d.pcgw && sameNet(a.ip, d.pcgw, a.mask)) return { n: a.n, nh: d.pcgw, src: a.ip };
      return null;
    }
    for (const a of addrs) if (sameNet(a.ip, dst, a.mask)) return { n: a.n, nh: dst, src: a.ip };
    if (d.kind === 'router') {
      const rs = d.routes.filter(r => sameNet(dst, r.net, r.mask)).sort((x, y) => maskLen(y.mask) - maskLen(x.mask));
      for (const r of rs) {
        if (isIp(r.via)) { const a = addrs.find(a => sameNet(a.ip, r.via, a.mask)); if (a) return { n: a.n, nh: r.via, src: a.ip }; }
        else { const f = d.ifs[r.via]; if (f && f.proto) return { n: r.via, nh: dst, src: f.ip }; }
      }
    }
    if (d.kind === 'switch' && d.gw) { const a = addrs[0]; if (a && sameNet(a.ip, d.gw, a.mask)) return { n: a.n, nh: d.gw, src: a.ip }; }
    return null;
  }
  function macOf(d, n) { return d.kind === 'pc' ? pcIf(d).mac : (d.ifs[n].sub ? d.ifs[d.ifs[n].parent].mac : d.ifs[n].mac); }
  function deliver(d, dst, ttl = 8, marks = []) {
    if (ipsOf(d).some(a => a.ip === dst && a.up)) return { ok: true, marks };
    const r = route(d, dst);
    if (!r) return { ok: false, why: 'noroute', marks, at: d.id };
    const seg = segment(d.id, r.n);
    const hit = seg.ends.find(e => ipsOf(D(e.dev)).some(a => a.n === e.n && a.ip === r.nh && a.up) && isOn(D(e.dev)));
    marks.push(...seg.path);
    if (!hit) return { ok: false, why: 'arp', marks, at: d.id, n: r.n };
    const nd = D(hit.dev);
    d.arp[r.nh] = { mac: macOf(nd, hit.n), n: r.n };
    learn(seg.path, d, r.n);
    if (ipsOf(nd).some(a => a.ip === dst)) return { ok: true, marks, last: nd.id };
    if (nd.kind !== 'router' || ttl <= 0) return { ok: false, why: 'drop', marks, at: nd.id };
    return deliver(nd, dst, ttl - 1, marks);
  }
  function learn(path, src, n) {
    const smac = macOf(src, n);
    for (let i = 0; i < path.length; i += 2) {
      const [dId, ifn] = path[i + 1]; const d = D(dId);
      if (d.kind === 'switch') { const f = d.ifs[ifn]; d.macs[smac] = { vlan: f.mode === 'access' ? f.vlan : f.native, port: ifn }; }
    }
  }
  const pinged = new Set(), tried = new Set();
  function ping(d, dst) {
    tried.add(d.id + '>' + dst);
    const there = deliver(d, dst);
    flash(there.marks);
    if (!there.ok) return { ok: false, why: there.why, at: there.at };
    const r = route(d, dst), o = owner(dst);
    const back = deliver(o.dev, r ? r.src : (ipsOf(d)[0] || {}).ip);
    flash(back.marks);
    if (back.ok) pinged.add(d.id + '>' + dst);
    return { ok: back.ok, why: back.ok ? '' : 'drop', at: back.at };
  }
  function flash(marks) { const until = clock + 600; for (const [dId, n] of marks) { const f = D(dId).ifs[n]; if (f) f.act = until; } }

  /* ---------- the IOS command line ---------- */
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
    if (!d.ifs[base]) return null;
    if (m[3] !== undefined) return d.kind === 'router' ? base + '.' + m[3] : null;
    return base;
  }
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
  cmd(EXEC, 'show ip route', showRoute, 'router');
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
      else d.ifs[n] = iface({ shutdown: true, svi: true, mac: mac('0019e8') });
    }
    s.mode = 'if'; s.ifc = n;
  });
  cmd('conf', 'vlan <num>', (d, s, a) => { const v = +a[0]; if (v < 1 || v > 4094) return err('% Bad VLAN list'); d.vlans[v] = d.vlans[v] || 'VLAN' + String(v).padStart(4, '0'); s.mode = 'vlan'; s.vlan = v; }, 'switch');
  cmd('conf', 'no vlan <num>', (d, s, a) => { delete d.vlans[+a[0]]; }, 'switch');
  cmd('conf', 'ip route <ip> <mask> <hop>', (d, s, a) => { if (!validMask(a[1])) return err('%Inconsistent address and mask'); const net = netOf(a[0], a[1]); d.routes = d.routes.filter(r => !(r.net === net && r.mask === a[1])); d.routes.push({ net, mask: a[1], via: a[2] }); }, 'router');
  cmd('conf', 'no ip route <ip> <mask> <hop>', (d, s, a) => { d.routes = d.routes.filter(r => !(r.net === netOf(a[0], a[1]) && r.mask === a[1])); }, 'router');
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
    if (d.kind === 'switch' && !f.svi) return err('% Invalid input detected at \'^\' marker.');
    if (!validMask(a[1])) return err('% Bad mask 0x' + (ipn(a[1]) >>> 0).toString(16).toUpperCase() + ' for address ' + a[0]);
    if (ipn(a[0]) === and(a[0], a[1])) return err('Bad mask /' + maskLen(a[1]) + ' for address ' + a[0]);
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
  cmd('if', 'switchport mode access', (d, s) => { ifc(d, s).mode = 'access'; }, 'switch');
  cmd('if', 'switchport mode trunk', (d, s) => { ifc(d, s).mode = 'trunk'; }, 'switch');
  cmd('if', 'switchport access vlan <num>', (d, s, a) => { const v = +a[0]; if (!d.vlans[v]) { d.vlans[v] = 'VLAN' + String(v).padStart(4, '0'); say(d, '% Access VLAN does not exist. Creating vlan ' + v); } ifc(d, s).vlan = v; }, 'switch');
  cmd('if', 'switchport trunk native vlan <num>', (d, s, a) => { ifc(d, s).native = +a[0]; }, 'switch');
  cmd('if', 'switchport trunk allowed vlan <rest>', () => {}, 'switch');
  cmd('if', 'spanning-tree portfast', (d, s) => { ifc(d, s).portfast = true; return '%Warning: portfast should only be enabled on ports connected to a single\n host. Connecting hubs, concentrators, switches, bridges, etc... to this\n interface  when portfast is enabled, can cause temporary bridging loops.\n Use with CAUTION'; }, 'switch');
  cmd('if', 'no spanning-tree portfast', (d, s) => { ifc(d, s).portfast = false; }, 'switch');
  cmd('if', 'clock rate <num>', (d, s, a) => { if (!s.ifc.startsWith('Serial')) return err('% Invalid input detected at \'^\' marker.'); ifc(d, s).clock = +a[0]; }, 'router');
  cmd('if', 'speed <word>', () => {}); cmd('if', 'duplex <word>', () => {});
  cmd('vlan', 'name <word>', (d, s, a) => { d.vlans[s.vlan] = a[0]; }, 'switch');
  for (const m of ['conf', 'if', 'vlan', 'line']) {
    cmd(m, 'exit', (d, s) => { s.mode = s.mode === 'conf' ? 'priv' : 'conf'; if (s.mode === 'priv') cfgDone(d); });
    cmd(m, 'end', (d, s) => { s.mode = 'priv'; cfgDone(d); });
  }
  for (const m of ['if', 'vlan', 'line']) cmd(m, 'interface <if>', (d, s, a) => C.find(c => c.modes.includes('conf') && c.w.join(' ') === 'interface <if>').fn(d, s, a));

  const HELP = { show: 'Show running system information', configure: 'Enter configuration mode', terminal: 'Configure from the terminal', enable: 'Turn on privileged commands', disable: 'Turn off privileged commands', ping: 'Send echo messages', interface: 'Select an interface to configure', ip: 'IP configuration', address: 'Set the IP address of an interface', shutdown: 'Shutdown the selected interface', no: 'Negate a command or set its defaults', hostname: "Set system's network name", exit: 'Exit from the current mode', end: 'Exit to privileged mode', brief: 'Brief summary of IP status and configuration', 'running-config': 'Current operating configuration', vlan: 'VLAN commands', switchport: 'Set switching mode characteristics', mode: 'Set trunking mode of the interface', access: 'Set access mode characteristics of the interface', trunk: 'Set trunking characteristics of the interface', route: 'Establish static routes', cdp: 'CDP information', neighbors: 'CDP neighbor entries', 'spanning-tree': 'Spanning Tree Subsystem', portfast: 'Enable an interface to move directly to forwarding on link up', clock: 'Configure serial interface clock', rate: 'Configure serial interface clock speed', copy: 'Copy from one file to another', description: 'Interface specific description', name: 'Ascii name of the VLAN', interfaces: 'Interface status and configuration', status: 'Show interface line status', controllers: 'Interface controller status', 'mac': 'MAC configuration', 'address-table': 'MAC forwarding table', arp: 'ARP table', version: 'System hardware and software status', line: 'Configure a terminal line', secret: 'Assign the privileged level secret', 'default-gateway': 'Specify default gateway (if not routing IP)', write: 'Write running configuration to memory', encapsulation: 'Set encapsulation type for an interface', dot1q: 'IEEE 802.1Q Virtual LAN', reload: 'Halt and perform a cold restart' };
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
    let cands = C.filter(c => c.modes.includes(mode) && (!c.kind || c.kind === d.kind));
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
    let cands = C.filter(c => c.modes.includes(mode) && (!c.kind || c.kind === d.kind));
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
    return { user: h + '>', priv: h + '#', conf: h + '(config)#', if: h + (s.ifc && s.ifc.includes('.') ? '(config-subif)#' : '(config-if)#'), vlan: h + '(config-vlan)#', line: h + '(config-line)#' }[s.mode];
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
      return `${short(n).padEnd(10)}${(f.desc || '').slice(0, 18).padEnd(19)}${st.padEnd(13)}${(f.mode === 'trunk' ? 'trunk' : String(f.vlan)).padEnd(11)}${(f.phys ? 'a-full' : 'auto').padStart(6)}${(f.phys ? (gi ? 'a-1000' : 'a-100') : 'auto').padStart(7)} ${gi ? (f.medium === 'sfp' ? '1000BaseSX SFP' : '10/100/1000BaseTX') : '10/100BaseTX'}`;
    }).join('\n');
  }
  function showTrunk(d) {
    const t = Object.entries(d.ifs).filter(([, f]) => !f.svi && f.mode === 'trunk');
    if (!t.length) return '';
    const vl = Object.keys(d.vlans).map(Number).sort((a, b) => a - b);
    return 'Port        Mode             Encapsulation  Status        Native vlan\n' + t.map(([n, f]) => `${short(n).padEnd(12)}${'on'.padEnd(17)}${'802.1q'.padEnd(15)}${(f.proto ? 'trunking' : 'not-trunking').padEnd(14)}${f.native}`).join('\n') +
      '\n\nPort        Vlans allowed on trunk\n' + t.map(([n]) => `${short(n).padEnd(12)}1-4094`).join('\n') +
      '\n\nPort        Vlans allowed and active in management domain\n' + t.map(([n]) => `${short(n).padEnd(12)}${vl.join(',')}`).join('\n') +
      '\n\nPort        Vlans in spanning tree forwarding state and not pruned\n' + t.map(([n]) => `${short(n).padEnd(12)}${forwarding(d, n) ? vl.join(',') : 'none'}`).join('\n');
  }
  function showInt(d, s, a) {
    const n = a[0], f = d.ifs[n]; if (!f) return err('% Invalid input detected at \'^\' marker.');
    const [st, pr] = ifStatus(d, n), hwmac = f.sub ? d.ifs[f.parent].mac : f.mac;
    const hw = n.startsWith('Serial') ? 'NIM-2T' : n.startsWith('Vlan') ? 'Ethernet SVI' : d.kind === 'router' ? 'ISR4321-2x1GE' : n.startsWith('Gig') ? 'Gigabit Ethernet' : 'Fast Ethernet';
    return `${n} is ${st}, line protocol is ${pr}\n  Hardware is ${hw}, address is ${hwmac} (bia ${hwmac})${f.desc ? `\n  Description: ${f.desc}` : ''}${f.ip ? `\n  Internet address is ${f.ip}/${maskLen(f.mask)}` : ''}${f.sub ? `\n  Encapsulation 802.1Q Virtual LAN, Vlan ID  ${f.encap || 'not set'}.` : ''}\n  MTU 1500 bytes, BW ${n.startsWith('Serial') ? '1544' : n.startsWith('Gig') ? '1000000' : '100000'} Kbit/sec, DLY 10 usec,\n  ${f.phys ? 'Full-duplex' : 'Auto-duplex'}, ${f.phys ? (n.startsWith('Gig') ? '1000Mb/s' : '100Mb/s') : 'Auto-speed'}\n  ...`;
  }
  function showVlan(d) {
    const ports = v => Object.entries(d.ifs).filter(([, f]) => !f.svi && f.mode === 'access' && f.vlan === +v).map(([n]) => short(n));
    const wrap = arr => { const lines = []; for (let i = 0; i < arr.length; i += 4) lines.push(arr.slice(i, i + 4).join(', ')); return lines.length ? lines : ['']; };
    let out = 'VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n';
    for (const v of Object.keys(d.vlans).map(Number).sort((a, b) => a - b)) { const w = wrap(ports(v)); out += `${String(v).padEnd(5)}${d.vlans[v].padEnd(33)}active    ${w[0]}\n` + w.slice(1).map(l => ' '.repeat(48) + l + '\n').join(''); }
    return out + '1002 fddi-default                     act/unsup \n1003 token-ring-default               act/unsup \n1004 fddinet-default                  act/unsup \n1005 trnet-default                    act/unsup ';
  }
  function runIf(d, n, f) {
    let o = `interface ${n}\n`;
    if (f.desc) o += ` description ${f.desc}\n`;
    if (f.sub && f.encap) o += ` encapsulation dot1Q ${f.encap}${f.nativeTag ? ' native' : ''}\n`;
    if (d.kind === 'switch' && !f.svi) { if (f.mode === 'trunk') { if (f.native !== 1) o += ` switchport trunk native vlan ${f.native}\n`; o += ' switchport mode trunk\n'; } else { if (f.vlan !== 1) o += ` switchport access vlan ${f.vlan}\n`; if (f.vlan !== 1 || f.portfast) o += ' switchport mode access\n'; } if (f.portfast) o += ' spanning-tree portfast\n'; }
    o += f.ip ? ` ip address ${f.ip} ${f.mask}\n` : (d.kind === 'router' || f.svi ? ' no ip address\n' : '');
    if (f.clock) o += ` clock rate ${f.clock}\n`;
    if (f.shutdown) o += ' shutdown\n';
    return o;
  }
  function showRun(d, only) {
    if (only) { const f = d.ifs[only]; if (!f) return err('% Invalid input detected at \'^\' marker.'); return `Building configuration...\n\nCurrent configuration : ${120 + runIf(d, only, f).length} bytes\n!\n${runIf(d, only, f)}end`; }
    let o = `Building configuration...\n\nCurrent configuration : ${1200 + Object.keys(d.ifs).length * 40} bytes\n!\nversion ${d.kind === 'router' ? '17.9' : '15.2'}\n!\nhostname ${d.hostname}\n!\n${d.secret ? 'enable secret 9 $9$' + 'nhEmQVczB7dqsO$X.HsgL6x1il0RxkOSSvyQYwucySCt7qFm4v7pqCxkKM\n!\n' : ''}`;
    if (d.kind === 'switch') for (const v of Object.keys(d.vlans).filter(v => v !== '1')) o += `vlan ${v}\n name ${d.vlans[v]}\n!\n`;
    for (const n of Object.keys(d.ifs).sort(natural)) o += runIf(d, n, d.ifs[n]) + '!\n';
    for (const r of d.routes) o += `ip route ${r.net} ${r.mask} ${r.via}\n`;
    if (d.gw) o += `ip default-gateway ${d.gw}\n`;
    return o + '!\nline con 0\nline vty 0 4\n login\n!\nend';
  }
  function showCdp(d) {
    const rows = [];
    const sh = x => x.replace('GigabitEthernet', 'Gig ').replace('FastEthernet', 'Fas ').replace('Serial', 'Ser ');
    for (const n of Object.keys(d.ifs).sort(natural)) {
      const f = d.ifs[n]; if (!f.proto || f.svi || f.sub) continue;
      const pe = peerOf(d.id, n); if (!pe) continue;
      const pd = D(pe.dev); if (pd.kind === 'pc' || !isOn(pd)) continue;
      rows.push(`${pd.hostname.padEnd(17)}${sh(n).padEnd(18)}${'163'.padStart(7)}${(pd.kind === 'router' ? 'R B S I' : 'S I').padStart(13)}  ${pd.m.platform.slice(0, 9).padEnd(10)}${sh(pe.port.iface)}`);
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
    const def = d.routes.find(r => r.net === '0.0.0.0');
    o += def ? `Gateway of last resort is ${isIp(def.via) ? def.via : '0.0.0.0'} to network 0.0.0.0\n\n` : 'Gateway of last resort is not set\n\n';
    const lines = [];
    for (const [n, f] of Object.entries(d.ifs)) if (f.ip && f.proto) { lines.push([netOf(f.ip, f.mask), `C        ${netOf(f.ip, f.mask)}/${maskLen(f.mask)} is directly connected, ${n}`]); lines.push([f.ip, `L        ${f.ip}/32 is directly connected, ${n}`]); }
    for (const r of d.routes) lines.push([r.net, `S${r.net === '0.0.0.0' ? '*' : ' '}       ${r.net}/${maskLen(r.mask)} [1/0] ${isIp(r.via) ? 'via ' + r.via : 'is directly connected, ' + r.via}`]);
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
    if (!pe) return `Interface ${n}\nHardware is NIM-2T\nNo serial cable attached\n...`;
    const dce = pe.cable.dce && pe.cable.dce.dev === d.id && portOf(pe.cable.dce).iface === n;
    return `Interface ${n}\nHardware is NIM-2T\n${dce ? 'DCE' : 'DTE'} V.35, ${dce ? (f.clock ? 'clock rate ' + f.clock : 'clocks stopped') : 'clocks detected'}.\n...`;
  }
  function iosPing(d, dst) {
    const r0 = route(d, dst), first = r0 && !d.arp[r0.nh];
    const r = ping(d, dst);
    const marks = r.ok ? (first ? '.!!!!' : '!!!!!') : '.....', n = (marks.match(/!/g) || []).length;
    return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${dst}, timeout is 2 seconds:\n${marks}\nSuccess rate is ${n * 20} percent (${n}/5)${n ? ', round-trip min/avg/max = 1/1/2 ms' : ''}`;
  }
  function runPC(d, line) {
    const w = line.trim().split(/\s+/), c = w[0].toLowerCase();
    const dash = m => m.replace(/\./g, '').toUpperCase().match(/../g).join('-');
    if (c === 'ipconfig') {
      const all = (w[1] || '').toLowerCase() === '/all';
      say(d, `\nEthernet adapter Ethernet0:\n\n   Connection-specific DNS Suffix  . :${all ? `\n   Physical Address. . . . . . . . . : ${dash(pcIf(d).mac)}` : ''}\n   IPv4 Address. . . . . . . . . . . : ${d.ip || '0.0.0.0'}\n   Subnet Mask . . . . . . . . . . . : ${d.mask || '0.0.0.0'}\n   Default Gateway . . . . . . . . . : ${d.pcgw}\n`);
    } else if (c === 'ping' && w[1]) {
      const dst = w[1];
      if (!isIp(dst)) return say(d, `Ping request could not find host ${dst}. Please check the name and try again.`);
      if (!d.ip) return say(d, 'PING: transmit failed. General failure.');
      if (!pcIf(d).proto) return say(d, `\nPinging ${dst} with 32 bytes of data:\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\nPING: transmit failed. General failure.\n\nThe network cable is unplugged.`);
      const r = ping(d, dst);
      let out = `\nPinging ${dst} with 32 bytes of data:\n`, got = 0;
      const unreach = r.why === 'noroute' || (r.why === 'arp' && r.at === d.id);
      for (let i = 0; i < 4; i++) {
        if (r.ok) { out += `Reply from ${dst}: bytes=32 time<1ms TTL=${owner(dst).dev.kind === 'router' ? 255 : 128}\n`; got++; }
        else if (unreach) out += `Reply from ${d.ip}: Destination host unreachable.\n`;
        else out += 'Request timed out.\n';
      }
      const recv = unreach ? 4 : got;
      out += `\nPing statistics for ${dst}:\n    Packets: Sent = 4, Received = ${recv}, Lost = ${4 - recv} (${(4 - recv) * 25}% loss),`;
      say(d, out, r.ok ? 'ok' : '');
    } else if (c === 'tracert' && w[1]) {
      const dst = w[1], hops = [];
      let cur = d, ok = false;
      for (let ttl = 0; ttl < 8 && cur; ttl++) { const r = deliver(cur, dst, 0); if (r.ok) { ok = true; hops.push(dst); break; } const rr = route(cur, dst); if (!rr) break; const o = owner(rr.nh); if (!o || deliver(cur, rr.nh, 0).ok === false) break; hops.push(rr.nh); cur = o.dev; }
      say(d, `\nTracing route to ${dst} over a maximum of 30 hops\n\n` + hops.map((h, i) => `  ${String(i + 1).padStart(2)}    <1 ms    <1 ms    <1 ms  ${h}`).join('\n') + (ok ? '\n\nTrace complete.' : `\n  ${String(hops.length + 1).padStart(2)}     *        *        *     Request timed out.`));
    } else if (c === 'arp' && w[1] === '-a') {
      const rows = Object.entries(d.arp).map(([ip, e]) => `  ${ip.padEnd(22)}${dash(e.mac).toLowerCase().padEnd(22)}dynamic`);
      say(d, rows.length ? `\nInterface: ${d.ip} --- 0x3\n  Internet Address      Physical Address      Type\n${rows.join('\n')}` : 'No ARP Entries Found.');
    } else if (c === 'cls') sess(d).lines = [];
    else if (c === 'help' || c === '?') say(d, 'ipconfig [/all]   ping <address>   tracert <address>   arp -a   cls');
    else say(d, `'${w[0]}' is not recognized as an internal or external command,\noperable program or batch file.`);
  }
  function setPC(devId, { ip = '', mask = '', gateway = '' }) {
    const d = D(devId);
    if (ip && !isIp(ip)) throw new Error("That address isn't four numbers from 0 to 255, like 192.168.10.11.");
    if (mask && !validMask(mask)) throw new Error('A subnet mask is ones then zeros, like 255.255.255.0.');
    if (gateway && !isIp(gateway)) throw new Error("The gateway is the router's address on this LAN, like 192.168.10.1.");
    d.ip = ip; d.mask = mask; d.pcgw = gateway; emit('change');
  }

  /* ---------- power ---------- */
  function powerCycle(d) { d.power = true; d.boot = clock + 2600; for (const f of Object.values(d.ifs)) f.upSince = clock; log(d, '%SYS-5-RELOAD: Reload requested by console.'); evalLinks(); emit('change'); }
  function setPower(devId, on) { const d = D(devId); if (on && !d.power) { d.power = true; d.boot = clock + 2600; } else if (!on) d.power = false; evalLinks(); emit('change'); }

  /* ---------- tasks ---------- */
  const consoleFrom = devId => { const c = cables.find(c => c.type === 'console' && c.a && c.b && [c.a.dev, c.b.dev].includes(devId)); return c ? (c.a.dev === devId ? c.b.dev : c.a.dev) : null; };
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
    if (k.trunk) { const d = D(k.trunk.device), n = parseIf(d, k.trunk.iface); return !!n && d.ifs[n].mode === 'trunk' && d.ifs[n].proto; }
    return false;
  }
  function deliverQuiet(d, dst) { // would a ping succeed now? doesn't touch lights or tables
    const arp = devs.map(x => JSON.stringify(x.arp)), macs = devs.map(x => JSON.stringify(x.macs)), act = devs.map(x => Object.values(x.ifs).map(f => f.act));
    const there = deliver(d, dst); let ok = there.ok;
    if (ok) { const r = route(d, dst); ok = deliver(owner(dst).dev, r.src).ok; }
    devs.forEach((x, i) => { x.arp = JSON.parse(arp[i]); x.macs = JSON.parse(macs[i]); Object.values(x.ifs).forEach((f, j) => { f.act = act[i][j]; }); });
    return ok;
  }
  const tasks = () => (lab.tasks || lab.task || []).map(t => ({ text: t.text, hint: t.hint || '', done: checkTask(t) }));

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
  }

  function tick(ms) {
    clock += ms;
    for (let i = later.length - 1; i >= 0; i--) if (later[i].at <= clock) { const f = later[i].fn; later.splice(i, 1); f(); }
    evalLinks();
  }

  function snapshot() {
    return {
      clock, devices: devs.map(d => ({ id: d.id, model: d.model, x: d.x, y: d.y, hostname: d.hostname, power: d.power, ip: d.ip, mask: d.mask, pcgw: d.pcgw, routes: d.routes, vlans: d.vlans, gw: d.gw, secret: d.secret, ifs: Object.fromEntries(Object.entries(d.ifs).map(([n, f]) => [n, { shutdown: f.shutdown, ip: f.ip, mask: f.mask, mode: f.mode, vlan: f.vlan, native: f.native, portfast: f.portfast, clock: f.clock, desc: f.desc, encap: f.encap, sub: f.sub, parent: f.parent, svi: f.svi, mac: f.mac, nativeTag: f.nativeTag }])) })),
      cables: cables.filter(c => c.a && c.b).map(c => ({ id: c.id, type: c.type, a: c.a, b: c.b, dce: c.dce })),
      opened: [...opened], pinged: [...pinged], tried: [...tried],
    };
  }
  function restore(s) {
    if (!s || !Array.isArray(s.devices)) return;
    for (const sd of s.devices) {
      let d = D(sd.id);
      if (!d) { if (!CATALOG[sd.model]) continue; d = addDevice({ id: sd.id, model: sd.model }); } // added on an open bench
      Object.assign(d, { x: sd.x, y: sd.y, hostname: sd.hostname, power: sd.power !== false, ip: sd.ip, mask: sd.mask, pcgw: sd.pcgw, routes: sd.routes || [], vlans: sd.vlans || d.vlans, gw: sd.gw || '', secret: sd.secret || '' });
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
    addDevice: add, removeDevice, renameDevice,
    get clock() { return clock; }, tick,
    plug, attach, detach, remove, canPlug, fits, occupied,
    exec, prompt, help, session: id => sess(D(id)), configure, setPC,
    forwarding: (id, n) => forwarding(D(id), n), stpState: (id, n) => stpState(D(id), n), ifStatus: (id, n) => ifStatus(D(id), n), isOn: id => isOn(D(id)),
    setPower, powerCycle: id => powerCycle(D(id)),
    consoleFrom, markOpened: id => { opened.add(id); emit('change'); },
    tasks, ping: (from, to) => ping(D(from), to),
    snapshot, restore,
    on(ev, fn) { listeners[ev].push(fn); return () => { listeners[ev] = listeners[ev].filter(f => f !== fn); }; },
  };
}

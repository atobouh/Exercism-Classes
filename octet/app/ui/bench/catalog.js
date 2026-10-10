// The device catalog: every model a bench can hold, described as data.
//
// A model lists its ports (where they sit on the faceplate, what plugs into
// them, which interface they belong to), its lights and its buttons. The
// faceplate is either drawn by one of the built-in drawings (`draw`) or is
// an image you supply (`image`), with the ports placed over it. Adding a
// device never touches the engine.
//
// Port types: eth (RJ45), sfp, serial (smart serial), con (RJ45 console),
// com (a PC's DB-9), decor (drawn, nothing plugs in).

// A Catalyst's front: `n` access ports in pairs, top and bottom, in groups
// of eight, then two uplinks. `uplink` is 'combo' (RJ45 or SFP, the
// 2960-Plus TC), 'rj45' (the TT models) or 'sfp' (four SFP cages, the 2960-X).
const switchPorts = ({ n = 24, access = ['F0/', 'FastEthernet0/'], uplink = 'combo', up = ['G0/', 'GigabitEthernet0/'], first = 1, x0 = 172 } = {}) => {
  const ports = [];
  const col = c => x0 + c * 24 + Math.floor(c / 4) * 10;
  for (let i = 1; i <= n; i++) {
    const c = Math.floor((i - 1) / 2), top = i % 2 === 1;
    ports.push({ key: access[0] + i, iface: access[1] + i, type: 'eth', x: col(c), y: top ? 13 : 36, w: 20, h: 15, row: top ? 0 : 1, label: String(i), led: true });
  }
  const ux = col(n / 2) + 14;
  if (uplink === 'sfp') {
    for (let k = 0; k < 4; k++) { const i = first + k, top = k % 2 === 0; ports.push({ key: up[0] + i, iface: up[1] + i, type: 'sfp', x: ux + Math.floor(k / 2) * 30, y: top ? 14 : 37, w: 24, h: 13, row: top ? 0 : 1, label: String(i), led: true }); }
  } else {
    for (const i of [first, first + 1]) {
      const y = i === first ? 13 : 36;
      ports.push({ key: up[0] + i, iface: up[1] + i, type: 'eth', x: ux, y, w: 20, h: 15, row: i - first, label: 'G' + i, led: true });
      if (uplink === 'combo') ports.push({ key: up[0] + i + 's', iface: up[1] + i, type: 'sfp', x: ux + 28, y: y + 1, w: 24, h: 13, row: i - first, label: 'SFP' });
    }
  }
  const cx = ux + (uplink === 'rj45' ? 60 : 90);
  ports.push({ key: 'CON', iface: 'console', type: 'con', x: cx, y: 24, w: 22, h: 17, label: 'CONSOLE' });
  return { ports, w: cx + 58 };
};
const catalyst = (opts, extra) => {
  const { ports, w } = switchPorts(opts);
  return Object.assign({
    kind: 'switch', w, h: 66, draw: 'c2960', rack: true,
    software: 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E8',
    defaults: { shutdown: false }, ports,
    lights: ['SYST', 'RPS', 'STAT', 'DUPLX', 'SPEED'].map((id, i) => ({ id, x: 22 + i * 25, y: 34, label: true })),
    buttons: [{ id: 'mode', x: 150, y: 34, r: 4.4, title: 'Mode: choose what the port lights show' }],
  }, extra);
};

// An ISR G2 (1900 and 2900 series): an EHWIC slot with a two-port serial
// card, then the onboard Gigabit ports, console and AUX.
const isrG2 = (model, ge, extra) => {
  const ports = [
    { key: 'S0/0/0', iface: 'Serial0/0/0', type: 'serial', x: 46, y: 26, w: 26, h: 13, label: '0' },
    { key: 'S0/0/1', iface: 'Serial0/0/1', type: 'serial', x: 108, y: 26, w: 26, h: 13, label: '1' },
  ];
  for (let i = 0; i < ge; i++) ports.push({ key: 'G0/' + i, iface: 'GigabitEthernet0/' + i, type: 'eth', x: 300 + i * 44, y: 24, w: 22, h: 17, label: 'GE 0/' + i, led: true });
  const cx = 300 + ge * 44 + 16;
  ports.push({ key: 'CON', iface: 'console', type: 'con', x: cx, y: 24, w: 22, h: 17, label: 'CON' }, { key: 'AUX', iface: 'aux', type: 'decor', x: cx + 32, y: 24, w: 22, h: 17, label: 'AUX' });
  const w = cx + 54 + 130;
  return Object.assign({
    kind: 'router', name: 'Cisco ' + model, platform: 'CISCO' + model, w, h: 66, draw: 'isrg2', label: 'CISCO ' + model, rack: true,
    software: `Cisco IOS Software, C${model.slice(0, 2)}00 Software (C${model.slice(0, 2)}00-UNIVERSALK9-M), Version 15.7(3)M8`,
    defaults: { shutdown: true }, ports,
    lights: [{ id: 'PWR', x: w - 96, y: 36 }, { id: 'SYS', x: w - 78, y: 36 }, { id: 'ACT', x: w - 60, y: 36 }],
    buttons: [{ id: 'power', x: w - 24, y: 33, r: 6, title: 'Power' }],
  }, extra);
};

export const CATALOG = {
  ISR4321: {
    kind: 'router', name: 'Cisco ISR 4321', platform: 'ISR4321/K9', w: 560, h: 66, draw: 'isr4321', rack: true,
    software: 'Cisco IOS XE Software, Version 17.09.04a',
    defaults: { shutdown: true },
    ports: [
      { key: 'S0/1/0', iface: 'Serial0/1/0', type: 'serial', x: 46, y: 26, w: 26, h: 13, label: '0' },
      { key: 'S0/1/1', iface: 'Serial0/1/1', type: 'serial', x: 108, y: 26, w: 26, h: 13, label: '1' },
      { key: 'G0/0/0', iface: 'GigabitEthernet0/0/0', type: 'eth', x: 232, y: 24, w: 22, h: 17, label: 'GE 0/0/0', led: true },
      { key: 'G0/0/1', iface: 'GigabitEthernet0/0/1', type: 'eth', x: 286, y: 24, w: 22, h: 17, label: 'GE 0/0/1', led: true },
      { key: 'G0/0/1s', iface: 'GigabitEthernet0/0/1', type: 'sfp', x: 316, y: 26, w: 24, h: 13, label: 'SFP', led: true },
      { key: 'CON', iface: 'console', type: 'con', x: 378, y: 24, w: 22, h: 17, label: 'CON' },
      { key: 'AUX', iface: 'aux', type: 'decor', x: 410, y: 24, w: 22, h: 17, label: 'AUX' },
    ],
    lights: [{ id: 'PWR', x: 462, y: 36 }, { id: 'SYS', x: 480, y: 36 }, { id: 'ACT', x: 498, y: 36 }],
    buttons: [{ id: 'power', x: 538, y: 33, r: 6, title: 'Power' }],
  },
  ISR4331: {
    kind: 'router', name: 'Cisco ISR 4331', platform: 'ISR4331/K9', w: 640, h: 66, draw: 'isr4321', label: 'ISR 4331', rack: true,
    software: 'Cisco IOS XE Software, Version 17.09.04a',
    defaults: { shutdown: true },
    ports: [
      { key: 'S0/1/0', iface: 'Serial0/1/0', type: 'serial', x: 46, y: 26, w: 26, h: 13, label: '0' },
      { key: 'S0/1/1', iface: 'Serial0/1/1', type: 'serial', x: 108, y: 26, w: 26, h: 13, label: '1' },
      { key: 'G0/0/0', iface: 'GigabitEthernet0/0/0', type: 'eth', x: 232, y: 24, w: 22, h: 17, label: 'GE 0/0/0', led: true },
      { key: 'G0/0/1', iface: 'GigabitEthernet0/0/1', type: 'eth', x: 286, y: 24, w: 22, h: 17, label: 'GE 0/0/1', led: true },
      { key: 'G0/0/1s', iface: 'GigabitEthernet0/0/1', type: 'sfp', x: 316, y: 26, w: 24, h: 13, label: 'SFP', led: true },
      { key: 'G0/0/2', iface: 'GigabitEthernet0/0/2', type: 'eth', x: 366, y: 24, w: 22, h: 17, label: 'GE 0/0/2', led: true },
      { key: 'G0/0/2s', iface: 'GigabitEthernet0/0/2', type: 'sfp', x: 396, y: 26, w: 24, h: 13, label: 'SFP', led: true },
      { key: 'CON', iface: 'console', type: 'con', x: 450, y: 24, w: 22, h: 17, label: 'CON' },
      { key: 'AUX', iface: 'aux', type: 'decor', x: 482, y: 24, w: 22, h: 17, label: 'AUX' },
    ],
    lights: [{ id: 'PWR', x: 542, y: 36 }, { id: 'SYS', x: 560, y: 36 }, { id: 'ACT', x: 578, y: 36 }],
    buttons: [{ id: 'power', x: 618, y: 33, r: 6, title: 'Power' }],
  },
  CISCO1941: isrG2('1941', 2),
  CISCO2901: isrG2('2901', 2),
  CISCO2911: isrG2('2911', 3),
  'WS-C2960+24TC-L': catalyst({}, { name: 'Cisco Catalyst 2960-Plus 24TC-L', platform: 'WS-C2960+24TC-L', label: 'CATALYST 2960-Plus' }),
  'WS-C2960-24TT-L': catalyst({ uplink: 'rj45' }, { name: 'Cisco Catalyst 2960 24TT-L', platform: 'WS-C2960-24TT-L', label: 'CATALYST 2960 Series' }),
  'WS-C2960-48TT-L': catalyst({ n: 48, uplink: 'rj45' }, { name: 'Cisco Catalyst 2960 48TT-L', platform: 'WS-C2960-48TT-L', label: 'CATALYST 2960 Series' }),
  'WS-C2960X-24TS-L': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', up: ['G1/0/', 'GigabitEthernet1/0/'], first: 25 }, { name: 'Cisco Catalyst 2960-X 24TS-L', platform: 'WS-C2960X-24TS-L', label: 'CATALYST 2960-X', software: 'Cisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E8' }),
  PC: {
    kind: 'pc', name: 'Desktop PC', platform: 'PC', w: 228, h: 84, draw: 'pc',
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 30, y: 50, w: 30, h: 14, label: 'COM1' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 168, y: 46, w: 22, h: 17, label: 'LAN', led: true },
    ],
    lights: [], buttons: [],
  },
  Laptop: {
    kind: 'pc', name: 'Laptop', platform: 'Laptop', w: 228, h: 84, draw: 'pc', glyph: 'laptop', prefix: 'Laptop',
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 30, y: 50, w: 30, h: 14, label: 'RS-232' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 168, y: 46, w: 22, h: 17, label: 'LAN', led: true },
    ],
    lights: [], buttons: [],
  },
  Server: {
    kind: 'pc', name: 'Server', platform: 'Server', w: 260, h: 66, draw: 'server', glyph: 'server', prefix: 'Server', rack: true,
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 150, y: 26, w: 30, h: 14, label: 'COM1' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 200, y: 24, w: 22, h: 17, label: 'NIC', led: true },
    ],
    lights: [], buttons: [],
  },
  Printer: {
    kind: 'pc', name: 'Network printer', platform: 'Printer', w: 200, h: 84, draw: 'printer', glyph: 'printer', prefix: 'Printer',
    ports: [{ key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 150, y: 50, w: 22, h: 17, label: 'LAN', led: true }],
    lights: [], buttons: [],
  },
};

// Your own device: a photo or drawing of its faceplate, with the ports
// placed on it. `kind` decides how it behaves (router, switch or pc).
//
//   registerModel('MyRouter', { kind: 'router', image: 'my-router.png', w: 600, h: 70,
//     ports: [{ key: 'G0/0', iface: 'GigabitEthernet0/0', type: 'eth', x: 120, y: 24, w: 22, h: 17 }] })
export function registerModel(id, model) {
  if (!model || !['router', 'switch', 'pc'].includes(model.kind)) throw new Error(`model ${id}: kind must be router, switch or pc`);
  if (!Array.isArray(model.ports) || !model.ports.length) throw new Error(`model ${id}: list at least one port`);
  CATALOG[id] = Object.assign({ name: id, platform: id, lights: [], buttons: [], defaults: { shutdown: model.kind === 'router' } }, model);
}

// What each cable is and what it plugs into.
export const CABLES = {
  straight: { name: 'Straight-through', hint: 'copper, most links', color: 'oklch(70% 0.1 245)', w: 4.2, fits: ['eth'] },
  cross: { name: 'Crossover', hint: 'like to like', color: 'oklch(78% 0.12 85)', w: 4.2, fits: ['eth'] },
  console: { name: 'Console', hint: 'rollover, PC to CONSOLE', color: 'oklch(84% 0.06 215)', w: 3.4, fits: ['con', 'com'] },
  fiber: { name: 'Fiber LC', hint: 'SFP to SFP', color: 'oklch(74% 0.14 50)', w: 3, fits: ['sfp'] },
  serial: { name: 'Serial DCE/DTE', hint: 'router to router WAN', color: 'oklch(48% 0.02 260)', w: 5.6, fits: ['serial'] },
};

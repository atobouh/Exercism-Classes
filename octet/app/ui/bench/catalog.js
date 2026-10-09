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

const switchPorts = () => {
  const ports = [];
  const x0 = 172;
  for (let n = 1; n <= 24; n++) {
    const c = Math.floor((n - 1) / 2), top = n % 2 === 1;
    ports.push({ key: 'F0/' + n, iface: 'FastEthernet0/' + n, type: 'eth', x: x0 + c * 24 + Math.floor(c / 4) * 10, y: top ? 13 : 36, w: 20, h: 15, row: top ? 0 : 1, label: String(n), led: true });
  }
  for (const n of [1, 2]) {
    const y = n === 1 ? 13 : 36;
    ports.push({ key: 'G0/' + n, iface: 'GigabitEthernet0/' + n, type: 'eth', x: 500, y, w: 20, h: 15, row: n - 1, label: 'G' + n, led: true });
    ports.push({ key: 'G0/' + n + 's', iface: 'GigabitEthernet0/' + n, type: 'sfp', x: 528, y: y + 1, w: 24, h: 13, row: n - 1, label: 'SFP' });
  }
  ports.push({ key: 'CON', iface: 'console', type: 'con', x: 640, y: 24, w: 22, h: 17, label: 'CONSOLE' });
  return ports;
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
  'WS-C2960+24TC-L': {
    kind: 'switch', name: 'Cisco Catalyst 2960-Plus 24TC-L', platform: 'WS-C2960+24TC-L', w: 720, h: 66, draw: 'c2960', rack: true,
    software: 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E8',
    defaults: { shutdown: false },
    ports: switchPorts(),
    lights: ['SYST', 'RPS', 'STAT', 'DUPLX', 'SPEED'].map((id, i) => ({ id, x: 22 + i * 25, y: 34, label: true })),
    buttons: [{ id: 'mode', x: 150, y: 34, r: 4.4, title: 'Mode: choose what the port lights show' }],
  },
  PC: {
    kind: 'pc', name: 'Desktop PC', platform: 'PC', w: 228, h: 84, draw: 'pc',
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 30, y: 50, w: 30, h: 14, label: 'COM1' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 168, y: 46, w: 22, h: 17, label: 'LAN', led: true },
    ],
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

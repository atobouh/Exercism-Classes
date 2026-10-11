// The device catalog: every model a bench can hold, described as data.
//
// A model lists its ports (where they sit on the faceplate, what plugs into
// them, which interface they belong to), its lights, its buttons and its
// card slots. The faceplate is either drawn by one of the built-in drawings
// (`draw`) or is an image you supply (`image`), with the ports placed over
// it. Adding a device never touches the engine.
//
// Port types: eth (RJ45), sfp (an empty cage until a transceiver goes in),
// serial (smart serial), con (RJ45 console), usbcon (USB mini-B console),
// usb (a computer's USB-A), com (a PC's DB-9), radio (Wi-Fi: no cable; joins by SSID),
// decor (drawn, nothing plugs in).
//
// `series` groups models in the builder's drawer (ISR 4000, Catalyst 2960...).
//
// Each model shows the side its ports are on. For the ISR G2 routers
// (1941, 2901, 2911) that is the rear panel, as on the real ones.

/* ---------- cards and transceivers ---------- */

// Interface cards. `ports(slot)` places the card's ports inside the slot.
// A card in slot n names its ports Serial0/n/0 and Serial0/n/1, as IOS does.
const twoSerial = s => [0, 1].map(i => ({ key: `S0/${s.n}/${i}`, iface: `Serial0/${s.n}/${i}`, type: 'serial', x: s.x + 18 + i * 56, y: s.y + 16, w: 26, h: 13, label: String(i) }));
export const MODULES = {
  'HWIC-2T': { name: 'HWIC-2T', about: '2-port serial WAN card', hw: 'GT96K Serial', ports: twoSerial },
  'NIM-2T': { name: 'NIM-2T', about: '2-port serial WAN module', hw: 'NIM-2T', ports: twoSerial },
};

// SFP transceivers. Each one works over one kind of fiber.
export const SFPS = {
  'GLC-SX-MMD': { name: '1000BASE-SX', about: 'multimode fiber, up to 550 m', fiber: 'mmf', type: '1000BaseSX SFP' },
  'GLC-LH-SMD': { name: '1000BASE-LX/LH', about: 'single-mode fiber, up to 10 km', fiber: 'smf', type: '1000BaseLX SFP' },
  'SFP-10G-SR': { name: '10GBASE-SR', about: 'multimode fiber, up to 300 m', fiber: 'mmf', type: 'SFP-10GBase-SR' },
  'SFP-10G-LR': { name: '10GBASE-LR', about: 'single-mode fiber, up to 10 km', fiber: 'smf', type: 'SFP-10GBase-LR' },
  'SFP-25G-SR-S': { name: '25GBASE-SR', about: 'multimode fiber, up to 100 m', fiber: 'mmf', type: 'SFP-25GBase-SR' },
};

/* ---------- Catalyst switches ---------- */

// A Catalyst's front: `n` access ports in pairs, top and bottom, in groups
// of eight, then the uplinks. `uplink` is 'combo' (RJ45 or SFP, the
// 2960-Plus TC), 'rj45' (the TT models) or 'sfp' (`nup` SFP cages).
const switchPorts = ({ n = 24, access = ['F0/', 'FastEthernet0/'], accessType = 'eth', uplink = 'combo', nup = 2, up = ['G0/', 'GigabitEthernet0/'], first = 1, x0 = 172, usb = false } = {}) => {
  const ports = [];
  const col = c => x0 + c * 24 + Math.floor(c / 4) * 10;
  for (let i = 1; i <= n; i++) {
    const c = Math.floor((i - 1) / 2), top = i % 2 === 1;
    ports.push(accessType === 'sfp' ? { key: access[0] + i, iface: access[1] + i, type: 'sfp', x: col(c), y: top ? 14 : 37, w: 20, h: 13, row: top ? 0 : 1, label: String(i), led: true } : { key: access[0] + i, iface: access[1] + i, type: 'eth', x: col(c), y: top ? 13 : 36, w: 20, h: 15, row: top ? 0 : 1, label: String(i), led: true });
  }
  const ux = col(n / 2) + 14;
  let end = ux;
  if (uplink === 'sfp') {
    for (let k = 0; k < nup; k++) { const i = first + k, top = k % 2 === 0; ports.push({ key: up[0] + i, iface: up[1] + i, type: 'sfp', x: ux + Math.floor(k / 2) * 30, y: top ? 14 : 37, w: 24, h: 13, row: top ? 0 : 1, label: String(i), led: true }); }
    end = ux + Math.ceil(nup / 2) * 30;
  } else {
    for (const i of [first, first + 1]) {
      const y = i === first ? 13 : 36;
      ports.push({ key: up[0] + i, iface: up[1] + i, type: 'eth', x: ux, y, w: 20, h: 15, row: i - first, label: 'G' + i, led: true });
      if (uplink === 'combo') ports.push({ key: up[0] + i + 's', iface: up[1] + i, type: 'sfp', x: ux + 28, y: y + 1, w: 24, h: 13, row: i - first, label: 'SFP' });
    }
    end = ux + (uplink === 'combo' ? 56 : 24);
  }
  const cx = end + 36;
  ports.push({ key: 'CON', iface: 'console', type: 'con', x: cx, y: 24, w: 22, h: 17, label: 'CONSOLE' });
  if (usb) ports.push({ key: 'USB', iface: 'usb', type: 'usbcon', x: cx + 34, y: 27, w: 11, h: 8, label: 'USB' });
  return { ports, w: cx + (usb ? 82 : 58) };
};
const catalyst = (opts, extra) => {
  const { ports, w } = switchPorts(opts);
  return Object.assign({
    kind: 'switch', series: 'Catalyst 2960', w, h: 66, draw: 'c2960', rack: true,
    software: 'Cisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.2(7)E8',
    defaults: { shutdown: false }, ports,
    lights: ['SYST', 'RPS', 'STAT', 'DUPLX', 'SPEED'].map((id, i) => ({ id, x: 22 + i * 25, y: 34, label: true })),
    buttons: [{ id: 'mode', x: 150, y: 34, r: 4.4, title: 'Mode: choose what the port lights show' }],
  }, extra);
};

/* ---------- routers ---------- */

// The console end of a router: RJ45 console, USB mini-B console, AUX.
const routerConsole = x => [
  { key: 'CON', iface: 'console', type: 'con', x, y: 24, w: 22, h: 17, label: 'CON' },
  { key: 'USB', iface: 'usb', type: 'usbcon', x: x + 32, y: 28, w: 11, h: 8, label: 'USB' },
  { key: 'AUX', iface: 'aux', type: 'decor', x: x + 54, y: 24, w: 22, h: 17, label: 'AUX' },
];
const routerTail = (w, extra) => Object.assign({
  lights: [{ id: 'PWR', x: w - 96, y: 36 }, { id: 'SYS', x: w - 78, y: 36 }, { id: 'ACT', x: w - 60, y: 36 }],
  buttons: [{ id: 'power', x: w - 24, y: 33, r: 6, title: 'Power' }],
}, extra);

// An ISR G2 (1900 and 2900 series), rear panel: EHWIC slots, the onboard
// Gigabit ports, then the consoles. Slots ship empty: power the router off
// and insert a HWIC-2T for serial ports.
const isrG2 = (model, ge, slots) => {
  const sl = Array.from({ length: slots }, (_, n) => ({ id: 'EHWIC' + n, name: 'EHWIC ' + n, n, x: 18 + n * 116, y: 10, w: 108, h: 46, takes: ['HWIC-2T'] }));
  const gx = 18 + slots * 116 + 20;
  const ports = [];
  for (let i = 0; i < ge; i++) ports.push({ key: 'G0/' + i, iface: 'GigabitEthernet0/' + i, type: 'eth', x: gx + i * 44, y: 24, w: 22, h: 17, label: 'GE 0/' + i, led: true });
  const cx = gx + ge * 44 + 16;
  ports.push(...routerConsole(cx));
  const w = cx + 76 + 130;
  return routerTail(w, {
    kind: 'router', series: 'ISR G2', name: 'Cisco ' + model, platform: 'CISCO' + model, w, h: 66, draw: 'isr', label: 'CISCO ' + model, side: 'REAR', rack: true,
    software: `Cisco IOS Software, C${model.slice(0, 2)}00 Software (C${model.slice(0, 2)}00-UNIVERSALK9-M), Version 15.7(3)M8`,
    hw: 'CN Gigabit Ethernet', defaults: { shutdown: true }, ports, slots: sl,
  });
};

// An ISR 4000: two NIM slots (0/1 and 0/2), the onboard Gigabit ports,
// then the consoles. `ge` lists each port as 'rj45', 'sfp' or 'combo'.
const isr4k = (model, ge, modules, o = {}) => {
  const sl = (o.slots ?? [1, 2]).map(n => ({ id: 'NIM' + n, name: 'NIM 0/' + n, n, x: 18 + (n - 1) * 116, y: 10, w: 108, h: 46, takes: ['NIM-2T'] }));
  const ports = [];
  let x = 260;
  ge.forEach((kind, i) => {
    const pre = o.prefix || ['G0/0/', 'GigabitEthernet0/0/', 'GE 0/0/'], k = (o.first ?? 0) + i;
    const key = pre[0] + k, iface = pre[1] + k, label = pre[2] + k;
    if (kind !== 'sfp') ports.push({ key, iface, type: 'eth', x, y: 24, w: 22, h: 17, label, led: true });
    if (kind === 'combo') ports.push({ key: key + 's', iface, type: 'sfp', x: x + 30, y: 26, w: 24, h: 13, label: 'SFP', led: true });
    if (kind === 'sfp') ports.push({ key, iface, type: 'sfp', x, y: 26, w: 24, h: 13, label, led: true });
    x += kind === 'combo' ? 82 : 52;
  });
  ports.push(...routerConsole(x + 10));
  const w = x + 10 + 76 + 130;
  return routerTail(w, {
    kind: 'router', series: o.series || 'ISR 4000', name: o.name || 'Cisco ISR ' + model, platform: o.platform || `ISR${model}/K9`, w, h: 66, draw: 'isr', label: o.label || 'ISR ' + model, rack: true,
    software: o.software || 'Cisco IOS XE Software, Version 17.09.04a', hw: `ISR${model}-${ge.length}x1GE`,
    defaults: { shutdown: true }, ports, slots: sl, modules, ...(o.extra || {}),
  });
};

/* ---------- the catalog ---------- */

export const CATALOG = {
  // The ISR 4321 comes with a NIM-2T in slot 0/1, as in Octet's course labs.
  ISR4321: isr4k('4321', ['rj45', 'combo'], { NIM1: 'NIM-2T' }),
  ISR4331: isr4k('4331', ['combo', 'rj45', 'sfp']),
  CISCO1941: isrG2('1941', 2, 2),
  CISCO2901: isrG2('2901', 2, 4),
  CISCO2911: isrG2('2911', 3, 4),

  'WS-C2960+24TC-L': catalyst({}, { name: 'Cisco Catalyst 2960-Plus 24TC-L', platform: 'WS-C2960+24TC-L', label: 'CATALYST 2960-Plus' }),
  'WS-C2960-24TT-L': catalyst({ uplink: 'rj45' }, { name: 'Cisco Catalyst 2960 24TT-L', platform: 'WS-C2960-24TT-L', label: 'CATALYST 2960 Series' }),
  'WS-C2960-48TT-L': catalyst({ n: 48, uplink: 'rj45' }, { name: 'Cisco Catalyst 2960 48TT-L', platform: 'WS-C2960-48TT-L', label: 'CATALYST 2960 Series' }),
  'WS-C2960X-24TS-L': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['G1/0/', 'GigabitEthernet1/0/'], first: 25, usb: true }, { name: 'Cisco Catalyst 2960-X 24TS-L', platform: 'WS-C2960X-24TS-L', label: 'CATALYST 2960-X', software: 'Cisco IOS Software, C2960X Software (C2960X-UNIVERSALK9-M), Version 15.2(7)E8' }),
  // Layer 3: they route between VLANs once you type `ip routing`.
  'WS-C3560-24PS': catalyst({ uplink: 'sfp', nup: 2 }, { series: 'Catalyst 3560 and 3650', name: 'Cisco Catalyst 3560 24PS', platform: 'WS-C3560-24PS', label: 'CATALYST 3560 Series PoE-24', l3: true, software: 'Cisco IOS Software, C3560 Software (C3560-IPSERVICESK9-M), Version 15.0(2)SE11' }),
  'WS-C3650-24PS': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['G1/1/', 'GigabitEthernet1/1/'], usb: true }, { series: 'Catalyst 3560 and 3650', name: 'Cisco Catalyst 3650 24PS', platform: 'WS-C3650-24PS', label: 'CATALYST 3650', l3: true, software: 'Cisco IOS XE Software, Version 16.12.10a' }),

  // More of an enterprise: branch and edge routers, the campus switching
  // families from access to core, firewalls, wireless, phones and mobiles.
  ISR4221: isr4k('4221', ['rj45', 'combo'], {}),
  ISR4351: isr4k('4351', ['combo', 'combo', 'combo'], {}),
  'ISR4451-X': isr4k('4451-X', ['combo', 'combo', 'combo', 'combo'], {}, { platform: 'ISR4451-X/K9' }),
  'C8200-1N-4T': isr4k('8200', ['rj45', 'rj45', 'rj45', 'rj45'], {}, { series: 'Catalyst 8000 Edge', name: 'Cisco Catalyst 8200-1N-4T', label: 'CATALYST 8200', platform: 'C8200-1N-4T', slots: [1] }),
  'C8300-1N1S-6T': isr4k('8300', ['rj45', 'rj45', 'rj45', 'rj45', 'combo', 'combo'], {}, { series: 'Catalyst 8000 Edge', name: 'Cisco Catalyst 8300-1N1S-6T', label: 'CATALYST 8300', platform: 'C8300-1N1S-6T', slots: [1] }),
  'ASR1001-X': isr4k('1001-X', ['sfp', 'sfp', 'sfp', 'sfp', 'sfp', 'sfp'], {}, { series: 'ASR 1000 (WAN edge)', name: 'Cisco ASR 1001-X', label: 'ASR 1001-X', platform: 'ASR1001-X', slots: [], software: 'Cisco IOS XE Software, Version 17.09.04a, ASR1000' }),

  'C1000-24T-4G-L': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['G1/0/', 'GigabitEthernet1/0/'], first: 25, usb: true }, { series: 'Catalyst 1000', name: 'Cisco Catalyst 1000-24T-4G-L', platform: 'C1000-24T-4G-L', label: 'CATALYST 1000', software: 'Cisco IOS Software, C1000 Software (C1000-UNIVERSALK9-M), Version 15.2(7)E9' }),
  'C9200L-24T-4G': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['G1/1/', 'GigabitEthernet1/1/'], usb: true }, { series: 'Catalyst 9000', name: 'Cisco Catalyst 9200L-24T-4G', platform: 'C9200L-24T-4G', label: 'CATALYST 9200L', software: 'Cisco IOS XE Software, Version 17.09.04a, C9200L' }),
  'WS-C3850-24T': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['G1/1/', 'GigabitEthernet1/1/'], usb: true }, { series: 'Catalyst 3560 and 3650', name: 'Cisco Catalyst 3850-24T', platform: 'WS-C3850-24T', label: 'CATALYST 3850', l3: true, software: 'Cisco IOS XE Software, Version 16.12.10, CAT3K_CAA' }),
  'C9300-24T': catalyst({ access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['Te1/1/', 'TenGigabitEthernet1/1/'], usb: true }, { series: 'Catalyst 9000', name: 'Cisco Catalyst 9300-24T', platform: 'C9300-24T', label: 'CATALYST 9300', l3: true, software: 'Cisco IOS XE Software, Version 17.09.04a, C9300' }),
  'C9300-48P': catalyst({ n: 48, access: ['G1/0/', 'GigabitEthernet1/0/'], uplink: 'sfp', nup: 4, up: ['Te1/1/', 'TenGigabitEthernet1/1/'], usb: true }, { series: 'Catalyst 9000', name: 'Cisco Catalyst 9300-48P', platform: 'C9300-48P', label: 'CATALYST 9300 PoE+', l3: true, software: 'Cisco IOS XE Software, Version 17.09.04a, C9300' }),
  'C9500-24Y4C': catalyst({ access: ['Twe1/0/', 'TwentyFiveGigE1/0/'], accessType: 'sfp', uplink: 'sfp', nup: 4, up: ['Hu1/0/', 'HundredGigE1/0/'], first: 25, usb: true }, { series: 'Catalyst 9000', name: 'Cisco Catalyst 9500-24Y4C (core)', platform: 'C9500-24Y4C', label: 'CATALYST 9500', l3: true, software: 'Cisco IOS XE Software, Version 17.09.04a, C9500' }),

  // Firewalls: here they run IOS-style commands (interfaces, routing, ACLs, NAT), not ASA or FTD.
  'ASA5506-X': isr4k('5506', ['rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45'], {}, { series: 'Firewalls', name: 'Cisco ASA 5506-X', label: 'ASA 5506-X', platform: 'ASA5506', slots: [], prefix: ['G1/', 'GigabitEthernet1/', 'G1/'], first: 1, extra: { group: 'security', glyph: 'firewall', prefix: 'FW' }, software: 'Cisco Adaptive Security Appliance (IOS-style commands in Octet)' }),
  FPR1010: isr4k('1010', ['rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45', 'rj45'], {}, { series: 'Firewalls', name: 'Cisco Firepower 1010', label: 'FIREPOWER 1010', platform: 'FPR-1010', slots: [], prefix: ['G1/', 'GigabitEthernet1/', 'G1/'], first: 1, extra: { group: 'security', glyph: 'firewall', prefix: 'FW' }, software: 'Cisco Firepower 1010 (IOS-style commands in Octet)' }),

  // Wireless: an access point bridges its radio to its Ethernet port. Set its SSID and key from its console.
  'C9120AXI': {
    kind: 'ap', series: 'Wireless', name: 'Cisco Catalyst 9120AXI access point', platform: 'C9120AXI-E', w: 200, h: 84, draw: 'ap', glyph: 'ap', prefix: 'AP', nic: 'GigabitEthernet0',
    ports: [
      { key: 'G0', iface: 'GigabitEthernet0', type: 'eth', x: 60, y: 56, w: 22, h: 17, label: 'PoE', led: true },
      { key: 'CON', iface: 'console', type: 'con', x: 100, y: 56, w: 22, h: 17, label: 'CON' },
      { key: 'RADIO', iface: 'Dot11Radio0', type: 'radio', x: 148, y: 18, w: 26, h: 26, label: 'Wi-Fi 6' },
    ],
    lights: [{ id: 'STATUS', x: 30, y: 30 }], buttons: [],
  },
  'AIR-AP2802I': {
    kind: 'ap', series: 'Wireless', name: 'Cisco Aironet 2802i access point', platform: 'AIR-AP2802I-E-K9', w: 200, h: 84, draw: 'ap', glyph: 'ap', prefix: 'AP', nic: 'GigabitEthernet0',
    ports: [
      { key: 'G0', iface: 'GigabitEthernet0', type: 'eth', x: 60, y: 56, w: 22, h: 17, label: 'PoE', led: true },
      { key: 'CON', iface: 'console', type: 'con', x: 100, y: 56, w: 22, h: 17, label: 'CON' },
      { key: 'RADIO', iface: 'Dot11Radio0', type: 'radio', x: 148, y: 18, w: 26, h: 26, label: 'Wi-Fi 5' },
    ],
    lights: [{ id: 'STATUS', x: 30, y: 30 }], buttons: [],
  },
  // The wireless LAN controller is a managed host here: give it an address, ping it.
  'C9800-L': {
    kind: 'pc', series: 'Wireless', name: 'Cisco Catalyst 9800-L wireless controller', platform: 'C9800-L-C-K9', w: 300, h: 66, draw: 'appliance', label: 'CATALYST 9800-L', glyph: 'wlc', prefix: 'WLC', rack: true, nic: 'GigabitEthernet0/0/0',
    ports: [
      { key: 'G0/0/0', iface: 'GigabitEthernet0/0/0', type: 'eth', x: 150, y: 24, w: 22, h: 17, label: 'GE 0/0/0', led: true },
      { key: 'CON', iface: 'console', type: 'con', x: 200, y: 24, w: 22, h: 17, label: 'CON' },
    ],
    lights: [], buttons: [],
  },

  Hub: {
    kind: 'hub', series: 'Hubs', name: 'Ethernet hub', platform: 'Hub', w: 300, h: 50, draw: 'hub', label: '8-PORT ETHERNET HUB', prefix: 'Hub',
    defaults: { shutdown: false },
    ports: Array.from({ length: 8 }, (_, i) => ({ key: 'P' + i, iface: 'Ethernet' + i, type: 'eth', x: 70 + i * 27, y: 22, w: 20, h: 15, label: String(i + 1), led: true })),
    lights: [{ id: 'PWR', x: 22, y: 30 }, { id: 'COL', x: 44, y: 30 }], buttons: [],
  },

  PC: {
    kind: 'pc', series: 'Computers', name: 'Desktop PC', platform: 'PC', w: 228, h: 84, draw: 'pc',
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 30, y: 50, w: 30, h: 14, label: 'COM1' },
      { key: 'USB', iface: 'usb', type: 'usb', x: 96, y: 52, w: 13, h: 9, label: 'USB' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 168, y: 46, w: 22, h: 17, label: 'LAN', led: true },
    ],
    lights: [], buttons: [],
  },
  Laptop: {
    kind: 'pc', series: 'Computers', name: 'Laptop', platform: 'Laptop', w: 228, h: 84, draw: 'pc', glyph: 'laptop', prefix: 'Laptop',
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 30, y: 50, w: 30, h: 14, label: 'RS-232' },
      { key: 'USB', iface: 'usb', type: 'usb', x: 96, y: 52, w: 13, h: 9, label: 'USB' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 168, y: 46, w: 22, h: 17, label: 'LAN', led: true },
    ],
    lights: [], buttons: [],
  },
  Server: {
    kind: 'pc', series: 'Computers', name: 'Server', platform: 'Server', w: 280, h: 66, draw: 'server', glyph: 'server', prefix: 'Server', rack: true,
    ports: [
      { key: 'COM1', iface: 'com', type: 'com', x: 140, y: 26, w: 30, h: 14, label: 'COM1' },
      { key: 'USB', iface: 'usb', type: 'usb', x: 186, y: 29, w: 13, h: 9, label: 'USB' },
      { key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 220, y: 24, w: 22, h: 17, label: 'NIC', led: true },
    ],
    lights: [], buttons: [],
  },
  'IP-Phone-8841': {
    kind: 'pc', series: 'Phones and mobiles', name: 'Cisco IP Phone 8841', platform: 'CP-8841', w: 180, h: 84, draw: 'phone', glyph: 'phone', prefix: 'Phone',
    ports: [{ key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 132, y: 58, w: 22, h: 17, label: 'SW', led: true }, { key: 'PCPORT', iface: 'pcport', type: 'decor', x: 100, y: 58, w: 22, h: 17, label: 'PC' }],
    lights: [], buttons: [],
  },
  'Laptop-WiFi': {
    kind: 'pc', series: 'Computers', name: 'Laptop (Wi-Fi)', platform: 'Laptop-WiFi', w: 228, h: 84, draw: 'pc', glyph: 'laptop', prefix: 'Laptop', nic: 'Wireless0',
    ports: [{ key: 'USB', iface: 'usb', type: 'usb', x: 96, y: 52, w: 13, h: 9, label: 'USB' }, { key: 'WLAN', iface: 'Wireless0', type: 'radio', x: 168, y: 44, w: 22, h: 22, label: 'Wi-Fi' }],
    lights: [], buttons: [],
  },
  Smartphone: {
    kind: 'pc', series: 'Phones and mobiles', name: 'Smartphone', platform: 'Smartphone', w: 110, h: 84, draw: 'mobile', glyph: 'mobile', prefix: 'Phone', nic: 'Wireless0',
    ports: [{ key: 'WLAN', iface: 'Wireless0', type: 'radio', x: 74, y: 50, w: 22, h: 22, label: 'Wi-Fi' }],
    lights: [], buttons: [],
  },
  Tablet: {
    kind: 'pc', series: 'Phones and mobiles', name: 'Tablet', platform: 'Tablet', w: 150, h: 84, draw: 'mobile', glyph: 'mobile', prefix: 'Tablet', nic: 'Wireless0',
    ports: [{ key: 'WLAN', iface: 'Wireless0', type: 'radio', x: 112, y: 50, w: 22, h: 22, label: 'Wi-Fi' }],
    lights: [], buttons: [],
  },
  Printer: {
    kind: 'pc', series: 'Printers', name: 'Network printer', platform: 'Printer', w: 200, h: 84, draw: 'printer', glyph: 'printer', prefix: 'Printer',
    ports: [{ key: 'NIC', iface: 'FastEthernet0', type: 'eth', x: 150, y: 50, w: 22, h: 17, label: 'LAN', led: true }],
    lights: [], buttons: [],
  },
};

// Your own device: a photo or drawing of its faceplate, with the ports
// placed on it. `kind` decides how it behaves (router, switch, hub or pc).
//
//   registerModel('MyRouter', { kind: 'router', image: 'my-router.png', w: 600, h: 70,
//     ports: [{ key: 'G0/0', iface: 'GigabitEthernet0/0', type: 'eth', x: 120, y: 24, w: 22, h: 17 }] })
export function registerModel(id, model) {
  if (!model || !['router', 'switch', 'hub', 'pc', 'ap'].includes(model.kind)) throw new Error(`model ${id}: kind must be router, switch, hub, pc or ap`);
  if (!Array.isArray(model.ports) || !model.ports.length) throw new Error(`model ${id}: list at least one port`);
  CATALOG[id] = Object.assign({ name: id, platform: id, lights: [], buttons: [], defaults: { shutdown: model.kind === 'router' } }, model);
}

// What each cable is and what it plugs into. `group` is its section of the
// cable tray (Copper, Fiber, Console, Serial). Fiber needs a transceiver of
// its own kind at both ends; console cables join a computer to a console.
export const CABLES = {
  straight: { name: 'Straight-through', short: 'Straight', group: 'Copper', hint: 'copper, most links', color: 'oklch(70% 0.1 245)', w: 4.2, fits: ['eth'] },
  cross: { name: 'Crossover', short: 'Crossover', group: 'Copper', hint: 'like to like', color: 'oklch(78% 0.12 85)', w: 4.2, fits: ['eth'] },
  console: { name: 'Console', short: 'Rollover', group: 'Console', hint: 'rollover, COM1 to CONSOLE', color: 'oklch(84% 0.06 215)', w: 3.4, fits: ['con', 'com'], console: true },
  usb: { name: 'USB console', short: 'USB', group: 'Console', hint: 'USB to mini-B console', color: 'oklch(42% 0.01 260)', w: 3, fits: ['usb', 'usbcon'], console: true },
  fiber: { name: 'Multimode fiber', short: 'Multimode', group: 'Fiber', hint: 'LC, for 1000BASE-SX', color: 'oklch(78% 0.1 200)', w: 3, fits: ['sfp'], fiber: 'mmf' },
  smf: { name: 'Single-mode fiber', short: 'Single-mode', group: 'Fiber', hint: 'LC, for 1000BASE-LX', color: 'oklch(86% 0.15 100)', w: 3, fits: ['sfp'], fiber: 'smf' },
  serial: { name: 'Serial DCE/DTE', short: 'DCE/DTE', group: 'Serial', hint: 'router to router WAN', color: 'oklch(48% 0.02 260)', w: 5.6, fits: ['serial'] },
};

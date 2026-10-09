// Runs the engine with no page: `node app/ui/bench/test/engine.test.mjs`
import { createNetwork } from '../engine.js';
import assert from 'node:assert/strict';

const office = {
  devices: [
    { id: 'R1', model: 'ISR4321' },
    { id: 'S1', model: 'WS-C2960+24TC-L' },
    { id: 'PC-A', model: 'PC', ip: '192.168.10.10', mask: '255.255.255.0', gateway: '192.168.10.1' },
    { id: 'PC-B', model: 'PC' },
  ],
  tasks: [
    { text: 'console', check: { console: 'R1' } },
    { text: 'address', check: { address: { device: 'R1', iface: 'g0/0/0', ip: '192.168.10.1', mask: '255.255.255.0', up: true } } },
    { text: 'ping', check: { pinged: { from: 'PC-B', to: '192.168.10.1' } } },
  ],
};
const run = (net, dev, lines) => lines.forEach(l => net.exec(dev, l));
const last = (net, dev) => net.session(dev).lines.slice(-1)[0].text;

{
  const net = createNetwork(office, { booted: true });
  assert.throws(() => net.plug('console', 'PC-A NIC', 'R1 CON'), /misfit/);
  net.plug('console', 'PC-A COM1', 'R1 CON');
  assert.equal(net.consoleFrom('R1'), 'PC-A');
  net.plug('straight', 'R1 G0/0/0', 'S1 G0/1');
  net.plug('straight', 'PC-A NIC', 'S1 F0/1');
  net.plug('straight', 'PC-B NIC', 'S1 F0/2');
  assert.throws(() => net.plug('straight', 'PC-B NIC', 'S1 F0/3'), /taken/);
  net.tick(100);
  assert.equal(net.ifStatus('R1', 'GigabitEthernet0/0/0')[0], 'administratively down', 'router ports start shut down');
  run(net, 'R1', ['en', 'conf t', 'int g0/0/0', 'ip add 192.168.10.1 255.255.255.0', 'no shut', 'end']);
  net.tick(100);
  assert.equal(net.stpState('S1', 'GigabitEthernet0/1'), 'listening');
  net.setPC('PC-B', { ip: '192.168.10.11', mask: '255.255.255.0', gateway: '192.168.10.1' });
  net.exec('PC-B', 'ping 192.168.10.1');
  assert.match(last(net, 'PC-B'), /Destination host unreachable/, 'spanning tree still blocking: ARP gets no answer');
  net.tick(31000);
  assert.equal(net.stpState('S1', 'FastEthernet0/2'), 'forwarding');
  net.exec('PC-B', 'ping 192.168.10.1');
  assert.match(last(net, 'PC-B'), /Reply from 192\.168\.10\.1: bytes=32/);
  net.exec('R1', 'show cdp neighbors');
  assert.match(last(net, 'R1'), /S1\s+Gig 0\/0\/0/);
  net.exec('S1', 'show mac address-table');
  assert.match(last(net, 'S1'), /Fa0\/2/);
  net.markOpened('R1');
  assert.deepEqual(net.tasks().map(t => t.done), [true, true, true]);
  // the console behaves like IOS
  net.exec('R1', 'sh ip intt br');
  assert.match(last(net, 'R1'), /\^\n% Invalid input detected/);
  net.exec('R1', 'co');
  assert.match(last(net, 'R1'), /Ambiguous/);
  // and a saved bench comes back the same
  const s = net.snapshot(), again = createNetwork(office, { booted: true });
  again.restore(s); again.tick(31000);
  again.exec('PC-B', 'ping 192.168.10.1');
  assert.match(last(again, 'PC-B'), /Reply from 192\.168\.10\.1: bytes=32/);
}

{ // router-on-a-stick, with the tag fault fixed from the console
  const lab = {
    booted: true,
    devices: [
      { id: 'R1', model: 'ISR4321', config: 'interface g0/0/1\n no shutdown\ninterface g0/0/1.10\n encapsulation dot1q 10\n ip address 192.168.10.1 255.255.255.0\ninterface g0/0/1.20\n encapsulation dot1q 30\n ip address 192.168.20.1 255.255.255.0' },
      { id: 'S1', model: 'WS-C2960+24TC-L', config: 'vlan 10\nvlan 20\ninterface fa0/5\n switchport access vlan 10\n spanning-tree portfast\ninterface fa0/6\n switchport access vlan 20\n spanning-tree portfast\ninterface g0/1\n switchport mode trunk' },
      { id: 'SALES', model: 'PC', ip: '192.168.10.10', mask: '255.255.255.0', gateway: '192.168.10.1' },
      { id: 'ENG', model: 'PC', ip: '192.168.20.10', mask: '255.255.255.0', gateway: '192.168.20.1' },
    ],
    cables: [{ a: 'R1 G0/0/1', b: 'S1 G0/1' }, { a: 'SALES NIC', b: 'S1 F0/5' }, { a: 'ENG NIC', b: 'S1 F0/6' }],
    tasks: [{ text: 'ENG reaches SALES', check: { reach: { from: 'ENG', to: '192.168.10.10' } } }],
  };
  const net = createNetwork(lab);
  net.tick(31000);
  net.exec('SALES', 'ping 192.168.10.1');
  assert.match(last(net, 'SALES'), /Reply from 192\.168\.10\.1: bytes=32/, 'VLAN 10 works through its subinterface');
  net.exec('ENG', 'ping 192.168.10.10');
  assert.match(last(net, 'ENG'), /Request timed out|unreachable/, 'VLAN 20 is tagged 30 on R1');
  assert.equal(net.tasks()[0].done, false, 'the .20 tag is wrong');
  run(net, 'R1', ['en', 'conf t', 'int g0/0/1.20', 'encap dot1q 20', 'end']);
  net.tick(100);
  assert.equal(net.tasks()[0].done, true);
  net.exec('R1', 'show running-config interface g0/0/1.20');
  assert.match(last(net, 'R1'), /encapsulation dot1Q 20/);
}

{ // a serial link needs a clock rate on the DCE end
  const net = createNetwork({ booted: true, devices: [{ id: 'R1', model: 'ISR4321' }, { id: 'ISP', model: 'ISR4321', config: 'interface s0/1/0\n ip address 10.0.0.2 255.255.255.252\n no shutdown' }] });
  net.plug('serial', 'R1 S0/1/0', 'ISP S0/1/0');
  run(net, 'R1', ['en', 'conf t', 'int s0/1/0', 'ip add 10.0.0.1 255.255.255.252', 'no shut', 'end']);
  net.tick(100);
  assert.equal(net.ifStatus('R1', 'Serial0/1/0')[1], 'down', 'no clock yet');
  run(net, 'R1', ['conf t', 'int s0/1/0', 'clock rate 64000', 'end']);
  net.tick(100);
  assert.equal(net.ifStatus('R1', 'Serial0/1/0')[1], 'up');
  net.exec('R1', 'ping 10.0.0.2');
  assert.match(last(net, 'R1'), /Success rate is (80|100) percent/);
}
// A command in the wrong mode gets the IOS error, then a tip.
{
  const net = createNetwork(office, { booted: true });
  net.exec('R1', 'conf t');
  const ls = net.session('R1').lines.slice(-2);
  assert.match(ls[0].text, /% Invalid input detected/);
  assert.equal(ls[1].cls, 'tip');
  assert.match(ls[1].text, /enable/);
  run(net, 'R1', ['enable', 'conf t', 'show ip interface brief']);
  assert.match(last(net, 'R1'), /`do show ip interface brief`/);
  const quiet = createNetwork(office, { booted: true, tips: false });
  quiet.exec('R1', 'conf t');
  assert.match(last(quiet, 'R1'), /% Invalid input detected/);
}
console.log('engine: all checks passed');

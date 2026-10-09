# Lab Simulator Coverage: What "All the Basics" Means for CCNA ITN / SRWE / ENSA

Compiled 2026-10-08. Inputs: `docs/library/research/ccna-outline.md` (module lists), `octet/crates/octet-sim/src/cli.rs` (existing commands), and web searches for NetAcad activity lists.

**Confidence note.** NetAcad's Packet Tracer (PT) activity files are behind enrolment. Web search found only partial public lists (Pearson/Cisco Press "Labs and Study Guide" tables of contents, answer-key sites; itexamanswers.net was unreachable from this sandbox). Activity titles below are therefore a mix of confirmed titles (marked **[c]**) and titles reconstructed from module content and memory of the v7 courses (unmarked, treat as approximate: numbering and exact wording vary between v7.0 and v7.02). What each lab needs from the simulator is derived from the module objectives, so it holds even where a title is off. Confirmed sources: Pearson/Cisco Press ITN and ENSA Labs and Study Guide (CCNAv7); PT titles seen in ITN lists (2.3.7 Navigate the IOS, 2.5.5 Configure Initial Switch Settings, 2.7.6 Implement Basic Connectivity, 10.1.4 Configure Initial Router Settings, 11.5.5 Subnet an IPv4 Network, 4.6.5 Connect a Wired and Wireless LAN); ENSA OSPF/ACL/NAT titles.

## 0. Current state of `cli.rs` (the baseline)

The IOS-style CLI is table driven (`PATTERNS`), with `?` help, abbreviation and "Ambiguous command" errors. Modes: Exec, Config, Interface, Vlan (no line/router/dhcp-pool/acl modes yet). Device kinds: Router, Switch, Pc. The topology engine (`net.rs`) already does hop-by-hop L2 with VLAN tagging/flooding and L3 ping with a "fault" location. IPv4 only. There is no privilege split (user EXEC `>` vs `#` is only `enable`/`disable`), no passwords, no timers, no protocol engines.

Already implemented commands:
`enable`, `disable`, `configure terminal`, `end`, `exit`, `do` (from config modes), `hostname`, `interface <if>`, `shutdown`/`no shutdown`, `description`, `ip address <ip> <mask>` and `no ip address` (router interfaces only), `ip route <net> <mask> <nh>` and `no ip route`, `vlan <id>`, `no vlan <id>`, `name`, `switchport mode access|trunk`, `switchport access vlan`, `switchport trunk native vlan`, `switchport trunk allowed vlan [add|remove]`, `encapsulation dot1q <id> [native]` (subinterfaces), `show running-config [interface x]`, `show ip interface brief`, `show ip route` (router), `show vlan brief` (switch), `show interfaces trunk` (switch), `ping <ip>`, `copy running-config startup-config`, `write [memory]`. PC context: `ip <addr>/<prefix> [gw]`, `ping`, `show ip`, `ipconfig`.

---

## 1. Hands-on labs per module and what each demands of the simulator

Legend: **PT** = Packet Tracer activity, **Lab** = physical-gear lab (done in PT here). "Needs" lists simulator capabilities beyond the CLI baseline. Capability tags (C1...) are defined in section 3 and phased in section 4.

### 1.1 ITN (CCNA 1)

| Module | Hands-on activities | What the simulator must do |
|---|---|---|
| 1 Networking Today | PT: Logical and Physical Mode Exploration; PT: Network Representation | Device palette, topology canvas, cables, device types (PC, laptop, server, switch, router, AP). Mostly UI. |
| 2 Basic Switch & End Device Config | PT **[c]** 2.3.7 Navigate the IOS; PT **[c]** 2.5.5 Configure Initial Switch Settings; PT **[c]** 2.7.6 Implement Basic Connectivity; PT 2.9.1 Basic Switch and End Device Configuration; Lab: Basic Switch Configuration, Build a Switch and Host Network | User EXEC vs privileged EXEC, `?`/tab/abbreviation, hostname, banner, line console/vty passwords, `enable secret`, `service password-encryption`, `copy run start`, `reload`, `erase startup-config`, `show` family, SVI `interface vlan 1` with IP and default gateway, host IP config (static), ping, MAC address table basics. |
| 3 Protocols & Models | PT **[c]** 3.5.5 Investigate the TCP/IP and OSI Models in Action | PT "simulation mode": step through PDUs with layer-by-layer headers. Needs a packet/event trace (L2/L3/L4 header view). |
| 4 Physical Layer | PT **[c]** 4.6.5 Connect a Wired and Wireless LAN | Cable types (straight, crossover, console, fiber), wrong cable = link stays down (or auto-MDIX), link lights, AP + wireless client association (simple). |
| 5 Number Systems | none (quizzes only) | none. |
| 6 Data Link Layer | none significant | none. |
| 7 Ethernet Switching | Lab: View the Switch MAC Address Table; PT/Lab: View ARP table; Lab: Configure speed/duplex (Module 2/7) | MAC learning with aging, `show mac address-table`, `clear mac address-table dynamic`, flooding of unknown unicast, duplex/speed settings, store-and-forward vs cut-through concept only. |
| 8 Network Layer | Lab: Identify IPv4 addresses; PT: Use Wireshark to examine Ethernet frames (n/a) | IPv4 header (TTL, protocol), host routing decision (local vs default gateway), `ipconfig`, `show ip route` on router; connected + local routes (C/L). |
| 9 Address Resolution | PT: Examine the ARP Table; Lab: Use Wireshark to examine ARP/ND; PT: IPv6 neighbor discovery | ARP request/reply, ARP cache with aging on hosts and routers, `arp -a`, `show ip arp`, IPv6 NDP (NS/NA), `show ipv6 neighbors`. |
| 10 Basic Router Config | PT **[c]** 10.1.4 Configure Initial Router Settings; PT: Connect a Router to a LAN; PT: Troubleshoot Default Gateway Issues; Lab: Configure Basic Router Settings (dual-stack) | Router basics: interface IPv4 + IPv6 addresses, `ipv6 unicast-routing`, `show ip interface brief`, `show ipv6 interface brief`, `show interfaces`, `show ip route`, `show ipv6 route`, banner, passwords, `copy run start`; default gateway misconfig must make ping fail with right reason. |
| 11 IPv4 Addressing | PT **[c]** 11.5.5 Subnet an IPv4 Network; PT: Subnetting Scenario; PT: VLSM Design and Implementation (11.9.x) | Static IPv4 on many interfaces from a designed plan; checking is by connectivity (ping), so mask correctness (including /30, /27 etc.) must be enforced in L3 reachability. |
| 12 IPv6 Addressing | PT: Configure IPv6 Addressing; PT: Implement a Subnetted IPv6 Addressing Scheme; Lab: Identify IPv6 Addresses | `ipv6 address` (GUA/ULA, `eui-64`, `link-local`), LLA auto-gen, `ipv6 unicast-routing`, host IPv6 (static, SLAAC later), `ping ipv6`, `show ipv6 interface`. |
| 13 ICMP | PT: Verify IPv4 and IPv6 addressing; PT: Use Ping and Traceroute to Test Network Connectivity; Lab: Use Ping and Traceroute | `ping` with real-IOS codes (`!`, `.`, `U`, `Request timed out`, `Destination host unreachable`), `traceroute`/`tracert`, TTL expiry, ICMP unreachable from the right hop, extended ping (`ping` interactive, source/size/repeat). |
| 14 Transport Layer | Lab: Use Wireshark to Compare TCP and UDP (n/a) | Sim-mode only: show TCP handshake/ports in PDU inspector (optional). |
| 15 Application Layer | PT: Web/DNS/DHCP/Email services; PT: Observe DNS Name Resolution | Server device with HTTP, DNS, DHCP, (FTP/TFTP, email optional), host `nslookup`, URL fetch result. Server-side service panels. |
| 16 Network Security Fundamentals | PT: Configure Secure Passwords and SSH | `enable secret`, `service password-encryption`, `security passwords min-length`, `login block-for`, `username ... secret`, `ip domain-name`, `crypto key generate rsa`, `transport input ssh`, `login local`, `ssh` client from a host/router, `show ip ssh`, `show login`. |
| 17 Build a Small Network | PT: Implement a Small Network / Troubleshooting Challenge; Lab: Design and Build a Small Network; PT: Network Troubleshooting (Test connectivity, Troubleshoot Using Show and Host commands); Lab: Troubleshoot Connectivity Issues | Everything above combined; strong dependence on realistic faults (shutdown ports, wrong mask/gateway, duplex mismatch, missing route), `show interfaces`, `show running-config`, `show cdp neighbors`, host `ipconfig /all`, `tracert`, `netstat`, `nslookup`. |

### 1.2 SRWE (CCNA 2)

| Module | Hands-on activities | What the simulator must do |
|---|---|---|
| 1 Basic Device Config | PT 1.1.x Implement a Small Network (**[c]** seen as 1.6.1 in an SRWE listing); PT: Configure Switch Ports; PT: Configure SSH; Lab: Configure Basic Router/Switch Settings | Switch `interface range`, `speed`, `duplex`, `mdix auto`, `show interfaces status`, `show interfaces fa0/1` with counters (runts, giants, CRC, late collisions), `ip default-gateway`, SSH/vty hardening, `service password-encryption`. |
| 2 Switching Concepts | Lab: View the Switch MAC Address Table; PT: Frame forwarding / sim mode | Real MAC table (learning, aging 300 s, `show mac address-table [dynamic|address|vlan|interface]`), unknown unicast flooding, broadcast domain boundaries. |
| 3 VLANs | PT: VLAN Configuration; PT: Troubleshoot VLAN Configurations; PT: Configure Trunks, DTP; Lab: Implement VLANs and Trunking; Lab: Troubleshoot VLAN Configurations | VLAN database (`show vlan brief` full semantics, extended vlan 1002-1005 reserved), access/voice VLAN (`switchport voice vlan`), trunks, native VLAN mismatch (CDP/STP warning log), allowed list, DTP modes (`dynamic auto/desirable`, `nonegotiate`), `show interfaces trunk`, `show interfaces switchport`, `show dtp interface`, `show vlan`, ports in unknown VLAN, VLAN deleted = ports go inactive. |
| 4 Inter-VLAN Routing | PT: Router-on-a-Stick; PT: Configure Layer 3 Switching and SVIs; PT: Troubleshoot Inter-VLAN Routing; Lab: Implement Inter-VLAN Routing; Lab: Troubleshoot Inter-VLAN Routing | Router subinterfaces (done), SVIs `interface vlan X` on L3 switch, `ip routing`, `no switchport` routed ports, `show ip route`, `show interfaces vlan`, SVI up/up only if VLAN exists and an active port (or trunk) in it. L3 switch device kind. |
| 5 STP Concepts | PT: Observe STP Operation; PT: Configure Rapid PVST+; PT: Root bridge manipulation; Lab: Build a Switch Network with Redundant Links; Lab: Implement Rapid PVST+ (supplemental module adds PortFast, BPDU guard/filter, root guard, loop guard) | Real STP/RSTP engine per VLAN (BPDU exchange, root election, port roles and states, timers, TCN/topology change), `spanning-tree mode rapid-pvst`, `spanning-tree vlan X root primary|secondary`, `priority`, `portfast`, `bpduguard`, `bpdufilter`, `guard root`, `guard loop`, `cost`, `port-priority`, `show spanning-tree [vlan]`, `show spanning-tree summary`, `detail`. |
| 6 EtherChannel | PT: Configure EtherChannel (PAgP and LACP); PT: Troubleshoot EtherChannel; Lab: Implement and Troubleshoot EtherChannel | `channel-group X mode on|active|passive|desirable|auto`, `interface port-channel`, negotiation matching, member mismatch (speed/duplex/VLAN/mode) = suspended `(s)` / `(I)` flags, load balancing, STP sees bundle as one link, `show etherchannel summary`, `show etherchannel port-channel`, `show interfaces port-channel`. |
| 7 DHCPv4 | PT: Configure DHCPv4; PT: Troubleshoot DHCPv4; PT: Configure a router as DHCP client; Lab: Implement DHCPv4 | Router DHCP server (`ip dhcp pool`, `network`, `default-router`, `dns-server`, `domain-name`, `lease`, `ip dhcp excluded-address`), `ip helper-address` relay, `ip address dhcp` on router, hosts in DHCP mode (DORA with real delays), `show ip dhcp binding`, `show ip dhcp pool`, `show ip dhcp server statistics`, `debug ip dhcp server events`, host `ipconfig /renew /release`, APIPA 169.254.x.x on failure. |
| 8 SLAAC & DHCPv6 | PT: Configure SLAAC, Stateless DHCPv6, Stateful DHCPv6; Lab: Configure DHCPv6 | Router Advertisements (A/M/O flags), `ipv6 nd` options, `ipv6 dhcp pool`, `dns-server`, `address prefix`, `ipv6 dhcp server`, `ipv6 dhcp relay destination`, host SLAAC (EUI-64) + DHCPv6, `show ipv6 dhcp pool|binding`, `ipconfig` IPv6 output. |
| 9 FHRP Concepts | PT: HSRP Configuration / Troubleshoot HSRP; Lab: Implement HSRP | `standby X ip`, `priority`, `preempt`, `version 2`, `track`, virtual IP/MAC 0000.0C07.ACxx, states (Init, Listen, Speak, Standby, Active), hello 3 s / hold 10 s, failover when the active router link drops, `show standby [brief]`. |
| 10 LAN Security Concepts | (concepts); Lab/PT: Implement port security preview | none beyond Module 11. |
| 11 Switch Security Config | PT: Implement Port Security; PT: Mitigate VLAN Attacks (DTP, native VLAN, disable unused ports); PT: Implement DHCP Snooping; PT: Implement DAI; PT: Implement PortFast and BPDU Guard; Lab: Implement Switch Security | Port security (`maximum`, `mac-address sticky|static`, `violation shutdown|restrict|protect`, err-disabled, `errdisable recovery`), DHCP snooping (trusted ports, binding table, rate-limit, `ip dhcp snooping vlan`), DAI (`ip arp inspection vlan`, `trust`, drops spoofed ARP), BPDU guard err-disable on edge port, `show port-security [interface]`, `show ip dhcp snooping [binding]`, `show ip arp inspection`, `show errdisable recovery`. Needs an attacker device (rogue DHCP server, spoofing host). |
| 12 WLAN Concepts | (concepts) | none. |
| 13 WLAN Config | PT: Configure a Wireless Network (home router, WPA2 PSK); PT: Configure WLC WLAN (AireOS GUI); PT: Troubleshoot WLAN | Wireless router/AP device with SSID, channel, security, client association; WLC web GUI is a separate UI deliverable. Treat as **later/out of v1**. |
| 14 Routing Concepts | PT: Basic Router Configuration Review; Lab: Basic Router Config | Routing table codes C, L, S, S*, O; AD/metric; longest prefix match; `show ip route` exact format; gateway of last resort. |
| 15 IP Static Routing | PT: Configure IPv4 and IPv6 Static and Default Routes; PT: Configure Floating Static Routes; PT: Configure Static Host Routes; Lab: Configure IPv4/IPv6 Static and Default Routes | `ip route` (next-hop, exit-interface, fully specified, AD for floating, `0.0.0.0 0.0.0.0`, host /32), `ipv6 route`, `show ip route static`, `show ipv6 route`, route install/withdraw on link state change (floating static kicks in). |
| 16 Troubleshoot Static/Default | PT: Troubleshoot IPv4 and IPv6 Static and Default Routes | Realistic failure modes: missing return route, wrong next hop, recursive lookup failure, `show ip route` detail, `traceroute` showing where it dies. |

### 1.3 ENSA (CCNA 3)

| Module | Hands-on activities | What the simulator must do |
|---|---|---|
| 1 OSPF Concepts | PT: OSPF operation exploration (sim mode) | Show OSPF packets in PDU inspector (Hello, DBD, LSR, LSU, LSAck). |
| 2 OSPFv2 Config | PT **[c]** Single-Area OSPFv2 Configuration; PT **[c]** Propagate a Default Route in OSPFv2; PT **[c]** Verify Single-Area OSPFv2; PT: Determine the DR and BDR; PT: Modify Single-Area OSPFv2; Lab **[c]** Configure Single-Area OSPFv2 | `router ospf 1`, `router-id`, `network x wildcard area 0`, `passive-interface`, `ip ospf priority|cost|hello-interval|dead-interval`, `ip ospf network point-to-point`, `auto-cost reference-bandwidth`, `default-information originate`, adjacency state machine (Down, Init, 2-Way, ExStart, Exchange, Loading, Full), DR/BDR election, SPF, routes with `O` and `O*E2`, AD 110, `show ip ospf`, `show ip ospf neighbor`, `show ip ospf interface [brief]`, `show ip protocols`, `show ip route ospf`, `clear ip ospf process`, `debug ip ospf adj`. |
| 3 Network Security Concepts | Lab **[c]** Social Engineering; Lab **[c]** Explore DNS traffic | none (UI only). |
| 4 ACL Concepts | PT **[c]** Access Control List Demonstration | Per-packet ACL evaluation shown in sim mode (which ACE matched). |
| 5 ACL Config | PT **[c]** Configure Numbered Standard IPv4 ACLs; PT **[c]** Configure Named Standard ACLs; PT **[c]** Modify IPv4 ACLs; PT: Secure VTY with ACL (`access-class`); PT **[c]** Extended ACL scenarios; PT **[c]** IPv4 ACL Implementation Challenge; Lab **[c]** Configure and Modify Extended IPv4 ACLs; Lab: Troubleshoot ACLs | `access-list N permit|deny ...`, `ip access-list standard|extended NAME`, sequence numbers, `remark`, wildcard masks, `host`/`any`, protocols (ip/icmp/tcp/udp), port operators (eq, gt, lt, range), `established`, `ip access-group in|out`, `access-class` on vty, implicit deny, `show access-lists` (with hit counters), `show ip interface` (ACL applied), `no` / resequence edits, ACL-denied ping gives `U` (admin prohibited). |
| 6 NAT | PT **[c]** Investigate NAT Operations; PT **[c]** Configure Static NAT; PT **[c]** Configure Dynamic NAT; PT **[c]** Configure PAT; PT **[c]** Configure NAT for IPv4; Lab **[c]** Configure NAT for IPv4; PT: Troubleshoot NAT | `ip nat inside|outside`, `ip nat inside source static`, `ip nat pool`, `access-list` for source match, `ip nat inside source list X pool Y [overload]`, `overload interface`, translation table with ports, timeouts, `show ip nat translations [verbose]`, `show ip nat statistics`, `clear ip nat translation *`, `debug ip nat`. Sim mode must show rewritten headers. |
| 7 WAN Concepts | none (maybe PT: PPPoE/serial) | Serial interface / DCE clocking is optional. **Later**. |
| 8 VPN & IPsec | PT: GRE/IPsec demo (optional) | out of scope for v1. |
| 9 QoS | none | out of scope. |
| 10 Network Management | PT **[c]** Use CDP/LLDP to map topology; PT: Configure NTP; PT: Configure Syslog and NTP; PT: Backup/restore config via TFTP; Lab: Use SNMP/syslog | `cdp run`, `lldp run`, `show cdp neighbors [detail]`, `show lldp neighbors [detail]`, `no cdp enable`; `ntp server`, `ntp master`, `ntp authenticate`, `show ntp status|associations`, `clock set`, `show clock`; `logging host`, `logging trap`, `logging buffered`, `service timestamps`, `show logging`; `snmp-server community|host|location|contact`, `show snmp`; `copy running-config tftp:`, `copy tftp: running-config`, `show flash`, `show version`, `boot system`. Needs a TFTP server device. |
| 11 Network Design | none (concepts; Meraki) | none. |
| 12 Troubleshooting | PT: Troubleshoot Enterprise Networks 1/2/3; PT: Troubleshooting Challenge; Lab: Troubleshoot Using Network Documentation | Whole-stack fault injection: the lab engine must be able to ship pre-broken configs (the existing `lab.rs` TOML with checks supports this). Needs every `show` command to look right. |
| 13 Virtualization | none | none. |
| 14 Automation | PT: Explore REST/JSON; PT: Controller/Python (n/a) | none for v1. |
| Supplemental (v1.1) | AI/ML, Ansible, Terraform, REST auth | none (reading/quiz). |

Observation: roughly 85% of the interactive CCNA hands-on work is CLI configuration plus ping/traceroute verification on switches, routers, PCs and a few server types, in around 12 protocol families. Wireless GUI (WLC), VPN, QoS, WAN serial and automation can be deferred.

---

## 2. Command catalogue

Status key: **HAVE** = already in `cli.rs`; **V1** = needed for v1; **LATER** = after v1 (still plausible in CCNA labs but not required to "cover the basics"). "Key show output" lists outputs that must match real IOS formatting, because students are graded on reading them.

### 2.1 Basic device setup (modes, hostname, passwords, banners, config management)

| Command | Status |
|---|---|
| `enable`, `disable`, `configure terminal`, `end`, `exit`, `hostname` | HAVE |
| User EXEC prompt `>` vs privileged `#`, `exit` from user EXEC, `logout` | V1 (privilege levels not modelled) |
| `?` context help, abbreviation, `Ambiguous`/`Incomplete`/`Invalid input` markers with the caret `^` | HAVE (partly; verify caret and `% Incomplete command.`) |
| `do <exec cmd>` from config modes | HAVE |
| `copy running-config startup-config`, `write memory` | HAVE |
| `show startup-config`, `erase startup-config`, `reload` (with the confirm prompts and state reset to startup) | V1 |
| `enable secret`, `enable password`, `service password-encryption` | V1 |
| `line console 0`, `line vty 0 15`, `password`, `login`, `login local`, `exec-timeout`, `logging synchronous`, `transport input` | V1 (needs `Line` mode) |
| `banner motd #...#`, `banner login` | V1 |
| `username X privilege 15 secret Y` | V1 |
| `ip domain-name`, `crypto key generate rsa` (modulus prompt), `ip ssh version 2`, `ssh -l user host` from device | V1 |
| `security passwords min-length`, `login block-for ... attempts ... within`, `login on-failure log` | LATER |
| `ip domain-lookup` / `no ip domain-lookup` (the classic hang on typos), `ip name-server` | V1 (the "Translating..." delay is a recognisable realism cue) |
| `clock set`, `show clock`, `show version` (uptime, IOS string, interfaces count, config register), `show flash`, `show history`, `terminal length` | V1 for `show version`, `show clock`; LATER for the rest |
| `no` prefix generic, `default interface`, `interface range`, `interface range` macro | V1 for `interface range`; LATER for `default` |
| `show running-config` full ordered output (version, service lines, hostname, secrets, interfaces, router, ip route, line, end) incl. `show run | section/include/begin` and `| exclude` | HAVE (basic); V1 for the pipe filters |
| `show history`, command recall (up arrow), `Ctrl+Z`, `Ctrl+C`, `Ctrl+Shift+6` to abort | V1 (terminal UI) |

Key show output: `show running-config`, `show startup-config`, `show version`, `show history`, `show clock`.

### 2.2 Interfaces

| Command | Status |
|---|---|
| `interface <type> <num>`, `shutdown`, `no shutdown`, `description` | HAVE |
| `ip address <ip> <mask>`, `no ip address` (router) | HAVE |
| `ip address` on SVI / routed switchport | V1 |
| `interface range fa0/1 - 24` | V1 |
| `speed 10|100|1000|auto`, `duplex half|full|auto`, `mdix auto` | V1 |
| `interface loopback N`, `interface vlan N`, `interface port-channel N` | V1 |
| `ipv6 address X/len`, `ipv6 address X link-local`, `ipv6 address X/len eui-64`, `ipv6 enable`, `ipv6 unicast-routing` | V1 |
| `clock rate`, `bandwidth` | LATER (serial links), `bandwidth` V1 (OSPF cost) |
| `show ip interface brief` | HAVE |
| `show interfaces [x]` (status line, MTU/BW/DLY, duplex/speed, input/output rates, counters, errors) | V1 |
| `show interfaces status` (port, name, status, vlan, duplex, speed, type), `show interfaces description` | V1 |
| `show interfaces switchport`, `show ip interface [x]`, `show ipv6 interface [brief]`, `show controllers` | V1 (switchport, ip interface, ipv6 brief); LATER (controllers) |
| `show interface counters errors`, `clear counters` | V1 |
| `show running-config interface x` | HAVE |

Key show outputs (must look real): `show ip interface brief` (Status "administratively down", Protocol "down", Method manual/DHCP/unset), `show interfaces fa0/1` (the line `FastEthernet0/1 is up, line protocol is up (connected)`, `Full-duplex, 100Mb/s`, `0 input errors, 0 CRC, ...`), `show interfaces status` (`connected`, `notconnect`, `err-disabled`, `disabled`).

### 2.3 VLAN / trunk / DTP / VTP

| Command | Status |
|---|---|
| `vlan N`, `name`, `no vlan N` | HAVE |
| `switchport mode access|trunk`, `switchport access vlan`, `switchport trunk native vlan`, `switchport trunk allowed vlan [add|remove]` | HAVE |
| `switchport trunk allowed vlan all|except|none` | V1 |
| `switchport trunk encapsulation dot1q` (needed on L3-capable switch models; harmless on 2960) | V1 |
| `switchport mode dynamic auto|desirable`, `switchport nonegotiate`, DTP negotiation result | V1 |
| `switchport voice vlan N` | V1 |
| `switchport mode access` default behaviours (fa0/x default dynamic auto, VLAN 1) | V1 |
| `show vlan brief` | HAVE |
| `show vlan [id N|name X]`, `show interfaces switchport`, `show interfaces trunk` (HAVE), `show dtp interface` | V1 (except trunk, HAVE) |
| `vtp mode server|client|transparent|off`, `vtp domain`, `vtp password`, `vtp version`, `show vtp status`, revision numbers and propagation | LATER (not in v1.1 exam topics; appears in older CCNA 2 content and labs only as "disable VTP" at times, so V1 should at least accept `vtp mode transparent` and print `show vtp status`) |
| `vlan database`-era commands, extended range VLANs 1006-4094 | LATER |

Key show outputs: `show vlan brief` (VLAN 1002-1005 default rows, port lists wrapping), `show interfaces trunk` (4 blocks: Mode/Encapsulation/Status/Native, allowed, allowed and active, forwarding and not pruned), `show interfaces fa0/1 switchport` (Administrative/Operational Mode, Negotiation of Trunking).

### 2.4 STP / RSTP

| Command | Status |
|---|---|
| `spanning-tree mode pvst|rapid-pvst` | V1 |
| `spanning-tree vlan X priority N`, `root primary|secondary` | V1 |
| `spanning-tree portfast [default]`, `portfast edge` (newer syntax), `bpduguard enable|default`, `bpdufilter enable`, `guard root`, `guard loop`, `link-type point-to-point` | V1 |
| `spanning-tree cost`, `port-priority` (per interface and per VLAN) | V1 |
| `show spanning-tree`, `show spanning-tree vlan N`, `show spanning-tree summary`, `show spanning-tree detail`, `show spanning-tree interface x`, `show spanning-tree root`, `show spanning-tree inconsistentports` | V1 (basic, vlan, summary, root); LATER (detail, inconsistentports) |
| `debug spanning-tree events` | LATER |
| MST (`spanning-tree mst`) | out of scope |

Key show output: `show spanning-tree vlan 1` with the "Root ID" block (Priority, Address, "This bridge is the root" or Cost/Port), "Bridge ID" block (Priority = configured + sys-id-ext, Hello/Max Age/Forward Delay 2/20/15 s, Aging Time 300), and the interface table (Role `Root`/`Desg`/`Altn`/`Back`, Sts `FWD`/`BLK`/`LRN`/`LIS`/`DIS`, Cost, Prio.Nbr, Type `P2p`/`Shr`/`P2p Edge`). For rapid-pvst, the header reads `Spanning tree enabled protocol rstp` and roles/states are `Desg FWD` / `Altn BLK`.

### 2.5 EtherChannel

| Command | Status |
|---|---|
| `interface range ...` + `channel-group N mode on|active|passive|desirable|auto` | V1 |
| `channel-protocol lacp|pagp` | V1 |
| `interface port-channel N` + trunk/access/L3 config inherits to members | V1 |
| `no switchport` + `ip address` on port-channel (L3 EtherChannel) | V1 (v1.1 topic 2.4 says "Layer 2/Layer 3") |
| `port-channel load-balance src-dst-ip|src-dst-mac|...`, `lacp port-priority`, `lacp system-priority` | LATER |
| `show etherchannel summary`, `show etherchannel port-channel`, `show etherchannel detail`, `show interfaces port-channel N`, `show interfaces etherchannel`, `show lacp neighbor`, `show pagp neighbor` | V1 (summary, port-channel); LATER (rest) |

Key show output: `show etherchannel summary` with the flag legend (`D - down`, `I - stand-alone`, `s - suspended`, `H - Hot-standby`, `R - Layer3`, `S - Layer2`, `U - in use`, `P - bundled in port-channel`) and rows like `1 Po1(SU) LACP Fa0/1(P) Fa0/2(P)`; a mismatch must produce `(SD)` and `(s)`.

### 2.6 Inter-VLAN routing (ROAS and L3 switch SVIs)

| Command | Status |
|---|---|
| Router subinterface `interface g0/0.10`, `encapsulation dot1q 10 [native]`, `ip address` | HAVE |
| `interface vlan N` + `ip address` on switch (SVI) | V1 |
| `ip routing` on L3 switch, `no switchport` (routed port) | V1 |
| `ip default-gateway` on L2 switch | V1 |
| `show ip route`, `show ip interface brief` (SVI rows, "up/up" only when VLAN has an active port), `show interfaces vlan N` | HAVE (route, brief); V1 (rest) |
| `show vlans` (router, 802.1Q subinterface info) | LATER |
| Switch device model: 2960 (L2) and 3560/3650 (L3) distinct command sets (L2 refuses `ip routing`/`no switchport` with real error `% Invalid input detected`) | V1 |

### 2.7 Static and default routes (IPv4 and IPv6)

| Command | Status |
|---|---|
| `ip route net mask next-hop` | HAVE |
| `ip route net mask exit-interface`, `... exit-int next-hop`, `... [AD]` (floating), `ip route 0.0.0.0 0.0.0.0 ...`, host route /32, `permanent`, `name` | V1 |
| `ipv6 route prefix/len next-hop|exit-int [AD]`, `ipv6 route ::/0 ...`, `ipv6 unicast-routing` | V1 |
| `show ip route`, with full legend (Codes: L, C, S, R, O, ...), `Gateway of last resort is ... to network 0.0.0.0`, subnet header lines (`172.16.0.0/16 is variably subnetted, 3 subnets, 2 masks`), `[1/0]`, `[110/2]`, `via x, g0/0` | HAVE (basic form); V1 for full fidelity |
| `show ip route static|connected|ospf|<prefix>`, `show ipv6 route [static]`, `show ip route summary` | V1 (static, connected, ospf, prefix); LATER (summary) |
| `show ip protocols` | V1 (with OSPF) |
| Route withdrawal when the next hop interface goes down; recursive next-hop resolution | V1 |

Key show output: `show ip route` and `show ipv6 route` (codes legend, `C`/`L` pairs, `S*` and gateway of last resort, `O IA`, `O*E2`).

### 2.8 OSPFv2 single area

| Command | Status |
|---|---|
| `router ospf N`, `router-id A.B.C.D`, `network A wildcard area 0`, `passive-interface [default] x`, `default-information originate` | V1 |
| `ip ospf priority|cost|hello-interval|dead-interval`, `ip ospf network point-to-point|broadcast`, `ip ospf N area 0` | V1 |
| `auto-cost reference-bandwidth N`, `bandwidth`, `maximum-paths` | V1 (first two); LATER (maximum-paths) |
| `show ip ospf`, `show ip ospf neighbor`, `show ip ospf interface [brief]`, `show ip protocols`, `show ip route ospf`, `show ip ospf database` | V1 (all but database); LATER (database) |
| `clear ip ospf process`, `debug ip ospf adj|events|hello` | V1 (clear); LATER (debug) |
| Multi-area, authentication, summarisation, OSPFv3 | LATER (OSPFv3 returns in CCNA v2.0, Feb 2027) |

Key show output: `show ip ospf neighbor` (`Neighbor ID  Pri  State  Dead Time  Address  Interface`, states like `FULL/DR`, `FULL/BDR`, `FULL/  -`, `2WAY/DROTHER`), `show ip ospf interface brief`, `show ip protocols` (Routing Protocol is "ospf 10", Router ID, networks, Passive Interface(s), Distance: (default is 110)).

### 2.9 DHCPv4 (server / relay / client)

| Command | Status |
|---|---|
| `ip dhcp excluded-address a [b]`, `ip dhcp pool NAME`, `network`, `default-router`, `dns-server`, `domain-name`, `lease`, `option 150` | V1 (pool mode needed) |
| `ip helper-address A` (interface) | V1 |
| `ip address dhcp` (router/SVI client) | V1 |
| `show ip dhcp binding|pool|server statistics|conflict` | V1 (binding, pool); LATER (rest) |
| `debug ip dhcp server events|packet` | LATER |
| Host DHCP mode, `ipconfig /release`, `/renew`, `/all` | V1 |
| `no service dhcp` | LATER |

### 2.10 SLAAC / DHCPv6

| Command | Status |
|---|---|
| `ipv6 nd ra suppress`, `ipv6 nd other-config-flag`, `ipv6 nd managed-config-flag`, `ipv6 nd prefix` | V1 (flags) / LATER (rest) |
| `ipv6 dhcp pool`, `address prefix`, `dns-server`, `domain-name`, `ipv6 dhcp server POOL`, `ipv6 dhcp relay destination` | V1 (SRWE Module 8 labs need stateless and stateful) |
| `show ipv6 dhcp pool|binding`, `show ipv6 neighbors`, `show ipv6 interface` | V1 |

### 2.11 FHRP / HSRP

| Command | Status |
|---|---|
| `standby version 2`, `standby N ip A`, `priority`, `preempt`, `timers`, `track`, `authentication` | V1 (ip, priority, preempt, version, timers); LATER (track, auth) |
| `show standby`, `show standby brief` | V1 |
| `vrrp`, `glbp` | LATER (v2.0 names VRRP) |

Key show output: `show standby brief` (`Interface Grp Pri P State Active Standby Virtual IP`, `Active`/`Standby`/`Listen`, `local`/`unknown`).

### 2.12 Port security

| Command | Status |
|---|---|
| `switchport port-security`, `maximum N`, `mac-address X|sticky`, `violation protect|restrict|shutdown`, `aging time|type` | V1 |
| `errdisable recovery cause psecure-violation`, `errdisable recovery interval`, `shutdown`/`no shutdown` to recover | V1 |
| `show port-security`, `show port-security interface x`, `show port-security address` | V1 |
| `show errdisable recovery`, `show interfaces status err-disabled` | V1 |

### 2.13 DHCP snooping and DAI

| Command | Status |
|---|---|
| `ip dhcp snooping`, `ip dhcp snooping vlan N`, `ip dhcp snooping trust` (interface), `ip dhcp snooping limit rate N`, `ip dhcp snooping information option` (`no`), `show ip dhcp snooping [binding]` | V1 |
| `ip arp inspection vlan N`, `ip arp inspection trust`, `ip arp inspection validate src-mac dst-mac ip`, `ip arp inspection limit rate`, `show ip arp inspection [interfaces|statistics]` | V1 |
| `ip verify source` (IP source guard) | LATER |
| `storm-control` (v2.0 topic) | LATER |

### 2.14 ACLs (standard / extended / named)

| Command | Status |
|---|---|
| `access-list 1-99 permit|deny source [wildcard]`, `access-list 100-199 permit|deny proto src wc dst wc [eq port]` | V1 |
| `ip access-list standard|extended NAME` + ACE lines with sequence numbers, `remark`, `no <seq>` | V1 |
| `ip access-group NAME|N in|out` (interface), `access-class N in` (line vty) | V1 |
| `host`, `any`, wildcard math, `eq/gt/lt/neq/range`, `established`, `log` | V1 (all except `log`); LATER (`log`) |
| `show access-lists [name]` with `(N matches)`, `show ip access-lists`, `show ip interface x` ("Inbound access list is ..."), `show run | section access` | V1 |
| IPv6 ACLs (`ipv6 access-list`, `ipv6 traffic-filter`) | LATER |

### 2.15 NAT / PAT

| Command | Status |
|---|---|
| `ip nat inside|outside` (interface) | V1 |
| `ip nat inside source static local global` | V1 |
| `ip nat pool NAME start end netmask|prefix-length` | V1 |
| `ip nat inside source list N pool NAME [overload]`, `... list N interface X overload` | V1 |
| `show ip nat translations [verbose]`, `show ip nat statistics`, `clear ip nat translation *`, `debug ip nat` | V1 (first three); LATER (debug) |
| NAT64 / outside source NAT | out of scope |

Key show output: `show ip nat translations` (`Pro Inside global  Inside local  Outside local  Outside global`, `icmp 209.165.200.225:1 192.168.10.10:1 209.165.201.1:1 209.165.201.1:1`, `tcp ...`).

### 2.16 NTP / syslog / SNMP / CDP / LLDP

| Command | Status |
|---|---|
| `ntp server A`, `ntp master [stratum]`, `ntp authenticate`, `ntp authentication-key`, `ntp trusted-key`, `ntp update-calendar`, `show ntp status|associations`, `show clock detail` | V1 (server/master/status/associations); LATER (auth) |
| `logging host A`, `logging trap LEVEL`, `logging buffered`, `logging console`, `logging source-interface`, `service timestamps log datetime`, `show logging`, severity levels 0-7 and facility names | V1 |
| `snmp-server community X ro|rw [acl]`, `snmp-server host A version 2c X`, `snmp-server location|contact`, `snmp-server enable traps`, `show snmp`, `show snmp community` | V1 (config accepted, `show snmp` real-looking); LATER (SNMPv3, actual SNMP polling) |
| `cdp run`, `cdp enable` (interface), `show cdp`, `show cdp neighbors [detail]`, `show cdp interface` | V1 |
| `lldp run`, `lldp transmit|receive`, `show lldp neighbors [detail]`, `show lldp` | V1 |
| TFTP: `copy running-config tftp:`, `copy tftp: running-config`, `show flash:` | V1 (needs a TFTP server device); LATER (IOS image upgrade `copy tftp: flash:`) |

Key show outputs: `show cdp neighbors` (`Device ID  Local Intrfce  Holdtme  Capability  Platform  Port ID`, capability codes R S I), `show cdp neighbors detail`, `show lldp neighbors`, `show ntp status` (`Clock is synchronized, stratum 2, reference is ...`), `show logging`.

### 2.17 Password / AAA basics

| Command | Status |
|---|---|
| Local passwords (see 2.1), `login local`, `username` | V1 |
| `aaa new-model`, `aaa authentication login default local|group radius|tacacs+`, `radius server`, `tacacs server`, `show aaa` | LATER (concept only in CCNA; v2.0 adds client config) |
| `ip ssh version 2`, `show ip ssh`, `show ssh`, `show users`, `show sessions`, `telnet` client | V1 |
| 802.1X (`dot1x`) | out of scope |

### 2.18 Show / debug commands (cross-cutting)

Must exist in v1 and look right: `show version`, `show running-config`, `show startup-config`, `show interfaces [status|trunk|switchport|description]`, `show ip interface [brief]`, `show ipv6 interface brief`, `show vlan brief`, `show mac address-table`, `show arp` / `show ip arp`, `show ip route`, `show ipv6 route`, `show ip protocols`, `show cdp neighbors`, `show spanning-tree`, `show etherchannel summary`, `show standby brief`, `show ip dhcp binding`, `show port-security`, `show access-lists`, `show ip nat translations`, `show logging`, `show clock`, `show flash`, `show history`, `show users`, `show ip ssh`.

Debug (V1 for a small set so students see the router "think"): `debug ip icmp`, `debug ip packet` (optional), `debug ip routing`, `debug ip ospf adj`, `debug spanning-tree events`, `debug ip dhcp server events`, `debug ip nat`, `undebug all` / `no debug all`, `terminal monitor`. Everything else LATER. Real IOS has no debug in user EXEC, so debug needs privilege `#`.

### 2.19 PC / host commands

| Command | Status |
|---|---|
| `ip <addr>/<prefix> [gw]` (VPC-style), `ping <ip>`, `show ip`, `ipconfig` | HAVE |
| Windows-style `ipconfig /all`, `/release`, `/renew`, `/displaydns`, `ping` with `-n/-t/-l`, `tracert`, `arp -a`, `nslookup`, `netstat` | V1 (ipconfig variants, ping options, tracert, arp -a); LATER (nslookup, netstat) |
| IPv6 host config (static GUA/LLA), SLAAC, `ping ipv6`, `ipconfig` IPv6 lines | V1 |
| Host DHCP/static toggle, DNS server, gateway fields | V1 |
| Host `telnet`/`ssh -l user ip` | V1 |
| Host terminal (console cable) emulating `Terminal` app on PC, `Desktop > Command Prompt` | V1 (UI) |
| Server device: DHCP, DNS, HTTP, TFTP, syslog, NTP, FTP, email panels | V1 (DHCP, DNS, HTTP, TFTP, syslog, NTP); LATER (FTP, email) |
| Wireless: AP, laptop, SSID/PSK | LATER |

Key outputs: Windows `ipconfig`/`ipconfig /all`, `ping` (`Reply from 192.168.1.1: bytes=32 time<1ms TTL=128`, `Request timed out.`, `Reply from x: Destination host unreachable.`, statistics block), `tracert` (`Tracing route to ... over a maximum of 30 hops:`), `arp -a`.

---

## 3. Behaviours that matter for realism

Ranked by how much student understanding depends on them (capability tags used in section 1 and 4).

1. **Link state follows cabling and admin state (C1).** A link is up only when both ends are cabled, neither side is `shutdown`, cable type is compatible (straight vs crossover, modern auto-MDIX makes this mostly moot but PT still shows red/green dots), and speed/duplex are compatible. Console messages: `%LINK-3-UPDOWN: Interface FastEthernet0/1, changed state to up` then `%LINEPROTO-5-UPDOWN: Line protocol on Interface ..., changed state to up` printed to the console of that device (async to whatever the student is typing). `show ip interface brief` must reflect `up/up`, `up/down`, `down/down`, `administratively down/down`. Status after plug-in on a switch is not instantaneous (see 3 below).
2. **Port LEDs and PT-style link dots (C1).** Link light colours: green steady (up, forwarding), amber (STP blocking/listening/learning, then turns green after 30 s in classic STP; ~2 s in RSTP edge/PortFast), off (down), red/amber blinking for err-disabled. The existing lab map UI can show this.
3. **STP convergence timing (C5).** Classic PVST+: Blocking(20 s max age) → Listening(15) → Learning(15) → Forwarding, so a newly connected port without PortFast is unusable for ~30 s; on Rapid PVST+, proposal/agreement makes P2P links forward in about a second, edge ports immediately. A simulated clock that can be fast-forwarded (a "time warp" button, and `show` outputs that depend on it) is needed so students see the 30 s without waiting. After a topology change, MAC table is flushed quickly (TCN). The first ping after connecting a PC often fails or drops the first packets on non-PortFast ports; that is a real lesson.
4. **ARP (C2).** Hosts and routers ARP before the first IP packet to a neighbour. First `ping` shows the first reply lost (`Request timed out.` / `.!!!!`) on both Windows (first of four) and IOS (first `.`) because of the ARP exchange; students learn from this. ARP cache with timeout (4 h on IOS, ~2 min on hosts), `arp -a`, `show ip arp`, `clear arp-cache`. ARP over VLANs and trunks must be broadcast-correct.
5. **MAC learning and aging (C2).** Source MAC learned per VLAN per port, aging 300 s, `show mac address-table` with `DYNAMIC`/`STATIC`/`SECURITY` types, flood unknown unicast within the VLAN, move detection (flapping MAC `%SW_MATM-4-MACFLAP_NOTIF`), table flush on STP topology change. The table must start empty after power-up and fill only as frames pass (this is the core ITN 7 and SRWE 2 lesson).
6. **CDP neighbours appear only after cabling and a CDP timer (C7).** CDP advertises every 60 s (hold 180 s); real devices show neighbours within about a minute of link up (immediately after the first advertisement on link-up in practice). Simulating with a visible delay or a first-advert-on-link-up makes `show cdp neighbors` credible. LLDP default is off on routers/switches in PT/IOS and 30 s timer. CDP also detects native VLAN mismatch (`%CDP-4-NATIVE_VLAN_MISMATCH`) and duplex mismatch (`%CDP-4-DUPLEX_MISMATCH`), both classic lab teaching moments.
7. **Interface counters (C1).** Input/output packets and bytes, broadcasts, input errors, CRC, runts, giants, collisions, late collisions, output drops, 5-minute rates, "last clearing of counters never", `clear counters` confirm. Counters increment from simulated traffic; duplex mismatch must produce CRC/late collisions/runts on the right side (half-duplex side sees late collisions, full-duplex side sees CRC/runts).
8. **Duplex/speed mismatch (C1).** Hard speed mismatch: link stays down. Auto vs hard-set duplex: auto side falls back to half at 10/100 → duplex mismatch: link is up but throughput collapses, errors increment, CDP duplex-mismatch log. `show interfaces status` shows `a-full`/`a-100` (auto-negotiated) vs `full`/`100`. 1000 Mb/s requires auto-negotiation.
9. **Err-disabled (C9).** Port security violation (shutdown mode), BPDU guard on a PortFast port receiving BPDU, EtherChannel misconfig guard, DHCP snooping rate-limit exceed, loop guard/root guard inconsistent (different state, not err-disabled). Port goes `down (err-disabled)`, log `%PM-4-ERR_DISABLE: psecure-violation error detected on Fa0/1, putting Fa0/1 in err-disable state`, recovery by `shutdown`/`no shutdown` or `errdisable recovery` after interval. `show interfaces status` shows `err-disabled`.
10. **Routing realism (C3).** Connected/local routes appear only when the interface is up/up and addressed; static routes with an unreachable next hop are not installed; floating statics appear when primary disappears; ICMP "U" (unreachable) from the router that has no route, `Destination host unreachable` vs `Request timed out` distinction (the former from a router with no route, the latter from silent drops/ACL-less failures/ARP failure), TTL decrement and `tracert` hops with the right source IP of each router's ingress interface.
11. **Convergence timers for routing and FHRP (C6/C8).** OSPF dead timer (40 s on broadcast, 4 x hello), HSRP hold (10 s). Link down triggers fast reaction. With a time-warp control this stays understandable.
12. **DHCP timing and messages (C4).** DORA, offered IP excluded-address logic, lease times, APIPA fallback, rogue server competition, DHCP snooping dropping offers on untrusted ports with log.
13. **IOS console feel (C0).** Asynchronous log messages interrupting the prompt (`logging synchronous` on lines fixes it), `--More--` paging (terminal length 24), `Building configuration...` + `[OK]`, `Translating "xxx"...domain server (255.255.255.255)` delay on mistyped commands, `% Ambiguous command:`, `% Incomplete command.`, `% Invalid input detected at '^' marker.`, config-mode prompts `(config-if)#`, `(config-line)#`, `(config-router)#`, `(config-vlan)#`, `(dhcp-config)#`, `(config-std-nacl)#`, `(config-ext-nacl)#`, `Router#reload` confirm, `Proceed with reload? [confirm]`.
14. **Boot sequence and persistence (C0).** Startup-config vs running-config split, `reload` discarding unsaved changes (a classic mistake), `erase startup-config`, config register not needed.
15. **Packet-level visibility (C10).** PT's Simulation mode is what ITN modules 3, 9, 14 and ENSA 1/4/6 lean on: step through PDUs, see per-hop headers (Ethernet, IP, ICMP/TCP/UDP), see which ACL line, NAT rewrite or ARP exchange occurred. The existing `Fault` record in `net.rs` ("where and why traffic stopped") is the seed for this; extend it to a full per-hop event trace.
16. **Time (C0).** A single simulated clock with real-time and fast-forward modes drives STP, OSPF, DHCP leases, ARP/MAC aging, NTP, syslog timestamps, CDP.

---

## 4. Suggested implementation phases

Order is by how many labs each phase unlocks and by dependency (device model and clock first, protocols that need a clock later).

**Phase 0: Foundations (mostly present).** Mode set extended (user EXEC, line, router, dhcp pool, ACL, config-if-range), privilege split, `|` filters, `--More--`, simulated clock with fast-forward, console log messages, startup vs running config, `reload`. Unlocks ITN 2, 10, 16 (passwords, banner, SSH config accepted).

**Phase 1: Layer 1/2 truth (C1, C2).** Link state engine with logging, speed/duplex/err-disabled, MAC table with learning/aging/flood, ARP on hosts/routers, interface counters, `show interfaces [status]`, `show mac address-table`, `show arp`, `interface range`, ICMP result codes, Windows-style `ping`/`tracert`/`ipconfig`/`arp -a`. Unlocks ITN 2, 4, 7, 9, 13, 17 and SRWE 1, 2.

**Phase 2: VLAN completeness (V1 gaps).** `show interfaces switchport`, voice VLAN, DTP, allowed-VLAN extras, native VLAN mismatch logs, SVI on L2/L3 switch, `ip routing`, `no switchport`, L3 switch model, `show vlan` variants. Unlocks SRWE 3 and 4 fully (L3 switch part).

**Phase 3: IP routing core (C3).** IPv6 addresses and `ipv6 unicast-routing`, full `show ip route`/`ipv6 route` fidelity (codes, AD, metric, gateway of last resort, variably subnetted headers), static route variants (exit-interface, floating, host, default), ND, `ping ipv6`, `traceroute`. Unlocks ITN 10, 12, 13 and SRWE 14, 15, 16.

**Phase 4: Services (C4).** DHCPv4 server/relay/client (router + hosts), DHCPv6 and SLAAC (RA flags), DNS/HTTP/TFTP/syslog/NTP server devices, `ntp`, `logging`, `snmp-server` accept-and-show, CDP/LLDP (C7). Unlocks ITN 15, SRWE 7, 8, ENSA 10.

**Phase 5: STP + EtherChannel (C5).** Timer-driven (R)PVST+ engine, root election, roles/states, PortFast, BPDU guard/filter, root/loop guard, EtherChannel (static, LACP, PAgP) with STP integration. Unlocks SRWE 5, 6 and the v1.1 supplemental module. This is the biggest single engine; it depends on the clock and link engine (Phases 0-1).

**Phase 6: L2 security (C9).** Port security, DHCP snooping, DAI, err-disable recovery, attacker/rogue devices. Needs MAC table (P1), DHCP (P4), ARP (P1), STP guards (P5). Unlocks SRWE 11.

**Phase 7: ACL + NAT (C3 extension).** Wildcard match, standard/extended/named, sequence editing, hit counters, `access-class`, NAT static/dynamic/PAT with translation table and port allocation. Unlocks ENSA 4, 5, 6.

**Phase 8: OSPFv2 + HSRP (C6, C8).** Neighbour state machine, DR/BDR, LSDB-lite or SPF computed directly from topology (cheaper: compute SPF from the real adjacency graph, fake the packet exchange but keep the states and timers), default-route origination; HSRP election/failover. Unlocks ENSA 1, 2 and SRWE 9.

**Phase 9: Observability and polish (C10).** Simulation mode / PDU inspector, `debug` commands, event list, grading hooks (`Check` in `lab.rs`), shipping troubleshooting labs with injected faults (ENSA 12, ITN 17, SRWE 4/16).

**Later (post-v1):** WLC/AP GUI and wireless clients (SRWE 12-13), VTP, AAA/RADIUS/TACACS+, IPv6 ACLs and DHCPv6 relay details, GRE/IPsec/QoS demos, OSPFv3/VRRP (CCNA v2.0 from 2027-02-03), SNMP polling, serial/PPP WAN, REST/Python automation.

**Scope decision worth making early:** whether PCs run a Windows-like desktop shell (Command Prompt with real `ipconfig` text) in addition to the existing VPC-style `ip x/y gw` console. CCNA courses and exam questions use Windows `ipconfig`/`ping`/`tracert` output, so the Windows-style host output should be V1; the VPC-style form can stay as a convenience.

---

## Sources

- `docs/library/research/ccna-outline.md` (module lists, exam-topic mapping, hard spots).
- `octet/crates/octet-sim/src/cli.rs` (`PATTERNS` table and `Act` enum for the HAVE column).
- [Introduction to Networks Labs and Study Guide (CCNAv7), Pearson](https://www.pearson.com/store/en-gb/p/introduction-to-networks-labs-and-study-guide-ccnav7/P200000009502/9780136634454) (ITN activity titles/numbers).
- [Enterprise Networking, Security, and Automation Labs and Study Guide (CCNAv7), Cisco Press](https://www.ciscopress.com/store/ccna-3-v7-labs-study-guide-9780136634690) (ENSA activity titles per chapter).
- [Cisco NetAcad CCNA2 SRWE Education Standards](https://go.netacad.com/rs/059-VFZ-834/images/Cisco%20NetAcad%20CCNA2%20SRWE%20Education%20Standards.pdf) (not opened; listed by search).
- [ITExamAnswers Packet Tracer lab list](https://itexamanswers.net/cisco-packet-tracer-lab-answers.html) (search result only; fetch was blocked, so SRWE and parts of ENSA titles are reconstructed, not verified).

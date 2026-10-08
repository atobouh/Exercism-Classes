//! What the `show` commands print, formatted the way IOS prints them.

use crate::device::{Kind, PortMode};
use crate::iface;
use crate::net::{PingResult, Topology};
use std::collections::BTreeSet;
use std::fmt::Write;
use std::net::Ipv4Addr;

/// Compresses 1,2,3,5,10,11 into "1-3,5,10-11".
pub fn vlan_ranges(v: &BTreeSet<u16>) -> String {
    let mut out: Vec<String> = Vec::new();
    let mut it = v.iter().copied().peekable();
    while let Some(start) = it.next() {
        let mut end = start;
        while it.peek() == Some(&(end + 1)) {
            end = it.next().unwrap();
        }
        out.push(if start == end { start.to_string() } else { format!("{start}-{end}") });
    }
    out.join(",")
}

fn iface_block(topo: &Topology, device: &str, name: &str) -> String {
    let d = topo.device(device).unwrap();
    let i = d.iface(name).unwrap();
    let mut s = format!("interface {}\n", i.name);
    if let Some(desc) = &i.description {
        let _ = writeln!(s, " description {desc}");
    }
    if let Some(e) = i.encapsulation {
        let _ = writeln!(s, " encapsulation dot1Q {}{}", e.vlan, if e.native { " native" } else { "" });
    }
    if let Some(sp) = &i.switchport {
        if sp.mode == PortMode::Access && sp.access_vlan != 1 {
            let _ = writeln!(s, " switchport access vlan {}", sp.access_vlan);
        }
        if sp.native_vlan != 1 {
            let _ = writeln!(s, " switchport trunk native vlan {}", sp.native_vlan);
        }
        if let Some(a) = &sp.allowed {
            let _ = writeln!(s, " switchport trunk allowed vlan {}", if a.is_empty() { "none".to_string() } else { vlan_ranges(a) });
        }
        let _ = writeln!(s, " switchport mode {}", if sp.mode == PortMode::Trunk { "trunk" } else { "access" });
    }
    if d.kind == Kind::Router {
        match i.ip {
            Some(n) => {
                let _ = writeln!(s, " ip address {} {}", n.addr, n.mask());
            }
            None => s.push_str(" no ip address\n"),
        }
    }
    if i.shutdown {
        s.push_str(" shutdown\n");
    }
    s
}

pub fn running_config(topo: &Topology, device: &str) -> String {
    let Some(d) = topo.device(device) else { return String::new() };
    if d.kind == Kind::Pc {
        return pc_ip(topo, device);
    }
    let mut s = String::from("Building configuration...\n\nCurrent configuration:\n!\n");
    let _ = writeln!(s, "hostname {}\n!", d.name);
    for (v, name) in &d.vlans {
        if *v != 1 {
            let _ = writeln!(s, "vlan {v}\n name {name}\n!");
        }
    }
    for i in &d.interfaces {
        s.push_str(&iface_block(topo, device, &i.name));
        s.push_str("!\n");
    }
    for r in &d.routes {
        let _ = writeln!(s, "ip route {} {} {}", r.net.network(), r.net.mask(), r.next_hop);
    }
    s.push_str("!\nend");
    s
}

/// The config as plain lines, for comparing before and after.
pub fn config_lines(topo: &Topology, device: &str) -> Vec<String> {
    running_config(topo, device)
        .lines()
        .skip_while(|l| !l.starts_with("hostname"))
        .filter(|l| *l != "!" && *l != "end")
        .map(str::to_string)
        .collect()
}

pub fn running_config_iface(topo: &Topology, device: &str, name: &str) -> String {
    let block = iface_block(topo, device, name);
    format!("Building configuration...\n\nCurrent configuration : {} bytes\n!\n{}end", block.len(), block)
}

pub fn ip_int_brief(topo: &Topology, device: &str) -> String {
    let d = topo.device(device).unwrap();
    let mut s = format!("{:<23}{:<16}{:<4}{:<7}{:<22}{}\n", "Interface", "IP-Address", "OK?", "Method", "Status", "Protocol");
    for i in &d.interfaces {
        let (st, pr) = topo.status(device, &i.name);
        let (ip, method) = match i.ip {
            Some(n) => (n.addr.to_string(), "manual"),
            None => ("unassigned".into(), "unset"),
        };
        let name = if iface::is_subinterface(&i.name) { i.short() } else { i.name.clone() };
        let _ = writeln!(s, "{:<23}{:<16}{:<4}{:<7}{:<22}{}", name, ip, "YES", method, st, pr);
    }
    s.trim_end().to_string()
}

pub fn vlan_brief(topo: &Topology, device: &str) -> String {
    let d = topo.device(device).unwrap();
    let mut s = String::from("VLAN Name                             Status    Ports\n---- -------------------------------- --------- -------------------------------\n");
    for (v, name) in &d.vlans {
        let ports: Vec<String> = d
            .interfaces
            .iter()
            .filter(|i| i.switchport.as_ref().is_some_and(|sp| sp.mode == PortMode::Access && sp.access_vlan == *v))
            .map(|i| i.short())
            .collect();
        let mut chunks = ports.chunks(4);
        let first = chunks.next().map(|c| c.join(", ")).unwrap_or_default();
        let _ = writeln!(s, "{:<5}{:<33}{:<10}{}", v, name, "active", first);
        for c in chunks {
            let _ = writeln!(s, "{:<48}{}", "", c.join(", "));
        }
    }
    s.trim_end().to_string()
}

pub fn interfaces_trunk(topo: &Topology, device: &str) -> String {
    let d = topo.device(device).unwrap();
    let trunks: Vec<_> = d.interfaces.iter().filter(|i| i.switchport.as_ref().is_some_and(|sp| sp.mode == PortMode::Trunk)).collect();
    if trunks.is_empty() {
        return String::new();
    }
    let mut s = format!("{:<12}{:<13}{:<15}{:<14}{}\n", "Port", "Mode", "Encapsulation", "Status", "Native vlan");
    for i in &trunks {
        let sp = i.switchport.as_ref().unwrap();
        let st = if topo.status(device, &i.name).0 == "up" { "trunking" } else { "not-trunking" };
        let _ = writeln!(s, "{:<12}{:<13}{:<15}{:<14}{}", i.short(), "on", "802.1q", st, sp.native_vlan);
    }
    let _ = writeln!(s, "\n{:<12}Vlans allowed on trunk", "Port");
    for i in &trunks {
        let sp = i.switchport.as_ref().unwrap();
        let allowed = sp.allowed.as_ref().map_or("1-4094".to_string(), |a| if a.is_empty() { "none".into() } else { vlan_ranges(a) });
        let _ = writeln!(s, "{:<12}{}", i.short(), allowed);
    }
    let _ = writeln!(s, "\n{:<12}Vlans allowed and active in management domain", "Port");
    for i in &trunks {
        let sp = i.switchport.as_ref().unwrap();
        let active: BTreeSet<u16> = d.vlans.keys().copied().filter(|v| sp.allows(*v)).collect();
        let _ = writeln!(s, "{:<12}{}", i.short(), vlan_ranges(&active));
    }
    s.trim_end().to_string()
}

pub fn ip_route(topo: &Topology, device: &str) -> String {
    let d = topo.device(device).unwrap();
    let mut s = String::from("Codes: L - local, C - connected, S - static\n\nGateway of last resort is not set\n\n");
    for i in d.l3_ifaces() {
        if topo.status(device, &i.name).0 != "up" {
            continue;
        }
        let n = i.ip.unwrap();
        let _ = writeln!(s, "C        {}/{} is directly connected, {}", n.network(), n.prefix, i.name);
        let _ = writeln!(s, "L        {}/32 is directly connected, {}", n.addr, i.name);
    }
    for r in &d.routes {
        let _ = writeln!(s, "S        {}/{} [1/0] via {}", r.net.network(), r.net.prefix, r.next_hop);
    }
    s.trim_end().to_string()
}

pub fn pc_ip(topo: &Topology, device: &str) -> String {
    let d = topo.device(device).unwrap();
    let nic = d.iface("eth0");
    let (ip, mask) = nic.and_then(|i| i.ip).map_or(("0.0.0.0/0".to_string(), "0.0.0.0".to_string()), |n| (format!("{}/{}", n.addr, n.prefix), n.mask().to_string()));
    format!(
        "NAME        : {}\nIP/MASK     : {} ({})\nGATEWAY     : {}",
        d.name,
        ip,
        mask,
        d.gateway.map_or("0.0.0.0".to_string(), |g| g.to_string())
    )
}

pub fn ping(topo: &Topology, device: &str, dst: Ipv4Addr, r: &PingResult) -> String {
    let is_pc = topo.device(device).is_some_and(|d| d.kind == Kind::Pc);
    if is_pc {
        // VPCS style, as in GNS3.
        if r.ok {
            let ttl = 64u8.saturating_sub(r.hops);
            (1..=5).map(|n| format!("84 bytes from {dst} icmp_seq={n} ttl={ttl} time={}.{} ms", 1 + n % 2, (n * 37) % 10)).collect::<Vec<_>>().join("\n")
        } else {
            (1..=5).map(|n| format!("{dst} icmp_seq={n} timeout")).collect::<Vec<_>>().join("\n")
        }
    } else {
        let marks = if r.ok { "!!!!!" } else { "....." };
        let rate = if r.ok { "100 percent (5/5)" } else { "0 percent (0/5)" };
        format!("Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to {dst}, timeout is 2 seconds:\n{marks}\nSuccess rate is {rate}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ranges_compress() {
        let v: BTreeSet<u16> = [1, 2, 3, 5, 10, 11].into_iter().collect();
        assert_eq!(vlan_ranges(&v), "1-3,5,10-11");
    }
}

//! The network: devices, cables, and how frames and packets really move.
//!
//! Layer 2 is simulated hop by hop: a frame leaves an interface tagged or
//! untagged, crosses a cable, and each switch decides which VLAN it belongs to
//! and where to flood it. Layer 3 sits on top: a ping finds its first hop,
//! asks layer 2 whether that hop is reachable, and the router routes it on.
//! When something stops a packet, the simulator records where and why, which
//! is what the lab map shows as the cut.

use crate::device::{Device, Kind, PortMode};
use crate::iface;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::net::Ipv4Addr;

#[derive(Clone, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Port {
    pub device: String,
    pub iface: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Link {
    pub a: Port,
    pub b: Port,
}

/// Where and why traffic stopped.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Fault {
    pub device: String,
    pub iface: Option<String>,
    pub message: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct PingResult {
    pub ok: bool,
    /// Devices the request passed through, in order.
    pub path: Vec<String>,
    pub fault: Option<Fault>,
    pub hops: u8,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Topology {
    pub devices: Vec<Device>,
    pub links: Vec<Link>,
}

/// A layer 3 interface: the thing that owns an address.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
struct Endpoint {
    device: String,
    iface: String,
}

#[derive(Default)]
struct Walk {
    reached: Vec<Endpoint>,
    faults: Vec<Fault>,
    seen: HashSet<(String, u16)>,
    seen_ports: HashSet<(String, String, Option<u16>)>,
}

impl Topology {
    pub fn device(&self, name: &str) -> Option<&Device> {
        self.devices.iter().find(|d| d.name.eq_ignore_ascii_case(name))
    }

    pub fn device_mut(&mut self, name: &str) -> Option<&mut Device> {
        self.devices.iter_mut().find(|d| d.name.eq_ignore_ascii_case(name))
    }

    /// The other end of the cable plugged into this port.
    pub fn peer(&self, device: &str, iface: &str) -> Option<&Port> {
        self.links.iter().find_map(|l| {
            if l.a.device == device && l.a.iface == iface {
                Some(&l.b)
            } else if l.b.device == device && l.b.iface == iface {
                Some(&l.a)
            } else {
                None
            }
        })
    }

    pub fn is_cabled(&self, device: &str, iface: &str) -> bool {
        self.peer(device, iface).is_some()
    }

    /// Line and protocol status, as `show ip interface brief` reports them.
    pub fn status(&self, device: &str, name: &str) -> (&'static str, &'static str) {
        let Some(d) = self.device(device) else { return ("down", "down") };
        let Some(i) = d.iface(name) else { return ("down", "down") };
        if i.shutdown {
            return ("administratively down", "down");
        }
        let phys = iface::parent(name);
        if phys != name {
            if d.iface(phys).is_none_or(|p| p.shutdown) {
                return ("administratively down", "down");
            }
            return self.status(device, phys);
        }
        match self.peer(device, phys) {
            Some(p) => match self.device(&p.device).and_then(|pd| pd.iface(&p.iface)) {
                Some(pi) if !pi.shutdown => ("up", "up"),
                _ => ("down", "down"),
            },
            None => ("down", "down"),
        }
    }

    // ---------- layer 2 ----------

    /// Every layer 3 interface a frame sent from `from` can reach, plus the
    /// places it was dropped along the way.
    fn l2_reach(&self, from: &Endpoint) -> Walk {
        let mut w = Walk::default();
        let Some(dev) = self.device(&from.device) else { return w };
        let Some(i) = dev.iface(&from.iface) else { return w };
        if i.shutdown {
            w.faults.push(fault(dev, Some(&i.name), format!("{} is shut down on {}", i.short(), dev.name)));
            return w;
        }
        let (out, tag) = if iface::is_subinterface(&i.name) {
            let parent = iface::parent(&i.name);
            if dev.iface(parent).is_none_or(|p| p.shutdown) {
                w.faults.push(fault(dev, Some(parent), format!("{} is shut down on {}", iface::short(parent), dev.name)));
                return w;
            }
            match i.encapsulation {
                Some(e) if !e.native => (parent.to_string(), Some(e.vlan)),
                Some(_) => (parent.to_string(), None),
                None => {
                    w.faults.push(fault(dev, Some(&i.name), format!("{} has no encapsulation set", i.short())));
                    return w;
                }
            }
        } else {
            (i.name.clone(), None)
        };
        self.send(&mut w, &dev.name, &out, tag);
        w
    }

    fn send(&self, w: &mut Walk, device: &str, out: &str, tag: Option<u16>) {
        if !w.seen_ports.insert((device.to_string(), out.to_string(), tag)) {
            return;
        }
        let Some(dev) = self.device(device) else { return };
        let Some(peer) = self.peer(device, out) else {
            w.faults.push(fault(dev, Some(out), format!("{} on {} isn't cabled", iface::short(out), dev.name)));
            return;
        };
        let Some(pd) = self.device(&peer.device) else { return };
        match pd.iface(&peer.iface) {
            Some(pi) if pi.shutdown => {
                w.faults.push(fault(pd, Some(&pi.name), format!("{} is shut down on {}", pi.short(), pd.name)));
            }
            Some(_) => self.arrive(w, &peer.device, &peer.iface, tag),
            None => {}
        }
    }

    fn arrive(&self, w: &mut Walk, device: &str, port: &str, tag: Option<u16>) {
        let Some(dev) = self.device(device) else { return };
        let Some(i) = dev.iface(port) else { return };
        match dev.kind {
            Kind::Pc => match tag {
                None => w.reached.push(Endpoint { device: dev.name.clone(), iface: i.name.clone() }),
                Some(t) => w.faults.push(fault(dev, Some(&i.name), format!("{} got a frame tagged {t} and can't read it", dev.name))),
            },
            Kind::Router => match tag {
                None => {
                    if i.ip.is_some() {
                        w.reached.push(Endpoint { device: dev.name.clone(), iface: i.name.clone() });
                    } else if let Some(s) = dev.subifs_of(&i.name).find(|s| !s.shutdown && s.encapsulation.is_some_and(|e| e.native)) {
                        w.reached.push(Endpoint { device: dev.name.clone(), iface: s.name.clone() });
                    } else {
                        w.faults.push(fault(dev, Some(&i.name), format!("untagged frames reach {} {}, which has no address for them", dev.name, i.short())));
                    }
                }
                Some(t) => match dev.subifs_of(&i.name).find(|s| s.encapsulation.is_some_and(|e| e.vlan == t)) {
                    Some(s) if !s.shutdown => w.reached.push(Endpoint { device: dev.name.clone(), iface: s.name.clone() }),
                    Some(s) => w.faults.push(fault(dev, Some(&s.name), format!("{} is shut down on {}", s.short(), dev.name))),
                    None => w.faults.push(fault(dev, Some(&i.name), format!("VLAN {t} reaches {} {}, but no subinterface there uses VLAN {t}", dev.name, i.short()))),
                },
            },
            Kind::Switch => {
                let sp = i.switchport.clone().unwrap_or_default();
                let vlan = match sp.mode {
                    PortMode::Access => match tag {
                        None => sp.access_vlan,
                        Some(t) => {
                            w.faults.push(fault(dev, Some(&i.name), format!("{} {} is an access port but receives frames tagged {t}. Should it be a trunk?", dev.name, i.short())));
                            return;
                        }
                    },
                    PortMode::Trunk => {
                        let v = tag.unwrap_or(sp.native_vlan);
                        if !sp.allows(v) {
                            w.faults.push(fault(dev, Some(&i.name), format!("the trunk {} on {} doesn't allow VLAN {v}", i.short(), dev.name)));
                            return;
                        }
                        v
                    }
                };
                if !dev.has_vlan(vlan) {
                    w.faults.push(fault(dev, Some(&i.name), format!("VLAN {vlan} doesn't exist on {}", dev.name)));
                    return;
                }
                if !w.seen.insert((dev.name.clone(), vlan)) {
                    return;
                }
                for q in &dev.interfaces {
                    if q.name == i.name || q.shutdown || !self.is_cabled(&dev.name, &q.name) {
                        continue;
                    }
                    let qs = q.switchport.clone().unwrap_or_default();
                    match qs.mode {
                        PortMode::Access if qs.access_vlan == vlan => self.send(w, &dev.name, &q.name, None),
                        PortMode::Trunk if qs.allows(vlan) => {
                            self.send(w, &dev.name, &q.name, if vlan == qs.native_vlan { None } else { Some(vlan) })
                        }
                        PortMode::Trunk => w.faults.push(fault(dev, Some(&q.name), format!("the trunk {} on {} doesn't allow VLAN {vlan}", q.short(), dev.name))),
                        _ => {}
                    }
                }
            }
        }
    }

    // ---------- layer 3 ----------

    fn owner_of(&self, ip: Ipv4Addr) -> Option<Endpoint> {
        self.devices.iter().find_map(|d| {
            d.l3_ifaces()
                .find(|i| i.ip.is_some_and(|n| n.addr == ip))
                .map(|i| Endpoint { device: d.name.clone(), iface: i.name.clone() })
        })
    }

    /// Sends a request from `src` toward `dst` and, if it arrives, a reply back.
    pub fn ping(&self, src: &str, dst: Ipv4Addr) -> PingResult {
        let fail = |device: &str, message: String| PingResult {
            ok: false,
            path: vec![device.to_string()],
            fault: Some(Fault { device: device.to_string(), iface: None, message }),
            hops: 0,
        };
        let Some(sdev) = self.device(src) else { return fail(src, format!("no device called {src}")) };
        if sdev.l3_ifaces().any(|i| i.ip.is_some_and(|n| n.addr == dst)) {
            return PingResult { ok: true, path: vec![sdev.name.clone()], fault: None, hops: 0 };
        }
        if self.owner_of(dst).is_none() {
            return fail(&sdev.name, format!("nothing on this network has the address {dst}"));
        }
        match self.forward(&sdev.name, dst, 0) {
            Err(f) => PingResult { ok: false, path: vec![sdev.name.clone()], fault: Some(f), hops: 0 },
            Ok((path, src_ip)) => {
                let hops = (path.len().saturating_sub(2)) as u8;
                let dst_dev = path.last().cloned().unwrap_or_default();
                match self.forward(&dst_dev, src_ip, 0) {
                    Ok(_) => PingResult { ok: true, path, fault: None, hops },
                    Err(mut f) => {
                        f.message = format!("the request arrives, but the reply can't get back: {}", f.message);
                        PingResult { ok: false, path, fault: Some(f), hops }
                    }
                }
            }
        }
    }

    /// Routes a packet from `device` to `dst`. Returns the devices it passed
    /// through and the source address the first device used.
    fn forward(&self, device: &str, dst: Ipv4Addr, depth: u8) -> Result<(Vec<String>, Ipv4Addr), Fault> {
        let dev = self.device(device).ok_or_else(|| Fault { device: device.into(), iface: None, message: "unknown device".into() })?;
        if depth > 8 {
            return Err(fault(dev, None, "the packet loops between routers until it expires".into()));
        }
        let usable = |name: &str| self.status(&dev.name, name).0 == "up";
        // Directly connected?
        if let Some(i) = dev.l3_ifaces().find(|i| i.ip.is_some_and(|n| n.contains(dst)) && usable(&i.name)) {
            let target = self.owner_of(dst).ok_or_else(|| fault(dev, Some(&i.name), format!("nothing answers at {dst}")))?;
            let w = self.l2_reach(&Endpoint { device: dev.name.clone(), iface: i.name.clone() });
            if w.reached.contains(&target) {
                return Ok((vec![dev.name.clone(), target.device], i.ip.unwrap().addr));
            }
            return Err(best_fault(w.faults).unwrap_or_else(|| fault(dev, Some(&i.name), format!("{dst} isn't reachable from {} {}", dev.name, i.short()))));
        }
        if let Some(i) = dev.l3_ifaces().find(|i| i.ip.is_some_and(|n| n.contains(dst))) {
            let (st, _) = self.status(&dev.name, &i.name);
            return Err(fault(dev, Some(&i.name), format!("{} on {} is {st}", i.short(), dev.name)));
        }
        // Next hop: a PC's gateway, or a router's static routes.
        let next_hop = match dev.kind {
            Kind::Pc => dev.gateway.ok_or_else(|| fault(dev, None, format!("{} has no default gateway, so it can't leave its own subnet", dev.name)))?,
            _ => dev
                .routes
                .iter()
                .filter(|r| r.net.contains(dst))
                .max_by_key(|r| r.net.prefix)
                .map(|r| r.next_hop)
                .ok_or_else(|| fault(dev, None, format!("{} has no route to {dst}", dev.name)))?,
        };
        let out = dev
            .l3_ifaces()
            .find(|i| i.ip.is_some_and(|n| n.contains(next_hop)))
            .ok_or_else(|| fault(dev, None, format!("the gateway {next_hop} isn't on any subnet {} is connected to", dev.name)))?;
        if !usable(&out.name) {
            let (st, _) = self.status(&dev.name, &out.name);
            return Err(fault(dev, Some(&out.name), format!("{} on {} is {st}", out.short(), dev.name)));
        }
        let gw = self.owner_of(next_hop).ok_or_else(|| fault(dev, Some(&out.name), format!("nothing answers at the gateway {next_hop}")))?;
        let w = self.l2_reach(&Endpoint { device: dev.name.clone(), iface: out.name.clone() });
        if !w.reached.contains(&gw) {
            return Err(best_fault(w.faults).unwrap_or_else(|| fault(dev, Some(&out.name), format!("the gateway {next_hop} can't be reached"))));
        }
        let gw_dev = self.device(&gw.device).unwrap();
        if gw_dev.kind == Kind::Pc {
            return Err(fault(gw_dev, None, format!("{next_hop} is a PC, not a router")));
        }
        let (mut rest, _) = self.forward(&gw.device, dst, depth + 1)?;
        let mut path = vec![dev.name.clone()];
        path.append(&mut rest);
        Ok((path, out.ip.unwrap().addr))
    }
}

fn fault(dev: &Device, iface: Option<&str>, message: String) -> Fault {
    Fault { device: dev.name.clone(), iface: iface.map(str::to_string), message }
}

/// The most telling place a frame stopped: a misconfiguration beats a cable
/// that simply goes nowhere.
fn best_fault(mut faults: Vec<Fault>) -> Option<Fault> {
    faults.sort_by_key(|f| if f.message.contains("isn't cabled") { 1 } else { 0 });
    faults.into_iter().next()
}

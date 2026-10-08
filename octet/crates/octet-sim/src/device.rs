//! Devices and their interfaces: the state that commands change.

use crate::iface;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fmt;
use std::net::Ipv4Addr;
use std::str::FromStr;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Kind {
    Router,
    Switch,
    Pc,
}

/// An address with its prefix length, like 192.168.10.1/24.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Ipv4Net {
    pub addr: Ipv4Addr,
    pub prefix: u8,
}

impl Ipv4Net {
    pub fn new(addr: Ipv4Addr, prefix: u8) -> Self {
        Self { addr, prefix: prefix.min(32) }
    }
    pub fn mask_bits(&self) -> u32 {
        if self.prefix == 0 { 0 } else { u32::MAX << (32 - self.prefix as u32) }
    }
    pub fn mask(&self) -> Ipv4Addr {
        Ipv4Addr::from(self.mask_bits())
    }
    pub fn network(&self) -> Ipv4Addr {
        Ipv4Addr::from(u32::from(self.addr) & self.mask_bits())
    }
    pub fn contains(&self, ip: Ipv4Addr) -> bool {
        (u32::from(ip) & self.mask_bits()) == u32::from(self.network())
    }
    pub fn same_subnet(&self, other: &Ipv4Net) -> bool {
        self.prefix == other.prefix && self.network() == other.network()
    }
}

impl fmt::Display for Ipv4Net {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}/{}", self.addr, self.prefix)
    }
}

impl FromStr for Ipv4Net {
    type Err = ();
    fn from_str(s: &str) -> Result<Self, ()> {
        let (a, p) = s.split_once('/').ok_or(())?;
        let addr: Ipv4Addr = a.parse().map_err(|_| ())?;
        let prefix: u8 = p.parse().map_err(|_| ())?;
        if prefix > 32 {
            return Err(());
        }
        Ok(Ipv4Net::new(addr, prefix))
    }
}

/// A dotted mask like 255.255.255.0 to a prefix length, if it is a valid mask.
pub fn mask_to_prefix(mask: Ipv4Addr) -> Option<u8> {
    let bits = u32::from(mask);
    let ones = bits.leading_ones();
    if bits.checked_shl(ones).unwrap_or(0) == 0 { Some(ones as u8) } else { None }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PortMode {
    Access,
    Trunk,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Switchport {
    pub mode: PortMode,
    pub access_vlan: u16,
    pub native_vlan: u16,
    /// `None` means every VLAN is allowed, which is the IOS default.
    pub allowed: Option<BTreeSet<u16>>,
}

impl Default for Switchport {
    fn default() -> Self {
        Self { mode: PortMode::Access, access_vlan: 1, native_vlan: 1, allowed: None }
    }
}

impl Switchport {
    pub fn allows(&self, vlan: u16) -> bool {
        self.allowed.as_ref().is_none_or(|a| a.contains(&vlan))
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Dot1q {
    pub vlan: u16,
    pub native: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Interface {
    pub name: String,
    pub shutdown: bool,
    pub ip: Option<Ipv4Net>,
    pub encapsulation: Option<Dot1q>,
    pub switchport: Option<Switchport>,
    pub description: Option<String>,
}

impl Interface {
    pub fn new(name: &str, kind: Kind) -> Self {
        Self {
            name: name.to_string(),
            // Router ports ship administratively down; switch ports and NICs come up.
            shutdown: kind == Kind::Router,
            ip: None,
            encapsulation: None,
            switchport: if kind == Kind::Switch { Some(Switchport::default()) } else { None },
            description: None,
        }
    }
    pub fn short(&self) -> String {
        iface::short(&self.name)
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct StaticRoute {
    pub net: Ipv4Net,
    pub next_hop: Ipv4Addr,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Device {
    pub name: String,
    pub kind: Kind,
    pub model: String,
    pub interfaces: Vec<Interface>,
    /// VLAN database on a switch. VLAN 1 always exists.
    pub vlans: BTreeMap<u16, String>,
    pub gateway: Option<Ipv4Addr>,
    pub routes: Vec<StaticRoute>,
}

impl Device {
    /// A device with the ports its model really has.
    pub fn new(name: &str, kind: Kind, model: Option<&str>) -> Self {
        let model = model.map(str::to_string).unwrap_or_else(|| default_model(kind).to_string());
        let ports = ports_for(kind, &model);
        let mut vlans = BTreeMap::new();
        if kind == Kind::Switch {
            vlans.insert(1, "default".to_string());
        }
        Self {
            name: name.to_string(),
            kind,
            model,
            interfaces: ports.iter().map(|p| Interface::new(p, kind)).collect(),
            vlans,
            gateway: None,
            routes: Vec::new(),
        }
    }

    pub fn iface(&self, name: &str) -> Option<&Interface> {
        self.interfaces.iter().find(|i| i.name == name)
    }

    pub fn iface_mut(&mut self, name: &str) -> Option<&mut Interface> {
        self.interfaces.iter_mut().find(|i| i.name == name)
    }

    /// Finds an interface by any spelling someone might type.
    pub fn resolve(&self, typed: &str) -> Option<String> {
        let c = iface::canonical(typed)?;
        self.iface(&c).map(|i| i.name.clone())
    }

    /// Creates a subinterface on demand, the way `interface g0/0/1.20` does.
    pub fn ensure_subif(&mut self, name: &str) -> bool {
        if self.iface(name).is_some() {
            return true;
        }
        if self.kind != Kind::Router || self.iface(iface::parent(name)).is_none() {
            return false;
        }
        let mut sub = Interface::new(name, self.kind);
        sub.shutdown = false;
        self.interfaces.push(sub);
        self.interfaces.sort_by(|a, b| iface::natural_cmp(&a.name, &b.name));
        true
    }

    pub fn subifs_of<'a>(&'a self, parent: &'a str) -> impl Iterator<Item = &'a Interface> + 'a {
        self.interfaces.iter().filter(move |i| iface::is_subinterface(&i.name) && iface::parent(&i.name) == parent)
    }

    pub fn has_vlan(&self, v: u16) -> bool {
        self.vlans.contains_key(&v)
    }

    /// The addresses this device answers on.
    pub fn l3_ifaces(&self) -> impl Iterator<Item = &Interface> {
        self.interfaces.iter().filter(|i| i.ip.is_some())
    }
}

pub fn default_model(kind: Kind) -> &'static str {
    match kind {
        Kind::Router => "ISR4321",
        Kind::Switch => "2960",
        Kind::Pc => "PC",
    }
}

fn ports_for(kind: Kind, model: &str) -> Vec<String> {
    match (kind, model) {
        (Kind::Pc, _) => vec!["eth0".into()],
        (Kind::Router, "2911") => (0..3).map(|n| format!("GigabitEthernet0/{n}")).collect(),
        (Kind::Router, _) => vec!["GigabitEthernet0/0/0".into(), "GigabitEthernet0/0/1".into(), "GigabitEthernet0/1/0".into()],
        (Kind::Switch, _) => {
            let mut v: Vec<String> = (1..=24).map(|n| format!("FastEthernet0/{n}")).collect();
            v.push("GigabitEthernet0/1".into());
            v.push("GigabitEthernet0/2".into());
            v
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masks_and_subnets() {
        assert_eq!(mask_to_prefix("255.255.255.0".parse().unwrap()), Some(24));
        assert_eq!(mask_to_prefix("255.255.240.0".parse().unwrap()), Some(20));
        assert_eq!(mask_to_prefix("255.0.255.0".parse().unwrap()), None);
        let n: Ipv4Net = "192.168.20.1/24".parse().unwrap();
        assert!(n.contains("192.168.20.10".parse().unwrap()));
        assert!(!n.contains("192.168.10.10".parse().unwrap()));
        assert_eq!(n.mask(), "255.255.255.0".parse::<Ipv4Addr>().unwrap());
    }

    #[test]
    fn models_have_real_ports() {
        let s = Device::new("S1", Kind::Switch, None);
        assert!(s.iface("FastEthernet0/24").is_some());
        assert!(s.iface("GigabitEthernet0/1").is_some());
        let r = Device::new("R1", Kind::Router, None);
        assert!(r.iface("GigabitEthernet0/0/1").unwrap().shutdown, "router ports start shut down");
    }

    #[test]
    fn subinterfaces_follow_their_parent() {
        let mut r = Device::new("R1", Kind::Router, None);
        assert!(r.ensure_subif("GigabitEthernet0/0/1.20"));
        assert!(r.ensure_subif("GigabitEthernet0/0/1.10"));
        let names: Vec<_> = r.interfaces.iter().map(|i| i.name.as_str()).collect();
        assert_eq!(names, ["GigabitEthernet0/0/0", "GigabitEthernet0/0/1", "GigabitEthernet0/0/1.10", "GigabitEthernet0/0/1.20", "GigabitEthernet0/1/0"]);
        assert!(!r.ensure_subif("GigabitEthernet0/9/9.1"));
    }
}

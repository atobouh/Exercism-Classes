//! Labs: a topology, its starting configuration, and the tasks to finish.
//!
//! Labs are written as TOML so new ones are easy to author:
//!
//! ```toml
//! id = "srwe-03-router-on-a-stick"
//! title = "Router-on-a-stick"
//!
//! [[device]]
//! name = "R1"
//! kind = "router"
//! x = 486
//! y = 96
//! config = """
//! interface g0/0/1
//!  no shutdown
//! """
//!
//! [[link]]
//! a = "R1 g0/0/1"
//! b = "S1 g0/1"
//!
//! [[task]]
//! text = "Give VLAN 20 a gateway on R1"
//! check = { kind = "ping", from = "PC-ENG", to = "192.168.10.10" }
//! ```

use crate::cli::{Output, Session};
use crate::device::{Device, Ipv4Net, Kind, PortMode};
use crate::diff::{diff_lines, DiffLine};
use crate::iface;
use crate::net::{Fault, Link, Port, Topology};
use crate::render;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::net::Ipv4Addr;

#[derive(Debug, thiserror::Error)]
pub enum LabError {
    #[error("the lab file isn't valid TOML: {0}")]
    Toml(#[from] toml::de::Error),
    #[error("{0}")]
    Invalid(String),
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceDef {
    pub name: String,
    pub kind: Kind,
    #[serde(default)]
    pub model: Option<String>,
    #[serde(default)]
    pub x: f32,
    #[serde(default)]
    pub y: f32,
    /// IOS commands applied in configuration mode before the lab opens.
    #[serde(default)]
    pub config: String,
    /// For PCs: address with prefix, like 192.168.10.10/24.
    #[serde(default)]
    pub ip: Option<String>,
    #[serde(default)]
    pub gateway: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LinkDef {
    pub a: String,
    pub b: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Check {
    Ping { from: String, to: String },
    NoPing { from: String, to: String },
    VlanExists { device: String, vlans: Vec<u16> },
    Trunk { device: String, iface: String },
    Access { device: String, iface: String, vlan: u16 },
    IfaceUp { device: String, iface: String },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TaskDef {
    pub text: String,
    #[serde(default)]
    pub detail: Option<String>,
    #[serde(default)]
    pub hint: Option<String>,
    pub check: Check,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LabDef {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub course: String,
    #[serde(default)]
    pub chapter: u32,
    #[serde(default)]
    pub summary: String,
    #[serde(rename = "device", default)]
    pub devices: Vec<DeviceDef>,
    #[serde(rename = "link", default)]
    pub links: Vec<LinkDef>,
    #[serde(rename = "task", default)]
    pub tasks: Vec<TaskDef>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct TaskResult {
    pub text: String,
    pub detail: Option<String>,
    pub hint: Option<String>,
    pub pass: bool,
    pub message: String,
    pub fault: Option<Fault>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ExecResult {
    /// The prompt the command was typed at.
    pub prompt: String,
    pub output: Output,
    /// The prompt for the next line.
    pub next_prompt: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DeviceView {
    pub name: String,
    pub kind: Kind,
    pub model: String,
    pub subtitle: String,
    pub x: f32,
    pub y: f32,
    /// "ok", "warn" (involved in the current fault) or "off" (nothing set up).
    pub status: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LinkView {
    pub a: String,
    pub a_port: String,
    pub b: String,
    pub b_port: String,
    pub trunk: bool,
    /// VLANs carried, for the label on a trunk.
    pub vlans: Vec<u16>,
    pub up: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LabView {
    pub id: String,
    pub title: String,
    pub devices: Vec<DeviceView>,
    pub links: Vec<LinkView>,
    pub fault: Option<Fault>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct PortRow {
    pub port: String,
    pub up: bool,
    pub carries: String,
    pub address: String,
    pub warn: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Lab {
    pub def: LabDef,
    pub topo: Topology,
    positions: BTreeMap<String, (f32, f32)>,
    sessions: BTreeMap<String, Session>,
    baseline: BTreeMap<String, Vec<String>>,
}

fn parse_port(s: &str) -> Option<(String, String)> {
    let (d, i) = s.trim().split_once(char::is_whitespace)?;
    Some((d.to_string(), i.trim().to_string()))
}

impl Lab {
    pub fn from_toml(src: &str) -> Result<Self, LabError> {
        let def: LabDef = toml::from_str(src)?;
        Self::from_def(def)
    }

    pub fn from_def(def: LabDef) -> Result<Self, LabError> {
        let mut topo = Topology::default();
        let mut positions = BTreeMap::new();
        for d in &def.devices {
            if topo.device(&d.name).is_some() {
                return Err(LabError::Invalid(format!("two devices are called {}", d.name)));
            }
            let mut dev = Device::new(&d.name, d.kind, d.model.as_deref());
            if d.kind == Kind::Pc {
                if let Some(ip) = &d.ip {
                    let net: Ipv4Net = ip.parse().map_err(|_| LabError::Invalid(format!("{}: bad ip {ip}", d.name)))?;
                    dev.iface_mut("eth0").unwrap().ip = Some(net);
                }
                if let Some(g) = &d.gateway {
                    dev.gateway = Some(g.parse().map_err(|_| LabError::Invalid(format!("{}: bad gateway {g}", d.name)))?);
                }
            }
            positions.insert(d.name.clone(), (d.x, d.y));
            topo.devices.push(dev);
        }
        for l in &def.links {
            let (ad, ai) = parse_port(&l.a).ok_or_else(|| LabError::Invalid(format!("bad link end {}", l.a)))?;
            let (bd, bi) = parse_port(&l.b).ok_or_else(|| LabError::Invalid(format!("bad link end {}", l.b)))?;
            let a = resolve_port(&topo, &ad, &ai)?;
            let b = resolve_port(&topo, &bd, &bi)?;
            if topo.peer(&a.device, &a.iface).is_some() || topo.peer(&b.device, &b.iface).is_some() {
                return Err(LabError::Invalid(format!("a port is cabled twice: {} or {}", l.a, l.b)));
            }
            topo.links.push(Link { a, b });
        }
        let mut lab = Lab { def, topo, positions, sessions: BTreeMap::new(), baseline: BTreeMap::new() };
        let configs: Vec<(String, String)> = lab.def.devices.iter().map(|d| (d.name.clone(), d.config.clone())).collect();
        for (name, cfg) in configs {
            let mut s = Session::new(&name);
            s.exec(&mut lab.topo, "configure terminal");
            for line in cfg.lines().map(str::trim).filter(|l| !l.is_empty() && !l.starts_with('!')) {
                let out = s.exec(&mut lab.topo, line);
                if out.error {
                    return Err(LabError::Invalid(format!("{name}: \"{line}\" failed: {}", out.text.lines().last().unwrap_or(""))));
                }
            }
            s.exec(&mut lab.topo, "end");
        }
        for d in &lab.topo.devices {
            lab.sessions.insert(d.name.clone(), Session::new(&d.name));
            lab.baseline.insert(d.name.clone(), render::config_lines(&lab.topo, &d.name));
        }
        Ok(lab)
    }

    fn session(&mut self, device: &str) -> Option<&mut Session> {
        let key = self.sessions.keys().find(|k| k.eq_ignore_ascii_case(device))?.clone();
        self.sessions.get_mut(&key)
    }

    pub fn prompt(&self, device: &str) -> String {
        self.sessions.iter().find(|(k, _)| k.eq_ignore_ascii_case(device)).map(|(_, s)| s.prompt(&self.topo)).unwrap_or_default()
    }

    /// Runs a line in a device's console.
    pub fn exec(&mut self, device: &str, line: &str) -> Option<ExecResult> {
        let mut topo = std::mem::take(&mut self.topo);
        let res = self.session(device).map(|s| {
            let prompt = s.prompt(&topo);
            let output = s.exec(&mut topo, line);
            let next_prompt = s.prompt(&topo);
            (prompt, output, next_prompt, s.device.clone())
        });
        self.topo = topo;
        let (prompt, output, next_prompt, now_named) = res?;
        // `hostname` renames the device everywhere.
        if !now_named.eq_ignore_ascii_case(device) {
            let old = self.sessions.keys().find(|k| k.eq_ignore_ascii_case(device)).cloned().unwrap();
            if let Some(s) = self.sessions.remove(&old) {
                self.sessions.insert(now_named.clone(), s);
            }
            if let Some(b) = self.baseline.remove(&old) {
                self.baseline.insert(now_named.clone(), b);
            }
            if let Some(p) = self.positions.remove(&old) {
                self.positions.insert(now_named, p);
            }
        }
        Some(ExecResult { prompt, output, next_prompt })
    }

    fn check(&self, c: &Check) -> (bool, String, Option<Fault>) {
        match c {
            Check::Ping { from, to } | Check::NoPing { from, to } => {
                let want = matches!(c, Check::Ping { .. });
                let Ok(dst) = to.parse::<Ipv4Addr>() else { return (false, format!("bad address {to}"), None) };
                let r = self.topo.ping(from, dst);
                if r.ok == want {
                    let msg = if want { format!("{from} reaches {to}") } else { format!("{from} can't reach {to}, as intended") };
                    (true, msg, None)
                } else if want {
                    let f = r.fault.clone();
                    (false, format!("{from} can't reach {to}: {}", f.as_ref().map_or("no reply", |f| f.message.as_str())), f)
                } else {
                    (false, format!("{from} can still reach {to}"), None)
                }
            }
            Check::VlanExists { device, vlans } => {
                let Some(d) = self.topo.device(device) else { return (false, format!("no device {device}"), None) };
                let missing: Vec<String> = vlans.iter().filter(|v| !d.has_vlan(**v)).map(|v| v.to_string()).collect();
                if missing.is_empty() {
                    (true, format!("{device} has VLAN {}", vlans.iter().map(|v| v.to_string()).collect::<Vec<_>>().join(" and ")), None)
                } else {
                    (false, format!("{device} is missing VLAN {}", missing.join(", ")), Some(Fault { device: d.name.clone(), iface: None, message: format!("VLAN {} doesn't exist yet", missing.join(", ")) }))
                }
            }
            Check::Trunk { device, iface: want } | Check::Access { device, iface: want, .. } | Check::IfaceUp { device, iface: want } => {
                let Some(d) = self.topo.device(device) else { return (false, format!("no device {device}"), None) };
                let Some(name) = d.resolve(want) else { return (false, format!("{device} has no {want}"), None) };
                let i = d.iface(&name).unwrap();
                let short = iface::short(&name);
                let up = self.topo.status(&d.name, &name).0 == "up";
                let fault = |m: String| Some(Fault { device: d.name.clone(), iface: Some(name.clone()), message: m });
                match c {
                    Check::Trunk { .. } => match &i.switchport {
                        Some(sp) if sp.mode == PortMode::Trunk && up => (true, format!("{short} on {device} is trunking"), None),
                        Some(sp) if sp.mode == PortMode::Trunk => (false, format!("{short} is a trunk but it isn't up"), fault(format!("{short} is down"))),
                        _ => (false, format!("{short} on {device} isn't a trunk"), fault(format!("{short} isn't a trunk"))),
                    },
                    Check::Access { vlan, .. } => match &i.switchport {
                        Some(sp) if sp.mode == PortMode::Access && sp.access_vlan == *vlan => (true, format!("{short} is in VLAN {vlan}"), None),
                        _ => (false, format!("{short} on {device} isn't an access port in VLAN {vlan}"), fault(format!("{short} should be in VLAN {vlan}"))),
                    },
                    _ => {
                        if up {
                            (true, format!("{short} on {device} is up"), None)
                        } else {
                            let (st, _) = self.topo.status(&d.name, &name);
                            (false, format!("{short} on {device} is {st}"), fault(format!("{short} is {st}")))
                        }
                    }
                }
            }
        }
    }

    pub fn run_checks(&self) -> Vec<TaskResult> {
        self.def
            .tasks
            .iter()
            .map(|t| {
                let (pass, message, fault) = self.check(&t.check);
                TaskResult { text: t.text.clone(), detail: t.detail.clone(), hint: t.hint.clone(), pass, message, fault }
            })
            .collect()
    }

    /// The first thing that is broken right now, for the mark on the map.
    pub fn fault(&self) -> Option<Fault> {
        self.run_checks().into_iter().find(|r| !r.pass).and_then(|r| r.fault)
    }

    pub fn view(&self) -> LabView {
        let fault = self.fault();
        let devices = self
            .topo
            .devices
            .iter()
            .map(|d| {
                let (x, y) = self.positions.get(&d.name).copied().unwrap_or((40.0, 40.0));
                let subtitle = match d.kind {
                    Kind::Pc => d.iface("eth0").and_then(|i| i.ip).map_or("no address yet".into(), |n| n.addr.to_string()),
                    Kind::Switch => format!("Catalyst {}", d.model),
                    Kind::Router => match d.model.as_str() {
                        "ISR4321" => "ISR 4321".into(),
                        m => m.to_string(),
                    },
                };
                let configured = d.kind != Kind::Pc || d.iface("eth0").is_some_and(|i| i.ip.is_some());
                let status = if fault.as_ref().is_some_and(|f| f.device == d.name) {
                    "warn"
                } else if configured {
                    "ok"
                } else {
                    "off"
                };
                DeviceView { name: d.name.clone(), kind: d.kind, model: d.model.clone(), subtitle, x, y, status: status.into() }
            })
            .collect();
        let links = self
            .topo
            .links
            .iter()
            .map(|l| {
                let sp = |p: &Port| self.topo.device(&p.device).and_then(|d| d.iface(&p.iface)).and_then(|i| i.switchport.clone());
                let (sa, sb) = (sp(&l.a), sp(&l.b));
                let trunk = sa.as_ref().is_some_and(|s| s.mode == PortMode::Trunk) || sb.as_ref().is_some_and(|s| s.mode == PortMode::Trunk);
                let vlans = [sa, sb]
                    .into_iter()
                    .flatten()
                    .find(|s| s.mode == PortMode::Trunk)
                    .map(|s| {
                        let sw = if self.topo.device(&l.a.device).is_some_and(|d| d.kind == Kind::Switch) { &l.a.device } else { &l.b.device };
                        self.topo.device(sw).map(|d| d.vlans.keys().copied().filter(|v| *v != 1 && s.allows(*v)).collect()).unwrap_or_default()
                    })
                    .unwrap_or_default();
                LinkView {
                    a: l.a.device.clone(),
                    a_port: iface::short(&l.a.iface),
                    b: l.b.device.clone(),
                    b_port: iface::short(&l.b.iface),
                    trunk,
                    vlans,
                    up: self.topo.status(&l.a.device, &l.a.iface).0 == "up",
                }
            })
            .collect();
        LabView { id: self.def.id.clone(), title: self.def.title.clone(), devices, links, fault }
    }

    pub fn move_device(&mut self, name: &str, x: f32, y: f32) {
        if let Some(p) = self.positions.iter_mut().find(|(k, _)| k.eq_ignore_ascii_case(name)) {
            *p.1 = (x, y);
        }
    }

    /// Adds a fresh device, named like the next free R2, S2 or PC-1.
    pub fn add_device(&mut self, kind: Kind, x: f32, y: f32) -> String {
        let base = match kind {
            Kind::Router => "R",
            Kind::Switch => "S",
            Kind::Pc => "PC-",
        };
        let name = (1..).map(|n| format!("{base}{n}")).find(|n| self.topo.device(n).is_none()).unwrap();
        self.topo.devices.push(Device::new(&name, kind, None));
        self.positions.insert(name.clone(), (x, y));
        self.sessions.insert(name.clone(), Session::new(&name));
        self.baseline.insert(name.clone(), render::config_lines(&self.topo, &name));
        name
    }

    /// Cables two devices on their first free ports, uplinks first.
    pub fn connect(&mut self, a: &str, b: &str) -> Result<LinkView, String> {
        let pick = |topo: &Topology, dev: &str| -> Option<String> {
            let d = topo.device(dev)?;
            let free: Vec<&str> = d.interfaces.iter().filter(|i| !iface::is_subinterface(&i.name) && !topo.is_cabled(&d.name, &i.name)).map(|i| i.name.as_str()).collect();
            let prefer = free.iter().find(|n| d.kind == Kind::Switch && n.starts_with("GigabitEthernet")).or(free.first());
            prefer.map(|s| s.to_string())
        };
        if a.eq_ignore_ascii_case(b) {
            return Err("pick two different devices".into());
        }
        let ia = pick(&self.topo, a).ok_or_else(|| format!("{a} has no free ports"))?;
        let ib = pick(&self.topo, b).ok_or_else(|| format!("{b} has no free ports"))?;
        let (da, db) = (self.topo.device(a).unwrap().name.clone(), self.topo.device(b).unwrap().name.clone());
        self.topo.links.push(Link { a: Port { device: da, iface: ia }, b: Port { device: db, iface: ib } });
        Ok(self.view().links.pop().unwrap())
    }

    pub fn ports(&self, device: &str) -> Vec<PortRow> {
        let Some(d) = self.topo.device(device) else { return vec![] };
        let fault = self.fault();
        d.interfaces
            .iter()
            .filter(|i| iface::is_subinterface(&i.name) || self.topo.is_cabled(&d.name, &i.name) || i.ip.is_some())
            .map(|i| {
                let (st, _) = self.topo.status(&d.name, &i.name);
                let carries = match (&i.switchport, i.encapsulation) {
                    (Some(sp), _) if sp.mode == PortMode::Trunk => format!("Trunk, {}", sp.allowed.as_ref().map_or("all VLANs".into(), |a| format!("VLAN {}", render::vlan_ranges(a)))),
                    (Some(sp), _) => format!("Access, VLAN {}", sp.access_vlan),
                    (None, Some(e)) => format!("VLAN {}{}", e.vlan, if e.native { ", native" } else { "" }),
                    (None, None) => match self.topo.peer(&d.name, &i.name) {
                        Some(p) => format!("To {} {}", p.device, iface::short(&p.iface)),
                        None => String::new(),
                    },
                };
                let warn = fault.as_ref().is_some_and(|f| f.device == d.name && f.iface.as_deref().is_some_and(|fi| fi == i.name || iface::parent(&i.name) == fi && i.encapsulation.is_some()));
                PortRow {
                    port: i.short(),
                    up: st == "up",
                    carries: if st == "administratively down" { format!("{carries} (shut down)").trim_start().to_string() } else { carries },
                    address: i.ip.map(|n| n.to_string()).unwrap_or_default(),
                    warn,
                }
            })
            .collect()
    }

    /// What the learner changed on a device since the lab opened.
    pub fn changes(&self, device: &str) -> Vec<DiffLine> {
        let Some(d) = self.topo.device(device) else { return vec![] };
        let before = self.baseline.get(&d.name).cloned().unwrap_or_default();
        let after = render::config_lines(&self.topo, &d.name);
        diff_lines(&before, &after)
    }

    pub fn device_names(&self) -> Vec<String> {
        self.topo.devices.iter().map(|d| d.name.clone()).collect()
    }
}

fn resolve_port(topo: &Topology, dev: &str, typed: &str) -> Result<Port, LabError> {
    let d = topo.device(dev).ok_or_else(|| LabError::Invalid(format!("link names an unknown device {dev}")))?;
    let iface = d.resolve(typed).ok_or_else(|| LabError::Invalid(format!("{dev} has no port {typed}")))?;
    Ok(Port { device: d.name.clone(), iface })
}

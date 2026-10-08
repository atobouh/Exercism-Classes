//! The IOS-style command line: modes, abbreviations, `?` help and the errors
//! IOS prints, driving changes to a device in the topology.

use crate::device::{mask_to_prefix, Dot1q, Ipv4Net, Kind, PortMode, StaticRoute};
use crate::iface;
use crate::net::Topology;
use crate::render;
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;
use std::net::Ipv4Addr;

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum Mode {
    Exec,
    Config,
    Interface(String),
    Vlan(u16),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Slot {
    K(&'static str),
    Iface,
    Num(u32, u32),
    Ip,
    Mask,
    Prefix,
    VlanList,
    Word,
    Rest,
}
use Slot::*;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Ctx {
    Exec,
    Config,
    If,
    Vlan,
    Pc,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Only {
    Any,
    Router,
    Switch,
    Subif,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Act {
    Enable,
    Disable,
    ConfT,
    End,
    Exit,
    ShowRun,
    ShowRunIf,
    ShowIpIntBrief,
    ShowVlanBrief,
    ShowIntTrunk,
    ShowIpRoute,
    Ping,
    Save,
    Hostname,
    Interface,
    Vlan,
    NoVlan,
    IpRoute,
    NoIpRoute,
    VlanName,
    IpAddress,
    NoIpAddress,
    Shutdown,
    NoShutdown,
    Description,
    SwModeAccess,
    SwModeTrunk,
    SwAccessVlan,
    SwNative,
    SwAllowed,
    SwAllowedAdd,
    SwAllowedRemove,
    Encap,
    EncapNative,
    PcIp,
    PcIpGw,
    PcShow,
}

struct Pat {
    ctx: Ctx,
    only: Only,
    slots: &'static [Slot],
    act: Act,
}

macro_rules! p {
    ($ctx:ident, $only:ident, [$($s:expr),*], $act:ident) => {
        Pat { ctx: Ctx::$ctx, only: Only::$only, slots: &[$($s),*], act: Act::$act }
    };
}

const PATTERNS: &[Pat] = &[
    p!(Exec, Any, [K("enable")], Enable),
    p!(Exec, Any, [K("disable")], Disable),
    p!(Exec, Any, [K("configure"), K("terminal")], ConfT),
    p!(Exec, Any, [K("show"), K("running-config")], ShowRun),
    p!(Exec, Any, [K("show"), K("running-config"), K("interface"), Iface], ShowRunIf),
    p!(Exec, Any, [K("show"), K("ip"), K("interface"), K("brief")], ShowIpIntBrief),
    p!(Exec, Router, [K("show"), K("ip"), K("route")], ShowIpRoute),
    p!(Exec, Switch, [K("show"), K("vlan"), K("brief")], ShowVlanBrief),
    p!(Exec, Switch, [K("show"), K("interfaces"), K("trunk")], ShowIntTrunk),
    p!(Exec, Any, [K("ping"), Ip], Ping),
    p!(Exec, Any, [K("copy"), K("running-config"), K("startup-config")], Save),
    p!(Exec, Any, [K("write"), K("memory")], Save),
    p!(Exec, Any, [K("write")], Save),
    p!(Exec, Any, [K("end")], End),
    p!(Exec, Any, [K("exit")], Exit),
    p!(Config, Any, [K("hostname"), Word], Hostname),
    p!(Config, Any, [K("interface"), Iface], Interface),
    p!(Config, Switch, [K("vlan"), Num(1, 4094)], Vlan),
    p!(Config, Switch, [K("no"), K("vlan"), Num(1, 4094)], NoVlan),
    p!(Config, Router, [K("ip"), K("route"), Ip, Mask, Ip], IpRoute),
    p!(Config, Router, [K("no"), K("ip"), K("route"), Ip, Mask, Ip], NoIpRoute),
    p!(Config, Any, [K("end")], End),
    p!(Config, Any, [K("exit")], Exit),
    p!(Vlan, Switch, [K("name"), Word], VlanName),
    p!(Vlan, Switch, [K("vlan"), Num(1, 4094)], Vlan),
    p!(Vlan, Switch, [K("interface"), Iface], Interface),
    p!(Vlan, Any, [K("end")], End),
    p!(Vlan, Any, [K("exit")], Exit),
    p!(If, Any, [K("interface"), Iface], Interface),
    p!(If, Router, [K("ip"), K("address"), Ip, Mask], IpAddress),
    p!(If, Router, [K("no"), K("ip"), K("address")], NoIpAddress),
    p!(If, Any, [K("shutdown")], Shutdown),
    p!(If, Any, [K("no"), K("shutdown")], NoShutdown),
    p!(If, Any, [K("description"), Rest], Description),
    p!(If, Switch, [K("switchport"), K("mode"), K("access")], SwModeAccess),
    p!(If, Switch, [K("switchport"), K("mode"), K("trunk")], SwModeTrunk),
    p!(If, Switch, [K("switchport"), K("access"), K("vlan"), Num(1, 4094)], SwAccessVlan),
    p!(If, Switch, [K("switchport"), K("trunk"), K("native"), K("vlan"), Num(1, 4094)], SwNative),
    p!(If, Switch, [K("switchport"), K("trunk"), K("allowed"), K("vlan"), VlanList], SwAllowed),
    p!(If, Switch, [K("switchport"), K("trunk"), K("allowed"), K("vlan"), K("add"), VlanList], SwAllowedAdd),
    p!(If, Switch, [K("switchport"), K("trunk"), K("allowed"), K("vlan"), K("remove"), VlanList], SwAllowedRemove),
    p!(If, Subif, [K("encapsulation"), K("dot1q"), Num(1, 4094)], Encap),
    p!(If, Subif, [K("encapsulation"), K("dot1q"), Num(1, 4094), K("native")], EncapNative),
    p!(If, Any, [K("end")], End),
    p!(If, Any, [K("exit")], Exit),
    p!(Pc, Any, [K("ip"), Prefix], PcIp),
    p!(Pc, Any, [K("ip"), Prefix, Ip], PcIpGw),
    p!(Pc, Any, [K("ping"), Ip], Ping),
    p!(Pc, Any, [K("show"), K("ip")], PcShow),
    p!(Pc, Any, [K("ipconfig")], PcShow),
];

fn kw_help(k: &str) -> &'static str {
    match k {
        "enable" => "Turn on privileged commands",
        "disable" => "Turn off privileged commands",
        "configure" => "Enter configuration mode",
        "terminal" => "Configure from the terminal",
        "show" => "Show running system information",
        "running-config" => "Current operating configuration",
        "interface" => "Select an interface to configure",
        "interfaces" => "Interface status and configuration",
        "ip" => "IP information",
        "brief" => "Brief summary",
        "route" => "IP routing table",
        "vlan" => "VLAN commands",
        "trunk" => "Trunk interfaces",
        "ping" => "Send echo messages",
        "copy" => "Copy from one file to another",
        "startup-config" => "Contents of startup configuration",
        "write" => "Write running configuration to memory",
        "memory" => "Write to NV memory",
        "end" => "Exit to privileged EXEC mode",
        "exit" => "Exit from the current mode",
        "hostname" => "Set system's network name",
        "no" => "Negate a command or set its defaults",
        "name" => "ASCII name of the VLAN",
        "address" => "Set the IP address of an interface",
        "shutdown" => "Shutdown the selected interface",
        "description" => "Interface specific description",
        "switchport" => "Set switching mode characteristics",
        "mode" => "Set trunking mode of the interface",
        "access" => "Set trunking mode to ACCESS unconditionally",
        "native" => "Set native VLAN",
        "allowed" => "Set allowed VLAN characteristics",
        "add" => "Add VLANs to the current list",
        "remove" => "Remove VLANs from the current list",
        "encapsulation" => "Set encapsulation type for an interface",
        "dot1q" => "IEEE 802.1Q Virtual LAN",
        "ipconfig" => "Show this PC's address and gateway",
        _ => "",
    }
}

fn slot_help(s: Slot) -> (String, &'static str) {
    match s {
        K(k) => (k.to_string(), kw_help(k)),
        Iface => ("WORD".into(), "Interface name, for example g0/0/1.20"),
        Num(a, b) => (format!("<{a}-{b}>"), "Number"),
        Ip => ("A.B.C.D".into(), "IP address"),
        Mask => ("A.B.C.D".into(), "Subnet mask"),
        Prefix => ("A.B.C.D/M".into(), "Address with prefix length"),
        VlanList => ("WORD".into(), "VLAN IDs, for example 10,20 or 30-40"),
        Word => ("WORD".into(), "A name"),
        Rest => ("LINE".into(), "Up to 240 characters"),
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Output {
    pub text: String,
    pub error: bool,
}

impl Output {
    fn ok(text: impl Into<String>) -> Self {
        Self { text: text.into(), error: false }
    }
    fn err(text: impl Into<String>) -> Self {
        Self { text: text.into(), error: true }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Session {
    pub device: String,
    pub mode: Mode,
}

enum Arg {
    Iface(String),
    Num(u32),
    Ip(Ipv4Addr),
    Net(Ipv4Net),
    Vlans(BTreeSet<u16>),
    Text(String),
}

fn parse_vlans(s: &str) -> Option<BTreeSet<u16>> {
    let mut out = BTreeSet::new();
    for part in s.split(',') {
        if let Some((a, b)) = part.split_once('-') {
            let (a, b): (u16, u16) = (a.parse().ok()?, b.parse().ok()?);
            if a == 0 || b > 4094 || a > b {
                return None;
            }
            out.extend(a..=b);
        } else {
            let v: u16 = part.parse().ok()?;
            if v == 0 || v > 4094 {
                return None;
            }
            out.insert(v);
        }
    }
    Some(out)
}

fn accepts(slot: Slot, tok: &str) -> bool {
    match slot {
        K(_) => false,
        Iface => iface::canonical(tok).is_some(),
        Num(a, b) => tok.parse::<u32>().is_ok_and(|n| n >= a && n <= b),
        Ip => tok.parse::<Ipv4Addr>().is_ok(),
        Mask => tok.parse::<Ipv4Addr>().ok().and_then(mask_to_prefix).is_some(),
        Prefix => tok.parse::<Ipv4Net>().is_ok(),
        VlanList => parse_vlans(tok).is_some(),
        Word | Rest => !tok.is_empty(),
    }
}

/// Splits a line into tokens with their starting column.
fn tokenize(line: &str) -> Vec<(usize, &str)> {
    let mut out = Vec::new();
    let mut start = None;
    for (i, c) in line.char_indices() {
        if c.is_whitespace() {
            if let Some(s) = start.take() {
                out.push((s, &line[s..i]));
            }
        } else if start.is_none() {
            start = Some(i);
        }
    }
    if let Some(s) = start {
        out.push((s, &line[s..]));
    }
    out
}

enum Match<'a> {
    Done(&'a Pat, Vec<Arg>),
    Invalid(usize),
    Ambiguous(String),
    Incomplete,
}

impl Session {
    pub fn new(device: &str) -> Self {
        Self { device: device.to_string(), mode: Mode::Exec }
    }

    pub fn prompt(&self, topo: &Topology) -> String {
        let Some(d) = topo.device(&self.device) else { return "?>".into() };
        if d.kind == Kind::Pc {
            return format!("{}>", d.name);
        }
        let suffix = match &self.mode {
            Mode::Exec => "#".to_string(),
            Mode::Config => "(config)#".to_string(),
            Mode::Interface(n) if iface::is_subinterface(n) => "(config-subif)#".to_string(),
            Mode::Interface(_) => "(config-if)#".to_string(),
            Mode::Vlan(_) => "(config-vlan)#".to_string(),
        };
        format!("{}{}", d.name, suffix)
    }

    fn ctx(&self, topo: &Topology) -> Ctx {
        if topo.device(&self.device).is_some_and(|d| d.kind == Kind::Pc) {
            return Ctx::Pc;
        }
        match self.mode {
            Mode::Exec => Ctx::Exec,
            Mode::Config => Ctx::Config,
            Mode::Interface(_) => Ctx::If,
            Mode::Vlan(_) => Ctx::Vlan,
        }
    }

    fn candidates(&self, topo: &Topology, ctx: Ctx) -> Vec<&'static Pat> {
        let d = topo.device(&self.device);
        let kind = d.map(|d| d.kind);
        let in_subif = matches!(&self.mode, Mode::Interface(n) if iface::is_subinterface(n));
        PATTERNS
            .iter()
            .filter(|p| p.ctx == ctx)
            .filter(|p| match p.only {
                Only::Any => true,
                Only::Router => kind == Some(Kind::Router),
                Only::Switch => kind == Some(Kind::Switch),
                Only::Subif => kind == Some(Kind::Router) && in_subif,
            })
            .collect()
    }

    fn match_line<'a>(&self, cands: Vec<&'a Pat>, toks: &[(usize, &str)]) -> Match<'a> {
        let mut live = cands;
        for (i, (col, tok)) in toks.iter().enumerate() {
            let lower = tok.to_ascii_lowercase();
            // Rest slots swallow everything that follows.
            if let Some(p) = live.iter().find(|p| p.slots.get(i) == Some(&Rest)) {
                return Match::Done(p, self.collect_args(p, toks));
            }
            let kws: BTreeSet<&str> = live.iter().filter_map(|p| match p.slots.get(i) { Some(K(k)) => Some(*k), _ => None }).collect();
            let exact = kws.iter().find(|k| **k == lower).copied();
            let prefix: Vec<&str> = kws.iter().filter(|k| k.starts_with(&lower)).copied().collect();
            let next: Vec<&Pat> = if let Some(k) = exact {
                live.iter().filter(|p| p.slots.get(i) == Some(&K(k))).copied().collect()
            } else if prefix.len() == 1 {
                live.iter().filter(|p| p.slots.get(i) == Some(&K(prefix[0]))).copied().collect()
            } else if prefix.len() > 1 {
                let typed: Vec<&Pat> = live.iter().filter(|p| p.slots.get(i).is_some_and(|s| accepts(*s, tok))).copied().collect();
                if typed.is_empty() {
                    return Match::Ambiguous(toks[..=i].iter().map(|t| t.1).collect::<Vec<_>>().join(" "));
                }
                typed
            } else {
                live.iter().filter(|p| p.slots.get(i).is_some_and(|s| accepts(*s, tok))).copied().collect()
            };
            if next.is_empty() {
                return Match::Invalid(*col);
            }
            live = next;
        }
        match live.iter().find(|p| p.slots.len() == toks.len()) {
            Some(p) => Match::Done(p, self.collect_args(p, toks)),
            None => Match::Incomplete,
        }
    }

    fn collect_args(&self, p: &Pat, toks: &[(usize, &str)]) -> Vec<Arg> {
        let mut args = Vec::new();
        for (i, s) in p.slots.iter().enumerate() {
            let Some((col, tok)) = toks.get(i) else { break };
            match s {
                K(_) => {}
                Iface => args.push(Arg::Iface(iface::canonical(tok).unwrap_or_default())),
                Num(..) => args.push(Arg::Num(tok.parse().unwrap_or(0))),
                Ip => args.push(Arg::Ip(tok.parse().unwrap())),
                Mask => {
                    let m: Ipv4Addr = tok.parse().unwrap();
                    args.push(Arg::Num(mask_to_prefix(m).unwrap_or(0) as u32));
                }
                Prefix => args.push(Arg::Net(tok.parse().unwrap())),
                VlanList => args.push(Arg::Vlans(parse_vlans(tok).unwrap_or_default())),
                Word => args.push(Arg::Text(tok.to_string())),
                Rest => {
                    let line_rest: Vec<&str> = toks[i..].iter().map(|t| t.1).collect();
                    let _ = col;
                    args.push(Arg::Text(line_rest.join(" ")));
                    break;
                }
            }
        }
        args
    }

    fn help(&self, topo: &Topology, line: &str) -> Output {
        let ctx = self.ctx(topo);
        let attached = !line.ends_with(" ?") && line.trim() != "?";
        let body = line.trim_end_matches('?');
        let toks = tokenize(body);
        let (done, partial): (&[(usize, &str)], Option<&str>) = if attached && !toks.is_empty() {
            (&toks[..toks.len() - 1], Some(toks[toks.len() - 1].1))
        } else {
            (&toks[..], None)
        };
        let mut live = self.candidates(topo, ctx);
        if !done.is_empty() {
            match self.narrow(live, done) {
                Some(l) => live = l,
                None => return Output::err("% Unrecognized command"),
            }
        }
        let pos = done.len();
        let mut rows: Vec<(String, &'static str)> = Vec::new();
        let mut cr = false;
        for p in &live {
            match p.slots.get(pos) {
                Some(s) => {
                    let (word, mut desc) = slot_help(*s);
                    let prev = done.last().map(|t| t.1.to_ascii_lowercase()).unwrap_or_default();
                    if *s == K("interface") && ctx == Ctx::Exec {
                        desc = if "ip".starts_with(&prev) && !prev.is_empty() { "IP interface status and configuration" } else { "Show one interface's configuration" };
                    }
                    let keep = match (partial, s) {
                        (Some(pt), K(k)) => k.starts_with(&pt.to_ascii_lowercase()),
                        (Some(_), _) => false,
                        _ => true,
                    };
                    if keep && !rows.iter().any(|r| r.0 == word) {
                        rows.push((word, desc));
                    }
                }
                None => cr = partial.is_none(),
            }
        }
        rows.sort_by(|a, b| a.0.cmp(&b.0));
        if partial.is_some() {
            if rows.is_empty() {
                return Output::err("% Unrecognized command");
            }
            return Output::ok(rows.iter().map(|r| r.0.clone()).collect::<Vec<_>>().join("  "));
        }
        let mut out: Vec<String> = rows.iter().map(|(w, d)| format!("  {w:<16} {d}")).collect();
        if cr {
            out.push("  <cr>".into());
        }
        if out.is_empty() {
            return Output::err("% Unrecognized command");
        }
        Output::ok(out.join("\n"))
    }

    fn narrow(&self, cands: Vec<&'static Pat>, toks: &[(usize, &str)]) -> Option<Vec<&'static Pat>> {
        let mut live = cands;
        for (i, (_, tok)) in toks.iter().enumerate() {
            let lower = tok.to_ascii_lowercase();
            let next: Vec<&Pat> = live
                .iter()
                .filter(|p| match p.slots.get(i) {
                    Some(K(k)) => k.starts_with(&lower),
                    Some(s) => accepts(*s, tok),
                    None => false,
                })
                .copied()
                .collect();
            if next.is_empty() {
                return None;
            }
            live = next;
        }
        Some(live)
    }

    /// Runs one line typed at this device's prompt.
    pub fn exec(&mut self, topo: &mut Topology, line: &str) -> Output {
        let line = line.trim_end();
        if line.trim().is_empty() {
            return Output::ok("");
        }
        if line.ends_with('?') {
            return self.help(topo, line);
        }
        // `do` runs an exec command from any configuration mode.
        let (line, saved) = match tokenize(line).first() {
            Some((_, w)) if w.eq_ignore_ascii_case("do") && self.mode != Mode::Exec => {
                let rest = line.trim_start()[2..].trim_start().to_string();
                (rest, Some(self.mode.clone()))
            }
            _ => (line.to_string(), None),
        };
        if saved.is_some() {
            self.mode = Mode::Exec;
        }
        let out = self.exec_inner(topo, &line);
        if let Some(m) = saved {
            if self.mode == Mode::Exec {
                self.mode = m;
            }
        }
        out
    }

    fn exec_inner(&mut self, topo: &mut Topology, line: &str) -> Output {
        let ctx = self.ctx(topo);
        let toks = tokenize(line);
        let prompt_len = self.prompt(topo).len();
        let cands = self.candidates(topo, ctx);
        match self.match_line(cands, &toks) {
            Match::Invalid(col) => Output::err(format!("{}^\n% Invalid input detected at '^' marker.", " ".repeat(prompt_len + col))),
            Match::Ambiguous(s) => Output::err(format!("% Ambiguous command:  \"{s}\"")),
            Match::Incomplete => Output::err("% Incomplete command."),
            Match::Done(p, args) => self.apply(topo, p.act, args),
        }
    }

    fn apply(&mut self, topo: &mut Topology, act: Act, args: Vec<Arg>) -> Output {
        let name = self.device.clone();
        let arg_iface = |i: usize| match args.get(i) { Some(Arg::Iface(s)) => s.clone(), _ => String::new() };
        let arg_num = |i: usize| match args.get(i) { Some(Arg::Num(n)) => *n, _ => 0 };
        let arg_ip = |i: usize| match args.get(i) { Some(Arg::Ip(a)) => *a, _ => Ipv4Addr::UNSPECIFIED };
        let arg_text = |i: usize| match args.get(i) { Some(Arg::Text(t)) => t.clone(), _ => String::new() };
        let arg_vlans = |i: usize| match args.get(i) { Some(Arg::Vlans(v)) => v.clone(), _ => BTreeSet::new() };
        let cur_if = match &self.mode { Mode::Interface(n) => n.clone(), _ => String::new() };
        match act {
            Act::Enable | Act::Disable | Act::Save => Output::ok(if act == Act::Save { "Building configuration...\n[OK]" } else { "" }),
            Act::ConfT => {
                self.mode = Mode::Config;
                Output::ok("Enter configuration commands, one per line.  End with CNTL/Z.")
            }
            Act::End => {
                self.mode = Mode::Exec;
                Output::ok("")
            }
            Act::Exit => {
                self.mode = match self.mode {
                    Mode::Interface(_) | Mode::Vlan(_) => Mode::Config,
                    _ => Mode::Exec,
                };
                Output::ok("")
            }
            Act::ShowRun => Output::ok(render::running_config(topo, &name)),
            Act::ShowRunIf => {
                let want = arg_iface(0);
                match topo.device(&name).and_then(|d| d.iface(&want)) {
                    Some(_) => Output::ok(render::running_config_iface(topo, &name, &want)),
                    None => Output::err("% Invalid input detected: no such interface"),
                }
            }
            Act::ShowIpIntBrief => Output::ok(render::ip_int_brief(topo, &name)),
            Act::ShowVlanBrief => Output::ok(render::vlan_brief(topo, &name)),
            Act::ShowIntTrunk => Output::ok(render::interfaces_trunk(topo, &name)),
            Act::ShowIpRoute => Output::ok(render::ip_route(topo, &name)),
            Act::PcShow => Output::ok(render::pc_ip(topo, &name)),
            Act::Ping => {
                let dst = arg_ip(0);
                let r = topo.ping(&name, dst);
                Output { text: render::ping(topo, &name, dst, &r), error: false }
            }
            Act::Hostname => {
                let new = arg_text(0);
                if topo.device(&new).is_some() && !new.eq_ignore_ascii_case(&name) {
                    return Output::err("% Another device already uses that name");
                }
                if let Some(d) = topo.device_mut(&name) {
                    d.name = new.clone();
                }
                for l in topo.links.iter_mut() {
                    for p in [&mut l.a, &mut l.b] {
                        if p.device == name {
                            p.device = new.clone();
                        }
                    }
                }
                self.device = new;
                Output::ok("")
            }
            Act::Interface => {
                let want = arg_iface(0);
                let Some(d) = topo.device_mut(&name) else { return Output::err("% Unknown device") };
                if d.iface(&want).is_none() && !(iface::is_subinterface(&want) && d.ensure_subif(&want)) {
                    return Output::err(format!("% Invalid interface: {} has no {}", name, iface::short(&want)));
                }
                self.mode = Mode::Interface(want);
                Output::ok("")
            }
            Act::Vlan => {
                let v = arg_num(0) as u16;
                if let Some(d) = topo.device_mut(&name) {
                    d.vlans.entry(v).or_insert_with(|| format!("VLAN{v:04}"));
                }
                self.mode = Mode::Vlan(v);
                Output::ok("")
            }
            Act::NoVlan => {
                let v = arg_num(0) as u16;
                if v == 1 {
                    return Output::err("%Default VLAN 1 may not be deleted.");
                }
                if let Some(d) = topo.device_mut(&name) {
                    d.vlans.remove(&v);
                }
                Output::ok("")
            }
            Act::VlanName => {
                if let (Mode::Vlan(v), Some(d)) = (&self.mode, topo.device_mut(&name)) {
                    d.vlans.insert(*v, arg_text(0));
                }
                Output::ok("")
            }
            Act::IpRoute | Act::NoIpRoute => {
                let net = Ipv4Net::new(arg_ip(0), arg_num(1) as u8);
                let net = Ipv4Net::new(net.network(), net.prefix);
                let route = StaticRoute { net, next_hop: arg_ip(2) };
                if let Some(d) = topo.device_mut(&name) {
                    d.routes.retain(|r| r != &route);
                    if act == Act::IpRoute {
                        d.routes.push(route);
                    }
                }
                Output::ok("")
            }
            Act::IpAddress => {
                let net = Ipv4Net::new(arg_ip(0), arg_num(1) as u8);
                if net.addr == net.network() && net.prefix < 31 {
                    return Output::err("Bad mask /".to_string() + &net.prefix.to_string() + " for address " + &net.addr.to_string());
                }
                let d = topo.device(&name).unwrap();
                if let Some(other) = d.l3_ifaces().find(|i| i.name != cur_if && i.ip.is_some_and(|n| n.same_subnet(&net))) {
                    return Output::err(format!("% {} overlaps with {}", net.network(), other.short()));
                }
                if let Some(i) = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)) {
                    i.ip = Some(net);
                }
                Output::ok("")
            }
            Act::NoIpAddress => {
                if let Some(i) = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)) {
                    i.ip = None;
                }
                Output::ok("")
            }
            Act::Shutdown | Act::NoShutdown => {
                let down = act == Act::Shutdown;
                let changed = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)).map(|i| {
                    let was = i.shutdown;
                    i.shutdown = down;
                    was != down
                });
                if changed == Some(true) && !iface::is_subinterface(&cur_if) {
                    let state = if down { "administratively down" } else { "up" };
                    return Output::ok(format!("%LINK-5-CHANGED: Interface {cur_if}, changed state to {state}"));
                }
                Output::ok("")
            }
            Act::Description => {
                if let Some(i) = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)) {
                    i.description = Some(arg_text(0));
                }
                Output::ok("")
            }
            Act::SwModeAccess | Act::SwModeTrunk | Act::SwAccessVlan | Act::SwNative | Act::SwAllowed | Act::SwAllowedAdd | Act::SwAllowedRemove => {
                let mut note = String::new();
                if act == Act::SwAccessVlan {
                    let v = arg_num(0) as u16;
                    if let Some(d) = topo.device_mut(&name) {
                        if !d.has_vlan(v) {
                            d.vlans.insert(v, format!("VLAN{v:04}"));
                            note = format!("% Access VLAN does not exist. Creating vlan {v}");
                        }
                    }
                }
                if let Some(sp) = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)).and_then(|i| i.switchport.as_mut()) {
                    match act {
                        Act::SwModeAccess => sp.mode = PortMode::Access,
                        Act::SwModeTrunk => sp.mode = PortMode::Trunk,
                        Act::SwAccessVlan => sp.access_vlan = arg_num(0) as u16,
                        Act::SwNative => sp.native_vlan = arg_num(0) as u16,
                        Act::SwAllowed => sp.allowed = Some(arg_vlans(0)),
                        Act::SwAllowedAdd => {
                            if let Some(a) = sp.allowed.as_mut() {
                                a.extend(arg_vlans(0));
                            }
                        }
                        Act::SwAllowedRemove => {
                            let rm = arg_vlans(0);
                            let mut a = sp.allowed.clone().unwrap_or_else(|| (1..=4094).collect());
                            a.retain(|v| !rm.contains(v));
                            sp.allowed = Some(a);
                        }
                        _ => {}
                    }
                }
                Output::ok(note)
            }
            Act::Encap | Act::EncapNative => {
                let v = arg_num(0) as u16;
                let d = topo.device(&name).unwrap();
                let parent = iface::parent(&cur_if).to_string();
                if let Some(other) = d.subifs_of(&parent).find(|s| s.name != cur_if && s.encapsulation.is_some_and(|e| e.vlan == v)) {
                    return Output::err(format!("Configuration of multiple subinterfaces of the same main\ninterface with the same VID ({v}) is not permitted.\nThis VID is already configured on {}.", other.short()));
                }
                if let Some(i) = topo.device_mut(&name).and_then(|d| d.iface_mut(&cur_if)) {
                    i.encapsulation = Some(Dot1q { vlan: v, native: act == Act::EncapNative });
                }
                Output::ok("")
            }
            Act::PcIp | Act::PcIpGw => {
                let net = match args.first() { Some(Arg::Net(n)) => *n, _ => return Output::err("Invalid address") };
                let gw = if act == Act::PcIpGw { Some(arg_ip(1)) } else { None };
                if let Some(g) = gw {
                    if !net.contains(g) {
                        return Output::err(format!("Gateway {g} isn't in {}/{}", net.network(), net.prefix));
                    }
                }
                if let Some(d) = topo.device_mut(&name) {
                    if let Some(i) = d.iface_mut("eth0") {
                        i.ip = Some(net);
                    }
                    d.gateway = gw;
                }
                let gwtext = gw.map(|g| format!(" gateway {g}")).unwrap_or_default();
                Output::ok(format!("PC1 : {} {}{}", net.addr, net.mask(), gwtext).replacen("PC1", &name, 1))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::device::Device;

    fn topo() -> Topology {
        Topology { devices: vec![Device::new("R1", Kind::Router, None), Device::new("S1", Kind::Switch, None)], links: vec![] }
    }

    #[test]
    fn abbreviations_work() {
        let mut t = topo();
        let mut s = Session::new("R1");
        assert!(!s.exec(&mut t, "conf t").error);
        assert_eq!(s.prompt(&t), "R1(config)#");
        assert!(!s.exec(&mut t, "int g0/0/1.20").error);
        assert_eq!(s.prompt(&t), "R1(config-subif)#");
        assert!(!s.exec(&mut t, "encap dot1q 20").error);
        assert!(!s.exec(&mut t, "ip add 192.168.20.1 255.255.255.0").error);
        assert!(!s.exec(&mut t, "end").error);
        let i = t.device("R1").unwrap().iface("GigabitEthernet0/0/1.20").unwrap().clone();
        assert_eq!(i.encapsulation.unwrap().vlan, 20);
        assert_eq!(i.ip.unwrap().to_string(), "192.168.20.1/24");
        let out = s.exec(&mut t, "sh run int g0/0/1.20");
        assert!(out.text.contains("encapsulation dot1Q 20"), "{}", out.text);
    }

    #[test]
    fn invalid_input_points_at_the_word() {
        let mut t = topo();
        let mut s = Session::new("R1");
        s.exec(&mut t, "conf t");
        let out = s.exec(&mut t, "interfase g0/0/1");
        assert!(out.error);
        // "R1(config)#" is 11 characters, the bad word starts at column 0.
        assert!(out.text.starts_with(&format!("{}^", " ".repeat(11))), "{:?}", out.text);
    }

    #[test]
    fn ambiguous_and_incomplete() {
        let mut t = topo();
        let mut s = Session::new("R1");
        s.exec(&mut t, "conf t");
        s.exec(&mut t, "int g0/0/1");
        assert!(s.exec(&mut t, "e").text.contains("Ambiguous"));
        assert!(s.exec(&mut t, "ip address").text.contains("Incomplete"));
    }

    #[test]
    fn help_lists_options() {
        let mut t = topo();
        let mut s = Session::new("R1");
        let out = s.exec(&mut t, "show ?");
        assert!(out.text.contains("running-config") && out.text.contains("ip"), "{}", out.text);
        assert!(!out.text.contains("vlan"), "a router has no VLAN database");
        let out = s.exec(&mut t, "sh?");
        assert_eq!(out.text, "show");
    }

    #[test]
    fn switchports_and_do() {
        let mut t = topo();
        let mut s = Session::new("S1");
        s.exec(&mut t, "conf t");
        s.exec(&mut t, "vlan 10");
        s.exec(&mut t, "name SALES");
        s.exec(&mut t, "int fa0/5");
        s.exec(&mut t, "sw mo acc");
        s.exec(&mut t, "sw acc vlan 10");
        s.exec(&mut t, "int g0/1");
        s.exec(&mut t, "switchport mode trunk");
        let out = s.exec(&mut t, "do show vlan brief");
        assert!(out.text.contains("SALES") && out.text.contains("Fa0/5"), "{}", out.text);
        assert_eq!(s.prompt(&t), "S1(config-if)#", "do keeps the mode");
        let d = t.device("S1").unwrap();
        assert_eq!(d.iface("GigabitEthernet0/1").unwrap().switchport.as_ref().unwrap().mode, PortMode::Trunk);
        // Switch-only commands are not on a router.
        let mut r = Session::new("R1");
        r.exec(&mut t, "conf t");
        r.exec(&mut t, "int g0/0/1");
        assert!(r.exec(&mut t, "switchport mode trunk").error);
    }

    #[test]
    fn duplicate_vlan_on_subinterfaces_is_refused() {
        let mut t = topo();
        let mut s = Session::new("R1");
        for l in ["conf t", "int g0/0/1.10", "encap dot1q 10", "int g0/0/1.20"] {
            s.exec(&mut t, l);
        }
        assert!(s.exec(&mut t, "encapsulation dot1q 10").error);
    }
}

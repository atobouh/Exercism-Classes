//! Octet's network simulator.
//!
//! A small but honest model of the networks CCNA covers: switches with VLANs,
//! access ports and 802.1Q trunks, routers with subinterfaces and static
//! routes, and PCs. Commands go through an IOS-style console, and pings are
//! worked out hop by hop, so a lab passes because the network really works.

pub mod cli;
pub mod device;
pub mod diff;
pub mod iface;
pub mod lab;
pub mod net;
pub mod render;

pub use cli::{Output, Session};
pub use device::{Device, Kind};
pub use lab::{ExecResult, Lab, LabDef, LabView, PortRow, TaskResult};
pub use net::{Fault, PingResult, Topology};

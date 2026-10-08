use octet_sim::Lab;

const LAB: &str = include_str!("../../../content/labs/srwe-03-router-on-a-stick.toml");

fn run(lab: &mut Lab, dev: &str, lines: &[&str]) {
    for l in lines {
        let r = lab.exec(dev, l).expect("device exists");
        assert!(!r.output.error, "{dev}: `{l}` failed:\n{}", r.output.text);
    }
}

#[test]
fn the_lab_starts_broken_where_the_brief_says() {
    let lab = Lab::from_toml(LAB).unwrap();
    let res = lab.run_checks();
    assert!(res[0].pass, "{}", res[0].message);
    assert!(res[1].pass, "{}", res[1].message);
    assert!(!res[2].pass);
    let f = lab.fault().expect("a fault to show on the map");
    assert_eq!(f.device, "R1");
    assert!(f.message.contains("VLAN 20"), "{}", f.message);
    // Sales can reach its own gateway but not Engineering.
    assert!(lab.topo.ping("PC-SALES", "192.168.10.1".parse().unwrap()).ok);
    assert!(!lab.topo.ping("PC-ENG", "192.168.20.1".parse().unwrap()).ok);
}

#[test]
fn fixing_the_tag_makes_every_check_pass() {
    let mut lab = Lab::from_toml(LAB).unwrap();
    run(&mut lab, "R1", &["conf t", "int g0/0/1.20", "encap dot1q 20", "end"]);
    assert!(lab.run_checks().iter().all(|r| r.pass));
    assert!(lab.fault().is_none());
    let out = lab.exec("PC-ENG", "ping 192.168.10.10").unwrap();
    assert!(out.output.text.contains("ttl=63"), "{}", out.output.text);
    let out = lab.exec("R1", "ping 192.168.20.10").unwrap();
    assert!(out.output.text.contains("!!!!!"));
    // The change shows up as a diff.
    let changes = lab.changes("R1");
    assert!(changes.iter().any(|l| l.text.contains("dot1Q 30") && l.change == octet_sim::diff::Change::Del));
    assert!(changes.iter().any(|l| l.text.contains("dot1Q 20") && l.change == octet_sim::diff::Change::Add));
}

#[test]
fn other_ways_to_break_it_are_explained() {
    // Remove VLAN 20 from the trunk.
    let mut lab = Lab::from_toml(LAB).unwrap();
    run(&mut lab, "R1", &["conf t", "int g0/0/1.20", "encap dot1q 20", "end"]);
    run(&mut lab, "S1", &["conf t", "int g0/1", "switchport trunk allowed vlan 10", "end"]);
    let f = lab.fault().unwrap();
    assert!(f.message.contains("doesn't allow VLAN 20"), "{}", f.message);

    // Shut the router port.
    let mut lab = Lab::from_toml(LAB).unwrap();
    run(&mut lab, "R1", &["conf t", "int g0/0/1.20", "encap dot1q 20", "int g0/0/1", "shutdown", "end"]);
    let r = lab.topo.ping("PC-ENG", "192.168.10.10".parse().unwrap());
    assert!(!r.ok);
    assert!(r.fault.unwrap().message.contains("shut down"));

    // Make the PC's port an access port in the wrong VLAN.
    let mut lab = Lab::from_toml(LAB).unwrap();
    run(&mut lab, "R1", &["conf t", "int g0/0/1.20", "encap dot1q 20", "end"]);
    run(&mut lab, "S1", &["conf t", "int fa0/6", "sw acc vlan 10", "end"]);
    assert!(!lab.topo.ping("PC-ENG", "192.168.10.10".parse().unwrap()).ok);

    // A PC without a gateway can't leave its subnet.
    let mut lab = Lab::from_toml(LAB).unwrap();
    run(&mut lab, "R1", &["conf t", "int g0/0/1.20", "encap dot1q 20", "end"]);
    run(&mut lab, "PC-ENG", &["ip 192.168.20.10/24"]);
    let r = lab.topo.ping("PC-ENG", "192.168.10.10".parse().unwrap());
    assert!(r.fault.unwrap().message.contains("no default gateway"));
}

#[test]
fn show_commands_read_like_ios() {
    let mut lab = Lab::from_toml(LAB).unwrap();
    let brief = lab.exec("R1", "sh ip int br").unwrap().output.text;
    assert!(brief.contains("Gi0/0/1.20") && brief.contains("192.168.20.1"), "{brief}");
    assert!(brief.contains("GigabitEthernet0/0/0") && brief.contains("administratively down"), "{brief}");
    let trunk = lab.exec("S1", "show int trunk").unwrap().output.text;
    assert!(trunk.contains("Gi0/1") && trunk.contains("trunking"), "{trunk}");
    let vlan = lab.exec("S1", "sh vlan br").unwrap().output.text;
    assert!(vlan.contains("ENG") && vlan.contains("Fa0/6"), "{vlan}");
    let route = lab.exec("R1", "show ip route").unwrap().output.text;
    assert!(route.contains("C        192.168.20.0/24"), "{route}");
}

#[test]
fn build_on_the_canvas() {
    let mut lab = Lab::from_toml(LAB).unwrap();
    let pc = lab.add_device(octet_sim::Kind::Pc, 640.0, 210.0);
    assert_eq!(pc, "PC-1");
    let link = lab.connect(&pc, "S1").unwrap();
    assert_eq!(link.b_port, "Gi0/2", "uplinks are used first on a switch");
    run(&mut lab, &pc, &["ip 192.168.10.20/24 192.168.10.1"]);
    // Gi0/2 is an access port in VLAN 1, so the new PC can't reach VLAN 10 yet.
    assert!(!lab.topo.ping(&pc, "192.168.10.10".parse().unwrap()).ok);
    run(&mut lab, "S1", &["conf t", "int g0/2", "sw mode access", "sw access vlan 10", "end"]);
    assert!(lab.topo.ping(&pc, "192.168.10.10".parse().unwrap()).ok);
}

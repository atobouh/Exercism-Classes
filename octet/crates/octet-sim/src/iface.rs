//! Interface names: parsing the abbreviations people type, and the long and
//! short forms IOS prints.

use std::cmp::Ordering;

const TYPES: &[(&str, &str)] = &[
    ("GigabitEthernet", "Gi"),
    ("FastEthernet", "Fa"),
    ("Ethernet", "Et"),
    ("Loopback", "Lo"),
    ("Vlan", "Vl"),
    ("eth", "eth"),
];

/// Turns what someone typed (`g0/0/1.20`, `fa0/5`, `GigabitEthernet0/1`) into
/// the canonical long name, or `None` if it isn't an interface name.
pub fn canonical(input: &str) -> Option<String> {
    let s: String = input.chars().filter(|c| !c.is_whitespace()).collect();
    let split = s.find(|c: char| c.is_ascii_digit())?;
    let (kind, rest) = s.split_at(split);
    if kind.is_empty() || !valid_numbering(rest) {
        return None;
    }
    let kind = kind.to_ascii_lowercase();
    // `eth0` is a PC's NIC; IOS types need at least one letter of the long name.
    let found = TYPES
        .iter()
        .find(|(_, short)| short.to_ascii_lowercase() == kind)
        .or_else(|| TYPES.iter().find(|(long, _)| long.to_ascii_lowercase().starts_with(&kind)))
        .map(|(long, _)| *long)?;
    Some(format!("{found}{rest}"))
}

fn valid_numbering(rest: &str) -> bool {
    let (main, sub) = match rest.split_once('.') {
        Some((m, s)) => (m, Some(s)),
        None => (rest, None),
    };
    let parts_ok = !main.is_empty()
        && main.split('/').all(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()));
    let sub_ok = sub.is_none_or(|s| !s.is_empty() && s.chars().all(|c| c.is_ascii_digit()));
    parts_ok && sub_ok
}

/// `GigabitEthernet0/0/1.20` becomes `Gi0/0/1.20`.
pub fn short(name: &str) -> String {
    for (long, short) in TYPES {
        if let Some(rest) = name.strip_prefix(long) {
            return format!("{short}{rest}");
        }
    }
    name.to_string()
}

/// The physical interface a subinterface belongs to.
pub fn parent(name: &str) -> &str {
    name.split_once('.').map_or(name, |(p, _)| p)
}

pub fn is_subinterface(name: &str) -> bool {
    name.contains('.')
}

/// Orders interfaces the way IOS lists them: by type, then each number.
pub fn natural_cmp(a: &str, b: &str) -> Ordering {
    let key = |s: &str| {
        let split = s.find(|c: char| c.is_ascii_digit()).unwrap_or(s.len());
        let (kind, rest) = s.split_at(split);
        let rank = TYPES.iter().position(|(l, _)| *l == kind).unwrap_or(usize::MAX);
        let nums: Vec<u32> = rest
            .split(['/', '.'])
            .map(|p| p.parse().unwrap_or(0))
            .collect();
        let has_sub = rest.contains('.');
        (rank, kind.to_string(), nums, has_sub)
    };
    let (ra, ka, na, sa) = key(a);
    let (rb, kb, nb, sb) = key(b);
    ra.cmp(&rb)
        .then(ka.cmp(&kb))
        .then_with(|| {
            // Compare the physical part first so subinterfaces follow their parent.
            let pa = if sa { &na[..na.len() - 1] } else { &na[..] };
            let pb = if sb { &nb[..nb.len() - 1] } else { &nb[..] };
            pa.cmp(pb).then(sa.cmp(&sb)).then(na.cmp(&nb))
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expands_abbreviations() {
        assert_eq!(canonical("g0/0/1.20").as_deref(), Some("GigabitEthernet0/0/1.20"));
        assert_eq!(canonical("gi0/1").as_deref(), Some("GigabitEthernet0/1"));
        assert_eq!(canonical("Fa0/5").as_deref(), Some("FastEthernet0/5"));
        assert_eq!(canonical("f0/5").as_deref(), Some("FastEthernet0/5"));
        assert_eq!(canonical("GigabitEthernet0/0/0").as_deref(), Some("GigabitEthernet0/0/0"));
        assert_eq!(canonical("g 0/1").as_deref(), Some("GigabitEthernet0/1"));
        assert_eq!(canonical("eth0").as_deref(), Some("eth0"));
        assert_eq!(canonical("lo0").as_deref(), Some("Loopback0"));
    }

    #[test]
    fn rejects_non_interfaces() {
        assert_eq!(canonical("trunk"), None);
        assert_eq!(canonical("g0/"), None);
        assert_eq!(canonical("x0/1"), None);
        assert_eq!(canonical("10"), None);
    }

    #[test]
    fn short_and_parent() {
        assert_eq!(short("GigabitEthernet0/0/1.20"), "Gi0/0/1.20");
        assert_eq!(parent("GigabitEthernet0/0/1.20"), "GigabitEthernet0/0/1");
        assert!(is_subinterface("Gi0/0/1.10"));
    }

    #[test]
    fn sorts_naturally() {
        let mut v = vec!["FastEthernet0/10", "FastEthernet0/2", "GigabitEthernet0/1", "GigabitEthernet0/0/1.20", "GigabitEthernet0/0/1"];
        v.sort_by(|a, b| natural_cmp(a, b));
        assert_eq!(v, ["GigabitEthernet0/0/1", "GigabitEthernet0/0/1.20", "GigabitEthernet0/1", "FastEthernet0/2", "FastEthernet0/10"]);
    }
}

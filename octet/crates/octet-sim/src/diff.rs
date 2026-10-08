//! A small line diff (longest common subsequence), enough for configs.

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Change {
    Same,
    Add,
    Del,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct DiffLine {
    pub change: Change,
    pub text: String,
}

pub fn diff_lines(a: &[String], b: &[String]) -> Vec<DiffLine> {
    let (n, m) = (a.len(), b.len());
    let mut lcs = vec![vec![0u32; m + 1]; n + 1];
    for i in (0..n).rev() {
        for j in (0..m).rev() {
            lcs[i][j] = if a[i] == b[j] { lcs[i + 1][j + 1] + 1 } else { lcs[i + 1][j].max(lcs[i][j + 1]) };
        }
    }
    let (mut i, mut j, mut out) = (0, 0, Vec::new());
    while i < n || j < m {
        if i < n && j < m && a[i] == b[j] {
            out.push(DiffLine { change: Change::Same, text: a[i].clone() });
            i += 1;
            j += 1;
        } else if j < m && (i == n || lcs[i][j + 1] >= lcs[i + 1][j]) {
            out.push(DiffLine { change: Change::Add, text: b[j].clone() });
            j += 1;
        } else {
            out.push(DiffLine { change: Change::Del, text: a[i].clone() });
            i += 1;
        }
    }
    // Deletions read better before the line that replaces them.
    let mut k = 1;
    while k < out.len() {
        if out[k].change == Change::Del && out[k - 1].change == Change::Add {
            out.swap(k, k - 1);
            k = k.saturating_sub(1).max(1);
        } else {
            k += 1;
        }
    }
    out
}

/// Only the changed lines with the interface or section they belong to.
pub fn hunks(lines: &[DiffLine]) -> Vec<DiffLine> {
    let mut out = Vec::new();
    let mut header: Option<&DiffLine> = None;
    let mut header_shown = false;
    for l in lines {
        let is_header = !l.text.starts_with(' ');
        if is_header && l.change == Change::Same {
            header = Some(l);
            header_shown = false;
            continue;
        }
        if l.change != Change::Same {
            if let (Some(h), false) = (header, header_shown) {
                if !is_header {
                    out.push(h.clone());
                    header_shown = true;
                }
            }
            out.push(l.clone());
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn v(s: &[&str]) -> Vec<String> {
        s.iter().map(|x| x.to_string()).collect()
    }

    #[test]
    fn replaced_line_shows_as_del_then_add() {
        let a = v(&["interface Gi0/0/1.20", " encapsulation dot1Q 30", " ip address 1.1.1.1 255.255.255.0"]);
        let b = v(&["interface Gi0/0/1.20", " encapsulation dot1Q 20", " ip address 1.1.1.1 255.255.255.0"]);
        let d = diff_lines(&a, &b);
        let kinds: Vec<Change> = d.iter().map(|l| l.change).collect();
        assert_eq!(kinds, [Change::Same, Change::Del, Change::Add, Change::Same]);
        let h = hunks(&d);
        assert_eq!(h[0].text, "interface Gi0/0/1.20");
        assert_eq!(h.len(), 3);
    }
}

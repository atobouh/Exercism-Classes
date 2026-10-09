//! Labs you build: one JSON file each, in a `labs` folder next to your data
//! file. A lab file is the bench lab format (format 1) with the bench itself
//! saved as snapshots instead of `[[device]]` and `[[cable]]` lists:
//!
//! - `start`: what a student sees first. Missing means "the board as built".
//! - `board`: the bench as you left it in build mode. Never exported.
//!
//! The same shape, without `board`, is the `.octet-lab` file you share.

use octet_core::content::{valid_id, BENCH_MODELS};
use serde_json::{json, Map, Value};
use std::collections::HashSet;
use std::path::{Path, PathBuf};

/// The checks the bench engine grades. A task with any other check never passes.
pub const CHECKS: &[&str] = &["console", "address", "pc", "cabled", "link", "vlan", "trunk", "tried", "pinged", "reach"];

pub struct Mine {
    pub dir: PathBuf,
}

/// A file name from a title: `My VLAN lab` is `my-vlan-lab`.
fn slug(title: &str) -> String {
    let mut s = String::new();
    for c in title.chars().flat_map(|c| c.to_lowercase()) {
        if c.is_ascii_alphanumeric() {
            s.push(c);
        } else if !s.ends_with('-') && !s.is_empty() {
            s.push('-');
        }
    }
    let s: String = s.trim_end_matches('-').chars().take(40).collect();
    let s = s.trim_end_matches('-').to_string();
    if s.is_empty() { "lab".into() } else { s }
}

/// What's wrong with a lab file, in words. Empty means it opens.
pub fn problems(v: &Value) -> Vec<String> {
    let mut out = Vec::new();
    let Some(o) = v.as_object() else { return vec!["this isn't an Octet lab file".into()] };
    if o.get("format").and_then(|f| f.as_i64()) != Some(1) {
        out.push("it needs \"format\": 1".into());
    }
    if o.get("title").and_then(|t| t.as_str()).is_none_or(|t| t.trim().is_empty()) {
        out.push("it needs a title".into());
    }
    let snap = o.get("start").filter(|s| !s.is_null()).or_else(|| o.get("board").filter(|s| !s.is_null()));
    let mut ids = HashSet::new();
    if let Some(s) = snap {
        let devices = s.get("devices").and_then(|d| d.as_array());
        if devices.is_none() {
            out.push("its starting bench has no device list".into());
        }
        for d in devices.into_iter().flatten() {
            let id = d.get("id").and_then(|x| x.as_str()).unwrap_or("");
            let model = d.get("model").and_then(|x| x.as_str()).unwrap_or("");
            if id.is_empty() || !ids.insert(id.to_string()) {
                out.push(format!("device \"{id}\" needs a unique name"));
            }
            if !BENCH_MODELS.contains(&model) {
                out.push(format!("device {id} is a \"{model}\", which this Octet doesn't have; it has {}", BENCH_MODELS.join(", ")));
            }
        }
        for c in s.get("cables").and_then(|c| c.as_array()).into_iter().flatten() {
            for end in ["a", "b"] {
                let dev = c.get(end).and_then(|e| e.get("dev")).and_then(|d| d.as_str()).unwrap_or("");
                if !ids.contains(dev) {
                    out.push(format!("a cable goes to \"{dev}\", which isn't on the bench"));
                }
            }
        }
    }
    match o.get("task") {
        None | Some(Value::Null) => {}
        Some(Value::Array(ts)) => {
            for (i, t) in ts.iter().enumerate() {
                let n = i + 1;
                if t.get("text").and_then(|x| x.as_str()).is_none_or(|x| x.trim().is_empty()) {
                    out.push(format!("task {n} needs some text"));
                }
                let kind = t.get("check").and_then(|c| c.as_object()).and_then(|c| c.keys().next().cloned()).unwrap_or_default();
                if !CHECKS.contains(&kind.as_str()) {
                    out.push(format!("task {n} checks \"{kind}\"; use one of {}", CHECKS.join(", ")));
                }
            }
        }
        Some(_) => out.push("its tasks should be a list".into()),
    }
    out
}

impl Mine {
    pub fn new(dir: PathBuf) -> Self {
        Self { dir }
    }

    fn path(&self, id: &str) -> Result<PathBuf, String> {
        if !valid_id(id) {
            return Err("bad lab id".into());
        }
        Ok(self.dir.join(format!("{id}.json")))
    }

    pub fn get(&self, id: &str) -> Result<Value, String> {
        let p = self.path(id)?;
        let text = std::fs::read_to_string(&p).map_err(|_| format!("no lab {id}"))?;
        serde_json::from_str(&text).map_err(|e| format!("{}: {e}", p.display()))
    }

    fn put(&self, id: &str, v: &Value) -> Result<(), String> {
        std::fs::create_dir_all(&self.dir).map_err(|e| format!("can't make {}: {e}", self.dir.display()))?;
        let p = self.path(id)?;
        let tmp = p.with_extension("json.tmp");
        std::fs::write(&tmp, serde_json::to_string_pretty(v).unwrap()).map_err(|e| format!("can't save {}: {e}", p.display()))?;
        std::fs::rename(&tmp, &p).map_err(|e| format!("can't save {}: {e}", p.display()))
    }

    /// Your labs, newest change first.
    pub fn list(&self) -> Vec<Value> {
        let mut out: Vec<Value> = std::fs::read_dir(&self.dir)
            .into_iter()
            .flatten()
            .filter_map(|e| e.ok())
            .filter_map(|e| {
                let p = e.path();
                let id = p.file_stem()?.to_str()?.to_string();
                (p.extension()? == "json" && valid_id(&id)).then_some(id)
            })
            .filter_map(|id| self.get(&id).ok())
            .collect();
        out.sort_by_key(|v| -v["updated"].as_i64().unwrap_or(0));
        out
    }

    fn free_id(&self, title: &str) -> String {
        let base = slug(title);
        let taken = |id: &str| self.dir.join(format!("{id}.json")).exists();
        if !taken(&base) {
            return base;
        }
        (2..).map(|n| format!("{base}-{n}")).find(|id| !taken(id)).unwrap()
    }

    pub fn create(&self, title: &str, now: i64) -> Result<String, String> {
        let title = title.trim();
        let title = if title.is_empty() { "Untitled lab" } else { title };
        let id = self.free_id(title);
        self.put(&id, &json!({ "format": 1, "id": id, "title": title, "summary": "", "task": [], "start": null, "board": null, "updated": now }))?;
        Ok(id)
    }

    /// Changes the fields you pass: title, summary, task, board, start.
    pub fn update(&self, id: &str, fields: &Map<String, Value>, now: i64) -> Result<(), String> {
        let mut v = self.get(id)?;
        for k in ["title", "summary", "task", "board", "start"] {
            if let Some(x) = fields.get(k) {
                v[k] = x.clone();
            }
        }
        if v["title"].as_str().is_none_or(|t| t.trim().is_empty()) {
            return Err("a lab needs a title".into());
        }
        v["updated"] = json!(now);
        self.put(id, &v)
    }

    pub fn delete(&self, id: &str) -> Result<(), String> {
        let p = self.path(id)?;
        std::fs::remove_file(&p).map_err(|e| format!("can't remove {}: {e}", p.display()))
    }

    /// The `.octet-lab` file: the lab with its starting bench, not your board.
    pub fn export(&self, id: &str) -> Result<String, String> {
        let v = self.get(id)?;
        let start = if v["start"].is_null() { fresh(v["board"].clone()) } else { v["start"].clone() };
        let out = json!({ "format": 1, "title": v["title"], "summary": v["summary"], "task": v["task"], "start": start });
        Ok(serde_json::to_string_pretty(&out).unwrap())
    }

    /// Checks a shared lab and keeps it as one of yours. Returns its new id.
    pub fn import(&self, text: &str, now: i64) -> Result<String, Vec<String>> {
        let v: Value = serde_json::from_str(text).map_err(|e| vec![format!("this isn't an Octet lab file ({e})")])?;
        let p = problems(&v);
        if !p.is_empty() {
            return Err(p);
        }
        let title = v["title"].as_str().unwrap_or("").trim().to_string();
        let id = self.free_id(&title);
        let start = if v["start"].is_null() { v["board"].clone() } else { v["start"].clone() };
        let task = if v["task"].is_null() { json!([]) } else { v["task"].clone() };
        let lab = json!({ "format": 1, "id": id, "title": title, "summary": v["summary"].as_str().unwrap_or(""), "task": task, "start": start, "board": start, "from": "file", "updated": now });
        self.put(&id, &lab).map_err(|e| vec![e])?;
        Ok(id)
    }
}

/// A bench as a student first sees it: no consoles opened, no pings yet.
fn fresh(mut s: Value) -> Value {
    if let Some(o) = s.as_object_mut() {
        for k in ["opened", "pinged", "tried"] {
            o.insert(k.into(), json!([]));
        }
        o.insert("passed".into(), json!(false));
    }
    s
}

/// Writes the `.octet-lab` file into `dir` without replacing another one.
pub fn write_file(dir: &Path, id: &str, text: &str) -> Result<PathBuf, String> {
    std::fs::create_dir_all(dir).map_err(|e| format!("can't reach {}: {e}", dir.display()))?;
    let p = std::iter::once(dir.join(format!("{id}.octet-lab")))
        .chain((2..).map(|n| dir.join(format!("{id}-{n}.octet-lab"))))
        .find(|p| !p.exists())
        .unwrap();
    std::fs::write(&p, text).map_err(|e| format!("can't save {}: {e}", p.display()))?;
    Ok(p)
}

/// The folder for your labs, next to your data file.
pub fn dir_for(data: &Path) -> PathBuf {
    data.parent().map(|d| d.join("labs")).unwrap_or_else(|| PathBuf::from("labs"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn titles_make_file_names() {
        assert_eq!(slug("My VLAN lab!"), "my-vlan-lab");
        assert_eq!(slug("  ---  "), "lab");
        assert!(valid_id(&slug(&"x".repeat(200))));
    }

    #[test]
    fn a_broken_file_says_what_to_fix() {
        let v = json!({ "format": 2, "title": "", "start": { "devices": [{ "id": "R1", "model": "Nope" }], "cables": [{ "a": { "dev": "R1" }, "b": { "dev": "R9" } }] }, "task": [{ "text": "", "check": { "fly": {} } }] });
        let p = problems(&v).join("\n");
        for want in ["format", "title", "Nope", "R9", "task 1 needs some text", "\"fly\""] {
            assert!(p.contains(want), "{want} missing from {p}");
        }
    }
}

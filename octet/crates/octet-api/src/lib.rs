//! Every command the interface can call, behind one entry point:
//! `App::call(name, args)`. The desktop app forwards Tauri invokes here, and
//! the dev server forwards HTTP requests here, so both behave the same.

use octet_core::content::{Block, Book};
use octet_core::review::{describe, Grade};
use octet_core::store::{Highlight, Piece, PieceKind, Store};
use octet_sim::{Kind, Lab};
use serde::Deserialize;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct App {
    pub books: Vec<Book>,
    pub store: Store,
    labs_dir: PathBuf,
    lab: Option<Lab>,
    clock: Option<i64>,
}

fn now_real() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

fn arg<T: for<'de> Deserialize<'de>>(args: &Value, key: &str) -> Result<T, String> {
    serde_json::from_value(args.get(key).cloned().unwrap_or(Value::Null)).map_err(|e| format!("argument `{key}`: {e}"))
}

impl App {
    /// `content` holds `books/` and `labs/`; `data` is the user's JSON file.
    pub fn open(content: &Path, data: &Path) -> Result<Self, String> {
        let books = octet_core::load_library(&content.join("books")).map_err(|e| e.to_string())?;
        let store = Store::open(data).map_err(|e| e.to_string())?;
        Ok(Self { books, store, labs_dir: content.join("labs"), lab: None, clock: None })
    }

    /// Pins the clock, for tests.
    pub fn set_clock(&mut self, t: i64) {
        self.clock = Some(t);
    }

    fn now(&self) -> i64 {
        self.clock.unwrap_or_else(now_real)
    }

    fn page_title(&self, id: &str) -> String {
        self.books.iter().find_map(|b| b.page(id)).map(|p| p.meta.title.clone()).unwrap_or_else(|| id.to_string())
    }

    fn question(&self, card: &str) -> Option<(String, octet_core::content::Question)> {
        let (page, idx) = card.rsplit_once('#')?;
        let p = self.books.iter().find_map(|b| b.page(page))?;
        match p.blocks.get(idx.parse::<usize>().ok()?)? {
            Block::Question(q) => Some((p.meta.title.clone(), q.clone())),
            _ => None,
        }
    }

    fn lab(&mut self) -> Result<&mut Lab, String> {
        self.lab.as_mut().ok_or_else(|| "no lab is open".to_string())
    }

    pub fn call(&mut self, cmd: &str, args: &Value) -> Result<Value, String> {
        let s = |e: octet_core::store::StoreError| e.to_string();
        match cmd {
            "library" => {
                let d = &self.store.data;
                let books: Vec<Value> = self
                    .books
                    .iter()
                    .map(|b| {
                        let total = b.page_count();
                        let read = b.chapters.iter().flat_map(|c| &c.pages).filter(|p| d.read.contains(&p.id)).count();
                        json!({
                            "id": b.id, "title": b.title, "short": b.short, "cloth": b.cloth,
                            "pages": total, "read": read,
                            "chapters": b.chapters.iter().map(|c| json!({
                                "number": c.number, "title": c.title,
                                "pages": c.pages.iter().map(|p| json!({
                                    "id": p.id, "title": p.meta.title, "summary": p.meta.summary,
                                    "lab": p.meta.lab, "read": d.read.contains(&p.id),
                                    "notes": d.notes.iter().filter(|n| n.page == p.id).count(),
                                    "passed": p.meta.lab.as_ref().is_some_and(|l| d.labs.iter().any(|r| &r.lab == l && r.passed)),
                                })).collect::<Vec<_>>(),
                            })).collect::<Vec<_>>(),
                        })
                    })
                    .collect();
                let ribbon = d.ribbon.as_ref().map(|r| json!({ "page": r.page, "block": r.block, "title": self.page_title(&r.page) }));
                let collections: Vec<Value> = d.collections.iter().map(|c| json!({ "id": c.id, "title": c.title, "count": c.pieces.len() })).collect();
                let mut recent: Vec<&Piece> = d.collections.iter().flat_map(|c| &c.pieces).collect();
                recent.sort_by_key(|p| -p.created);
                Ok(json!({
                    "books": books, "ribbon": ribbon, "collections": collections,
                    "recent": recent.into_iter().take(4).collect::<Vec<_>>(),
                    "due": self.store.due(self.now()).len(),
                }))
            }
            "page" => {
                let id: String = arg(args, "id")?;
                let p = self.books.iter().find_map(|b| b.page(&id)).ok_or_else(|| format!("no page {id}"))?.clone();
                let d = &self.store.data;
                let links: Vec<Value> = p.meta.links.iter().map(|l| json!({ "id": l, "title": self.page_title(l), "read": d.read.contains(l) })).collect();
                let answered: Vec<usize> = p.blocks.iter().enumerate().filter(|(i, _)| d.cards.iter().any(|c| c.id == format!("{id}#{i}"))).map(|(i, _)| i).collect();
                Ok(json!({
                    "page": p, "links": links,
                    "highlights": d.highlights.iter().filter(|h| h.page == id).collect::<Vec<_>>(),
                    "notes": d.notes.iter().filter(|n| n.page == id).collect::<Vec<_>>(),
                    "answered": answered,
                    "read": d.read.contains(&id),
                }))
            }
            "highlight" => {
                let h = Highlight { page: arg(args, "page")?, block: arg(args, "block")?, text: arg(args, "text")? };
                self.store.highlight(h).map_err(s)?;
                Ok(Value::Null)
            }
            "add_note" => {
                let now = self.now();
                let n = self
                    .store
                    .add_note(&arg::<String>(args, "page")?, arg(args, "after_block")?, &arg::<String>(args, "quote").unwrap_or_default(), &arg::<String>(args, "text")?, now)
                    .map_err(s)?;
                Ok(json!(n))
            }
            "edit_note" => {
                self.store.edit_note(arg(args, "id")?, &arg::<String>(args, "text")?).map_err(s)?;
                Ok(Value::Null)
            }
            "collect" => {
                let kind: PieceKind = arg(args, "kind")?;
                let piece = Piece { kind, text: arg(args, "text")?, source: arg(args, "source")?, created: self.now() };
                self.store.collect(&arg::<String>(args, "collection")?, piece).map_err(s)?;
                Ok(Value::Null)
            }
            "collection" => {
                let id: String = arg(args, "id")?;
                let c = self.store.data.collections.iter().find(|c| c.id == id).ok_or_else(|| format!("no collection {id}"))?;
                Ok(json!(c))
            }
            "set_ribbon" => {
                self.store.set_ribbon(&arg::<String>(args, "page")?, arg(args, "block")?).map_err(s)?;
                Ok(Value::Null)
            }
            "mark_read" => {
                self.store.mark_read(&arg::<String>(args, "page")?).map_err(s)?;
                Ok(Value::Null)
            }
            "answer" => {
                let page: String = arg(args, "page")?;
                let block: usize = arg(args, "block")?;
                let choice: usize = arg(args, "choice")?;
                let card_id = format!("{page}#{block}");
                let (title, q) = self.question(&card_id).ok_or("that block isn't a question")?;
                let correct = choice == q.answer;
                let mistake = (!correct).then(|| Piece {
                    kind: PieceKind::Note,
                    text: format!("I answered \"{}\" to: {} The answer is \"{}\".", q.options.get(choice).cloned().unwrap_or_default(), q.prompt, q.options[q.answer]),
                    source: title,
                    created: self.now(),
                });
                let now = self.now();
                let card = self.store.answer(&card_id, correct, mistake, now).map_err(s)?;
                Ok(json!({ "correct": correct, "answer": q.answer, "why": q.why, "next": describe(card.interval) }))
            }
            "review_due" => {
                let now = self.now();
                let due: Vec<Value> = self
                    .store
                    .due(now)
                    .into_iter()
                    .filter_map(|c| {
                        let (title, q) = self.question(&c.id)?;
                        let previews: Vec<String> = [Grade::Again, Grade::Hard, Grade::Good, Grade::Easy].iter().map(|g| describe(c.preview(*g).interval)).collect();
                        Some(json!({ "id": c.id, "source": title, "prompt": q.prompt, "answer": q.options[q.answer], "why": q.why, "previews": previews }))
                    })
                    .collect();
                Ok(json!(due))
            }
            "review_grade" => {
                let g: Grade = arg(args, "grade")?;
                let now = self.now();
                let c = self.store.grade(&arg::<String>(args, "id")?, g, now).map_err(s)?;
                Ok(json!(c))
            }
            "lab_open" => {
                let id: String = arg(args, "id")?;
                if id.contains(['/', '\\', '.']) {
                    return Err("bad lab id".into());
                }
                let src = std::fs::read_to_string(self.labs_dir.join(format!("{id}.toml"))).map_err(|e| format!("can't open lab {id}: {e}"))?;
                let lab = Lab::from_toml(&src).map_err(|e| e.to_string())?;
                self.lab = Some(lab);
                self.call("lab_state", &Value::Null)
            }
            "lab_state" => {
                let lab = self.lab()?;
                let prompts: serde_json::Map<String, Value> = lab.device_names().into_iter().map(|n| (n.clone(), json!(lab.prompt(&n)))).collect();
                Ok(json!({ "view": lab.view(), "tasks": lab.run_checks(), "prompts": prompts, "summary": lab.def.summary }))
            }
            "lab_exec" => {
                let dev: String = arg(args, "device")?;
                let line: String = arg(args, "line")?;
                let r = self.lab()?.exec(&dev, &line).ok_or_else(|| format!("no device {dev}"))?;
                let lab = self.lab()?;
                Ok(json!({ "result": r, "view": lab.view() }))
            }
            "lab_checks" => {
                let lab = self.lab()?;
                let tasks = lab.run_checks();
                let all = tasks.iter().all(|t| t.pass);
                let id = lab.def.id.clone();
                let view = lab.view();
                if all {
                    let notes: String = arg(args, "notes").unwrap_or_default();
                    self.store.lab_passed(&id, &notes).map_err(s)?;
                }
                Ok(json!({ "tasks": tasks, "passed": all, "view": view }))
            }
            "lab_ports" => {
                let dev: String = arg(args, "device")?;
                Ok(json!(self.lab()?.ports(&dev)))
            }
            "lab_changes" => {
                let dev: String = arg(args, "device")?;
                Ok(json!(octet_sim::diff::hunks(&self.lab()?.changes(&dev))))
            }
            "lab_move" => {
                let (d, x, y): (String, f32, f32) = (arg(args, "device")?, arg(args, "x")?, arg(args, "y")?);
                self.lab()?.move_device(&d, x, y);
                Ok(Value::Null)
            }
            "lab_add" => {
                let kind: Kind = arg(args, "kind")?;
                let (x, y): (f32, f32) = (arg(args, "x")?, arg(args, "y")?);
                let lab = self.lab()?;
                let name = lab.add_device(kind, x, y);
                Ok(json!({ "name": name, "view": lab.view(), "prompt": lab.prompt(&name) }))
            }
            "lab_connect" => {
                let (a, b): (String, String) = (arg(args, "a")?, arg(args, "b")?);
                let lab = self.lab()?;
                let link = lab.connect(&a, &b)?;
                Ok(json!({ "link": link, "view": lab.view() }))
            }
            other => Err(format!("unknown command {other}")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn app() -> (App, tempfile::TempDir) {
        let dir = tempfile::tempdir().unwrap();
        let content = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../content");
        let mut a = App::open(&content, &dir.path().join("octet.json")).unwrap();
        a.set_clock(1_000_000);
        (a, dir)
    }

    #[test]
    fn library_and_page() {
        let (mut a, _d) = app();
        let lib = a.call("library", &Value::Null).unwrap();
        assert_eq!(lib["books"].as_array().unwrap().len(), 3);
        let p = a.call("page", &json!({ "id": "srwe/03/03-vlan-trunks" })).unwrap();
        assert_eq!(p["page"]["meta"]["title"], "VLAN trunks");
        assert_eq!(p["links"][0]["title"], "What a VLAN is");
    }

    #[test]
    fn answering_makes_a_card_and_a_mistake() {
        let (mut a, _d) = app();
        let page = a.call("page", &json!({ "id": "srwe/03/03-vlan-trunks" })).unwrap();
        let qi = page["page"]["blocks"].as_array().unwrap().iter().position(|b| b["type"] == "question").unwrap();
        let r = a.call("answer", &json!({ "page": "srwe/03/03-vlan-trunks", "block": qi, "choice": 0 })).unwrap();
        assert_eq!(r["correct"], false);
        assert_eq!(r["next"], "In 10 minutes");
        let wrong = a.call("collection", &json!({ "id": "wrong" })).unwrap();
        assert_eq!(wrong["pieces"].as_array().unwrap().len(), 1);
        a.set_clock(1_000_000 + 601);
        let due = a.call("review_due", &Value::Null).unwrap();
        assert_eq!(due[0]["answer"], "Tagged 10");
        a.call("review_grade", &json!({ "id": due[0]["id"], "grade": "good" })).unwrap();
        assert!(a.call("review_due", &Value::Null).unwrap().as_array().unwrap().is_empty());
    }

    #[test]
    fn lab_round_trip() {
        let (mut a, _d) = app();
        let st = a.call("lab_open", &json!({ "id": "srwe-03-router-on-a-stick" })).unwrap();
        assert_eq!(st["view"]["fault"]["device"], "R1");
        for l in ["conf t", "int g0/0/1.20", "encap dot1q 20", "end"] {
            a.call("lab_exec", &json!({ "device": "R1", "line": l })).unwrap();
        }
        let c = a.call("lab_checks", &json!({ "notes": "the tag was 30" })).unwrap();
        assert_eq!(c["passed"], true);
        let lib = a.call("library", &Value::Null).unwrap();
        let ch = &lib["books"][1]["chapters"][2]["pages"];
        assert_eq!(ch.as_array().unwrap().last().unwrap()["passed"], true);
        assert!(a.call("lab_open", &json!({ "id": "../secrets" })).is_err());
    }
}

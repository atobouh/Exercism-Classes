//! Every command the interface can call, behind one entry point:
//! `App::call(name, args)`. The desktop app forwards Tauri invokes here, and
//! the dev server forwards HTTP requests here, so both behave the same.

use octet_core::bundle;
use octet_core::content::{load_book, load_library, sort_shelf, Blueprint, Block, Book, Command, Question, Recall};
use octet_core::review::{describe, Grade};
use octet_core::store::{Highlight, Piece, PieceKind, Store};
use serde::Deserialize;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

pub struct App {
    pub books: Vec<Book>,
    pub store: Store,
    content: PathBuf,
    /// Books you added in Settings, next to your data file.
    user_books: PathBuf,
    /// Books in `user_books` that couldn't be read, with why.
    pub broken: Vec<String>,
    blueprints: Vec<Blueprint>,
    labs_dir: PathBuf,
    clock: Option<i64>,
}

/// Something you answer that becomes a review card.
enum Ask {
    Question(Question),
    Command(Command),
    Recall(Recall),
}

fn now_real() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs() as i64).unwrap_or(0)
}

fn arg<T: for<'de> Deserialize<'de>>(args: &Value, key: &str) -> Result<T, String> {
    serde_json::from_value(args.get(key).cloned().unwrap_or(Value::Null)).map_err(|e| format!("argument `{key}`: {e}"))
}

/// Splits a command into words, joining an interface name that was typed
/// with a space (`gigabitethernet 0/1`) and writing it the long way.
fn command_words(line: &str) -> Vec<String> {
    let raw: Vec<String> = line.split_whitespace().map(|w| w.to_ascii_lowercase()).collect();
    let mut out = Vec::new();
    let mut i = 0;
    while i < raw.len() {
        let w = &raw[i];
        if let Some(next) = raw.get(i + 1) {
            if w.chars().all(|c| c.is_ascii_alphabetic()) && next.starts_with(|c: char| c.is_ascii_digit()) {
                if let Some(name) = octet_sim::iface::canonical(&format!("{w}{next}")) {
                    out.push(name.to_ascii_lowercase());
                    i += 2;
                    continue;
                }
            }
        }
        out.push(octet_sim::iface::canonical(w).map(|n| n.to_ascii_lowercase()).unwrap_or_else(|| w.clone()));
        i += 1;
    }
    out
}

/// Accepts what IOS would: the same words, each one possibly shortened.
/// Values with digits (addresses, numbers) must be typed in full.
pub fn command_matches(typed: &str, accepted: &str) -> bool {
    let t = command_words(typed);
    let a = command_words(accepted);
    t.len() == a.len()
        && t.iter().zip(&a).all(|(t, a)| {
            if t == a {
                return true;
            }
            let has_digit = a.chars().any(|c| c.is_ascii_digit());
            !has_digit && !t.is_empty() && a.starts_with(t.as_str()) && (t.len() >= 2 || a.len() <= 2)
        })
}

impl App {
    /// `content` holds `books/`, `labs/`, `exam/` and `prompts/`; `data` is
    /// the user's JSON file. Books added in Settings live in a `books`
    /// folder next to it.
    pub fn open(content: &Path, data: &Path) -> Result<Self, String> {
        let store = Store::open(data).map_err(|e| e.to_string())?;
        let user_books = data.parent().map(|d| d.join("books")).unwrap_or_else(|| PathBuf::from("books"));
        let blueprints = Blueprint::load_dir(&content.join("exam")).map_err(|e| e.to_string())?;
        let mut app = Self { books: vec![], store, content: content.to_path_buf(), user_books, broken: vec![], blueprints, labs_dir: content.join("labs"), clock: None };
        app.reload()?;
        Ok(app)
    }

    /// Reads the shelf again. A broken book of yours is set aside, never a
    /// reason for Octet not to open.
    fn reload(&mut self) -> Result<(), String> {
        let mut books = load_library(&self.content.join("books")).map_err(|e| e.to_string())?;
        self.broken.clear();
        if let Ok(rd) = std::fs::read_dir(&self.user_books) {
            let mut dirs: Vec<PathBuf> = rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.join("book.toml").is_file()).collect();
            dirs.sort();
            for d in dirs {
                match load_book(&d) {
                    Ok(mut b) => match books.iter_mut().find(|x| x.id == b.id) {
                        // Your changes to a shipped book sit on top of it.
                        Some(base) => {
                            (base.title, base.short, base.cloth, base.pattern) = (b.title, b.short, b.cloth, b.pattern);
                            if !b.about.is_empty() {
                                base.about = b.about;
                            }
                            for c in b.chapters {
                                match base.chapters.iter_mut().find(|x| x.number == c.number) {
                                    Some(x) => {
                                        x.title = c.title;
                                        if !c.pages.is_empty() {
                                            x.pages = c.pages;
                                        }
                                    }
                                    None => base.chapters.push(c),
                                }
                            }
                            base.chapters.sort_by_key(|c| c.number);
                            base.changed = true;
                        }
                        None => {
                            b.yours = true;
                            books.push(b);
                        }
                    },
                    Err(e) => self.broken.push(e.to_string()),
                }
            }
        }
        sort_shelf(&mut books);
        self.books = books;
        Ok(())
    }

    /// Pins the clock, for tests.
    pub fn set_clock(&mut self, t: i64) {
        self.clock = Some(t);
    }

    fn now(&self) -> i64 {
        self.clock.unwrap_or_else(now_real)
    }

    fn find_page(&self, id: &str) -> Option<&octet_core::Page> {
        self.books.iter().find_map(|b| b.page(id))
    }

    fn page_title(&self, id: &str) -> String {
        self.find_page(id).map(|p| p.meta.title.clone()).unwrap_or_else(|| id.to_string())
    }

    fn ask(&self, card: &str) -> Option<(String, Ask)> {
        let (page, idx) = card.rsplit_once('#')?;
        let p = self.find_page(page)?;
        let ask = match p.blocks.get(idx.parse::<usize>().ok()?)? {
            Block::Question(q) => Ask::Question(q.clone()),
            Block::Command(c) => Ask::Command(c.clone()),
            Block::Recall(r) => Ask::Recall(r.clone()),
            _ => return None,
        };
        Some((p.meta.title.clone(), ask))
    }

    /// Where your copy of a book lives: the whole book if you added it, or
    /// your changes if it ships with Octet.
    fn user_book_dir(&self, id: &str) -> Result<PathBuf, String> {
        let b = self.books.iter().find(|b| b.id == id).ok_or_else(|| format!("no book {id}"))?;
        if !b.yours && !b.changed {
            return Err("you haven't changed that book".into());
        }
        Ok(self.user_books.join(id))
    }

    fn export_book(&self, id: &str) -> Result<String, String> {
        let b = self.books.iter().find(|b| b.id == id).ok_or_else(|| format!("no book {id}"))?;
        let mine = self.user_books.join(id);
        if b.yours {
            bundle::export(&mine)
        } else if b.changed {
            bundle::export_layered(&self.content.join("books").join(id), &mine)
        } else {
            bundle::export(&self.content.join("books").join(id))
        }
    }

    fn book_json(&self, b: &Book) -> Value {
        let d = &self.store.data;
        let total = b.page_count();
        let read = b.pages().filter(|p| d.read.contains(&p.id)).count();
        json!({
            "id": b.id, "title": b.title, "short": b.short, "cloth": b.cloth, "pattern": b.pattern, "about": b.about, "yours": b.yours, "changed": b.changed,
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
    }

    pub fn call(&mut self, cmd: &str, args: &Value) -> Result<Value, String> {
        let s = |e: octet_core::store::StoreError| e.to_string();
        match cmd {
            "library" => {
                let d = &self.store.data;
                let books: Vec<Value> = self.books.iter().map(|b| self.book_json(b)).collect();
                let ribbon = d.ribbon.as_ref().filter(|r| self.find_page(&r.page).is_some()).map(|r| json!({ "page": r.page, "block": r.block, "title": self.page_title(&r.page) }));
                let collections: Vec<Value> = d.collections.iter().map(|c| json!({ "id": c.id, "title": c.title, "count": c.pieces.len() })).collect();
                let mut recent: Vec<&Piece> = d.collections.iter().flat_map(|c| &c.pieces).collect();
                recent.sort_by_key(|p| -p.created);
                Ok(json!({
                    "books": books, "ribbon": ribbon, "collections": collections,
                    "recent": recent.into_iter().take(4).collect::<Vec<_>>(),
                    "due": self.store.due(self.now()).iter().filter(|c| self.ask(&c.id).is_some()).count(),
                    "broken": self.broken,
                }))
            }
            "page" => {
                let id: String = arg(args, "id")?;
                let p = self.find_page(&id).ok_or_else(|| format!("no page {id}"))?.clone();
                let d = &self.store.data;
                let links: Vec<Value> = p.meta.links.iter().map(|l| json!({ "id": l, "title": self.page_title(l), "read": d.read.contains(l) })).collect();
                let answered: Vec<usize> = p.blocks.iter().enumerate().filter(|(i, _)| d.cards.iter().any(|c| c.id == format!("{id}#{i}"))).map(|(i, _)| i).collect();
                // Titles for inline links, so the page can show where they go.
                let mut texts = Vec::new();
                for b in &p.blocks {
                    if let Ok(v) = serde_json::to_value(b) {
                        texts.push(v.to_string());
                    }
                }
                let inline: serde_json::Map<String, Value> = texts.iter().flat_map(|t| octet_core::content::inline_links(t)).filter_map(|l| self.find_page(&l).map(|pg| (l.clone(), json!(pg.meta.title)))).collect();
                Ok(json!({
                    "page": p, "links": links, "inline": inline,
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
            // Answering anything in the text makes it a review card:
            // `choice` or `choices` for a question, `text` for a command,
            // `knew` for a recall card.
            "answer" => {
                let page: String = arg(args, "page")?;
                let block: usize = arg(args, "block")?;
                let card_id = format!("{page}#{block}");
                let (title, ask) = self.ask(&card_id).ok_or("that block isn't something to answer")?;
                let now = self.now();
                let (correct, mistake, reply) = match &ask {
                    Ask::Question(q) => {
                        let mut picked: Vec<usize> = match arg::<Vec<usize>>(args, "choices") {
                            Ok(v) => v,
                            Err(_) => vec![arg::<usize>(args, "choice")?],
                        };
                        picked.sort_unstable();
                        let right = q.answer.indices();
                        let correct = picked == right;
                        let names = |ix: &[usize]| ix.iter().filter_map(|i| q.options.get(*i)).map(|o| format!("\"{o}\"")).collect::<Vec<_>>().join(" and ");
                        let mistake = format!("I answered {} to: {} The answer is {}.", names(&picked), q.prompt, names(&right));
                        (correct, mistake, json!({ "answer": right }))
                    }
                    Ask::Command(c) => {
                        let typed: String = arg(args, "text")?;
                        let correct = c.answer.iter().any(|a| command_matches(&typed, a));
                        let mistake = format!("I typed \"{}\" to: {} The command is \"{}\".", typed.trim(), c.prompt, c.answer[0]);
                        (correct, mistake, json!({ "answer": c.answer[0] }))
                    }
                    Ask::Recall(r) => {
                        let knew: bool = arg(args, "knew")?;
                        (knew, format!("I didn't remember: {} It's: {}", r.front, r.back), json!({ "answer": r.back }))
                    }
                };
                let why = match &ask {
                    Ask::Question(q) => q.why.clone(),
                    Ask::Command(c) => c.why.clone(),
                    Ask::Recall(_) => String::new(),
                };
                let mistake = (!correct).then_some(Piece { kind: PieceKind::Note, text: mistake, source: title, created: now });
                let card = self.store.answer(&card_id, correct, mistake, now).map_err(s)?;
                let mut out = json!({ "correct": correct, "why": why, "next": describe(card.interval) });
                out["answer"] = reply["answer"].clone();
                Ok(out)
            }
            "check_command" => {
                let card: String = arg(args, "id")?;
                let typed: String = arg(args, "text")?;
                match self.ask(&card) {
                    Some((_, Ask::Command(c))) => Ok(json!({ "correct": c.answer.iter().any(|a| command_matches(&typed, a)) })),
                    _ => Err("that card isn't a command".into()),
                }
            }
            "review_due" => {
                let now = self.now();
                let due: Vec<Value> = self
                    .store
                    .due(now)
                    .into_iter()
                    .filter_map(|c| {
                        let (title, ask) = self.ask(&c.id)?;
                        let previews: Vec<String> = [Grade::Again, Grade::Hard, Grade::Good, Grade::Easy].iter().map(|g| describe(c.preview(*g).interval)).collect();
                        let (kind, prompt, answer, why, mode) = match ask {
                            Ask::Question(q) => {
                                let ans = q.answer.indices().iter().map(|i| q.options[*i].clone()).collect::<Vec<_>>().join(" and ");
                                ("question", q.prompt, ans, q.why, String::new())
                            }
                            Ask::Command(c) => ("command", c.prompt, c.answer[0].clone(), c.why, c.mode),
                            Ask::Recall(r) => ("recall", r.front, r.back, String::new(), String::new()),
                        };
                        Some(json!({ "id": c.id, "kind": kind, "source": title, "prompt": prompt, "answer": answer, "why": why, "mode": mode, "previews": previews }))
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
            "exams" => Ok(json!(self.blueprints.iter().map(|b| json!({ "id": b.id, "exam": b.exam, "valid": b.valid })).collect::<Vec<_>>())),
            // One exam's topics, each with the pages that teach it. Without
            // `exam`, the last file in content/exam (the newest).
            "exam_map" => {
                let want: Option<String> = arg(args, "exam").ok();
                let Some(bp) = want.as_ref().and_then(|w| self.blueprints.iter().find(|b| &b.id == w)).or(self.blueprints.last()) else {
                    return Ok(json!({ "domains": [], "exams": [] }));
                };
                let d = &self.store.data;
                let page = |id: &String| {
                    self.books.iter().find_map(|b| b.page(id).map(|p| json!({ "id": p.id, "title": p.meta.title, "book": b.short, "read": d.read.contains(&p.id) })))
                };
                let domains: Vec<Value> = bp
                    .domains
                    .iter()
                    .map(|dm| json!({ "id": dm.id, "title": dm.title, "weight": dm.weight, "topics": dm.topics.iter().map(|t| json!({ "id": t.id, "title": t.title, "pages": t.pages.iter().filter_map(page).collect::<Vec<_>>() })).collect::<Vec<_>>() }))
                    .collect();
                Ok(json!({ "id": bp.id, "exam": bp.exam, "valid": bp.valid, "domains": domains, "exams": self.blueprints.iter().map(|b| json!({ "id": b.id, "exam": b.exam, "valid": b.valid })).collect::<Vec<_>>() }))
            }
            "book_prompt" => {
                let p = self.content.join("prompts/book-from-notes.md");
                std::fs::read_to_string(&p).map(Value::String).map_err(|e| format!("can't read the prompt: {e}"))
            }
            // Reads pasted text and says what it would add, or what's wrong.
            "book_check" => {
                let text: String = arg(args, "text")?;
                match bundle::parse_bundle(&text) {
                    Ok(b) => {
                        let existing = self.books.iter().find(|x| x.id == b.def.id);
                        let asks = b.book.pages().flat_map(|p| &p.blocks).filter(|x| matches!(x, Block::Question(_) | Block::Command(_) | Block::Recall(_))).count();
                        Ok(json!({
                            "ok": true, "id": b.def.id, "title": b.def.title, "short": b.def.short, "cloth": b.def.cloth, "pattern": b.def.pattern,
                            "chapters": b.book.chapters.iter().filter(|c| !c.pages.is_empty()).map(|c| json!({ "number": c.number, "title": c.title, "pages": c.pages.len() })).collect::<Vec<_>>(),
                            "pages": b.book.page_count(), "asks": asks,
                            "updates": existing.map(|e| e.title.clone()),
                            "shipped": existing.is_some_and(|e| !e.yours),
                        }))
                    }
                    Err(problems) => Ok(json!({ "ok": false, "problems": problems })),
                }
            }
            "book_import" => {
                let text: String = arg(args, "text")?;
                let b = bundle::parse_bundle(&text).map_err(|p| p.join("\n"))?;
                let cloth: String = arg(args, "cloth").unwrap_or(b.def.cloth.clone());
                let pattern: String = arg(args, "pattern").unwrap_or(b.def.pattern.clone());
                bundle::install(&b, &self.user_books, &cloth, &pattern)?;
                self.reload()?;
                Ok(json!({ "id": b.def.id }))
            }
            "book_cover" => {
                let id: String = arg(args, "id")?;
                let shipped = self.books.iter().any(|b| b.id == id && !b.yours);
                let text = self.export_book(&id)?;
                let b = bundle::parse_bundle(&text).map_err(|p| p.join("\n"))?;
                // Rewrite only book.toml by installing no pages.
                let empty = bundle::Bundle { def: b.def, def_src: b.def_src, pages: vec![], book: b.book };
                // A shipped book keeps its pages; only the cover is yours.
                let empty = if shipped { bundle::Bundle { def: bundle::Bundle::details_only(&empty.def), ..empty } } else { empty };
                bundle::install(&empty, &self.user_books, &arg::<String>(args, "cloth")?, &arg::<String>(args, "pattern")?)?;
                self.reload()?;
                Ok(Value::Null)
            }
            "book_export" => {
                let id: String = arg(args, "id")?;
                self.export_book(&id).map(Value::String)
            }
            "book_remove" => {
                let id: String = arg(args, "id")?;
                let dir = self.user_book_dir(&id)?;
                std::fs::remove_dir_all(&dir).map_err(|e| format!("can't remove {}: {e}", dir.display()))?;
                self.reload()?;
                Ok(Value::Null)
            }
            "about" => Ok(json!({ "data": self.store.path().display().to_string(), "books": self.user_books.display().to_string(), "version": env!("CARGO_PKG_VERSION") })),
            // A bench lab, as JSON for <octet-bench>, with your saved bench if any.
            "lab_def" => {
                let id: String = arg(args, "id")?;
                if !octet_core::content::valid_id(&id) {
                    return Err("bad lab id".into());
                }
                let lab = octet_core::content::read_lab(&self.labs_dir.join(format!("{id}.toml")))?;
                let rec = self.store.data.labs.iter().find(|l| l.lab == id);
                Ok(json!({ "lab": lab, "state": rec.and_then(|r| r.state.clone()), "passed": rec.is_some_and(|r| r.passed), "notes": rec.map(|r| r.notes.clone()).unwrap_or_default() }))
            }
            "lab_save" => {
                let id: String = arg(args, "id")?;
                let state: Value = arg(args, "state")?;
                self.store.lab_save(&id, state).map_err(s)?;
                Ok(Value::Null)
            }
            "lab_pass" => {
                let id: String = arg(args, "id")?;
                self.store.lab_passed(&id, &arg::<String>(args, "notes").unwrap_or_default()).map_err(s)?;
                Ok(Value::Null)
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
        assert_eq!(lib["books"].as_array().unwrap().len(), 4);
        let p = a.call("page", &json!({ "id": "srwe/03/03-vlan-trunks" })).unwrap();
        assert_eq!(p["page"]["meta"]["title"], "VLAN trunks");
        assert_eq!(p["links"][0]["title"], "What a VLAN is");
    }

    #[test]
    fn answering_makes_a_card_and_a_mistake() {
        let (mut a, _d) = app();
        let page = a.call("page", &json!({ "id": "srwe/03/03-vlan-trunks" })).unwrap();
        let blocks = page["page"]["blocks"].as_array().unwrap();
        let qi = blocks.iter().position(|b| b["type"] == "question" && b["answer"].is_number()).unwrap();
        let right = blocks[qi]["answer"].as_u64().unwrap() as usize;
        let wrong = if right == 0 { 1 } else { 0 };
        let r = a.call("answer", &json!({ "page": "srwe/03/03-vlan-trunks", "block": qi, "choice": wrong })).unwrap();
        assert_eq!(r["correct"], false);
        assert_eq!(r["next"], "In 10 minutes");
        let wrong = a.call("collection", &json!({ "id": "wrong" })).unwrap();
        assert_eq!(wrong["pieces"].as_array().unwrap().len(), 1);
        a.set_clock(1_000_000 + 601);
        let due = a.call("review_due", &Value::Null).unwrap();
        assert_eq!(due[0]["answer"], blocks[qi]["options"][right]);
        a.call("review_grade", &json!({ "id": due[0]["id"], "grade": "good" })).unwrap();
        assert!(a.call("review_due", &Value::Null).unwrap().as_array().unwrap().is_empty());
    }

    #[test]
    fn commands_match_like_ios() {
        assert!(command_matches("sw mode trunk", "switchport mode trunk"));
        assert!(command_matches("int g0/0/1.20", "interface GigabitEthernet0/0/1.20"));
        assert!(command_matches("interface gigabitethernet 0/1", "interface g0/1"));
        assert!(command_matches("IP ADD 10.1.1.1 255.255.255.0", "ip address 10.1.1.1 255.255.255.0"));
        assert!(!command_matches("ip add 10.1.1.2 255.255.255.0", "ip address 10.1.1.1 255.255.255.0"));
        assert!(!command_matches("switchport mode", "switchport mode trunk"));
        assert!(!command_matches("s mode trunk", "switchport mode trunk"), "one letter is too short to be sure");
        assert!(command_matches("no sh", "no shutdown"));
    }

    #[test]
    fn a_pasted_book_lands_on_the_shelf() {
        let (mut a, d) = app();
        let text = "=== book ===\nid = \"mine\"\ntitle = \"My notes\"\nshort = \"Mine\"\ncloth = \"moss\"\n[[chapter]]\nnumber = 1\ntitle = \"One\"\n=== page 1 01-a ===\n+++\ntitle = \"A\"\n+++\nHi.\n\n```command\nprompt = \"Save it.\"\nanswer = [\"copy running-config startup-config\"]\nwhy = \"w\"\n```\n";
        let c = a.call("book_check", &json!({ "text": text })).unwrap();
        assert_eq!(c["ok"], true);
        assert_eq!(c["asks"], 1);
        a.call("book_import", &json!({ "text": text, "cloth": "navy", "pattern": "dots" })).unwrap();
        assert!(d.path().join("books/mine/01/01-a.md").is_file());
        let lib = a.call("library", &Value::Null).unwrap();
        let mine = lib["books"].as_array().unwrap().iter().find(|b| b["id"] == "mine").unwrap().clone();
        assert_eq!((mine["yours"].as_bool(), mine["cloth"].as_str()), (Some(true), Some("navy")));
        let r = a.call("answer", &json!({ "page": "mine/01/01-a", "block": 1, "text": "copy run start" })).unwrap();
        assert_eq!(r["correct"], true);
        a.call("book_cover", &json!({ "id": "mine", "cloth": "rose", "pattern": "waves" })).unwrap();
        assert_eq!(a.books.iter().find(|b| b.id == "mine").unwrap().cloth, "rose");
        assert!(a.call("book_remove", &json!({ "id": "itn" })).is_err(), "shipped books stay");
        a.call("book_remove", &json!({ "id": "mine" })).unwrap();
        assert!(a.books.iter().all(|b| b.id != "mine"));
    }

    #[test]
    fn a_shipped_book_takes_your_changes_and_gives_them_back() {
        let (mut a, _d) = app();
        let srwe = a.books.iter().find(|b| b.id == "srwe").unwrap();
        let (before, ch1) = (srwe.page_count(), srwe.chapters[0].pages.len());
        let text = "=== book ===\nid = \"srwe\"\ntitle = \"Switching, Routing and Wireless\"\nshort = \"CCNA 2\"\ncloth = \"plum\"\npattern = \"traces\"\n[[chapter]]\nnumber = 1\ntitle = \"Basic device configuration\"\n=== page 1 01-mine ===\n+++\ntitle = \"My page\"\n+++\nMine.\n";
        let c = a.call("book_check", &json!({ "text": text })).unwrap();
        assert_eq!((c["ok"].as_bool(), c["shipped"].as_bool()), (Some(true), Some(true)));
        a.call("book_import", &json!({ "text": text, "cloth": "navy", "pattern": "traces" })).unwrap();
        let b = a.books.iter().find(|b| b.id == "srwe").unwrap();
        assert!(b.changed && !b.yours);
        assert_eq!(b.cloth, "navy");
        assert_eq!(b.page_count(), before - ch1 + 1, "your chapter 1 replaces the shipped one; the rest stay");
        let all = a.call("book_export", &json!({ "id": "srwe" })).unwrap();
        let all = all.as_str().unwrap();
        assert!(all.contains("=== page 1 01-mine ===") && all.contains("=== page 3 03-vlan-trunks ==="));
        a.call("book_remove", &json!({ "id": "srwe" })).unwrap();
        let b = a.books.iter().find(|b| b.id == "srwe").unwrap();
        assert!(!b.changed);
        assert_eq!((b.page_count(), b.cloth.as_str()), (before, "plum"));
    }

    #[test]
    fn a_bench_lab_loads_saves_and_passes() {
        let (mut a, _d) = app();
        let def = a.call("lab_def", &json!({ "id": "srwe-03-router-on-a-stick" })).unwrap();
        assert_eq!(def["lab"]["title"], "Router-on-a-stick");
        assert_eq!(def["lab"]["device"][0]["id"], "R1");
        assert!(def["state"].is_null());
        a.call("lab_save", &json!({ "id": "srwe-03-router-on-a-stick", "state": { "cables": [] } })).unwrap();
        a.call("lab_pass", &json!({ "id": "srwe-03-router-on-a-stick", "notes": "the tag was 30" })).unwrap();
        let def = a.call("lab_def", &json!({ "id": "srwe-03-router-on-a-stick" })).unwrap();
        assert_eq!((def["passed"].as_bool(), def["notes"].as_str()), (Some(true), Some("the tag was 30")));
        assert!(def["state"]["cables"].is_array());
        let lib = a.call("library", &Value::Null).unwrap();
        let ch = &lib["books"][1]["chapters"][2]["pages"];
        assert_eq!(ch.as_array().unwrap().last().unwrap()["passed"], true);
        assert!(a.call("lab_def", &json!({ "id": "../secrets" })).is_err());
    }
}

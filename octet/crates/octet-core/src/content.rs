//! Books, chapters and pages, read from plain files so content is easy to
//! write and review.
//!
//! ```text
//! content/books/srwe/book.toml              title, cover, chapter list
//! content/books/srwe/03/03-vlan-trunks.md   one page
//! ```
//!
//! A page is Markdown with a TOML header between `+++` lines. The body knows
//! a small set of things, all described in `docs/library/WRITING.md`:
//! paragraphs, `##` and `###` headings, `-` and `1.` lists, `|` tables, and
//! fenced blocks (opened with ``` or ~~~) for everything interactive:
//! `question`, `command`, `recall`, `console`, `diagram`, `fields`, `drill`,
//! the callouts `key`, `exam`, `trap` and `deeper`, `figure`, `lab` and
//! `exam-map`.

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum ContentError {
    #[error("can't read {path}: {source}")]
    Io { path: PathBuf, source: std::io::Error },
    #[error("{path}: {message}")]
    Format { path: PathBuf, message: String },
}

/// One right option, or several for "Choose two." questions.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum Answer {
    One(usize),
    Many(Vec<usize>),
}

impl Answer {
    pub fn indices(&self) -> Vec<usize> {
        match self {
            Answer::One(i) => vec![*i],
            Answer::Many(v) => {
                let mut v = v.clone();
                v.sort_unstable();
                v
            }
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Question {
    pub prompt: String,
    pub options: Vec<String>,
    pub answer: Answer,
    pub why: String,
}

/// Type the command. `answer` lists the accepted forms; the first is the one
/// shown when you get it wrong. Abbreviations are accepted the way IOS does.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Command {
    pub prompt: String,
    /// The prompt the command is typed at, like `S1(config-if)#`.
    #[serde(default)]
    pub mode: String,
    pub answer: Vec<String>,
    pub why: String,
}

/// A flashcard: you say the answer to yourself, then check.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Recall {
    pub front: String,
    pub back: String,
}

pub const NODE_KINDS: &[&str] = &["pc", "laptop", "server", "printer", "phone", "switch", "l3switch", "router", "firewall", "ap", "wlc", "cloud", "internet", "hub"];
pub const LINK_STYLES: &[&str] = &["", "trunk", "serial", "wireless", "dashed", "fiber"];

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Node {
    pub id: String,
    pub kind: String,
    /// Grid position: one unit is one device's spacing.
    pub x: f32,
    pub y: f32,
    #[serde(default)]
    pub label: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Link {
    pub a: String,
    pub b: String,
    /// Shown near `a`, usually its interface.
    #[serde(default)]
    pub a_label: String,
    #[serde(default)]
    pub b_label: String,
    /// Shown in the middle, like a subnet.
    #[serde(default)]
    pub label: String,
    #[serde(default)]
    pub style: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Diagram {
    pub nodes: Vec<Node>,
    #[serde(default)]
    pub links: Vec<Link>,
    #[serde(default)]
    pub caption: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Field {
    pub name: String,
    /// Relative width; with `unit = "bits"` this is the number of bits.
    #[serde(default = "one")]
    pub span: u32,
    /// The size printed under the name, like "6 bytes". Worked out from
    /// `span` when the unit is bits or bytes.
    #[serde(default)]
    pub size: String,
}

fn one() -> u32 {
    1
}

/// A header or frame laid out field by field.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Fields {
    #[serde(default)]
    pub title: String,
    /// `bits`, `bytes`, or empty.
    #[serde(default)]
    pub unit: String,
    /// Wrap after this many units, like 32 for an IPv4 header.
    #[serde(default)]
    pub row: Option<u32>,
    pub fields: Vec<Field>,
    #[serde(default)]
    pub caption: String,
}

pub const CALLOUTS: &[&str] = &["key", "exam", "trap", "deeper"];
pub const DRILLS: &[&str] = &["binary", "hex", "mask", "wildcard", "subnet", "hosts", "ipv6"];

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Block {
    /// A paragraph with light inline marks: *emphasis*, **strong**, `code`
    /// and [links](itn/05/02-page-id).
    Text { text: String },
    Heading { level: u8, text: String },
    List { ordered: bool, items: Vec<String> },
    Table { head: Vec<String>, rows: Vec<Vec<String>> },
    /// What a device prints. Lines that start with a prompt (`R1#`,
    /// `S1(config-if)#`, `PC1>`) show the typed command in bold.
    Console { title: String, lines: Vec<String> },
    /// `key`, `exam`, `trap` or `deeper`.
    Callout { kind: String, blocks: Vec<Block> },
    Question(Question),
    Command(Command),
    Recall(Recall),
    Diagram(Diagram),
    Fields(Fields),
    /// Endless practice generated on the spot: subnetting, binary and so on.
    Drill { kind: String },
    Figure { id: String },
    Lab { id: String },
    /// The exam topics, each linked to the pages that teach it.
    ExamMap,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PageMeta {
    pub title: String,
    #[serde(default)]
    pub summary: String,
    #[serde(default)]
    pub links: Vec<String>,
    /// A page can be the entry point to a lab.
    #[serde(default)]
    pub lab: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Page {
    /// Stable id like `srwe/03/04-vlan-trunks`.
    pub id: String,
    pub meta: PageMeta,
    pub blocks: Vec<Block>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ChapterDef {
    pub number: u32,
    pub title: String,
}

/// Book cloths. The three course books use teal, plum and ochre.
pub const CLOTHS: &[&str] = &["teal", "plum", "ochre", "navy", "moss", "brick", "slate", "linen", "graphite", "rose"];
/// Patterns pressed into the cover.
pub const PATTERNS: &[&str] = &["rings", "traces", "grid", "bits", "waves", "stripes", "dots", "plain"];

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BookDef {
    pub id: String,
    pub title: String,
    pub short: String,
    /// A name from [`CLOTHS`]. The old names `itn`, `srwe` and `ensa` still work.
    pub cloth: String,
    #[serde(default)]
    pub pattern: String,
    /// One line shown in the book's page.
    #[serde(default)]
    pub about: String,
    #[serde(rename = "chapter", default)]
    pub chapters: Vec<ChapterDef>,
}

impl BookDef {
    /// Resolves the old cloth names and checks the cover and chapter list.
    pub fn normalise(&mut self) -> Result<(), String> {
        let (cloth, pattern) = match self.cloth.as_str() {
            "itn" => ("teal", "rings"),
            "srwe" => ("plum", "traces"),
            "ensa" => ("ochre", "grid"),
            c => (c, "plain"),
        };
        let cloth = cloth.to_string();
        if self.pattern.is_empty() {
            self.pattern = pattern.into();
        }
        self.cloth = cloth;
        if !valid_id(&self.id) {
            return Err(format!("book id \"{}\" can only use lowercase letters, digits and dashes", self.id));
        }
        if !CLOTHS.contains(&self.cloth.as_str()) {
            return Err(format!("cloth \"{}\" isn't one of {}", self.cloth, CLOTHS.join(", ")));
        }
        if !PATTERNS.contains(&self.pattern.as_str()) {
            return Err(format!("pattern \"{}\" isn't one of {}", self.pattern, PATTERNS.join(", ")));
        }
        let mut seen = HashSet::new();
        for c in &self.chapters {
            if !seen.insert(c.number) {
                return Err(format!("chapter {} is listed twice", c.number));
            }
        }
        Ok(())
    }
}

pub fn valid_id(id: &str) -> bool {
    !id.is_empty() && id.len() <= 48 && id.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') && !id.starts_with('-')
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Chapter {
    pub number: u32,
    pub title: String,
    pub pages: Vec<Page>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct Book {
    pub id: String,
    pub title: String,
    pub short: String,
    pub cloth: String,
    pub pattern: String,
    pub about: String,
    pub chapters: Vec<Chapter>,
    /// Added by you from Settings, rather than shipped with Octet.
    #[serde(default)]
    pub yours: bool,
    /// A shipped book you have changed from Settings.
    #[serde(default)]
    pub changed: bool,
}

impl Book {
    pub fn page(&self, id: &str) -> Option<&Page> {
        self.chapters.iter().flat_map(|c| &c.pages).find(|p| p.id == id)
    }
    pub fn page_count(&self) -> usize {
        self.chapters.iter().map(|c| c.pages.len()).sum()
    }
    pub fn pages(&self) -> impl Iterator<Item = &Page> {
        self.chapters.iter().flat_map(|c| &c.pages)
    }
}

fn read(path: &Path) -> Result<String, ContentError> {
    fs::read_to_string(path).map_err(|source| ContentError::Io { path: path.to_path_buf(), source })
}

/// Splits a page into its header and body and parses both. Messages name
/// the line they're about, counted from the top of the file.
pub fn parse_page(id: &str, src: &str, path: &Path) -> Result<Page, ContentError> {
    let err = |message: String| ContentError::Format { path: path.to_path_buf(), message };
    let src = src.replace("\r\n", "\n");
    let src = src.trim_start_matches('\u{feff}');
    let rest = src.strip_prefix("+++\n").ok_or_else(|| err("line 1: a page starts with a +++ header".into()))?;
    let (head, body) = rest.split_once("\n+++").ok_or_else(|| err("the +++ header isn't closed".into()))?;
    let meta: PageMeta = toml::from_str(head).map_err(|e| err(format!("header: {}", one_line(&e.to_string()))))?;
    if meta.title.trim().is_empty() {
        return Err(err("header: the title is empty".into()));
    }
    let first = head.lines().count() + 2;
    let lines: Vec<&str> = body.lines().collect();
    // The rest of the closing `+++` line is ignored.
    let blocks = parse_body(&lines[1.min(lines.len())..], first + 1, false).map_err(err)?;
    Ok(Page { id: id.to_string(), meta, blocks })
}

fn one_line(s: &str) -> String {
    s.split_whitespace().collect::<Vec<_>>().join(" ")
}

#[derive(Default)]
struct Pending {
    para: Vec<String>,
    list: Option<(bool, Vec<String>)>,
    table: Vec<Vec<String>>,
}

impl Pending {
    fn flush(&mut self, out: &mut Vec<Block>, line: usize) -> Result<(), String> {
        if !self.para.is_empty() {
            out.push(Block::Text { text: self.para.join(" ") });
            self.para.clear();
        }
        if let Some((ordered, items)) = self.list.take() {
            out.push(Block::List { ordered, items });
        }
        if !self.table.is_empty() {
            let rows = std::mem::take(&mut self.table);
            let head = rows[0].clone();
            for (i, r) in rows.iter().enumerate().skip(1) {
                if r.len() != head.len() {
                    return Err(format!("line {}: table row {} has {} cells but the header has {}", line, i, r.len(), head.len()));
                }
            }
            out.push(Block::Table { head, rows: rows[1..].to_vec() });
        }
        Ok(())
    }
}

fn list_item(line: &str) -> Option<(bool, &str)> {
    if let Some(r) = line.strip_prefix("- ").or_else(|| line.strip_prefix("* ")) {
        return Some((false, r));
    }
    let digits = line.chars().take_while(|c| c.is_ascii_digit()).count();
    if digits > 0 && digits < 3 {
        if let Some(r) = line[digits..].strip_prefix(". ") {
            return Some((true, r));
        }
    }
    None
}

fn cells(line: &str) -> Vec<String> {
    let t = line.trim();
    let t = t.strip_prefix('|').unwrap_or(t);
    let t = t.strip_suffix('|').unwrap_or(t);
    // A `\|` inside a cell is a literal bar.
    t.replace("\\|", "\u{1}").split('|').map(|c| c.trim().replace('\u{1}', "|")).collect()
}

fn is_separator(line: &str) -> bool {
    let t = line.trim();
    t.starts_with('|') && t.contains('-') && t.chars().all(|c| matches!(c, '|' | '-' | ':' | ' '))
}

/// `first` is the line number of `lines[0]` in the file.
fn parse_body(lines: &[&str], first: usize, nested: bool) -> Result<Vec<Block>, String> {
    let mut out = Vec::new();
    let mut p = Pending::default();
    let mut i = 0;
    while i < lines.len() {
        let n = first + i;
        let raw = lines[i];
        let line = raw.trim_end();
        let t = line.trim_start();
        i += 1;
        if t.starts_with("```") || t.starts_with("~~~") {
            if nested {
                return Err(format!("line {n}: a callout can't hold another fenced block"));
            }
            p.flush(&mut out, n)?;
            let ch = t.chars().next().unwrap();
            let fence_len = t.chars().take_while(|c| *c == ch).count();
            let info = t[fence_len..].trim();
            let (kind, title) = info.split_once(char::is_whitespace).map_or((info, ""), |(k, r)| (k, r.trim()));
            let mut inner = Vec::new();
            let mut closed = false;
            while i < lines.len() {
                let l = lines[i].trim();
                i += 1;
                if l.len() >= fence_len && l.chars().all(|c| c == ch) {
                    closed = true;
                    break;
                }
                inner.push(lines[i - 1]);
            }
            if !closed {
                return Err(format!("line {n}: the ```{kind} block is never closed"));
            }
            out.push(fenced(kind, title, &inner, n).map_err(|m| format!("line {n}: {kind}: {m}"))?);
            continue;
        }
        if t.is_empty() {
            p.flush(&mut out, n)?;
            continue;
        }
        if let Some(h) = t.strip_prefix("### ").or_else(|| t.strip_prefix("## ")) {
            p.flush(&mut out, n)?;
            let level = if t.starts_with("###") { 3 } else { 2 };
            out.push(Block::Heading { level, text: h.trim().to_string() });
            continue;
        }
        if t.starts_with("# ") {
            return Err(format!("line {n}: use ## for a heading; the page title comes from the header"));
        }
        if t.starts_with('|') {
            if !p.para.is_empty() || p.list.is_some() {
                p.flush(&mut out, n)?;
            }
            if !is_separator(t) {
                p.table.push(cells(t));
            }
            continue;
        }
        if let Some((ordered, item)) = list_item(t) {
            if !p.para.is_empty() || !p.table.is_empty() {
                p.flush(&mut out, n)?;
            }
            match &mut p.list {
                Some((o, items)) if *o == ordered => items.push(item.trim().to_string()),
                _ => {
                    p.flush(&mut out, n)?;
                    p.list = Some((ordered, vec![item.trim().to_string()]));
                }
            }
            continue;
        }
        if let Some((_, items)) = &mut p.list {
            // A wrapped line continues the item above it.
            let last = items.last_mut().unwrap();
            last.push(' ');
            last.push_str(t);
            continue;
        }
        if !p.table.is_empty() {
            p.flush(&mut out, n)?;
        }
        p.para.push(t.to_string());
    }
    p.flush(&mut out, first + lines.len())?;
    Ok(out)
}

fn toml_block<T: for<'de> Deserialize<'de>>(inner: &str) -> Result<T, String> {
    toml::from_str(inner).map_err(|e| one_line(&e.to_string()))
}

fn fenced(kind: &str, title: &str, inner: &[&str], n: usize) -> Result<Block, String> {
    let text = inner.join("\n");
    let word = || text.trim().to_string();
    Ok(match kind {
        "question" => {
            let q: Question = toml_block(&text)?;
            let idx = q.answer.indices();
            if q.options.len() < 2 {
                return Err("a question needs at least two options".into());
            }
            if idx.is_empty() || idx.iter().any(|i| *i >= q.options.len()) {
                return Err(format!("answer {:?} doesn't match the {} options (they count from 0)", idx, q.options.len()));
            }
            if idx.windows(2).any(|w| w[0] == w[1]) {
                return Err("an answer is listed twice".into());
            }
            if matches!(q.answer, Answer::Many(_)) && idx.len() < 2 {
                return Err("a list answer needs at least two options; use a single number for one".into());
            }
            Block::Question(q)
        }
        "command" => {
            let c: Command = toml_block(&text)?;
            if c.answer.is_empty() || c.answer.iter().any(|a| a.trim().is_empty()) {
                return Err("list at least one accepted command".into());
            }
            Block::Command(c)
        }
        "recall" => Block::Recall(toml_block(&text)?),
        "diagram" => {
            let d: Diagram = toml_block(&text)?;
            let ids: HashSet<&str> = d.nodes.iter().map(|x| x.id.as_str()).collect();
            if ids.len() != d.nodes.len() {
                return Err("two nodes share an id".into());
            }
            for x in &d.nodes {
                if !NODE_KINDS.contains(&x.kind.as_str()) {
                    return Err(format!("node {} has kind \"{}\"; use one of {}", x.id, x.kind, NODE_KINDS.join(", ")));
                }
            }
            for l in &d.links {
                for e in [&l.a, &l.b] {
                    if !ids.contains(e.as_str()) {
                        return Err(format!("a link names {e}, which isn't a node"));
                    }
                }
                if !LINK_STYLES.contains(&l.style.as_str()) {
                    return Err(format!("link style \"{}\" isn't one of trunk, serial, wireless, dashed, fiber", l.style));
                }
            }
            Block::Diagram(d)
        }
        "fields" => {
            let f: Fields = toml_block(&text)?;
            if f.fields.is_empty() {
                return Err("list at least one field".into());
            }
            if let Some(row) = f.row {
                // Fields may not straddle a row.
                let mut used = 0;
                for x in &f.fields {
                    if x.span > row {
                        return Err(format!("{} is wider than a row", x.name));
                    }
                    if used + x.span > row {
                        return Err(format!("{} crosses the end of a row of {row}", x.name));
                    }
                    used = (used + x.span) % row;
                }
            }
            Block::Fields(f)
        }
        "console" => {
            let mut lines: Vec<String> = inner.iter().map(|l| l.trim_end().to_string()).collect();
            while lines.last().is_some_and(|l| l.is_empty()) {
                lines.pop();
            }
            Block::Console { title: title.to_string(), lines }
        }
        k if CALLOUTS.contains(&k) => Block::Callout { kind: k.to_string(), blocks: parse_body(inner, n + 1, true)? },
        "drill" => {
            let k = word();
            if !DRILLS.contains(&k.as_str()) {
                return Err(format!("\"{k}\" isn't one of {}", DRILLS.join(", ")));
            }
            Block::Drill { kind: k }
        }
        "figure" => Block::Figure { id: word() },
        "lab" => Block::Lab { id: word() },
        "exam-map" => Block::ExamMap,
        other => return Err(format!("unknown block ```{other}. Use one of question, command, recall, console, diagram, fields, drill, key, exam, trap, deeper, figure, lab")),
    })
}

/// Reads `book.toml` and checks it.
pub fn read_book_def(dir: &Path) -> Result<BookDef, ContentError> {
    let def_path = dir.join("book.toml");
    let fmt = |message: String| ContentError::Format { path: def_path.clone(), message };
    let mut def: BookDef = toml::from_str(&read(&def_path)?).map_err(|e| fmt(one_line(&e.to_string())))?;
    def.normalise().map_err(fmt)?;
    Ok(def)
}

/// Loads one book directory.
pub fn load_book(dir: &Path) -> Result<Book, ContentError> {
    let def = read_book_def(dir)?;
    let mut chapters = Vec::new();
    for ch in &def.chapters {
        let cdir = dir.join(format!("{:02}", ch.number));
        let mut pages = Vec::new();
        if cdir.is_dir() {
            let mut files: Vec<PathBuf> = fs::read_dir(&cdir)
                .map_err(|source| ContentError::Io { path: cdir.clone(), source })?
                .filter_map(|e| e.ok().map(|e| e.path()))
                .filter(|p| p.extension().is_some_and(|x| x == "md"))
                .collect();
            files.sort();
            for f in files {
                let stem = f.file_stem().unwrap().to_string_lossy();
                let id = format!("{}/{:02}/{}", def.id, ch.number, stem);
                pages.push(parse_page(&id, &read(&f)?, &f)?);
            }
        }
        chapters.push(Chapter { number: ch.number, title: ch.title.clone(), pages });
    }
    Ok(Book { id: def.id, title: def.title, short: def.short, cloth: def.cloth, pattern: def.pattern, about: def.about, chapters, yours: false, changed: false })
}

/// The order of the shipped books on the shelf; anything else follows.
pub const SHELF: &[&str] = &["itn", "srwe", "ensa", "field"];

/// Loads every book directory under `books_dir`, in shelf order.
pub fn load_library(books_dir: &Path) -> Result<Vec<Book>, ContentError> {
    let mut books = load_dir(books_dir)?;
    sort_shelf(&mut books);
    Ok(books)
}

/// Every book in a directory. A missing directory holds no books.
pub fn load_dir(dir: &Path) -> Result<Vec<Book>, ContentError> {
    if !dir.is_dir() {
        return Ok(vec![]);
    }
    let mut dirs: Vec<PathBuf> = fs::read_dir(dir)
        .map_err(|source| ContentError::Io { path: dir.to_path_buf(), source })?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.join("book.toml").is_file())
        .collect();
    dirs.sort();
    dirs.iter().map(|d| load_book(d)).collect()
}

pub fn sort_shelf(books: &mut [Book]) {
    let order = |b: &Book| (b.yours, SHELF.iter().position(|x| *x == b.id).unwrap_or(SHELF.len()), b.title.to_lowercase());
    books.sort_by_key(order);
}

/// One exam topic, like `3.4`, and the pages that teach it.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Topic {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub pages: Vec<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Domain {
    pub id: String,
    pub title: String,
    /// Share of the exam, in percent.
    pub weight: u32,
    #[serde(rename = "topic")]
    pub topics: Vec<Topic>,
}

/// An exam's topic list, mapped onto the shelf. Exams change every few
/// years; each version is its own file in `content/exam/`, so a new one is
/// added without touching any page.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Blueprint {
    /// File name without `.toml`, like `ccna-200-301-v1.1`.
    #[serde(skip_deserializing, default)]
    pub id: String,
    pub exam: String,
    /// When it applies, in words: "Until 2 February 2027".
    #[serde(default)]
    pub valid: String,
    #[serde(rename = "domain")]
    pub domains: Vec<Domain>,
}

impl Blueprint {
    pub fn load(path: &Path) -> Result<Self, ContentError> {
        let mut b: Blueprint = toml::from_str(&read(path)?).map_err(|e| ContentError::Format { path: path.to_path_buf(), message: one_line(&e.to_string()) })?;
        b.id = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        Ok(b)
    }

    /// Every blueprint in a folder, newest file name last.
    pub fn load_dir(dir: &Path) -> Result<Vec<Self>, ContentError> {
        let Ok(rd) = fs::read_dir(dir) else { return Ok(vec![]) };
        let mut files: Vec<PathBuf> = rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.extension().is_some_and(|x| x == "toml")).collect();
        files.sort();
        files.iter().map(|f| Self::load(f)).collect()
    }
}

/// Every page or lab a book refers to must exist, every exam tag must be a
/// real topic, and every inline link must resolve. Returns the problems.
pub fn check_references(books: &[Book], blueprints: &[Blueprint], labs_dir: Option<&Path>) -> Vec<String> {
    let mut problems = Vec::new();
    let exists = |id: &str| books.iter().any(|b| b.page(id).is_some());
    let mut ids = HashSet::new();
    for b in books {
        for p in b.pages() {
            if !ids.insert(p.id.as_str()) {
                problems.push(format!("{}: two pages share this id", p.id));
            }
            for l in &p.meta.links {
                if !exists(l) {
                    problems.push(format!("{}: links to missing page {l}", p.id));
                }
            }
            let mut texts = Vec::new();
            collect_text(&p.blocks, &mut texts);
            for t in texts {
                for target in inline_links(&t) {
                    if !exists(&target) {
                        problems.push(format!("{}: inline link to missing page {target}", p.id));
                    }
                }
            }
            if let Some(dir) = labs_dir {
                for blk in &p.blocks {
                    if let Block::Lab { id } = blk {
                        if !dir.join(format!("{id}.toml")).is_file() {
                            problems.push(format!("{}: names missing lab {id}", p.id));
                        }
                    }
                }
                if let Some(l) = &p.meta.lab {
                    if !dir.join(format!("{l}.toml")).is_file() {
                        problems.push(format!("{}: header names missing lab {l}", p.id));
                    }
                }
            }
        }
    }
    for bp in blueprints {
        for t in bp.domains.iter().flat_map(|d| &d.topics) {
            for p in &t.pages {
                if !exists(p) {
                    problems.push(format!("exam/{}: topic {} names missing page {p}", bp.id, t.id));
                }
            }
        }
    }
    problems
}

fn collect_text(blocks: &[Block], out: &mut Vec<String>) {
    for b in blocks {
        match b {
            Block::Text { text } | Block::Heading { text, .. } => out.push(text.clone()),
            Block::List { items, .. } => out.extend(items.iter().cloned()),
            Block::Table { head, rows } => {
                out.extend(head.iter().cloned());
                out.extend(rows.iter().flatten().cloned());
            }
            Block::Callout { blocks, .. } => collect_text(blocks, out),
            _ => {}
        }
    }
}

/// The page ids in `[words](book/03/page)` links.
pub fn inline_links(text: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = text;
    while let Some(i) = rest.find("](") {
        let after = &rest[i + 2..];
        if let Some(j) = after.find(')') {
            let target = &after[..j];
            if target.split('/').count() == 3 && target.split('/').all(valid_id) {
                out.push(target.to_string());
            }
            rest = &after[j..];
        } else {
            break;
        }
    }
    out
}

/// Words in a page, for reading time and for the writers' checks.
pub fn word_count(p: &Page) -> usize {
    let mut texts = Vec::new();
    collect_text(&p.blocks, &mut texts);
    for b in &p.blocks {
        match b {
            Block::Question(q) => texts.extend([q.prompt.clone(), q.why.clone()]),
            Block::Command(c) => texts.extend([c.prompt.clone(), c.why.clone()]),
            Block::Recall(r) => texts.extend([r.front.clone(), r.back.clone()]),
            _ => {}
        }
    }
    texts.iter().map(|t| t.split_whitespace().count()).sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    const PAGE: &str = "+++\ntitle = \"VLAN trunks\"\nlinks = [\"srwe/03/01-what-a-vlan-is\"]\n+++\n\nAn access port carries one VLAN.\nA trunk carries all of them.\n\n```question\nprompt = \"How?\"\noptions = [\"Untagged\", \"Tagged 10\"]\nanswer = 1\nwhy = \"Because.\"\n```\n\n```figure\ntrunk-tagging\n```\n\nLast paragraph.\n";

    fn page(body: &str) -> Result<Page, ContentError> {
        parse_page("b/01/x", &format!("+++\ntitle = \"T\"\n+++\n{body}"), Path::new("x.md"))
    }

    #[test]
    fn parses_blocks() {
        let p = parse_page("srwe/03/04", PAGE, Path::new("x.md")).unwrap();
        assert_eq!(p.meta.title, "VLAN trunks");
        assert_eq!(p.blocks.len(), 4);
        assert_eq!(p.blocks[0], Block::Text { text: "An access port carries one VLAN. A trunk carries all of them.".into() });
        assert!(matches!(&p.blocks[1], Block::Question(q) if q.answer == Answer::One(1)));
        assert_eq!(p.blocks[2], Block::Figure { id: "trunk-tagging".into() });
    }

    #[test]
    fn rejects_a_bad_answer_index_and_names_the_line() {
        let bad = PAGE.replace("answer = 1", "answer = 5");
        let e = parse_page("x", &bad, Path::new("x.md")).unwrap_err().to_string();
        assert!(e.contains("line 9"), "{e}");
    }

    #[test]
    fn headings_lists_and_tables() {
        let p = page("\n## Two kinds\n\n- Access ports carry\n  one VLAN.\n- Trunks carry many.\n\n1. First\n2. Second\n\n| Port | Mode |\n| --- | --- |\n| Fa0/1 | access |\n| G0/1 | trunk |\n\nAfter.\n").unwrap();
        assert_eq!(p.blocks[0], Block::Heading { level: 2, text: "Two kinds".into() });
        assert_eq!(p.blocks[1], Block::List { ordered: false, items: vec!["Access ports carry one VLAN.".into(), "Trunks carry many.".into()] });
        assert!(matches!(&p.blocks[2], Block::List { ordered: true, items } if items.len() == 2));
        assert_eq!(p.blocks[3], Block::Table { head: vec!["Port".into(), "Mode".into()], rows: vec![vec!["Fa0/1".into(), "access".into()], vec!["G0/1".into(), "trunk".into()]] });
        assert_eq!(p.blocks[4], Block::Text { text: "After.".into() });
    }

    #[test]
    fn interactive_blocks() {
        let p = page(concat!(
            "\n~~~console S1\nS1# show vlan brief\nVLAN Name\n\n~~~\n",
            "\n```key\nA trunk carries **every** VLAN.\n\n- one\n- two\n```\n",
            "\n```question\nprompt = \"Choose two.\"\noptions = [\"a\", \"b\", \"c\"]\nanswer = [2, 0]\nwhy = \"w\"\n```\n",
            "\n```command\nprompt = \"Make it a trunk.\"\nmode = \"S1(config-if)#\"\nanswer = [\"switchport mode trunk\"]\nwhy = \"w\"\n```\n",
            "\n```recall\nfront = \"Native VLAN default?\"\nback = \"VLAN 1\"\n```\n",
            "\n```diagram\nnodes = [{ id = \"S1\", kind = \"switch\", x = 0, y = 0 }, { id = \"R1\", kind = \"router\", x = 1, y = 0 }]\nlinks = [{ a = \"S1\", b = \"R1\", style = \"trunk\" }]\n```\n",
            "\n```fields\nunit = \"bits\"\nrow = 32\nfields = [{ name = \"Version\", span = 4 }, { name = \"IHL\", span = 4 }, { name = \"Rest\", span = 24 }]\n```\n",
            "\n```drill\nsubnet\n```\n",
        ))
        .unwrap();
        assert_eq!(p.blocks[0], Block::Console { title: "S1".into(), lines: vec!["S1# show vlan brief".into(), "VLAN Name".into()] });
        assert!(matches!(&p.blocks[1], Block::Callout { kind, blocks } if kind == "key" && blocks.len() == 2));
        assert!(matches!(&p.blocks[2], Block::Question(q) if q.answer.indices() == vec![0, 2]));
        assert!(matches!(&p.blocks[3], Block::Command(c) if c.mode == "S1(config-if)#"));
        assert!(matches!(&p.blocks[4], Block::Recall(_)));
        assert!(matches!(&p.blocks[5], Block::Diagram(d) if d.links[0].style == "trunk"));
        assert!(matches!(&p.blocks[6], Block::Fields(_)));
        assert_eq!(p.blocks[7], Block::Drill { kind: "subnet".into() });
    }

    #[test]
    fn explains_mistakes() {
        let e = |body: &str| page(body).unwrap_err().to_string();
        assert!(e("\n```diagram\nnodes = [{ id = \"S1\", kind = \"switch\", x = 0, y = 0 }]\nlinks = [{ a = \"S1\", b = \"R9\" }]\n```\n").contains("R9"));
        assert!(e("\n```fields\nrow = 32\nfields = [{ name = \"A\", span = 20 }, { name = \"B\", span = 20 }]\n```\n").contains("crosses"));
        assert!(e("\n```question\nprompt = \"p\"\noptions = [\"a\", \"b\"]\nanswer = 0\nwhy = \"w\"\nhint = \"x\"\n```\n").contains("hint"));
        assert!(e("\n# Big\n").contains("##"));
        assert!(e("\n```console\nno end\n").contains("never closed"));
        assert!(e("\n| a | b |\n|---|---|\n| 1 |\n").contains("cells"));
        assert!(e("\n```drill\nmagic\n```\n").contains("magic"));
    }

    #[test]
    fn finds_inline_links() {
        assert_eq!(inline_links("See [trunks](srwe/03/03-vlan-trunks) and [x](https://a.b)."), vec!["srwe/03/03-vlan-trunks"]);
    }

    #[test]
    fn old_cloth_names_still_work() {
        let mut d: BookDef = toml::from_str("id = \"srwe\"\ntitle = \"t\"\nshort = \"s\"\ncloth = \"srwe\"").unwrap();
        d.normalise().unwrap();
        assert_eq!((d.cloth.as_str(), d.pattern.as_str()), ("plum", "traces"));
        let mut bad: BookDef = toml::from_str("id = \"My Book\"\ntitle = \"t\"\nshort = \"s\"\ncloth = \"teal\"").unwrap();
        assert!(bad.normalise().is_err());
    }
}

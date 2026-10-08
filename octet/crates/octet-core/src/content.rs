//! Books, chapters and pages, read from plain files so content is easy to
//! write and review.
//!
//! ```text
//! content/books/srwe/book.toml           title, cloth, chapter list
//! content/books/srwe/03/04-vlan-trunks.md   one page
//! ```
//!
//! A page is Markdown with a TOML header between `+++` lines. Paragraphs are
//! separated by blank lines. Fenced blocks add the interactive parts:
//!
//! ````text
//! ```question
//! prompt = "The native VLAN is 1. How does a frame from PC-SALES cross the trunk?"
//! options = ["Untagged", "Tagged 10", "Tagged 1"]
//! answer = 1
//! why = "Only the native VLAN crosses untagged, and Sales is in VLAN 10."
//! ```
//!
//! ```figure
//! trunk-tagging
//! ```
//! ````

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, thiserror::Error)]
pub enum ContentError {
    #[error("can't read {path}: {source}")]
    Io { path: PathBuf, source: std::io::Error },
    #[error("{path}: {message}")]
    Format { path: PathBuf, message: String },
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub struct Question {
    pub prompt: String,
    pub options: Vec<String>,
    pub answer: usize,
    pub why: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Block {
    /// A paragraph with light inline marks: *emphasis*, **strong**, `code`.
    Text { text: String },
    Question(Question),
    Figure { id: String },
    Lab { id: String },
}

#[derive(Clone, Debug, Serialize, Deserialize)]
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
pub struct ChapterDef {
    pub number: u32,
    pub title: String,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct BookDef {
    pub id: String,
    pub title: String,
    pub short: String,
    /// Cover colour token: itn, srwe or ensa.
    pub cloth: String,
    #[serde(rename = "chapter", default)]
    pub chapters: Vec<ChapterDef>,
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
    pub chapters: Vec<Chapter>,
}

impl Book {
    pub fn page(&self, id: &str) -> Option<&Page> {
        self.chapters.iter().flat_map(|c| &c.pages).find(|p| p.id == id)
    }
    pub fn page_count(&self) -> usize {
        self.chapters.iter().map(|c| c.pages.len()).sum()
    }
}

fn read(path: &Path) -> Result<String, ContentError> {
    fs::read_to_string(path).map_err(|source| ContentError::Io { path: path.to_path_buf(), source })
}

/// Splits a page into its header and body and parses both.
pub fn parse_page(id: &str, src: &str, path: &Path) -> Result<Page, ContentError> {
    let err = |message: String| ContentError::Format { path: path.to_path_buf(), message };
    let src = src.replace("\r\n", "\n");
    let rest = src.strip_prefix("+++\n").ok_or_else(|| err("a page starts with a +++ header".into()))?;
    let (head, body) = rest.split_once("\n+++").ok_or_else(|| err("the +++ header isn't closed".into()))?;
    let meta: PageMeta = toml::from_str(head).map_err(|e| err(format!("header: {e}")))?;
    let mut blocks = Vec::new();
    let mut para: Vec<&str> = Vec::new();
    let mut lines = body.lines().peekable();
    let flush = |para: &mut Vec<&str>, blocks: &mut Vec<Block>| {
        if !para.is_empty() {
            blocks.push(Block::Text { text: para.join(" ").trim().to_string() });
            para.clear();
        }
    };
    while let Some(line) = lines.next() {
        if let Some(kind) = line.trim().strip_prefix("```") {
            flush(&mut para, &mut blocks);
            let mut inner = Vec::new();
            for l in lines.by_ref() {
                if l.trim() == "```" {
                    break;
                }
                inner.push(l);
            }
            let inner = inner.join("\n");
            blocks.push(match kind.trim() {
                "question" => Block::Question(toml::from_str(&inner).map_err(|e| err(format!("question: {e}")))?),
                "figure" => Block::Figure { id: inner.trim().to_string() },
                "lab" => Block::Lab { id: inner.trim().to_string() },
                other => return Err(err(format!("unknown block ```{other}"))),
            });
        } else if line.trim().is_empty() {
            flush(&mut para, &mut blocks);
        } else {
            para.push(line.trim());
        }
    }
    flush(&mut para, &mut blocks);
    for b in &blocks {
        if let Block::Question(q) = b {
            if q.answer >= q.options.len() {
                return Err(err(format!("question \"{}\" has answer {} but only {} options", q.prompt, q.answer, q.options.len())));
            }
        }
    }
    Ok(Page { id: id.to_string(), meta, blocks })
}

/// Loads one book directory.
pub fn load_book(dir: &Path) -> Result<Book, ContentError> {
    let def_path = dir.join("book.toml");
    let def: BookDef = toml::from_str(&read(&def_path)?).map_err(|e| ContentError::Format { path: def_path.clone(), message: e.to_string() })?;
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
    Ok(Book { id: def.id, title: def.title, short: def.short, cloth: def.cloth, chapters })
}

/// Loads every book under `content/books`, in the order of their ids.
pub fn load_library(books_dir: &Path) -> Result<Vec<Book>, ContentError> {
    let mut dirs: Vec<PathBuf> = fs::read_dir(books_dir)
        .map_err(|source| ContentError::Io { path: books_dir.to_path_buf(), source })?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.join("book.toml").is_file())
        .collect();
    dirs.sort();
    let mut books: Vec<Book> = dirs.iter().map(|d| load_book(d)).collect::<Result<_, _>>()?;
    let order = |id: &str| ["itn", "srwe", "ensa"].iter().position(|x| *x == id).unwrap_or(9);
    books.sort_by_key(|b| order(&b.id));
    Ok(books)
}

#[cfg(test)]
mod tests {
    use super::*;

    const PAGE: &str = "+++\ntitle = \"VLAN trunks\"\nlinks = [\"srwe/03/01-what-a-vlan-is\"]\n+++\n\nAn access port carries one VLAN.\nA trunk carries all of them.\n\n```question\nprompt = \"How?\"\noptions = [\"Untagged\", \"Tagged 10\"]\nanswer = 1\nwhy = \"Because.\"\n```\n\n```figure\ntrunk-tagging\n```\n\nLast paragraph.\n";

    #[test]
    fn parses_blocks() {
        let p = parse_page("srwe/03/04", PAGE, Path::new("x.md")).unwrap();
        assert_eq!(p.meta.title, "VLAN trunks");
        assert_eq!(p.blocks.len(), 4);
        assert_eq!(p.blocks[0], Block::Text { text: "An access port carries one VLAN. A trunk carries all of them.".into() });
        assert!(matches!(&p.blocks[1], Block::Question(q) if q.answer == 1));
        assert_eq!(p.blocks[2], Block::Figure { id: "trunk-tagging".into() });
    }

    #[test]
    fn rejects_a_bad_answer_index() {
        let bad = PAGE.replace("answer = 1", "answer = 5");
        assert!(parse_page("x", &bad, Path::new("x.md")).is_err());
    }
}

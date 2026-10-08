//! Checks content while you write it.
//!
//! ```text
//! octet-check content                  the whole shipped library
//! octet-check content/books/itn/05     one chapter (inside the library)
//! octet-check my-book.txt              a pasted-book text, as Settings reads it
//! ```
//!
//! Prints each page with its word count and what it holds, then every
//! problem. Exits with 1 if there are problems.

use octet_core::content::{check_references, load_dir, word_count, Blueprint, Block};
use std::path::{Path, PathBuf};
use std::process::ExitCode;

fn summary(p: &octet_core::Page) -> String {
    let mut q = 0;
    let mut other = Vec::new();
    for b in &p.blocks {
        match b {
            Block::Question(_) | Block::Command(_) | Block::Recall(_) => q += 1,
            Block::Console { .. } => other.push("console"),
            Block::Diagram(_) => other.push("diagram"),
            Block::Fields(_) => other.push("fields"),
            Block::Table { .. } => other.push("table"),
            Block::Drill { .. } => other.push("drill"),
            Block::Lab { .. } => other.push("lab"),
            _ => {}
        }
    }
    other.sort_unstable();
    other.dedup();
    format!("{:>5} words  {:>2} to answer  {}", word_count(p), q, other.join(" "))
}

fn main() -> ExitCode {
    let arg = std::env::args().nth(1).unwrap_or_else(|| "content".into());
    let path = PathBuf::from(&arg);
    if path.is_file() {
        let text = std::fs::read_to_string(&path).unwrap_or_default();
        return match octet_core::bundle::parse_bundle(&text) {
            Ok(b) => {
                for p in b.book.pages() {
                    println!("{:<48} {}", p.id, summary(p));
                }
                println!("OK: {} chapters, {} pages", b.book.chapters.len(), b.book.page_count());
                ExitCode::SUCCESS
            }
            Err(problems) => {
                problems.iter().for_each(|p| println!("PROBLEM: {p}"));
                ExitCode::FAILURE
            }
        };
    }
    // Find the content root above whatever was named.
    let root = path.ancestors().find(|a| a.join("books").is_dir()).map(Path::to_path_buf).unwrap_or(path.clone());
    let books = match load_dir(&root.join("books")) {
        Ok(b) => b,
        Err(e) => {
            println!("PROBLEM: {e}");
            return ExitCode::FAILURE;
        }
    };
    let bps = Blueprint::load_dir(&root.join("exam")).unwrap_or_default();
    let want = path.canonicalize().unwrap_or(path.clone());
    let mut shown = 0;
    for b in &books {
        for c in &b.chapters {
            let cdir = root.join("books").join(&b.id).join(format!("{:02}", c.number));
            let cdir = cdir.canonicalize().unwrap_or(cdir);
            if !(cdir.starts_with(&want) || want == root.canonicalize().unwrap_or(root.clone())) {
                continue;
            }
            for p in &c.pages {
                println!("{:<48} {}", p.id, summary(p));
                shown += 1;
            }
        }
    }
    let problems: Vec<String> = check_references(&books, &bps, Some(&root.join("labs")));
    let mine: Vec<&String> = problems.iter().filter(|p| shown == 0 || books.iter().flat_map(|b| b.pages()).any(|pg| p.starts_with(&format!("{}:", pg.id)))).collect();
    mine.iter().for_each(|p| println!("PROBLEM: {p}"));
    println!("{} pages checked, {} problems", shown, mine.len());
    if mine.is_empty() { ExitCode::SUCCESS } else { ExitCode::FAILURE }
}

//! Checks content while you write it.
//!
//! ```text
//! octet-check content                  the whole shipped library
//! octet-check content/books/itn/05     one chapter (inside the library)
//! octet-check my-book.txt              a pasted-book text, as Settings reads it
//! ```
//!
//! Prints each page with its word count and what it holds, then every
//! problem. Exits with 1 if there are problems. A broken page elsewhere in
//! the library never stops a chapter from being checked: other pages are
//! read leniently, and only problems in the named folder are reported.

use octet_core::content::{check_references, parse_page, read_book_def, word_count, Block, Blueprint, Book, Chapter};
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

/// Every book, keeping the pages that parse. Parse errors are returned with
/// the file they're in.
fn load_lenient(books_dir: &Path) -> (Vec<Book>, Vec<(PathBuf, String)>) {
    let mut books = Vec::new();
    let mut errors = Vec::new();
    let Ok(rd) = std::fs::read_dir(books_dir) else { return (books, errors) };
    let mut dirs: Vec<PathBuf> = rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.join("book.toml").is_file()).collect();
    dirs.sort();
    for dir in dirs {
        let def = match read_book_def(&dir) {
            Ok(d) => d,
            Err(e) => {
                errors.push((dir.join("book.toml"), e.to_string()));
                continue;
            }
        };
        let mut chapters = Vec::new();
        for ch in &def.chapters {
            let cdir = dir.join(format!("{:02}", ch.number));
            let mut files: Vec<PathBuf> = std::fs::read_dir(&cdir).map(|rd| rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.extension().is_some_and(|x| x == "md")).collect()).unwrap_or_default();
            files.sort();
            let mut pages = Vec::new();
            for f in files {
                let id = format!("{}/{:02}/{}", def.id, ch.number, f.file_stem().unwrap().to_string_lossy());
                match std::fs::read_to_string(&f).map_err(|e| e.to_string()).and_then(|src| parse_page(&id, &src, &f).map_err(|e| e.to_string())) {
                    Ok(p) => pages.push(p),
                    Err(e) => errors.push((f.clone(), e)),
                }
            }
            chapters.push(Chapter { number: ch.number, title: ch.title.clone(), pages });
        }
        books.push(Book { id: def.id, title: def.title, short: def.short, cloth: def.cloth, pattern: def.pattern, about: def.about, chapters, yours: false, changed: false });
    }
    (books, errors)
}

fn main() -> ExitCode {
    let arg = std::env::args().nth(1).unwrap_or_else(|| "content".into());
    let path = PathBuf::from(&arg);
    if path.is_file() && path.extension().is_none_or(|x| x != "md") {
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
    let root = path.ancestors().find(|a| a.join("books").is_dir()).map(Path::to_path_buf).unwrap_or(path.clone());
    let want = path.canonicalize().unwrap_or(path.clone());
    let inside = |p: &Path| p.canonicalize().map(|c| c.starts_with(&want)).unwrap_or(false);
    let (books, errors) = load_lenient(&root.join("books"));
    let mut problems: Vec<String> = errors.iter().filter(|(f, _)| inside(f)).map(|(_, e)| e.clone()).collect();
    let mut shown = 0;
    let mut mine = Vec::new();
    for b in &books {
        for c in &b.chapters {
            let cdir = root.join("books").join(&b.id).join(format!("{:02}", c.number));
            if !inside(&cdir) && !inside(&cdir.join("x")) && !cdir.canonicalize().map(|c| c.starts_with(&want)).unwrap_or(false) {
                continue;
            }
            for p in &c.pages {
                println!("{:<48} {}", p.id, summary(p));
                mine.push(p.id.clone());
                shown += 1;
            }
        }
    }
    let bps = Blueprint::load_dir(&root.join("exam")).unwrap_or_default();
    let whole = want == root.canonicalize().unwrap_or(root.clone());
    for p in check_references(&books, &bps, Some(&root.join("labs"))) {
        if whole || mine.iter().any(|id| p.starts_with(&format!("{id}:"))) {
            problems.push(p);
        }
    }
    problems.iter().for_each(|p| println!("PROBLEM: {p}"));
    println!("{} pages checked, {} problems", shown, problems.len());
    if problems.is_empty() { ExitCode::SUCCESS } else { ExitCode::FAILURE }
}

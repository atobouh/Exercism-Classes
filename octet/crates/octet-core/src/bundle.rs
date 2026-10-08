//! A whole book in one piece of text, so it can be pasted into Settings:
//! the answer an assistant gives back after reading your class PDFs.
//!
//! ```text
//! === book ===
//! id = "my-encor"
//! title = "Enterprise Core"
//! short = "ENCOR notes"
//! cloth = "navy"
//! pattern = "waves"
//!
//! [[chapter]]
//! number = 1
//! title = "Packet forwarding"
//!
//! === page 1 01-how-a-switch-decides ===
//! +++
//! title = "How a switch decides"
//! +++
//!
//! A page, exactly as it would be written in its own file.
//! ```
//!
//! The `book` section is a `book.toml`, and each `page` section is a page
//! file named by its chapter number and file name, so a book folder and a
//! bundle convert both ways without losing anything.

use crate::content::{parse_page, read_book_def, valid_id, Book, BookDef, Chapter, ContentError};
use std::fs;
use std::path::{Path, PathBuf};

pub struct BundlePage {
    pub chapter: u32,
    pub name: String,
    pub src: String,
}

pub struct Bundle {
    pub def: BookDef,
    pub def_src: String,
    pub pages: Vec<BundlePage>,
    /// The parsed book, ready to show.
    pub book: Book,
}

impl Bundle {
    /// The book's details with no chapters, for changing only the cover.
    pub fn details_only(def: &BookDef) -> BookDef {
        BookDef { chapters: vec![], ..def.clone() }
    }
}

/// Assistants often wrap their answer in a code fence; take it off. Returns
/// the text and how many lines were taken off the top.
fn unwrap_fence(text: &str) -> (String, usize) {
    let t = text.replace("\r\n", "\n");
    let t = t.trim_end().trim_start_matches('\u{feff}');
    let lead = t.lines().take_while(|l| l.trim().is_empty()).count();
    let t = t.trim_start();
    let mut lines: Vec<&str> = t.lines().collect();
    let opens = lines.first().is_some_and(|l| l.trim_start().starts_with("```") || l.trim_start().starts_with("~~~"));
    let closes = lines.len() > 1 && lines.last().is_some_and(|l| {
        let l = l.trim();
        l.len() >= 3 && (l.chars().all(|c| c == '`') || l.chars().all(|c| c == '~'))
    });
    if opens && closes && lines.iter().any(|l| l.trim_start().starts_with("=== book")) {
        lines.remove(0);
        lines.pop();
        return (lines.join("\n"), lead + 1);
    }
    (lines.join("\n"), lead)
}

/// Reads a bundle. Every problem is reported in plain words with the line
/// it's on, so it can be fixed by hand or sent back to the assistant.
pub fn parse_bundle(text: &str) -> Result<Bundle, Vec<String>> {
    let (text, shift) = unwrap_fence(text);
    let lines: Vec<&str> = text.lines().collect();
    let mut sections: Vec<(usize, String, Vec<&str>)> = Vec::new();
    let mut problems = Vec::new();
    for (i, l) in lines.iter().enumerate() {
        let t = l.trim();
        if t.starts_with("===") && t.ends_with("===") && t.len() > 6 {
            sections.push((i + 1 + shift, t.trim_matches('=').trim().to_string(), Vec::new()));
        } else if let Some(s) = sections.last_mut() {
            s.2.push(l);
        } else if !t.is_empty() {
            problems.push(format!("Line {}: the text should begin with \"=== book ===\".", i + 1 + shift));
            return Err(problems);
        }
    }
    let Some((book_line, _, book_lines)) = sections.iter().find(|s| s.1 == "book") else {
        return Err(vec!["There's no \"=== book ===\" section, so the book has no title or chapters.".into()]);
    };
    let def_src = book_lines.join("\n");
    let mut def: BookDef = match toml::from_str(&def_src) {
        Ok(d) => d,
        Err(e) => return Err(vec![format!("The book section (from line {book_line}): {}", e.to_string().split_whitespace().collect::<Vec<_>>().join(" "))]),
    };
    if let Err(e) = def.normalise() {
        return Err(vec![format!("The book section (from line {book_line}): {e}.")]);
    }
    let mut pages = Vec::new();
    for (line, head, body) in &sections {
        if head == "book" {
            continue;
        }
        let mut words = head.split_whitespace();
        let (Some("page"), Some(ch), Some(name), None) = (words.next(), words.next(), words.next(), words.next()) else {
            problems.push(format!("Line {line}: \"=== {head} ===\" should look like \"=== page 3 02-page-name ===\"."));
            continue;
        };
        let Ok(chapter) = ch.parse::<u32>() else {
            problems.push(format!("Line {line}: \"{ch}\" should be a chapter number."));
            continue;
        };
        if !def.chapters.iter().any(|c| c.number == chapter) {
            problems.push(format!("Line {line}: chapter {chapter} isn't in the book's chapter list."));
            continue;
        }
        if !valid_id(name) {
            problems.push(format!("Line {line}: the page name \"{name}\" can only use lowercase letters, digits and dashes."));
            continue;
        }
        if pages.iter().any(|p: &BundlePage| p.chapter == chapter && p.name == name) {
            problems.push(format!("Line {line}: chapter {chapter} already has a page called {name}."));
            continue;
        }
        let src = body.iter().skip_while(|l| l.trim().is_empty()).copied().collect::<Vec<_>>().join("\n") + "\n";
        pages.push(BundlePage { chapter, name: name.to_string(), src });
        // Page line numbers are counted from the top of the pasted text.
        let offset = *line + body.iter().take_while(|l| l.trim().is_empty()).count();
        let id = format!("{}/{:02}/{}", def.id, chapter, name);
        if let Err(e) = parse_page(&id, &pages.last().unwrap().src, Path::new(name)) {
            let msg = match e {
                ContentError::Format { message, .. } => renumber(&message, offset),
                e => e.to_string(),
            };
            problems.push(format!("Page {name} (chapter {chapter}): {msg}"));
        }
    }
    if pages.is_empty() && problems.is_empty() {
        problems.push("There are no pages. Each page starts with a line like \"=== page 1 01-page-name ===\".".into());
    }
    if !problems.is_empty() {
        return Err(problems);
    }
    let book = build(&def, &pages);
    Ok(Bundle { def, def_src, pages, book })
}

/// "line 4: ..." inside a page becomes the line in the whole text.
fn renumber(message: &str, offset: usize) -> String {
    if let Some(rest) = message.strip_prefix("line ") {
        let digits: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();
        if let Ok(n) = digits.parse::<usize>() {
            return format!("line {}{}", n + offset, &rest[digits.len()..]);
        }
    }
    message.to_string()
}

fn build(def: &BookDef, pages: &[BundlePage]) -> Book {
    let chapters = def
        .chapters
        .iter()
        .map(|c| {
            let mut ps: Vec<&BundlePage> = pages.iter().filter(|p| p.chapter == c.number).collect();
            ps.sort_by(|a, b| a.name.cmp(&b.name));
            let pages = ps
                .iter()
                .filter_map(|p| parse_page(&format!("{}/{:02}/{}", def.id, c.number, p.name), &p.src, Path::new(&p.name)).ok())
                .collect();
            Chapter { number: c.number, title: c.title.clone(), pages }
        })
        .collect();
    Book { id: def.id.clone(), title: def.title.clone(), short: def.short.clone(), cloth: def.cloth.clone(), pattern: def.pattern.clone(), about: def.about.clone(), chapters, yours: true, changed: false }
}

fn io(path: &Path) -> impl Fn(std::io::Error) -> String + '_ {
    move |e| format!("can't write {}: {e}", path.display())
}

/// Writes a bundle into `books_dir/<id>/`. If the book is already there, the
/// chapters in this bundle replace those chapters and the rest stay, so a
/// long book can come in one chapter at a time. The cover chosen in
/// Settings wins over the one in the text.
pub fn install(bundle: &Bundle, books_dir: &Path, cloth: &str, pattern: &str) -> Result<PathBuf, String> {
    let dir = books_dir.join(&bundle.def.id);
    let mut def = bundle.def.clone();
    if dir.join("book.toml").is_file() {
        if let Ok(old) = read_book_def(&dir) {
            for c in old.chapters {
                if !def.chapters.iter().any(|n| n.number == c.number) {
                    def.chapters.push(c);
                }
            }
            def.chapters.sort_by_key(|c| c.number);
        }
    }
    def.cloth = cloth.to_string();
    def.pattern = pattern.to_string();
    def.normalise()?;
    fs::create_dir_all(&dir).map_err(io(&dir))?;
    let path = dir.join("book.toml");
    fs::write(&path, book_toml(&def)).map_err(io(&path))?;
    let mut touched: Vec<u32> = bundle.pages.iter().map(|p| p.chapter).collect();
    touched.dedup();
    for ch in touched {
        let cdir = dir.join(format!("{ch:02}"));
        if cdir.is_dir() {
            fs::remove_dir_all(&cdir).map_err(io(&cdir))?;
        }
        fs::create_dir_all(&cdir).map_err(io(&cdir))?;
        for p in bundle.pages.iter().filter(|p| p.chapter == ch) {
            let path = cdir.join(format!("{}.md", p.name));
            fs::write(&path, &p.src).map_err(io(&path))?;
        }
    }
    Ok(dir)
}

fn quote(s: &str) -> String {
    toml::Value::String(s.to_string()).to_string()
}

fn book_toml(def: &BookDef) -> String {
    let mut s = format!("id = {}\ntitle = {}\nshort = {}\ncloth = {}\npattern = {}\n", quote(&def.id), quote(&def.title), quote(&def.short), quote(&def.cloth), quote(&def.pattern));
    if !def.about.is_empty() {
        s += &format!("about = {}\n", quote(&def.about));
    }
    for c in &def.chapters {
        s += &format!("\n[[chapter]]\nnumber = {}\ntitle = {}\n", c.number, quote(&c.title));
    }
    s
}

/// A book folder's definition and page sources.
pub fn read_folder(dir: &Path) -> Result<(BookDef, Vec<BundlePage>), String> {
    let def = read_book_def(dir).map_err(|e| e.to_string())?;
    let mut pages = Vec::new();
    for c in &def.chapters {
        let cdir = dir.join(format!("{:02}", c.number));
        let Ok(rd) = fs::read_dir(&cdir) else { continue };
        let mut files: Vec<PathBuf> = rd.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.extension().is_some_and(|x| x == "md")).collect();
        files.sort();
        for f in files {
            let src = fs::read_to_string(&f).map_err(|e| e.to_string())?;
            pages.push(BundlePage { chapter: c.number, name: f.file_stem().unwrap().to_string_lossy().into_owned(), src });
        }
    }
    Ok((def, pages))
}

/// A book as one piece of text.
pub fn to_text(def: &BookDef, pages: &[BundlePage]) -> String {
    let mut out = format!("=== book ===\n{}", book_toml(def));
    for c in &def.chapters {
        for p in pages.iter().filter(|p| p.chapter == c.number) {
            out += &format!("\n=== page {} {} ===\n{}\n", c.number, p.name, p.src.trim_end());
        }
    }
    out
}

/// A book folder as one piece of text, to keep or share. With `overlay`,
/// the changes kept there are laid over the shipped pages first.
pub fn export(dir: &Path) -> Result<String, String> {
    let (def, pages) = read_folder(dir)?;
    Ok(to_text(&def, &pages))
}

/// The shipped book with your changes on top: your chapters replace the
/// shipped ones with the same number, and your book details win.
pub fn export_layered(base: &Path, overlay: &Path) -> Result<String, String> {
    let (mut def, mut pages) = read_folder(base)?;
    let (ov, ov_pages) = read_folder(overlay)?;
    for c in &ov.chapters {
        match def.chapters.iter_mut().find(|x| x.number == c.number) {
            Some(x) => x.title = c.title.clone(),
            None => def.chapters.push(c.clone()),
        }
        if ov_pages.iter().any(|p| p.chapter == c.number) {
            pages.retain(|p| p.chapter != c.number);
        }
    }
    def.chapters.sort_by_key(|c| c.number);
    (def.title, def.short, def.cloth, def.pattern) = (ov.title, ov.short, ov.cloth, ov.pattern);
    if !ov.about.is_empty() {
        def.about = ov.about;
    }
    pages.extend(ov_pages);
    Ok(to_text(&def, &pages))
}

#[cfg(test)]
mod tests {
    use super::*;

    const TEXT: &str = "```text\n=== book ===\nid = \"notes\"\ntitle = \"My notes\"\nshort = \"Mine\"\ncloth = \"moss\"\npattern = \"waves\"\n\n[[chapter]]\nnumber = 1\ntitle = \"One\"\n\n[[chapter]]\nnumber = 2\ntitle = \"Two\"\n\n=== page 1 01-first ===\n+++\ntitle = \"First\"\n+++\n\nHello.\n\n~~~question\nprompt = \"p\"\noptions = [\"a\", \"b\"]\nanswer = 0\nwhy = \"w\"\n~~~\n\n=== page 2 01-second ===\n+++\ntitle = \"Second\"\n+++\n\nBye.\n```";

    #[test]
    fn reads_installs_merges_and_exports() {
        let b = parse_bundle(TEXT).unwrap();
        assert_eq!(b.book.page_count(), 2);
        assert_eq!(b.book.chapters[0].pages[0].id, "notes/01/01-first");
        let dir = tempfile::tempdir().unwrap();
        install(&b, dir.path(), "navy", "dots").unwrap();
        // A second bundle with only chapter 2 keeps chapter 1.
        let only2 = "=== book ===\nid = \"notes\"\ntitle = \"My notes\"\nshort = \"Mine\"\ncloth = \"moss\"\n[[chapter]]\nnumber = 2\ntitle = \"Two, again\"\n=== page 2 01-new ===\n+++\ntitle = \"New\"\n+++\nNew.\n";
        install(&parse_bundle(only2).unwrap(), dir.path(), "navy", "dots").unwrap();
        let book = crate::content::load_book(&dir.path().join("notes")).unwrap();
        assert_eq!(book.cloth, "navy");
        assert_eq!(book.chapters.len(), 2);
        assert_eq!(book.chapters[0].pages[0].meta.title, "First");
        assert_eq!(book.chapters[1].title, "Two, again");
        assert_eq!(book.chapters[1].pages.len(), 1);
        let text = export(&dir.path().join("notes")).unwrap();
        let again = parse_bundle(&text).unwrap();
        assert_eq!(again.book.page_count(), 2);
    }

    #[test]
    fn problems_name_the_line_in_the_pasted_text() {
        let bad = TEXT.replace("answer = 0", "answer = 7");
        let p = parse_bundle(&bad).err().unwrap();
        assert_eq!(p.len(), 1);
        assert!(p[0].starts_with("Page 01-first (chapter 1): line 24"), "{}", p[0]);
        let p = parse_bundle(&TEXT.replace("=== page 2 01-second", "=== page 9 01-second")).err().unwrap();
        assert!(p[0].contains("chapter 9 isn't in"), "{}", p[0]);
        assert!(parse_bundle("hello").is_err());
    }
}

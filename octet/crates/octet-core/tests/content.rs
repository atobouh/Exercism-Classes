use octet_core::content::{check_references, Blueprint};
use octet_core::load_library;
use std::path::Path;

#[test]
fn the_shipped_library_loads() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../content");
    let books = load_library(&root.join("books")).expect("content parses");
    let ids: Vec<&str> = books.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(ids, ["itn", "srwe", "ensa", "field"]);
    assert_eq!(books[0].chapters.len(), 17);
    assert_eq!(books[1].chapters.len(), 16);
    assert_eq!(books[2].chapters.len(), 14);
    assert_eq!(books[3].chapters.len(), 15);
    let vlans = &books[1].chapters[2];
    assert_eq!(vlans.title, "VLANs");
    assert!(vlans.pages.iter().any(|p| p.id == "srwe/03/03-vlan-trunks"));
    assert_eq!(vlans.pages.last().unwrap().meta.lab.as_deref(), Some("srwe-03-router-on-a-stick"), "the lab closes the chapter");

    // Every link, inline link, lab and exam mapping points at something real.
    let blueprints = Blueprint::load_dir(&root.join("exam")).expect("exam topic lists parse");
    let problems = check_references(&books, &blueprints, Some(&root.join("labs")));
    assert!(problems.is_empty(), "{}", problems.join("\n"));

}

#[test]
fn the_book_prompt_ships() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../content");
    let prompt = std::fs::read_to_string(root.join("prompts/book-from-notes.md")).unwrap();
    for cloth in octet_core::content::CLOTHS {
        assert!(prompt.contains(&format!("`{cloth}`")), "the prompt lists cloth {cloth}");
    }
    for pattern in octet_core::content::PATTERNS {
        assert!(prompt.contains(&format!("`{pattern}`")), "the prompt lists pattern {pattern}");
    }
}

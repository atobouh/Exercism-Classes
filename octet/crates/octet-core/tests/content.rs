use octet_core::{load_library, Block};
use std::path::Path;

#[test]
fn the_shipped_library_loads() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../content");
    let books = load_library(&root.join("books")).expect("content parses");
    let ids: Vec<&str> = books.iter().map(|b| b.id.as_str()).collect();
    assert_eq!(ids, ["itn", "srwe", "ensa"]);
    assert_eq!(books[0].chapters.len(), 17);
    assert_eq!(books[1].chapters.len(), 16);
    assert_eq!(books[2].chapters.len(), 14);
    let vlans = &books[1].chapters[2];
    assert_eq!(vlans.title, "VLANs");
    assert_eq!(vlans.pages.len(), 6);
    // Every link points at a real page, and every lab at a real lab file.
    for b in &books {
        for p in b.chapters.iter().flat_map(|c| &c.pages) {
            for l in &p.meta.links {
                assert!(books.iter().any(|bk| bk.page(l).is_some()), "{} links to missing page {l}", p.id);
            }
            for blk in &p.blocks {
                if let Block::Lab { id } = blk {
                    let f = root.join("labs").join(format!("{id}.toml"));
                    let src = std::fs::read_to_string(&f).unwrap_or_else(|_| panic!("{} names missing lab {id}", p.id));
                    octet_sim::Lab::from_toml(&src).expect("lab parses");
                }
            }
        }
    }
}

//! Everything that is yours: highlights, notes, collections, where you
//! stopped, answers, review cards and finished labs. Saved as one JSON file
//! on this computer.

use crate::review::{Card, Grade};
use serde::{Deserialize, Serialize};
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Highlight {
    pub page: String,
    pub block: usize,
    /// The exact words you marked inside that block.
    pub text: String,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Note {
    pub id: u64,
    pub page: String,
    /// The note sits under this block.
    pub after_block: usize,
    /// What you selected when you wrote it, if anything.
    #[serde(default)]
    pub quote: String,
    pub text: String,
    pub created: i64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PieceKind {
    Quote,
    Command,
    Note,
    Diagram,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Piece {
    pub kind: PieceKind,
    pub text: String,
    /// Where it came from, shown as "From VLAN trunks".
    pub source: String,
    pub created: i64,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Collection {
    pub id: String,
    pub title: String,
    pub pieces: Vec<Piece>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Place {
    pub page: String,
    pub block: usize,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct LabRecord {
    pub lab: String,
    pub passed: bool,
    #[serde(default)]
    pub notes: String,
    /// The bench as you left it: devices, cables and configs.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub state: Option<serde_json::Value>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Data {
    pub version: u32,
    pub highlights: Vec<Highlight>,
    pub notes: Vec<Note>,
    pub collections: Vec<Collection>,
    /// Pages you have finished reading.
    pub read: Vec<String>,
    /// The ribbon: where you stopped.
    pub ribbon: Option<Place>,
    pub cards: Vec<Card>,
    pub labs: Vec<LabRecord>,
    pub next_id: u64,
}

impl Default for Data {
    fn default() -> Self {
        let col = |id: &str, title: &str| Collection { id: id.into(), title: title.into(), pieces: vec![] };
        Self {
            version: 1,
            highlights: vec![],
            notes: vec![],
            collections: vec![col("commands", "Show commands"), col("wrong", "Things I got wrong"), col("diagrams", "Diagrams")],
            read: vec![],
            ribbon: None,
            cards: vec![],
            labs: vec![],
            next_id: 1,
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum StoreError {
    #[error("can't use {path}: {source}")]
    Io { path: PathBuf, source: std::io::Error },
    #[error("{path} isn't readable as Octet data: {source}")]
    Corrupt { path: PathBuf, source: serde_json::Error },
}

/// Your data plus where it lives. Every change is written straight away.
pub struct Store {
    path: PathBuf,
    pub data: Data,
}

impl Store {
    /// Opens the data file, creating it on first run.
    pub fn open(path: &Path) -> Result<Self, StoreError> {
        let data = match fs::read_to_string(path) {
            Ok(s) => serde_json::from_str(&s).map_err(|source| StoreError::Corrupt { path: path.to_path_buf(), source })?,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Data::default(),
            Err(source) => return Err(StoreError::Io { path: path.to_path_buf(), source }),
        };
        Ok(Self { path: path.to_path_buf(), data })
    }

    /// Writes to a temporary file and renames it, so a crash never leaves a
    /// half-written file behind.
    pub fn save(&self) -> Result<(), StoreError> {
        let io = |source| StoreError::Io { path: self.path.clone(), source };
        if let Some(dir) = self.path.parent() {
            fs::create_dir_all(dir).map_err(io)?;
        }
        let tmp = self.path.with_extension("json.tmp");
        let mut f = fs::File::create(&tmp).map_err(io)?;
        f.write_all(serde_json::to_string_pretty(&self.data).unwrap().as_bytes()).map_err(io)?;
        f.sync_all().map_err(io)?;
        fs::rename(&tmp, &self.path).map_err(io)
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    fn id(&mut self) -> u64 {
        let id = self.data.next_id;
        self.data.next_id += 1;
        id
    }

    pub fn highlight(&mut self, h: Highlight) -> Result<(), StoreError> {
        if !self.data.highlights.contains(&h) {
            self.data.highlights.push(h);
        }
        self.save()
    }

    pub fn add_note(&mut self, page: &str, after_block: usize, quote: &str, text: &str, now: i64) -> Result<Note, StoreError> {
        let n = Note { id: self.id(), page: page.into(), after_block, quote: quote.into(), text: text.into(), created: now };
        self.data.notes.push(n.clone());
        self.save()?;
        Ok(n)
    }

    pub fn edit_note(&mut self, id: u64, text: &str) -> Result<(), StoreError> {
        if text.trim().is_empty() {
            self.data.notes.retain(|n| n.id != id);
        } else if let Some(n) = self.data.notes.iter_mut().find(|n| n.id == id) {
            n.text = text.into();
        }
        self.save()
    }

    pub fn collect(&mut self, collection: &str, piece: Piece) -> Result<(), StoreError> {
        if let Some(c) = self.data.collections.iter_mut().find(|c| c.id == collection) {
            c.pieces.push(piece);
        }
        self.save()
    }

    pub fn set_ribbon(&mut self, page: &str, block: usize) -> Result<(), StoreError> {
        self.data.ribbon = Some(Place { page: page.into(), block });
        self.save()
    }

    pub fn mark_read(&mut self, page: &str) -> Result<(), StoreError> {
        if !self.data.read.iter().any(|p| p == page) {
            self.data.read.push(page.into());
        }
        self.save()
    }

    /// Answering a question in the text makes it a review card. A wrong
    /// answer also goes into "Things I got wrong".
    pub fn answer(&mut self, card_id: &str, correct: bool, mistake: Option<Piece>, now: i64) -> Result<Card, StoreError> {
        let idx = match self.data.cards.iter().position(|c| c.id == card_id) {
            Some(i) => i,
            None => {
                self.data.cards.push(Card::new(card_id, now));
                self.data.cards.len() - 1
            }
        };
        let card = &mut self.data.cards[idx];
        card.grade(if correct { Grade::Good } else { Grade::Again }, now);
        let card = card.clone();
        if let (false, Some(p)) = (correct, mistake) {
            if let Some(c) = self.data.collections.iter_mut().find(|c| c.id == "wrong") {
                c.pieces.push(p);
            }
        }
        self.save()?;
        Ok(card)
    }

    pub fn due(&self, now: i64) -> Vec<&Card> {
        let mut d: Vec<&Card> = self.data.cards.iter().filter(|c| c.is_due(now)).collect();
        d.sort_by_key(|c| c.due);
        d
    }

    pub fn grade(&mut self, card_id: &str, grade: Grade, now: i64) -> Result<Option<Card>, StoreError> {
        let Some(c) = self.data.cards.iter_mut().find(|c| c.id == card_id) else { return Ok(None) };
        c.grade(grade, now);
        let c = c.clone();
        self.save()?;
        Ok(Some(c))
    }

    pub fn lab_save(&mut self, lab: &str, state: serde_json::Value) -> Result<(), StoreError> {
        match self.data.labs.iter_mut().find(|l| l.lab == lab) {
            Some(l) => l.state = Some(state),
            None => self.data.labs.push(LabRecord { lab: lab.into(), passed: false, notes: String::new(), state: Some(state) }),
        }
        self.save()
    }

    pub fn lab_passed(&mut self, lab: &str, notes: &str) -> Result<(), StoreError> {
        match self.data.labs.iter_mut().find(|l| l.lab == lab) {
            Some(l) => {
                l.passed = true;
                l.notes = notes.into();
            }
            None => self.data.labs.push(LabRecord { lab: lab.into(), passed: true, notes: notes.into(), state: None }),
        }
        self.save()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn saves_and_reopens() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("octet.json");
        let mut s = Store::open(&path).unwrap();
        s.add_note("srwe/03/04", 0, "every frame", "The tag is the lane.", 10).unwrap();
        s.highlight(Highlight { page: "srwe/03/04".into(), block: 0, text: "every frame".into() }).unwrap();
        s.answer("srwe/03/04#3", false, Some(Piece { kind: PieceKind::Note, text: "I said untagged".into(), source: "VLAN trunks".into(), created: 10 }), 10).unwrap();
        s.set_ribbon("srwe/03/04", 2).unwrap();
        let again = Store::open(&path).unwrap();
        assert_eq!(again.data, s.data);
        assert_eq!(again.data.collections[1].pieces.len(), 1);
        assert_eq!(again.due(10 + 600).len(), 1, "a wrong answer comes back in ten minutes");
    }

    #[test]
    fn empty_note_is_removed() {
        let dir = tempfile::tempdir().unwrap();
        let mut s = Store::open(&dir.path().join("o.json")).unwrap();
        let n = s.add_note("p", 0, "", "x", 0).unwrap();
        s.edit_note(n.id, "  ").unwrap();
        assert!(s.data.notes.is_empty());
    }
}

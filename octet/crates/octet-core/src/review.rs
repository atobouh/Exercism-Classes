//! Spaced review. Every question you meet while reading becomes a card, and
//! comes back just before you would forget it.
//!
//! The schedule is SM-2 with a learning step: a card you get wrong comes back
//! in ten minutes, a new card you know comes back tomorrow, and from then on
//! each good answer stretches the gap by the card's ease.

use serde::{Deserialize, Serialize};

pub const MINUTE: i64 = 60;
pub const DAY: i64 = 86_400;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Grade {
    Again,
    Hard,
    Good,
    Easy,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Card {
    /// `page id#block index`, so a card always points back to where you met it.
    pub id: String,
    pub due: i64,
    /// Seconds until the next review after the last one.
    pub interval: i64,
    pub ease: f64,
    pub reps: u32,
    pub lapses: u32,
}

impl Card {
    pub fn new(id: &str, now: i64) -> Self {
        Self { id: id.to_string(), due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
    }

    pub fn is_due(&self, now: i64) -> bool {
        self.due <= now
    }

    /// What the card would look like after this grade, without changing it.
    pub fn preview(&self, grade: Grade) -> Card {
        let mut c = self.clone();
        c.grade(grade, 0);
        c
    }

    pub fn grade(&mut self, grade: Grade, now: i64) {
        let days = |s: i64| s as f64 / DAY as f64;
        let (interval, ease) = match grade {
            Grade::Again => {
                self.lapses += u32::from(self.reps > 0);
                self.reps = 0;
                (10 * MINUTE, (self.ease - 0.2).max(1.3))
            }
            Grade::Hard => {
                let next = if self.reps == 0 { DAY } else { (days(self.interval) * 1.2).max(1.0).round() as i64 * DAY };
                (next, (self.ease - 0.15).max(1.3))
            }
            Grade::Good => {
                let next = match self.reps {
                    0 => DAY,
                    1 => 6 * DAY,
                    _ => (days(self.interval) * self.ease).round().max(1.0) as i64 * DAY,
                };
                (next, self.ease)
            }
            Grade::Easy => {
                let next = match self.reps {
                    0 => 4 * DAY,
                    _ => (days(self.interval).max(1.0) * self.ease * 1.3).round() as i64 * DAY,
                };
                (next, self.ease + 0.15)
            }
        };
        if grade != Grade::Again {
            self.reps += 1;
        }
        self.interval = interval;
        self.ease = ease;
        self.due = now + interval;
    }
}

/// "In 10 minutes", "In 6 days", "In 3 months".
pub fn describe(seconds: i64) -> String {
    let plural = |n: i64, unit: &str| format!("In {n} {unit}{}", if n == 1 { "" } else { "s" });
    match seconds {
        s if s < DAY => plural((s / MINUTE).max(1), "minute"),
        s if s < 30 * DAY => plural(s / DAY, "day"),
        s if s < 365 * DAY => plural(s / (30 * DAY), "month"),
        s => plural(s / (365 * DAY), "year"),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_new_card_learns_then_stretches() {
        let mut c = Card::new("p#1", 0);
        assert_eq!(describe(c.preview(Grade::Again).interval), "In 10 minutes");
        assert_eq!(describe(c.preview(Grade::Good).interval), "In 1 day");
        assert_eq!(describe(c.preview(Grade::Easy).interval), "In 4 days");
        c.grade(Grade::Good, 0);
        c.grade(Grade::Good, c.due);
        assert_eq!(c.interval, 6 * DAY);
        c.grade(Grade::Good, c.due);
        assert_eq!(c.interval, 15 * DAY, "6 days times an ease of 2.5");
    }

    #[test]
    fn forgetting_resets_and_lowers_ease() {
        let mut c = Card::new("p#1", 0);
        c.grade(Grade::Good, 0);
        c.grade(Grade::Good, 0);
        c.grade(Grade::Again, 100);
        assert_eq!(c.reps, 0);
        assert_eq!(c.lapses, 1);
        assert_eq!(c.due, 100 + 10 * MINUTE);
        assert!(c.ease < 2.5);
    }
}

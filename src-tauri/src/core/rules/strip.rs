use crate::models::FileItem;

use super::RuleTrait;

pub struct StripRule<'a> {
    pub keep_chars: &'a str,
}

impl RuleTrait for StripRule<'_> {
    fn apply(&self, name: &str, _index: usize, _file: &FileItem) -> String {
        name.chars()
            .filter(|ch| ch.is_alphanumeric() || self.keep_chars.contains(*ch))
            .collect()
    }
}

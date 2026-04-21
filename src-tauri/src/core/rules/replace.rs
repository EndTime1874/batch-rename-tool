use regex::Regex;

use crate::models::FileItem;

use super::RuleTrait;

pub struct ReplaceRule<'a> {
    pub from: &'a str,
    pub to: &'a str,
    pub regex: bool,
}

impl RuleTrait for ReplaceRule<'_> {
    fn apply(&self, name: &str, _index: usize, _file: &FileItem) -> String {
        if self.from.is_empty() {
            return name.to_string();
        }

        if self.regex {
            match Regex::new(self.from) {
                Ok(pattern) => pattern.replace_all(name, self.to).to_string(),
                Err(_) => name.to_string(),
            }
        } else {
            name.replace(self.from, self.to)
        }
    }
}

use crate::models::FileItem;

use super::RuleTrait;

pub struct SuffixRule<'a> {
    pub text: &'a str,
}

impl RuleTrait for SuffixRule<'_> {
    fn apply(&self, name: &str, _index: usize, _file: &FileItem) -> String {
        format!("{}{}", name, self.text)
    }
}

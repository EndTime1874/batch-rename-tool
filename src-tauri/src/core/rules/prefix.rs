use crate::models::FileItem;

use super::RuleTrait;

pub struct PrefixRule<'a> {
    pub text: &'a str,
}

impl RuleTrait for PrefixRule<'_> {
    fn apply(&self, name: &str, _index: usize, _file: &FileItem) -> String {
        format!("{}{}", self.text, name)
    }
}

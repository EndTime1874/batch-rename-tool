use crate::models::FileItem;

use super::RuleTrait;

pub struct SequenceRule {
    pub start: u32,
    pub step: u32,
    pub digits: u8,
}

impl RuleTrait for SequenceRule {
    fn apply(&self, _name: &str, index: usize, _file: &FileItem) -> String {
        let value = self.start as u64 + index as u64 * self.step as u64;
        let width = self.digits as usize;

        if width == 0 {
            value.to_string()
        } else {
            format!("{value:0width$}")
        }
    }
}

use crate::models::{CaseMode, FileItem};

use super::RuleTrait;

pub struct CaseRule {
    pub mode: CaseMode,
}

impl RuleTrait for CaseRule {
    fn apply(&self, name: &str, _index: usize, _file: &FileItem) -> String {
        match &self.mode {
            CaseMode::Upper => name.to_uppercase(),
            CaseMode::Lower => name.to_lowercase(),
            CaseMode::Capitalize => capitalize(name),
        }
    }
}

fn capitalize(name: &str) -> String {
    let mut chars = name.chars();
    match chars.next() {
        Some(first) => {
            let mut result = first.to_uppercase().collect::<String>();
            result.push_str(&chars.as_str().to_lowercase());
            result
        }
        None => String::new(),
    }
}

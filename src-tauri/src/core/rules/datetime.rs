use chrono::DateTime;

use crate::models::{DateSource, FileItem};

use super::RuleTrait;

pub struct DateTimeRule<'a> {
    pub source: DateSource,
    pub format: &'a str,
}

impl RuleTrait for DateTimeRule<'_> {
    fn apply(&self, name: &str, _index: usize, file: &FileItem) -> String {
        let raw = match &self.source {
            DateSource::Created => &file.created,
            DateSource::Modified => &file.modified,
        };

        match DateTime::parse_from_rfc3339(raw) {
            Ok(datetime) => format!("{}{}", datetime.format(self.format), name),
            Err(_) => name.to_string(),
        }
    }
}

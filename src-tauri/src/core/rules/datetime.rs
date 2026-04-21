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
            Ok(datetime) => {
                let format = normalize_format(self.format);
                format!("{}{}", datetime.format(&format), name)
            }
            Err(_) => name.to_string(),
        }
    }
}

fn normalize_format(format: &str) -> String {
    format
        .replace("YYYY", "%Y")
        .replace("YY", "%y")
        .replace("MM", "%m")
        .replace("DD", "%d")
        .replace("HH", "%H")
        .replace("mm", "%M")
        .replace("ss", "%S")
}

#[cfg(test)]
mod tests {
    use crate::core::rules::RuleTrait;
    use crate::models::{DateSource, FileItem};

    use super::DateTimeRule;

    fn file() -> FileItem {
        FileItem {
            path: String::from("/tmp/report.txt"),
            name: String::from("report"),
            ext: String::from("txt"),
            size: 1,
            created: String::from("2024-01-02T03:04:05+00:00"),
            modified: String::from("2024-02-03T04:05:06+00:00"),
        }
    }

    #[test]
    fn datetime_rule_accepts_ui_date_format_tokens() {
        let rule = DateTimeRule {
            source: DateSource::Created,
            format: "YYYYMMDD_",
        };

        assert_eq!(rule.apply("report", 0, &file()), "20240102_report");
    }
}

use serde::{Deserialize, Serialize};

use super::FileItem;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RuleConfig {
    Prefix {
        text: String,
    },
    Suffix {
        text: String,
    },
    Strip {
        keep_chars: String,
    },
    Case {
        mode: CaseMode,
    },
    Replace {
        from: String,
        to: String,
        regex: bool,
    },
    Sequence {
        start: u32,
        step: u32,
        digits: u8,
        sort_by: SortBy,
    },
    DateTime {
        source: DateSource,
        format: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CaseMode {
    Upper,
    Lower,
    Capitalize,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SortBy {
    Name,
    Created,
    Modified,
    Size,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DateSource {
    Created,
    Modified,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PreviewItem {
    pub original: FileItem,
    pub new_name: String,
    pub conflict: bool,
    pub selected: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FailureItem {
    pub path: String,
    pub error: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LogEntry {
    pub timestamp: String,
    pub old_path: String,
    pub new_path: String,
    pub status: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ExecuteResult {
    pub success: u32,
    pub failed: u32,
    pub rolled_back: u32,
    pub failures: Vec<FailureItem>,
    pub entries: Vec<LogEntry>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct UndoResult {
    pub restored: u32,
    pub failed: u32,
}

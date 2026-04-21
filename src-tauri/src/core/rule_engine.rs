use crate::core::rules::case::CaseRule;
use crate::core::rules::datetime::DateTimeRule;
use crate::core::rules::prefix::PrefixRule;
use crate::core::rules::replace::ReplaceRule;
use crate::core::rules::sequence::SequenceRule;
use crate::core::rules::strip::StripRule;
use crate::core::rules::suffix::SuffixRule;
use crate::core::rules::RuleTrait;
use crate::models::{FileItem, RuleConfig, SortBy};

pub fn apply_rules(files: &[FileItem], rules: &[RuleConfig]) -> Vec<String> {
    let sequence_indexes = sequence_indexes(files, rules);

    files
        .iter()
        .enumerate()
        .map(|(file_index, file)| {
            let rule_index = sequence_indexes[file_index];
            rules.iter().fold(file.name.clone(), |name, rule| {
                apply_rule(rule, &name, rule_index, file)
            })
        })
        .collect()
}

fn apply_rule(rule: &RuleConfig, name: &str, index: usize, file: &FileItem) -> String {
    match rule {
        RuleConfig::Prefix { text } => PrefixRule { text }.apply(name, index, file),
        RuleConfig::Suffix { text } => SuffixRule { text }.apply(name, index, file),
        RuleConfig::Strip { keep_chars } => StripRule { keep_chars }.apply(name, index, file),
        RuleConfig::Case { mode } => CaseRule { mode: mode.clone() }.apply(name, index, file),
        RuleConfig::Replace { from, to, regex } => ReplaceRule {
            from,
            to,
            regex: *regex,
        }
        .apply(name, index, file),
        RuleConfig::Sequence {
            start,
            step,
            digits,
            sort_by: _,
        } => SequenceRule {
            start: *start,
            step: *step,
            digits: *digits,
        }
        .apply(name, index, file),
        RuleConfig::DateTime { source, format } => DateTimeRule {
            source: source.clone(),
            format,
        }
        .apply(name, index, file),
    }
}

fn sequence_indexes(files: &[FileItem], rules: &[RuleConfig]) -> Vec<usize> {
    let mut order: Vec<usize> = (0..files.len()).collect();

    if let Some(sort_by) = rules.iter().find_map(|rule| match rule {
        RuleConfig::Sequence { sort_by, .. } => Some(sort_by),
        _ => None,
    }) {
        order.sort_by(|left, right| compare_files(&files[*left], &files[*right], sort_by));
    }

    let mut indexes = vec![0; files.len()];
    for (sorted_index, original_index) in order.into_iter().enumerate() {
        indexes[original_index] = sorted_index;
    }
    indexes
}

fn compare_files(left: &FileItem, right: &FileItem, sort_by: &SortBy) -> std::cmp::Ordering {
    match sort_by {
        SortBy::Name => left
            .name
            .to_lowercase()
            .cmp(&right.name.to_lowercase())
            .then_with(|| left.path.cmp(&right.path)),
        SortBy::Created => left.created.cmp(&right.created),
        SortBy::Modified => left.modified.cmp(&right.modified),
        SortBy::Size => left
            .size
            .cmp(&right.size)
            .then_with(|| left.path.cmp(&right.path)),
    }
}

#[cfg(test)]
mod tests {
    use crate::models::{CaseMode, DateSource, FileItem, RuleConfig, SortBy};

    use super::apply_rules;

    fn file(name: &str, size: u64) -> FileItem {
        FileItem {
            path: format!("/tmp/{name}.txt"),
            name: name.to_string(),
            ext: String::from("txt"),
            size,
            created: String::from("2024-01-02T03:04:05+00:00"),
            modified: String::from("2024-02-03T04:05:06+00:00"),
        }
    }

    #[test]
    fn rule_engine_applies_prefix_suffix_and_replace() {
        let files = vec![file("报告-01", 10)];
        let rules = vec![
            RuleConfig::Prefix {
                text: String::from("pre_"),
            },
            RuleConfig::Replace {
                from: String::from("报告"),
                to: String::from("文档"),
                regex: false,
            },
            RuleConfig::Suffix {
                text: String::from("_done"),
            },
        ];

        assert_eq!(apply_rules(&files, &rules), vec!["pre_文档-01_done"]);
    }

    #[test]
    fn rule_engine_supports_strip_and_case_rules() {
        let files = vec![file("a-中_1!", 10)];

        assert_eq!(
            apply_rules(
                &files,
                &[RuleConfig::Strip {
                    keep_chars: String::from("_")
                }]
            ),
            vec!["a中_1"]
        );
        assert_eq!(
            apply_rules(
                &files,
                &[RuleConfig::Case {
                    mode: CaseMode::Upper
                }]
            ),
            vec!["A-中_1!"]
        );
        assert_eq!(
            apply_rules(
                &files,
                &[RuleConfig::Case {
                    mode: CaseMode::Capitalize
                }]
            ),
            vec!["A-中_1!"]
        );
    }

    #[test]
    fn rule_engine_supports_regex_replace_for_chinese_text() {
        let files = vec![file("图片123中文", 10)];
        let rules = vec![RuleConfig::Replace {
            from: String::from(r"\d+中文"),
            to: String::from("完成"),
            regex: true,
        }];

        assert_eq!(apply_rules(&files, &rules), vec!["图片完成"]);
    }

    #[test]
    fn rule_engine_sequences_by_requested_sort_but_keeps_input_alignment() {
        let files = vec![file("b", 20), file("a", 10), file("c", 30)];
        let rules = vec![RuleConfig::Sequence {
            start: 1,
            step: 2,
            digits: 3,
            sort_by: SortBy::Name,
        }];

        assert_eq!(apply_rules(&files, &rules), vec!["003", "001", "005"]);
    }

    #[test]
    fn rule_engine_supports_datetime_prefix() {
        let files = vec![file("invoice", 10)];
        let rules = vec![RuleConfig::DateTime {
            source: DateSource::Created,
            format: String::from("%Y%m%d_"),
        }];

        assert_eq!(apply_rules(&files, &rules), vec!["20240102_invoice"]);
    }
}

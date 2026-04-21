use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::models::{ExecuteResult, FailureItem, LogEntry, PreviewItem, UndoResult};

pub fn execute_renames(items: &[PreviewItem]) -> ExecuteResult {
    let timestamp = Utc::now().to_rfc3339();
    let mut result = ExecuteResult {
        success: 0,
        failed: 0,
        rolled_back: 0,
        failures: Vec::new(),
        entries: Vec::new(),
    };
    let mut completed: Vec<(PathBuf, PathBuf)> = Vec::new();

    for item in items.iter().filter(|item| item.selected) {
        let old_path = PathBuf::from(&item.original.path);
        let new_path = target_path(item);

        if item.conflict {
            record_failure(
                &mut result,
                &timestamp,
                &old_path,
                &new_path,
                "存在文件名冲突",
            );
            rollback_completed(&mut result, &timestamp, &completed);
            return result;
        }

        if same_path(&old_path, &new_path) {
            result.success += 1;
            result.entries.push(LogEntry {
                timestamp: timestamp.clone(),
                old_path: old_path.to_string_lossy().to_string(),
                new_path: new_path.to_string_lossy().to_string(),
                status: String::from("success"),
            });
            completed.push((old_path, new_path));
            continue;
        }

        match fs::rename(&old_path, &new_path) {
            Ok(_) => {
                result.success += 1;
                result.entries.push(LogEntry {
                    timestamp: timestamp.clone(),
                    old_path: old_path.to_string_lossy().to_string(),
                    new_path: new_path.to_string_lossy().to_string(),
                    status: String::from("success"),
                });
                completed.push((old_path, new_path));
            }
            Err(err) => {
                record_failure(
                    &mut result,
                    &timestamp,
                    &old_path,
                    &new_path,
                    &format!("重命名失败：{err}"),
                );
                rollback_completed(&mut result, &timestamp, &completed);
                return result;
            }
        }
    }

    result
}

pub fn undo_renames(log_entries: &[LogEntry]) -> UndoResult {
    let mut result = UndoResult {
        restored: 0,
        failed: 0,
    };

    for entry in log_entries
        .iter()
        .rev()
        .filter(|entry| entry.status == "success")
    {
        let old_path = PathBuf::from(&entry.old_path);
        let new_path = PathBuf::from(&entry.new_path);

        if same_path(&old_path, &new_path) {
            result.restored += 1;
            continue;
        }

        match fs::rename(&new_path, &old_path) {
            Ok(_) => result.restored += 1,
            Err(_) => result.failed += 1,
        }
    }

    result
}

fn target_path(item: &PreviewItem) -> PathBuf {
    let old_path = PathBuf::from(&item.original.path);
    old_path
        .parent()
        .map(|parent| parent.join(&item.new_name))
        .unwrap_or_else(|| PathBuf::from(&item.new_name))
}

fn record_failure(
    result: &mut ExecuteResult,
    timestamp: &str,
    old_path: &Path,
    new_path: &Path,
    error: &str,
) {
    result.failed += 1;
    result.failures.push(FailureItem {
        path: old_path.to_string_lossy().to_string(),
        error: error.to_string(),
    });
    result.entries.push(LogEntry {
        timestamp: timestamp.to_string(),
        old_path: old_path.to_string_lossy().to_string(),
        new_path: new_path.to_string_lossy().to_string(),
        status: String::from("failed"),
    });
}

fn rollback_completed(
    result: &mut ExecuteResult,
    timestamp: &str,
    completed: &[(PathBuf, PathBuf)],
) {
    for (old_path, new_path) in completed.iter().rev() {
        if same_path(old_path, new_path) {
            result.rolled_back += 1;
            result.entries.push(LogEntry {
                timestamp: timestamp.to_string(),
                old_path: old_path.to_string_lossy().to_string(),
                new_path: new_path.to_string_lossy().to_string(),
                status: String::from("rolled_back"),
            });
            continue;
        }

        match fs::rename(new_path, old_path) {
            Ok(_) => {
                result.rolled_back += 1;
                result.entries.push(LogEntry {
                    timestamp: timestamp.to_string(),
                    old_path: old_path.to_string_lossy().to_string(),
                    new_path: new_path.to_string_lossy().to_string(),
                    status: String::from("rolled_back"),
                });
            }
            Err(err) => {
                result.failed += 1;
                result.failures.push(FailureItem {
                    path: new_path.to_string_lossy().to_string(),
                    error: format!("回滚失败：{err}"),
                });
                result.entries.push(LogEntry {
                    timestamp: timestamp.to_string(),
                    old_path: old_path.to_string_lossy().to_string(),
                    new_path: new_path.to_string_lossy().to_string(),
                    status: String::from("failed"),
                });
            }
        }
    }
}

fn same_path(left: &Path, right: &Path) -> bool {
    left == right || left.to_string_lossy().to_lowercase() == right.to_string_lossy().to_lowercase()
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::models::{FileItem, LogEntry, PreviewItem};

    use super::{execute_renames, undo_renames};

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_renamer_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    fn item(dir: &Path, old_name: &str, new_name: &str) -> PreviewItem {
        PreviewItem {
            original: FileItem {
                path: dir.join(old_name).to_string_lossy().to_string(),
                name: old_name.trim_end_matches(".txt").to_string(),
                ext: String::from("txt"),
                size: 1,
                created: String::from("2024-01-01T00:00:00+00:00"),
                modified: String::from("2024-01-01T00:00:00+00:00"),
            },
            new_name: new_name.to_string(),
            conflict: false,
            selected: true,
        }
    }

    #[test]
    fn renamer_executes_successful_renames() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("success")?;
        fs::write(dir.join("a.txt"), "a")?;

        let result = execute_renames(&[item(&dir, "a.txt", "renamed.txt")]);

        assert_eq!(result.success, 1);
        assert_eq!(result.failed, 0);
        assert!(dir.join("renamed.txt").exists());
        assert!(!dir.join("a.txt").exists());

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn renamer_rolls_back_when_later_rename_fails() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("rollback")?;
        fs::write(dir.join("a.txt"), "a")?;

        let items = vec![
            item(&dir, "a.txt", "renamed.txt"),
            item(&dir, "missing.txt", "missing-renamed.txt"),
        ];
        let result = execute_renames(&items);

        assert_eq!(result.success, 1);
        assert_eq!(result.failed, 1);
        assert_eq!(result.rolled_back, 1);
        assert!(dir.join("a.txt").exists());
        assert!(!dir.join("renamed.txt").exists());

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn renamer_undo_restores_success_entries() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("undo")?;
        let old_path = dir.join("a.txt");
        let new_path = dir.join("renamed.txt");
        fs::write(&new_path, "a")?;

        let result = undo_renames(&[LogEntry {
            timestamp: String::from("2024-01-01T00:00:00Z"),
            old_path: old_path.to_string_lossy().to_string(),
            new_path: new_path.to_string_lossy().to_string(),
            status: String::from("success"),
        }]);

        assert_eq!(result.restored, 1);
        assert_eq!(result.failed, 0);
        assert!(old_path.exists());
        assert!(!new_path.exists());

        fs::remove_dir_all(dir)?;
        Ok(())
    }
}

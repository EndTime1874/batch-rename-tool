use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use chrono::Local;

use crate::models::{ExecuteResult, LogEntry, PreviewItem};

pub fn write_csv_backup(items: &[PreviewItem], backup_dir: &Path) -> Result<PathBuf, String> {
    fs::create_dir_all(backup_dir).map_err(|err| format!("创建备份目录失败：{err}"))?;

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let operation_time = Local::now().to_rfc3339();
    let backup_path = backup_dir.join(format!("backup_{timestamp}.csv"));
    let mut writer =
        csv::Writer::from_path(&backup_path).map_err(|err| format!("创建备份 CSV 失败：{err}"))?;

    writer
        .write_record(["original_path", "new_name", "operation_time"])
        .map_err(|err| format!("写入备份 CSV 表头失败：{err}"))?;

    for item in items.iter().filter(|item| item.selected) {
        writer
            .write_record([
                item.original.path.as_str(),
                item.new_name.as_str(),
                operation_time.as_str(),
            ])
            .map_err(|err| format!("写入备份 CSV 失败：{err}"))?;
    }

    writer
        .flush()
        .map_err(|err| format!("保存备份 CSV 失败：{err}"))?;
    Ok(backup_path)
}

pub fn append_rename_log(result: &ExecuteResult, log_path: &Path) -> Result<(), String> {
    if let Some(parent) = log_path.parent() {
        fs::create_dir_all(parent).map_err(|err| format!("创建日志目录失败：{err}"))?;
    }

    if result.entries.is_empty() {
        return Ok(());
    }

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .map_err(|err| format!("打开重命名日志失败：{err}"))?;

    for entry in &result.entries {
        writeln!(
            file,
            "{} | {} | {} | {}",
            entry.timestamp, entry.old_path, entry.new_path, entry.status
        )
        .map_err(|err| format!("写入重命名日志失败：{err}"))?;
    }

    writeln!(file).map_err(|err| format!("写入重命名日志失败：{err}"))?;
    Ok(())
}

pub fn read_last_operation(log_path: &Path) -> Result<Vec<LogEntry>, String> {
    let content =
        fs::read_to_string(log_path).map_err(|err| format!("读取重命名日志失败：{err}"))?;
    let blocks = split_log_blocks(&content);

    match blocks.last() {
        Some(block) => parse_log_block(block),
        None => Ok(Vec::new()),
    }
}

fn split_log_blocks(content: &str) -> Vec<Vec<String>> {
    let mut blocks = Vec::new();
    let mut current = Vec::new();

    for line in content.lines() {
        if line.trim().is_empty() {
            if !current.is_empty() {
                blocks.push(current);
                current = Vec::new();
            }
        } else {
            current.push(line.to_string());
        }
    }

    if !current.is_empty() {
        blocks.push(current);
    }

    blocks
}

fn parse_log_block(lines: &[String]) -> Result<Vec<LogEntry>, String> {
    let mut entries = Vec::new();

    for line in lines {
        let parts: Vec<&str> = line.splitn(4, " | ").collect();
        if parts.len() != 4 {
            return Err(format!("日志格式错误：{line}"));
        }

        entries.push(LogEntry {
            timestamp: parts[0].to_string(),
            old_path: parts[1].to_string(),
            new_path: parts[2].to_string(),
            status: parts[3].to_string(),
        });
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::models::{ExecuteResult, FileItem, LogEntry, PreviewItem};

    use super::{append_rename_log, read_last_operation, write_csv_backup};

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_backup_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    fn item(dir: &Path) -> PreviewItem {
        PreviewItem {
            original: FileItem {
                path: dir.join("a.txt").to_string_lossy().to_string(),
                name: String::from("a"),
                ext: String::from("txt"),
                size: 1,
                created: String::from("2024-01-01T00:00:00+00:00"),
                modified: String::from("2024-01-01T00:00:00+00:00"),
            },
            new_name: String::from("renamed.txt"),
            conflict: false,
            selected: true,
        }
    }

    fn result(entry_name: &str) -> ExecuteResult {
        ExecuteResult {
            success: 1,
            failed: 0,
            rolled_back: 0,
            failures: Vec::new(),
            entries: vec![LogEntry {
                timestamp: String::from("2024-01-01T00:00:00Z"),
                old_path: format!("/tmp/{entry_name}.txt"),
                new_path: format!("/tmp/{entry_name}_new.txt"),
                status: String::from("success"),
            }],
        }
    }

    #[test]
    fn backup_writes_selected_items_to_csv() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("csv")?;
        let backup_path = write_csv_backup(&[item(&dir)], &dir)?;
        let content = fs::read_to_string(&backup_path)?;

        assert!(backup_path.exists());
        assert!(content.contains("original_path,new_name,operation_time"));
        assert!(content.contains("renamed.txt"));

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn backup_appends_log_and_reads_last_operation() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("log")?;
        let log_path = dir.join("rename.log");

        append_rename_log(&result("first"), &log_path)?;
        append_rename_log(&result("second"), &log_path)?;

        let entries = read_last_operation(&log_path)?;

        assert_eq!(entries.len(), 1);
        assert_eq!(entries[0].old_path, "/tmp/second.txt");
        assert_eq!(entries[0].status, "success");

        fs::remove_dir_all(dir)?;
        Ok(())
    }
}

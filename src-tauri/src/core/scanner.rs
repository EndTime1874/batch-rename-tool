use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

use chrono::{DateTime, Utc};
use tokio::fs;

use crate::models::FileItem;

pub async fn scan_folder(
    path: &str,
    recursive: bool,
    extensions: &[String],
) -> Result<Vec<FileItem>, String> {
    let root = PathBuf::from(path);

    if !root.exists() {
        return Err(format!("路径不存在：{path}"));
    }

    if !root.is_dir() {
        return Err(format!("路径不是文件夹：{path}"));
    }

    let extension_set = normalize_extensions(extensions);
    let mut files = Vec::new();
    let mut pending_dirs = vec![root];

    while let Some(dir) = pending_dirs.pop() {
        let mut entries = match fs::read_dir(&dir).await {
            Ok(entries) => entries,
            Err(_) => continue,
        };

        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|err| format!("读取目录失败：{}，{}", dir.display(), err))?
        {
            let path = entry.path();
            let metadata = match entry.metadata().await {
                Ok(metadata) => metadata,
                Err(_) => continue,
            };

            if metadata.is_dir() {
                if recursive {
                    pending_dirs.push(path);
                }
                continue;
            }

            if !metadata.is_file() || !extension_allowed(&path, &extension_set) {
                continue;
            }

            if let Some(item) = build_file_item(
                &path,
                metadata.len(),
                metadata.created(),
                metadata.modified(),
            ) {
                files.push(item);
            }
        }
    }

    files.sort_by(|left, right| left.path.cmp(&right.path));
    Ok(files)
}

fn normalize_extensions(extensions: &[String]) -> HashSet<String> {
    extensions
        .iter()
        .map(|ext| ext.trim().trim_start_matches('.').to_lowercase())
        .filter(|ext| !ext.is_empty())
        .collect()
}

fn extension_allowed(path: &Path, extensions: &HashSet<String>) -> bool {
    if extensions.is_empty() {
        return true;
    }

    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| extensions.contains(&ext.to_lowercase()))
        .unwrap_or(false)
}

fn build_file_item(
    path: &Path,
    size: u64,
    created: Result<SystemTime, std::io::Error>,
    modified: Result<SystemTime, std::io::Error>,
) -> Option<FileItem> {
    let name = path.file_stem()?.to_string_lossy().to_string();
    let ext = path
        .extension()
        .map(|ext| ext.to_string_lossy().to_string())
        .unwrap_or_default();

    Some(FileItem {
        path: path.to_string_lossy().to_string(),
        name,
        ext,
        size,
        created: system_time_to_rfc3339(created.ok()),
        modified: system_time_to_rfc3339(modified.ok()),
    })
}

fn system_time_to_rfc3339(time: Option<SystemTime>) -> String {
    let datetime: DateTime<Utc> = time.unwrap_or_else(SystemTime::now).into();
    datetime.to_rfc3339()
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::scan_folder;

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_scanner_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    #[tokio::test]
    async fn scanner_filters_extensions_without_recursion() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("flat")?;
        fs::write(dir.join("a.txt"), "a")?;
        fs::write(dir.join("b.JPG"), "b")?;
        fs::create_dir_all(dir.join("nested"))?;
        fs::write(dir.join("nested").join("c.txt"), "c")?;

        let files = scan_folder(
            dir.to_str().ok_or("invalid temp path")?,
            false,
            &[String::from("txt")],
        )
        .await?;

        assert_eq!(files.len(), 1);
        assert_eq!(files[0].name, "a");
        assert_eq!(files[0].ext, "txt");

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[tokio::test]
    async fn scanner_recurses_and_matches_extensions_case_insensitively(
    ) -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("recursive")?;
        fs::write(dir.join("a.txt"), "a")?;
        fs::write(dir.join("b.JPG"), "b")?;
        fs::create_dir_all(dir.join("nested"))?;
        fs::write(dir.join("nested").join("c.TxT"), "c")?;

        let files = scan_folder(
            dir.to_str().ok_or("invalid temp path")?,
            true,
            &[String::from(".TXT")],
        )
        .await?;

        let names: Vec<_> = files.iter().map(|file| file.name.as_str()).collect();
        assert_eq!(names, vec!["a", "c"]);

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[tokio::test]
    async fn scanner_returns_friendly_error_for_missing_path() {
        let result = scan_folder("/path/that/does/not/exist", false, &[]).await;
        assert!(result.is_err());
        assert!(result.err().unwrap_or_default().contains("路径不存在"));
    }
}

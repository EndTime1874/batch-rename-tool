use std::path::PathBuf;

use crate::core::scanner;
use crate::models::FileItem;

#[tauri::command]
pub async fn scan_folder(
    path: String,
    recursive: bool,
    extensions: Vec<String>,
) -> Result<Vec<FileItem>, String> {
    scanner::scan_folder(&path, recursive, &extensions).await
}

#[tauri::command]
pub fn validate_folder(path: String) -> Result<(), String> {
    let trimmed = path.trim();

    if trimmed.is_empty() {
        return Err("路径不能为空".to_string());
    }

    let folder = PathBuf::from(trimmed);

    if !folder.exists() {
        return Err(format!("路径不存在：{trimmed}"));
    }

    if !folder.is_dir() {
        return Err(format!("路径不是文件夹：{trimmed}"));
    }

    std::fs::read_dir(&folder).map_err(|err| format!("无法读取文件夹：{trimmed}，{err}"))?;

    Ok(())
}

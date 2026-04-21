use std::path::PathBuf;

use tauri::{AppHandle, Manager};

pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| format!("获取应用数据目录失败：{err}"))?;
    std::fs::create_dir_all(&dir).map_err(|err| format!("创建应用数据目录失败：{err}"))?;
    Ok(dir)
}

pub fn backup_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("backups"))
}

pub fn rename_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("rename.log"))
}

pub fn templates_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(data_dir(app)?.join("templates.json"))
}

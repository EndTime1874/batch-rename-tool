use std::path::PathBuf;

use tauri::{AppHandle, Manager};

/// 检测是否为便携版：EXE 同级目录存在 `portable.flag` 文件即视为便携版
pub fn is_portable() -> bool {
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            return dir.join("portable.flag").exists();
        }
    }
    false
}

/// 获取应用数据根目录
/// - 便携版：EXE 同级的 config/ 文件夹
/// - 安装版：系统标准目录（Windows: AppData\Roaming\BatchRename\）
pub fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    if is_portable() {
        // 便携版：数据跟着 EXE 走
        let exe = std::env::current_exe().map_err(|err| format!("无法获取 EXE 路径：{err}"))?;
        let dir = exe.parent().ok_or("无法获取 EXE 所在目录")?.join("config");
        std::fs::create_dir_all(&dir).map_err(|err| format!("创建便携版数据目录失败：{err}"))?;
        Ok(dir)
    } else {
        // 安装版：Tauri 标准数据目录
        let dir = app
            .path()
            .app_data_dir()
            .map_err(|err| format!("获取应用数据目录失败：{err}"))?;
        std::fs::create_dir_all(&dir).map_err(|err| format!("创建应用数据目录失败：{err}"))?;
        Ok(dir)
    }
}

/// 向后兼容的别名函数
pub fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    get_app_data_dir(app)
}

pub fn backup_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("backups"))
}

pub fn rename_log_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("rename.log"))
}

pub fn templates_path(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("templates.json"))
}

/// 启动时确保所有必要目录存在
pub fn ensure_app_dirs(app: &AppHandle) -> Result<(), String> {
    let base = get_app_data_dir(app)?;
    for dir in [base.join("backups"), base.join("logs")] {
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("创建目录失败 {}: {}", dir.display(), e))?;
    }
    Ok(())
}

use tauri::AppHandle;

use crate::core::{backup, conflict, renamer, rule_engine, scanner};
use crate::models::{ExecuteResult, PreviewItem, RuleConfig, UndoResult};
use crate::utils::path_util;

#[tauri::command]
pub async fn preview_rename(
    path: String,
    recursive: bool,
    extensions: Vec<String>,
    rules: Vec<RuleConfig>,
) -> Result<Vec<PreviewItem>, String> {
    let files = scanner::scan_folder(&path, recursive, &extensions).await?;
    let new_names = rule_engine::apply_rules(&files, &rules);

    Ok(conflict::detect_conflicts(&files, &new_names))
}

#[tauri::command]
pub fn execute_rename(app: AppHandle, items: Vec<PreviewItem>) -> Result<ExecuteResult, String> {
    let backup_dir = path_util::backup_dir(&app)?;
    let log_path = path_util::rename_log_path(&app)?;

    backup::write_csv_backup(&items, &backup_dir)?;
    let result = renamer::execute_renames(&items);
    backup::append_rename_log(&result, &log_path)?;

    Ok(result)
}

#[tauri::command]
pub fn undo_last(app: AppHandle) -> Result<UndoResult, String> {
    let log_path = path_util::rename_log_path(&app)?;
    if !log_path.exists() {
        return Ok(UndoResult {
            restored: 0,
            failed: 0,
        });
    }

    let entries = backup::read_last_operation(&log_path)?;
    Ok(renamer::undo_renames(&entries))
}

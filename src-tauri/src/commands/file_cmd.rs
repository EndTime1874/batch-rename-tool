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

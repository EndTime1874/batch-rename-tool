/// 返回当前运行模式，供前端展示
#[tauri::command]
pub fn get_app_mode() -> String {
    if crate::utils::path_util::is_portable() {
        "portable".to_string()
    } else {
        "installed".to_string()
    }
}

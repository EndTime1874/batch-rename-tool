pub mod commands;
pub mod core;
pub mod models;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::file_cmd::scan_folder,
            commands::rename_cmd::preview_rename,
            commands::rename_cmd::execute_rename,
            commands::rename_cmd::undo_last,
            commands::template_cmd::save_template,
            commands::template_cmd::list_templates,
            commands::template_cmd::load_template,
            commands::template_cmd::delete_template,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

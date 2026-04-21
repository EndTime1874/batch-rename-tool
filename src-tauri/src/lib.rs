pub mod commands;
pub mod core;
pub mod models;
pub mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 启动时确保所有必要目录存在
            if let Err(err) = utils::path_util::ensure_app_dirs(&app.handle()) {
                eprintln!("初始化应用目录失败：{err}");
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_cmd::scan_folder,
            commands::file_cmd::validate_folder,
            commands::rename_cmd::preview_rename,
            commands::rename_cmd::execute_rename,
            commands::rename_cmd::undo_last,
            commands::template_cmd::save_template,
            commands::template_cmd::list_templates,
            commands::template_cmd::load_template,
            commands::template_cmd::delete_template,
            commands::config_cmd::get_app_mode,
        ]);

    if let Err(err) = builder.run(tauri::generate_context!()) {
        eprintln!("error while running tauri application: {err}");
    }
}

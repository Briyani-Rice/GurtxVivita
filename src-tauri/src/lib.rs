use std::fs;
use tauri::{AppHandle, Manager};
use tauri_plugin_fs::FsExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_md_files(app: AppHandle) -> Result<Vec<String>, String> {
    let resource_path = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("src/components/Docs/Resources/MDFiles");

    let entries = fs::read_dir(resource_path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file()
            && path.extension().and_then(|s| s.to_str()) == Some("md")
        {
            files.push(path.to_string_lossy().to_string());
        }
    }

    Ok(files)
}

#[tauri::command]
fn load_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let fs_scope = app.try_fs_scope().expect("fs_scope not available");

            fs_scope
                .allow_directory("/path/to/directory", true)
                .expect("Failed to allow directory");

            // #[cfg(debug_assertions)] // Best practice: limit to debug builds
            // {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            // }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_md_files,
            load_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
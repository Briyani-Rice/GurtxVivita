use std::fs;
use std::path::{Component, Path, PathBuf};
use tauri::{AppHandle, Manager};
use tauri_plugin_fs::FsExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn get_md_files(app: AppHandle) -> Result<Vec<String>, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?;
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let resource_path = docs_dir_candidates(&resource_dir, &manifest_dir)
        .into_iter()
        .find(|path| path.is_dir())
        .ok_or_else(|| "Documentation directory was not found".to_string())?;

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

fn docs_dir_candidates(resource_dir: &Path, manifest_dir: &Path) -> Vec<PathBuf> {
    [
        resource_dir.join("src/components/Docs/Resources/MDFiles"),
        manifest_dir.join("../src/components/Docs/Resources/MDFiles"),
        manifest_dir.join("src/components/Docs/Resources/MDFiles"),
    ]
    .into_iter()
    .map(normalize_path)
    .collect()
}

fn normalize_path(path: PathBuf) -> PathBuf {
    let mut normalized = PathBuf::new();

    for component in path.components() {
        match component {
            Component::ParentDir => {
                normalized.pop();
            }
            Component::CurDir => {}
            other => normalized.push(other.as_os_str()),
        }
    }

    normalized
}

#[tauri::command]
fn load_file_content(file_path: String) -> Result<String, String> {
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_oauth::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let fs_scope = app.try_fs_scope().expect("fs_scope not available");

            fs_scope
                .allow_directory("/path/to/directory", true)
                .expect("Failed to allow directory");

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn docs_dir_candidates_include_repo_docs_for_dev() {
        let resource_dir = PathBuf::from("/tmp/gurtxvivita/resources");
        let manifest_dir = PathBuf::from("/workspace/GurtxVivita/src-tauri");

        let candidates = docs_dir_candidates(&resource_dir, &manifest_dir);

        assert!(candidates.contains(
            &PathBuf::from("/workspace/GurtxVivita/src/components/Docs/Resources/MDFiles")
        ));
    }
}

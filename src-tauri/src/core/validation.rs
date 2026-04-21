use std::env;
use std::path::{Path, PathBuf};

use crate::models::PreviewItem;

const WINDOWS_MAX_PATH: usize = 260;
const MACOS_MAX_PATH: usize = 1024;

pub fn apply_preview_warnings(items: &mut [PreviewItem]) {
    for item in items {
        let old_path = PathBuf::from(&item.original.path);
        let Some(parent) = old_path.parent() else {
            continue;
        };

        let warnings = preview_warnings(&item.new_name, parent);

        if !warnings.is_empty() {
            item.warning = Some(warnings.join("；"));
            item.selected = false;
        }
    }
}

pub fn execution_error(item: &PreviewItem) -> Option<String> {
    let old_path = PathBuf::from(&item.original.path);
    let parent = old_path.parent()?;
    let warnings = preview_warnings(&item.new_name, parent);

    if warnings.is_empty() {
        None
    } else {
        Some(warnings.join("；"))
    }
}

pub fn path_for_rename(path: &Path) -> PathBuf {
    windows_long_path(path)
}

fn preview_warnings(new_name: &str, parent: &Path) -> Vec<String> {
    let mut warnings = Vec::new();

    if let Some(message) = illegal_name_warning(new_name) {
        warnings.push(message);
    }

    if let Some(message) = path_length_warning(&parent.join(new_name)) {
        warnings.push(message);
    }

    warnings
}

fn illegal_name_warning(name: &str) -> Option<String> {
    if name.trim().is_empty() {
        return Some(String::from("文件名不能为空"));
    }

    if name.contains('\0') {
        return Some(String::from("文件名包含非法空字符"));
    }

    let invalid_chars = invalid_chars_for_current_os();
    let used_chars: Vec<char> = invalid_chars
        .iter()
        .copied()
        .filter(|character| name.contains(*character))
        .collect();

    if used_chars.is_empty() {
        return None;
    }

    Some(format!(
        "文件名包含当前平台非法字符：{}",
        used_chars
            .iter()
            .map(char::to_string)
            .collect::<Vec<_>>()
            .join(" ")
    ))
}

fn invalid_chars_for_current_os() -> &'static [char] {
    match env::consts::OS {
        "windows" => &['\\', '/', ':', '*', '?', '"', '<', '>', '|'],
        "macos" => &['/', ':'],
        _ => &['/'],
    }
}

fn path_length_warning(path: &Path) -> Option<String> {
    let path_len = path.to_string_lossy().chars().count();

    match env::consts::OS {
        "windows" if path_len > WINDOWS_MAX_PATH => Some(format!(
            "Windows 路径长度超过 {WINDOWS_MAX_PATH} 字符，执行时将尝试使用长路径前缀"
        )),
        "macos" if path_len > MACOS_MAX_PATH => {
            Some(format!("macOS 路径长度超过 {MACOS_MAX_PATH} 字符"))
        }
        _ => None,
    }
}

#[cfg(windows)]
fn windows_long_path(path: &Path) -> PathBuf {
    let path_text = path.to_string_lossy();

    if path_text.starts_with(r"\\?\") || path_text.chars().count() <= WINDOWS_MAX_PATH {
        return path.to_path_buf();
    }

    if path_text.starts_with(r"\\") {
        return PathBuf::from(format!(r"\\?\UNC\{}", path_text.trim_start_matches(r"\\")));
    }

    if path.is_absolute() {
        PathBuf::from(format!(r"\\?\{}", path_text))
    } else {
        path.to_path_buf()
    }
}

#[cfg(not(windows))]
fn windows_long_path(path: &Path) -> PathBuf {
    path.to_path_buf()
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::models::{FileItem, PreviewItem};

    use super::apply_preview_warnings;

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_validation_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    fn item(dir: &Path, new_name: &str) -> PreviewItem {
        PreviewItem {
            original: FileItem {
                path: dir.join("a.txt").to_string_lossy().to_string(),
                name: String::from("a"),
                ext: String::from("txt"),
                size: 1,
                created: String::from("2024-01-01T00:00:00+00:00"),
                modified: String::from("2024-01-01T00:00:00+00:00"),
            },
            new_name: new_name.to_string(),
            conflict: false,
            warning: None,
            selected: true,
        }
    }

    #[test]
    fn preview_warnings_disable_illegal_names() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("illegal_name")?;
        let mut items = vec![item(&dir, "bad/name.txt")];

        apply_preview_warnings(&mut items);

        assert!(items[0].warning.is_some());
        assert!(!items[0].selected);

        fs::remove_dir_all(dir)?;
        Ok(())
    }
}

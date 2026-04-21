use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};

use crate::models::{FileItem, PreviewItem};

pub fn detect_conflicts(originals: &[FileItem], new_names: &[String]) -> Vec<PreviewItem> {
    let candidate_names: Vec<String> = originals
        .iter()
        .zip(new_names.iter())
        .map(|(file, new_name)| with_original_extension(new_name, &file.ext))
        .collect();

    let mut name_counts: HashMap<String, usize> = HashMap::new();
    for name in &candidate_names {
        *name_counts.entry(normalize_key(name)).or_insert(0) += 1;
    }

    originals
        .iter()
        .zip(candidate_names.iter())
        .map(|(file, new_name)| {
            let duplicate = name_counts
                .get(&normalize_key(new_name))
                .map(|count| *count > 1)
                .unwrap_or(false);
            let disk_conflict = target_exists_for_other_file(file, new_name);

            PreviewItem {
                original: file.clone(),
                new_name: new_name.clone(),
                conflict: duplicate || disk_conflict,
                selected: true,
            }
        })
        .collect()
}

pub fn resolve_conflicts(items: &mut Vec<PreviewItem>) {
    let mut used_names = HashSet::new();

    for item in items.iter_mut() {
        let mut candidate = item.new_name.clone();

        if used_names.contains(&normalize_key(&candidate))
            || target_exists_for_other_file(&item.original, &candidate)
        {
            candidate = next_available_name(&item.original, &item.new_name, &used_names);
        }

        used_names.insert(normalize_key(&candidate));
        item.new_name = candidate;
        item.conflict = false;
    }
}

fn with_original_extension(name: &str, ext: &str) -> String {
    if ext.is_empty() || has_extension(name) {
        name.to_string()
    } else {
        format!("{name}.{ext}")
    }
}

fn has_extension(name: &str) -> bool {
    Path::new(name).extension().is_some()
}

fn next_available_name(
    original: &FileItem,
    requested_name: &str,
    used_names: &HashSet<String>,
) -> String {
    let (stem, ext) = split_name(requested_name);

    for index in 1.. {
        let candidate = if ext.is_empty() {
            format!("{stem}_{index}")
        } else {
            format!("{stem}_{index}.{ext}")
        };

        if !used_names.contains(&normalize_key(&candidate))
            && !target_exists_for_other_file(original, &candidate)
        {
            return candidate;
        }
    }

    requested_name.to_string()
}

fn split_name(name: &str) -> (String, String) {
    let path = Path::new(name);
    let stem = path
        .file_stem()
        .map(|stem| stem.to_string_lossy().to_string())
        .unwrap_or_else(|| name.to_string());
    let ext = path
        .extension()
        .map(|ext| ext.to_string_lossy().to_string())
        .unwrap_or_default();

    (stem, ext)
}

fn target_exists_for_other_file(original: &FileItem, new_name: &str) -> bool {
    let original_path = PathBuf::from(&original.path);
    let parent = match original_path.parent() {
        Some(parent) => parent,
        None => return false,
    };
    let target_path = parent.join(new_name);

    if same_path(&original_path, &target_path) {
        return false;
    }

    let target_key = normalize_key(new_name);
    match fs::read_dir(parent) {
        Ok(entries) => entries.filter_map(Result::ok).any(|entry| {
            entry
                .file_name()
                .to_str()
                .map(|file_name| {
                    normalize_key(file_name) == target_key && entry.path() != original_path
                })
                .unwrap_or(false)
        }),
        Err(_) => target_path.exists(),
    }
}

fn same_path(left: &Path, right: &Path) -> bool {
    left == right || left.to_string_lossy().to_lowercase() == right.to_string_lossy().to_lowercase()
}

fn normalize_key(name: &str) -> String {
    name.to_lowercase()
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::models::FileItem;

    use super::{detect_conflicts, resolve_conflicts};

    fn temp_dir(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_conflict_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir)
    }

    fn file(path: &Path, name: &str) -> FileItem {
        FileItem {
            path: path
                .join(format!("{name}.txt"))
                .to_string_lossy()
                .to_string(),
            name: name.to_string(),
            ext: String::from("txt"),
            size: 1,
            created: String::from("2024-01-01T00:00:00+00:00"),
            modified: String::from("2024-01-01T00:00:00+00:00"),
        }
    }

    #[test]
    fn conflict_marks_duplicates_and_existing_files() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("detect")?;
        fs::write(dir.join("a.txt"), "a")?;
        fs::write(dir.join("b.txt"), "b")?;
        fs::write(dir.join("exists.txt"), "exists")?;

        let originals = vec![file(&dir, "a"), file(&dir, "b")];
        let items = detect_conflicts(&originals, &[String::from("same"), String::from("same")]);

        assert!(items.iter().all(|item| item.conflict));
        assert!(items.iter().all(|item| item.selected));
        assert_eq!(items[0].new_name, "same.txt");

        let items = detect_conflicts(&originals[..1], &[String::from("exists")]);
        assert!(items[0].conflict);

        fs::remove_dir_all(dir)?;
        Ok(())
    }

    #[test]
    fn conflict_resolution_appends_number_until_unique() -> Result<(), Box<dyn Error>> {
        let dir = temp_dir("resolve")?;
        fs::write(dir.join("a.txt"), "a")?;
        fs::write(dir.join("b.txt"), "b")?;

        let originals = vec![file(&dir, "a"), file(&dir, "b")];
        let mut items = detect_conflicts(&originals, &[String::from("same"), String::from("same")]);

        resolve_conflicts(&mut items);

        assert_eq!(items[0].new_name, "same.txt");
        assert_eq!(items[1].new_name, "same_1.txt");
        assert!(items.iter().all(|item| !item.conflict));

        fs::remove_dir_all(dir)?;
        Ok(())
    }
}

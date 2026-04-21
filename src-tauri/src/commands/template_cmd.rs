use std::fs;
use std::path::Path;

use chrono::Local;
use tauri::AppHandle;

use crate::models::{RuleConfig, Template};
use crate::utils::path_util;

#[tauri::command]
pub fn save_template(app: AppHandle, name: String, rules: Vec<RuleConfig>) -> Result<(), String> {
    let name = normalize_template_name(name)?;
    let path = path_util::templates_path(&app)?;
    let mut templates = read_templates(&path)?;

    if let Some(template) = templates.iter_mut().find(|template| template.name == name) {
        template.rules = rules;
    } else {
        templates.push(Template {
            name,
            rules,
            created: Local::now().to_rfc3339(),
        });
    }

    templates.sort_by(|left, right| left.name.cmp(&right.name));
    write_templates(&path, &templates)
}

#[tauri::command]
pub fn list_templates(app: AppHandle) -> Result<Vec<Template>, String> {
    let path = path_util::templates_path(&app)?;
    read_templates(&path)
}

#[tauri::command]
pub fn load_template(app: AppHandle, name: String) -> Result<Vec<RuleConfig>, String> {
    let name = normalize_template_name(name)?;
    let path = path_util::templates_path(&app)?;
    let templates = read_templates(&path)?;

    templates
        .into_iter()
        .find(|template| template.name == name)
        .map(|template| template.rules)
        .ok_or_else(|| format!("模板不存在：{name}"))
}

#[tauri::command]
pub fn delete_template(app: AppHandle, name: String) -> Result<(), String> {
    let name = normalize_template_name(name)?;
    let path = path_util::templates_path(&app)?;
    let mut templates = read_templates(&path)?;
    let before = templates.len();

    templates.retain(|template| template.name != name);
    if templates.len() == before {
        return Err(format!("模板不存在：{name}"));
    }

    write_templates(&path, &templates)
}

fn normalize_template_name(name: String) -> Result<String, String> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(String::from("模板名不能为空"));
    }
    Ok(name)
}

fn read_templates(path: &Path) -> Result<Vec<Template>, String> {
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path).map_err(|err| format!("读取模板文件失败：{err}"))?;
    if content.trim().is_empty() {
        return Ok(Vec::new());
    }

    serde_json::from_str(&content).map_err(|err| format!("解析模板文件失败：{err}"))
}

fn write_templates(path: &Path, templates: &[Template]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|err| format!("创建模板目录失败：{err}"))?;
    }

    let content =
        serde_json::to_string_pretty(templates).map_err(|err| format!("序列化模板失败：{err}"))?;
    fs::write(path, content).map_err(|err| format!("写入模板文件失败：{err}"))
}

#[cfg(test)]
mod tests {
    use std::error::Error;
    use std::fs;
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use crate::models::{RuleConfig, Template};

    use super::{read_templates, write_templates};

    fn temp_file(name: &str) -> Result<PathBuf, Box<dyn Error>> {
        let nanos = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos();
        let dir = std::env::temp_dir().join(format!("batch_rename_template_{name}_{nanos}"));
        fs::create_dir_all(&dir)?;
        Ok(dir.join("templates.json"))
    }

    #[test]
    fn template_store_round_trips_rules() -> Result<(), Box<dyn Error>> {
        let path = temp_file("round_trip")?;
        let parent = path
            .parent()
            .ok_or("temp file missing parent")?
            .to_path_buf();
        let templates = vec![Template {
            name: String::from("常用"),
            rules: vec![RuleConfig::Prefix {
                text: String::from("IMG_"),
            }],
            created: String::from("2026-01-01T00:00:00+08:00"),
        }];

        write_templates(&path, &templates)?;
        let loaded = read_templates(&path)?;

        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].name, "常用");

        fs::remove_dir_all(parent)?;
        Ok(())
    }
}

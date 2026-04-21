use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FileItem {
    pub path: String,
    pub name: String,
    pub ext: String,
    pub size: u64,
    pub created: String,
    pub modified: String,
}

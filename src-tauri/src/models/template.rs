use serde::{Deserialize, Serialize};

use super::RuleConfig;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Template {
    pub name: String,
    pub rules: Vec<RuleConfig>,
    pub created: String,
}

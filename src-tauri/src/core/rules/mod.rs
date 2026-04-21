use crate::models::FileItem;

pub mod case;
pub mod datetime;
pub mod prefix;
pub mod replace;
pub mod sequence;
pub mod strip;
pub mod suffix;

pub trait RuleTrait {
    fn apply(&self, name: &str, index: usize, file: &FileItem) -> String;
}

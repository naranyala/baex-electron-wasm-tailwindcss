use wasm_bindgen::prelude::*;

pub mod core {
    pub mod signals;
    pub mod components;
    pub mod template;
}

pub mod utils {
    pub mod html;
    pub mod js_utils;
}

pub mod sqlite;

// Re-export functions. #[wasm_bindgen] is already on the original functions.
pub use crate::core::signals::{create_signal_by_id, get_signal_by_id, set_signal_by_id, on_signal_change_by_id, get_or_create_signal_id};
pub use crate::core::components::{register_component, update_component_property, get_component_property, get_component_changed_properties, clear_component_changed_properties, remove_component};
pub use crate::core::template::process_template;

// SQLite functions are re-exported from the sqlite module
pub use crate::sqlite::wrapper::*;

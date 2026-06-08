use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use std::collections::HashMap;

pub struct Database {
    pub db: u32,
    pub pb: HashMap<u32, Statement>,
    pub Sa: HashMap<String, js_sys::Function>,
}

pub struct Statement {
    pub Qa: u32,
    pub db: *mut Database,
    pub ob: Option<u32>,
    pub ub: u32,
    pub gb: Option<u32>,
    pub Fb: Option<u32>,
}

// The actual implementation is complex and relies on C-bindings.
// I will move the logic from lib.rs.

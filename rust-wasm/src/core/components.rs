use std::cell::RefCell;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

pub struct ComponentState {
    pub values: HashMap<String, JsValue>,
    pub changed: HashMap<String, JsValue>,
}

impl ComponentState {
    pub fn new() -> Self {
        Self {
            values: HashMap::new(),
            changed: HashMap::new(),
        }
    }
}

thread_local! {
    pub static COMPONENT_ID_COUNTER: RefCell<u32> = RefCell::new(0);
    pub static BINDING_ID: RefCell<u32> = RefCell::new(0);
    pub static COMPONENT_STATE: RefCell<HashMap<u32, ComponentState>> = RefCell::new(HashMap::new());
}

pub fn next_binding_id() -> String {
    BINDING_ID.with(|id| {
        let mut id = id.borrow_mut();
        let cur = *id;
        *id += 1;
        format!("b{}", cur)
    })
}

#[wasm_bindgen]
pub fn register_component() -> u32 {
    COMPONENT_ID_COUNTER.with(|id| {
        let mut id = id.borrow_mut();
        let cur = *id;
        *id += 1;
        cur
    })
}

#[wasm_bindgen]
pub fn update_component_property(cid: u32, name: String, value: JsValue) -> bool {
    COMPONENT_STATE.with(|state| {
        let mut state = state.borrow_mut();
        let comp = state.entry(cid).or_insert_with(ComponentState::new);

        let old_value = comp.values.get(&name).cloned().unwrap_or(JsValue::UNDEFINED);

        if old_value != value {
            comp.changed.insert(name.clone(), old_value);
            comp.values.insert(name, value);
            true
        } else {
            false
        }
    })
}

#[wasm_bindgen]
pub fn get_component_property(cid: u32, name: String) -> JsValue {
    COMPONENT_STATE.with(|state| {
        state.borrow().get(&cid).and_then(|comp| comp.values.get(&name).cloned()).unwrap_or(JsValue::UNDEFINED)
    })
}

#[wasm_bindgen]
pub fn get_component_changed_properties(cid: u32) -> JsValue {
    use js_sys::{Array, Object, Reflect};
    COMPONENT_STATE.with(|state| {
        let state = state.borrow();
        let result = Array::new();
        if let Some(comp) = state.get(&cid) {
            for (name, old_value) in &comp.changed {
                let entry = Object::new();
                Reflect::set(&entry, &"propName".into(), &name.as_str().into()).unwrap();
                Reflect::set(&entry, &"oldValue".into(), old_value).unwrap();
                let new_value = comp.values.get(name).cloned();
                Reflect::set(&entry, &"value".into(), &new_value.unwrap_or(JsValue::UNDEFINED)).unwrap();
                result.push(&entry);
            }
        }
        result.into()
    })
}

#[wasm_bindgen]
pub fn clear_component_changed_properties(cid: u32) {
    COMPONENT_STATE.with(|state| {
        let mut state = state.borrow_mut();
        if let Some(comp) = state.get_mut(&cid) {
            comp.changed.clear();
        }
    });
}

#[wasm_bindgen]
pub fn remove_component(cid: u32) {
    COMPONENT_STATE.with(|state| {
        state.borrow_mut().remove(&cid);
    });
}

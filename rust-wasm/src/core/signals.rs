use std::cell::RefCell;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

thread_local! {
    pub static SIGNAL_VALUES: RefCell<HashMap<u32, JsValue>> = RefCell::new(HashMap::new());
    pub static SIGNAL_SUBSCRIBERS: RefCell<HashMap<u32, Vec<js_sys::Function>>> = RefCell::new(HashMap::new());
    pub static SIGNAL_KEY_MAP: RefCell<HashMap<String, u32>> = RefCell::new(HashMap::new());
    pub static SIGNAL_ID_COUNTER: RefCell<u32> = RefCell::new(0);
}

/// Returns the unique ID associated with a signal key.
/// If the key doesn't exist, a new ID is generated and stored.
#[wasm_bindgen]
pub fn get_or_create_signal_id(key: String) -> u32 {
    SIGNAL_KEY_MAP.with(|map| {
        let mut map = map.borrow_mut();
        if let Some(&id) = map.get(&key) {
            id
        } else {
            let id = SIGNAL_ID_COUNTER.with(|counter| {
                let mut counter = counter.borrow_mut();
                let id = *counter;
                *counter += 1;
                id
            });
            map.insert(key, id);
            id
        }
    })
}

/// Initializes a signal in the WASM engine using its ID.
/// Sets the initial value and ensures a subscriber list exists.
#[wasm_bindgen]
pub fn create_signal_by_id(id: u32, initial: JsValue) -> JsValue {
    SIGNAL_VALUES.with(|store| {
        store.borrow_mut().insert(id, initial.clone());
    });
    SIGNAL_SUBSCRIBERS.with(|store| {
        store.borrow_mut().entry(id).or_default();
    });
    initial
}

/// Retrieves the current value of a signal by its ID.
#[wasm_bindgen]
pub fn get_signal_by_id(id: u32) -> JsValue {
    SIGNAL_VALUES.with(|store| {
        store.borrow().get(&id).cloned().unwrap_or(JsValue::UNDEFINED)
    })
}

/// Updates a signal's value and triggers all registered JavaScript callbacks.
#[wasm_bindgen]
pub fn set_signal_by_id(id: u32, value: JsValue) {
    SIGNAL_VALUES.with(|store| {
        store.borrow_mut().insert(id, value.clone());
    });
    SIGNAL_SUBSCRIBERS.with(|store| {
        let subscribers = store.borrow();
        if let Some(callbacks) = subscribers.get(&id) {
            for callback in callbacks {
                let _ = callback.call1(&JsValue::UNDEFINED, &value);
            }
        }
    });
}

/// Registers a JavaScript callback to be executed whenever the specified signal changes.
#[wasm_bindgen]
pub fn on_signal_change_by_id(id: u32, callback: js_sys::Function) {
    SIGNAL_SUBSCRIBERS.with(|store| {
        store.borrow_mut().entry(id).or_default().push(callback);
    });
}

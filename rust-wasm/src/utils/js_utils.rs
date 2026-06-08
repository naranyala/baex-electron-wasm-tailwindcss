use wasm_bindgen::prelude::*;

pub fn js_to_string(val: &JsValue) -> String {
    if val.is_null() || val.is_undefined() {
        return String::new();
    }
    if let Some(s) = val.as_string() {
        return s;
    }
    if let Some(n) = val.as_f64() {
        return n.to_string();
    }
    if let Some(b) = val.as_bool() {
        return b.to_string();
    }
    String::new()
}

pub fn is_template_result(val: &JsValue) -> bool {
    if !val.is_object() {
        return false;
    }
    let has_html = js_sys::Reflect::has(val, &JsValue::from_str("html")).unwrap_or(false);
    let has_bindings = js_sys::Reflect::has(val, &JsValue::from_str("bindings")).unwrap_or(false);
    has_html && has_bindings
}

pub fn is_signal_like(val: &JsValue) -> bool {
    if !val.is_object() {
        return false;
    }
    if is_template_result(val) {
        return false;
    }
    js_sys::Reflect::has(val, &JsValue::from_str("value")).unwrap_or(false)
}

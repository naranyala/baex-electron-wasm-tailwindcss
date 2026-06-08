use wasm_bindgen::prelude::*;
use js_sys::{Array, Object, Reflect};
use crate::utils::html::escape_html;
use crate::utils::js_utils::{js_to_string, is_template_result, is_signal_like};

pub fn detect_binding(s: &str) -> Option<(&'static str, &str)> {
    let bytes = s.as_bytes();
    let len = bytes.len();
    if len < 3 || bytes[len - 1] != b'=' {
        return None;
    }
    let before_eq = &s[..len - 1];
    let prefix_pos = before_eq.rfind(|c: char| !c.is_alphanumeric() && c != '_')?;
    let prefix = &s[prefix_pos..prefix_pos + 1];
    let name = &s[prefix_pos + 1..len - 1];
    if name.is_empty() || !name.chars().all(|c| c.is_alphanumeric() || c == '_') {
        return None;
    }
    match prefix {
        "@" => Some(("event", name)),
        "." => Some(("property", name)),
        "?" => Some(("bool", name)),
        _ => None,
    }
}

pub fn resolve_text_value(
    value: &JsValue,
    output: &mut String,
    bindings: &js_sys::Array,
    depth: u32,
) {
    use js_sys::{Array, Reflect};
    if depth > 10 {
        return;
    }
    if value.is_null() || value.is_undefined() {
        return;
    }
    if is_template_result(value) {
        if let Ok(html_val) = Reflect::get(value, &"html".into()) {
            if let Some(html_str) = html_val.as_string() {
                output.push_str(&html_str);
            }
        }
        if let Ok(bindings_val) = Reflect::get(value, &"bindings".into()) {
            let nested = Array::from(&bindings_val);
            for j in 0..nested.length() {
                bindings.push(&nested.get(j));
            }
        }
        return;
    }
    if let Ok(is_raw) = js_sys::Reflect::get(value, &"__raw".into()) {
        if is_raw.is_truthy() {
            if let Ok(val) = js_sys::Reflect::get(value, &"value".into()) {
                if let Some(s) = val.as_string() {
                    output.push_str(&s);
                    return;
                }
            }
        }
    }
    if Array::is_array(value) {
        let arr = Array::from(value);
        for j in 0..arr.length() {
            resolve_text_value(&arr.get(j), output, bindings, depth + 1);
        }
        return;
    }
    if is_signal_like(value) {
        if let Ok(val) = Reflect::get(value, &"value".into()) {
            resolve_text_value(&val, output, bindings, depth + 1);
        }
        return;
    }
    output.push_str(&escape_html(&js_to_string(value)));
}

#[wasm_bindgen]
pub fn process_template(strings: JsValue, values: JsValue) -> JsValue {
    let strings = Array::from(&strings);
    let values = Array::from(&values);
    let mut output = String::new();
    let result_bindings = Array::new();
    let strings_len = strings.length();
    let values_len = values.length();
    for i in 0..strings_len {
        let s = strings.get(i).as_string().unwrap_or_default();
        if i < values_len {
            if let Some((bind_type, bind_name)) = detect_binding(&s) {
                let suffix = match bind_type {
                    "event" => format!("@{}=", bind_name),
                    "property" => format!(".{}=", bind_name),
                    "bool" => format!("?{}=", bind_name),
                    _ => unreachable!(),
                };
                output.push_str(&s[..s.len() - suffix.len()]);
                let marker = crate::core::components::next_binding_id();
                output.push_str(&format!("data-baex=\"{}\"", marker));
                let binding = Object::new();
                Reflect::set(&binding, &"marker".into(), &marker.into()).unwrap();
                Reflect::set(&binding, &"type".into(), &bind_type.into()).unwrap();
                Reflect::set(&binding, &"valueIdx".into(), &JsValue::from_f64(i as f64)).unwrap();
                match bind_type {
                    "event" => { Reflect::set(&binding, &"eventName".into(), &bind_name.into()).unwrap(); },
                    "property" => { Reflect::set(&binding, &"propName".into(), &bind_name.into()).unwrap(); },
                    "bool" => { Reflect::set(&binding, &"attrName".into(), &bind_name.into()).unwrap(); },
                    _ => {}
                }
                result_bindings.push(&binding);
            } else {
                output.push_str(&s);
                let value = values.get(i);
                resolve_text_value(&value, &mut output, &result_bindings, 0);
            }
        } else {
            output.push_str(&s);
        }
    }
    let result = Object::new();
    Reflect::set(&result, &"html".into(), &output.into()).unwrap();
    Reflect::set(&result, &"bindings".into(), &result_bindings).unwrap();
    result.into()
}

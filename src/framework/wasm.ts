import init, {
  clear_component_changed_properties,
  create_signal,
  get_component_changed_properties,
  get_component_property,
  get_signal,
  on_signal_change,
  process_template,
  register_component,
  register_globals,
  remove_component,
  resolve_observed_attributes,
  deserialize_property,
  serialize_property,
  set_signal,
  update_component_property,
} from '../../rust-wasm/pkg/web_core.js';

let ready: Promise<void> | null = null;

export function ensureWasmReady(input?: BufferSource): Promise<void> {
  if (!ready) {
    const initPromise = input ? init(input) : init();
    ready = initPromise.then(() => {
      register_globals();
    });
  }
  return ready;
}

export const wasm = {
  register_component,
  update_component_property,
  get_component_property,
  get_component_changed_properties,
  clear_component_changed_properties,
  remove_component,
  processTemplate: process_template,
  createSignal: create_signal,
  getSignal: get_signal,
  setSignal: set_signal,
  onSignalChange: on_signal_change,
  resolveObservedAttributes: resolve_observed_attributes,
  serializeProperty: serialize_property,
  deserializeProperty: deserialize_property,
};

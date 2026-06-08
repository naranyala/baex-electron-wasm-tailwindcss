import init, {
  clear_component_changed_properties,
  create_signal_by_id,
  get_component_changed_properties,
  get_component_property,
  get_signal_by_id,
  on_signal_change_by_id,
  process_template,
  register_component,
  remove_component,
  set_signal_by_id,
  update_component_property,
  get_or_create_signal_id,
} from '../../../rust-wasm/pkg/web_core.js';
 
let ready: Promise<any> | null = null;
 
/**
 * Ensures the WASM engine is loaded and initialized before any framework calls are made.
 * @param input Optional binary buffer for the WASM module.
 * @returns A promise that resolves when the WASM engine is ready.
 */
export function ensureWasmReady(input?: BufferSource): Promise<any> {
  if (!ready) {
    const initPromise = input ? init(input) : init();
    ready = initPromise;
  }
  return ready!;
}
 
/**
 * The bridge between the JavaScript framework and the Rust WASM core.
 * Provides high-performance primitives for signal management, template processing,
 * and component state tracking.
 */
export const wasm = {
  register_component,
  update_component_property,
  get_component_property,
  get_component_changed_properties,
  clear_component_changed_properties,
  remove_component,
  processTemplate: process_template,
  getOrCreateSignalId: get_or_create_signal_id,
  createSignal: create_signal_by_id,
  getSignal: get_signal_by_id,
  setSignal: set_signal_by_id,
  onSignalChange: on_signal_change_by_id,
  resolveObservedAttributes: (_e: any) => [],
  serializeProperty: (_e: any, t: any) => t,
  deserializeProperty: (_e: any, t: any) => t,
};


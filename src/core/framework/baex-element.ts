import { wasm } from './wasm';
import { tracker } from './dependency-tracker';
import { getSignal } from './signals';
import {
  normalizePatches,
  resolveAttributeName,
  serializeProperty,
  deserializeProperty,
} from './utils';
import { buildDOM, RenderContext } from './renderer';
import { PropertyDeclaration, PropertyValues, Callback } from './types';
import { Binding, TemplateResult } from './template';

/**
 * Base class for all BAEX reactive components.
 * Extends HTMLElement to integrate with the native Web Component API.
 * Handles synchronization between JavaScript properties and the WASM engine.
 */
export class BaexElement extends HTMLElement {
  /**
   * Definition of reactive properties for the component.
   */
  static properties: Record<string, PropertyDeclaration> = {};
 
  private _cid: number = 0;
  private _pendingUpdate = false;
  private _forceUpdate = false;
  private _updateCallbacks: Array<() => void> = [];
  private _subscriptions = new Map<string | number, () => void>();
  private _cleanupStack: Callback[] = [];
  private _bindingMap = new Map<string, Array<{ node: Node; binding: Binding }>>();
 
  constructor() {
    super();
    this._cid = wasm.register_component();
    this._syncInitialProperties();
    this._defineClassProperties();
  }
 
  /**
   * Syncs the initial values of properties defined in `static properties` to the WASM engine.
   */
  private _syncInitialProperties(): void {
    const props = (this.constructor as typeof BaexElement).properties;
    for (const name of Object.keys(props)) {
      const value = (this as any)[name];
      if (value !== undefined) {
        wasm.update_component_property(this._cid, name, value);
      }
    }
  }
 
  connectedCallback(): void {
    this.requestUpdate();
    this.onConnected?.();
  }
 
  disconnectedCallback(): void {
    wasm.remove_component(this._cid);
    this._disposeSubscriptions();
    tracker.cleanupStack(this._cleanupStack);
    this.onDisconnected?.();
  }
 
  attributeChangedCallback(
    name: string,
    old: string | null,
    value: string | null,
  ): void {
    if (old === value) return;
    const props = (this.constructor as typeof BaexElement).properties;
    for (const [propName, decl] of Object.entries(props)) {
      const attrName = resolveAttributeName(propName, decl);
      if (attrName === name) {
        this._setPropertyFromAttribute(propName, decl, value);
        return;
      }
    }
  }
 
  /**
   * Returns the list of attributes that the browser should monitor for changes.
   */
  static get observedAttributes(): string[] {
    const props = (this as typeof BaexElement).properties;
    try {
        return wasm.resolveObservedAttributes(props);
    } catch (e) {
        return [];
    }
  }
 
  /**
   * Schedules a re-render of the component. 
   * Uses queueMicrotask to batch multiple updates into a single render cycle.
   * @param force If true, ignores fine-grained patching and performs a full render.
   */
  requestUpdate(force = false): void {
    if (force) {
      this._forceUpdate = true;
    }
    if (!this._pendingUpdate) {
      this._pendingUpdate = true;
      queueMicrotask(() => this._performUpdate());
    }
  }
 
  /**
   * The main render function. Must be implemented by the subclass to return a TemplateResult.
   * @throws Error if not implemented.
   */
  protected render(): TemplateResult {
    throw new Error('render() must be implemented by subclass');
  }
 
  /** Lifecycle hook called when the element is added to the DOM. */
  protected onConnected?(): void;
  /** Lifecycle hook called when the element is removed from the DOM. */
  protected onDisconnected?(): void;
  /** Lifecycle hook called after an update has been performed. */
  protected onUpdate?(changed: PropertyValues): void;
  
  private _disposeSubscriptions(): void {
    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions.clear();
    this._bindingMap.clear();
  }
  
  /**
   * Core update logic. Orchestrates fine-grained patching or full re-rendering
   * based on the changes reported by the WASM engine.
   */
  private _performUpdate(): void {
 
    this._pendingUpdate = false;
    const currentForce = this._forceUpdate;
    this._forceUpdate = false;
  
    const rawPatches = wasm.get_component_changed_properties(this._cid);
    wasm.clear_component_changed_properties(this._cid);
  
    const patches = normalizePatches(rawPatches);
  
    tracker.begin(() => {
      this.requestUpdate();
    }, this._cleanupStack);
    
    if (currentForce) {
      this._renderInitial();
    } else {
      let patched = false;
      for (const patch of patches) {
        const marker = this._findMarkerForProperty(patch.propName);
        if (marker) {
          this._applyPatch(marker, patch.value);
          patched = true;
        }
      }
      if (!patched) {
        this._renderInitial();
      }
    }
    
    const newDeps = tracker.end();
    
    for (const [key, unsubscribe] of this._subscriptions.entries()) {
      if (!newDeps.has(key)) {
        unsubscribe();
        this._subscriptions.delete(key);
      }
    }
 
    newDeps.forEach(key => {
      if (!this._subscriptions.has(key)) {
        const sig = getSignal(key as string);
        const unsubscribe = sig?.subscribe(() => this.requestUpdate());
        if (unsubscribe) {
          this._subscriptions.set(key, unsubscribe);
        }
      }
    });
  
    this.onUpdate?.(Object.fromEntries(patches.map((p) => [p.propName, p.value])));
    for (const cb of this._updateCallbacks) {
      cb();
    }
    this._updateCallbacks = [];
  }
 
  private _findMarkerForProperty(propName: string): string | null {
    for (const [marker, targets] of this._bindingMap.entries()) {
      if (targets.some(t => t.binding.type === 'property' && t.binding.propName === propName)) {
        return marker;
      }
    }
    return null;
  }
 
  private _renderInitial(): void {
    const result = this.render();
    if (!result) return;
 
    this.innerHTML = '';
    
    const ctx: RenderContext = {
      bindingMap: this._bindingMap,
      applyBinding: this._applyBindingToNode.bind(this),
      applyPatch: this._applyPatch.bind(this)
    };
    
    const rootNode = buildDOM(result.root, result.bindings, ctx);
    this.appendChild(rootNode);
  }
 
  private _applyBindingToNode(el: HTMLElement, b: Binding): void {
    if (b.type === 'event') {
      el.addEventListener(b.eventName, b.value);
    } else if (b.type === 'property') {
      (el as unknown as Record<string, unknown>)[b.propName] = b.value;
    } else if (b.type === 'bool') {
      if (b.value) {
        el.setAttribute(b.attrName, '');
      } else {
        el.removeAttribute(b.attrName);
      }
    }
  }
 
  private _applyPatch(marker: string, newValue: unknown): void {
    const targets = this._bindingMap.get(marker);
    if (!targets) return;
 
    for (const { node, binding } of targets) {
      const el = node as HTMLElement;
      if (binding.type === 'property') {
        (el as unknown as Record<string, unknown>)[binding.propName] = newValue;
      } else if (binding.type === 'bool') {
        if (newValue) {
          el.setAttribute(binding.attrName, '');
        } else {
          el.removeAttribute(binding.attrName);
        }
      }
    }
  }
 
  private _defineClassProperties(): void {
    const ctor = this.constructor as typeof BaexElement;
    const props = ctor.properties;
 
    for (const [name, decl] of Object.entries(props)) {
      Object.defineProperty(this, name, {
        get() {
          return wasm.get_component_property((this as any)._cid, name);
        },
        set(value: unknown) {
          const oldValue = wasm.get_component_property((this as any)._cid, name);
          if (decl.hasChanged && !decl.hasChanged(value, oldValue)) return;
          const changed = wasm.update_component_property(
            (this as any)._cid,
            name,
            value,
          );
          if (changed) {
            const attrName = resolveAttributeName(name, decl);
            if (decl.reflect && attrName) {
               const str = serializeProperty(value, decl.type);
               if (str === null) {
                 this.removeAttribute(attrName);
               } else {
                 this.setAttribute(attrName, str);
               }
            }
            this.requestUpdate();
          }
        },
        configurable: true,
        enumerable: true,
      });
    }
  }
 
  private _setPropertyFromAttribute(
    propName: string,
    decl: PropertyDeclaration,
    value: string | null,
  ): void {
    const converted = deserializeProperty(value, decl.type);
    wasm.update_component_property(this._cid, propName, converted);
    this.requestUpdate();
  }
 
  /**
   * Schedules a callback to be executed after the next update cycle.
   * @param cb The callback function.
   */
  whenUpdate(cb: () => void): void {
    if (!this._pendingUpdate) {
      cb();
    } else {
      this._updateCallbacks.push(cb);
    }
  }
}
 
/**
 * Decorator to define a reactive property for a BaexElement.
 * @param decl Optional property declaration (type, reflection, etc).
 */
export function property(decl?: PropertyDeclaration): PropertyDecorator {
  return (target: object, key: string | symbol) => {
    if (!target) return;
    const ctor = (target as unknown as { constructor?: unknown }).constructor as
      | typeof BaexElement
      | undefined;
    if (!ctor || typeof ctor !== 'function') return;
 
    if (!ctor.properties) {
      ctor.properties = {};
    }
    ctor.properties[key as string] = decl ?? {};
  };
}
 
/**
 * Shorthand decorator for a reactive state property.
 */
export function state(): PropertyDecorator {
  return property({ attribute: false });
}

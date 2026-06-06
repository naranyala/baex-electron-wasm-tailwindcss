import type { Binding, TemplateResult } from './template';
import { wasm } from './wasm';
import { tracker } from './dependency-tracker';
import { getSignal } from './signals';
import type { PropertyDeclaration, PropertyValues } from './types';
import { 
  resolveAttributeName, 
  normalizePatches, 
  deserializeProperty, 
  serializeProperty 
} from './utils';



export class BaexElement extends HTMLElement {
  static properties: Record<string, PropertyDeclaration> = {};

  private _cid: number = 0;
  private _pendingUpdate = false;
  private _forceUpdate = false;
  private _updateCallbacks: Array<() => void> = [];
  private _nodeMap = new Map<string, HTMLElement>();
  private _isFirstRender = true;

  constructor() {
    super();
    this._cid = wasm.register_component();
    this._syncInitialProperties();
    this._defineClassProperties();
  }

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

  static get observedAttributes(): string[] {
    const props = (this as typeof BaexElement).properties;
    // Check if wasm module is loaded. 
    // In many cases, observedAttributes is accessed during class definition,
    // before ensureWasmReady() can complete.
    try {
        return wasm.resolveObservedAttributes(props);
    } catch (e) {
        // Fallback: return empty array, or derive from props directly if possible.
        // For now, returning empty array to prevent crashing.
        return [];
    }
  }

  requestUpdate(force = false): void {
    if (force) {
      this._forceUpdate = true;
    }
    if (!this._pendingUpdate) {
      this._pendingUpdate = true;
      queueMicrotask(() => this._performUpdate());
    }
  }

  protected render(): TemplateResult {
    throw new Error('render() must be implemented by subclass');
  }

  protected onConnected?(): void;
  protected onDisconnected?(): void;
  protected onUpdate?(changed: PropertyValues): void;

  private _performUpdate(): void {
    this._pendingUpdate = false;
    const currentForce = this._forceUpdate;
    this._forceUpdate = false;
 
    const rawPatches = wasm.get_component_changed_properties(this._cid);
    wasm.clear_component_changed_properties(this._cid);
 
    const patches = normalizePatches(rawPatches);
 
    if (this._isFirstRender) {
      tracker.begin();
      this._renderInitial();
      const deps = tracker.end();
      deps.forEach(key => {
        const sig = getSignal(key);
        sig?.subscribe(() => this.requestUpdate());
      });
      this._isFirstRender = false;
    } else if (patches.length > 0 || currentForce) {
      this._renderInitial();
    }
 
    this.onUpdate?.(Object.fromEntries(patches.map((p) => [p.propName, p.value])));
    for (const cb of this._updateCallbacks) {
      cb();
    }
    this._updateCallbacks = [];
  }

  private _renderInitial(): void {
    const result = this.render();
    if (!result) return;

    this.innerHTML = result.html;
    this._initializeNodeMap(result.bindings);
    this._applyBindings(result.bindings);
  }

  private _initializeNodeMap(bindings: Binding[]): void {
    this._nodeMap.clear();
    for (const b of bindings) {
      const el = this.querySelector<HTMLElement>(`[data-baex="${b.marker}"]`);
      if (el) {
        this._nodeMap.set(b.marker, el);
      }
    }
  }

  private _applyBindings(bindings: Binding[]): void {
    for (const b of bindings) {
      const el = this._nodeMap.get(b.marker);
      if (!el) continue;

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

  whenUpdate(cb: () => void): void {
    if (!this._pendingUpdate) {
      cb();
    } else {
      this._updateCallbacks.push(cb);
    }
  }
}

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

export function state(): PropertyDecorator {
  return property({ attribute: false });
}

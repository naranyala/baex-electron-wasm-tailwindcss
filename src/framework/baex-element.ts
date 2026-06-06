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
  private _subscriptions = new Map<string, () => void>();
  private _bindingMap = new Map<string, Array<{ node: Node; binding: Binding }>>();

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
  
    // Always track dependencies during render to handle conditional dependencies
    tracker.begin();
    
    if (currentForce) {
      this._renderInitial();
    } else {
      // Try to apply fine-grained patches first
      let patched = false;
      for (const patch of patches) {
        // Find the marker associated with this property
        const marker = this._findMarkerForProperty(patch.propName);
        if (marker) {
          this._applyPatch(marker, patch.value);
          patched = true;
        }
      }
      
      // If no targeted patches could be applied, or we have structural changes, fallback to full render
      if (!patched) {
        this._renderInitial();
      }
    }
    
    const newDeps = tracker.end();
    
    // Unsubscribe from deps no longer used
    for (const [key, unsubscribe] of this._subscriptions.entries()) {
      if (!newDeps.has(key)) {
        unsubscribe();
        this._subscriptions.delete(key);
      }
    }
 
    // Subscribe to new deps
    newDeps.forEach(key => {
      if (!this._subscriptions.has(key)) {
        const sig = getSignal(key);
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
    const rootNode = this._buildDOM(result.root, result.bindings);
    this.appendChild(rootNode);
  }

  private _buildDOM(instruction: any, allBindings: Binding[]): Node {
    if (instruction.type === 'text') {
      return document.createTextNode(instruction.content);
    }

    if (instruction.type === 'fragment') {
      const fragment = document.createDocumentFragment();
      for (const child of instruction.children) {
        fragment.appendChild(this._buildDOM(child, allBindings));
      }
      return fragment;
    }

    if (instruction.type === 'element') {
      const el = document.createElement(instruction.tag);
      
      if (instruction.bindings) {
        for (const bInst of instruction.bindings) {
          const binding = allBindings.find(b => b.marker === bInst.marker);
          if (binding) {
            this._applyBindingToNode(el, binding);
            
            // Register for fine-grained updates
            const marker = bInst.marker;
            if (!this._bindingMap.has(marker)) {
              this._bindingMap.set(marker, []);
            }
            this._bindingMap.get(marker)!.push({ node: el, binding });
          }
        }
      }

      for (const child of instruction.children) {
        el.appendChild(this._buildDOM(child, allBindings));
      }
      return el;
    }

    return document.createTextNode('');
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
      // Event bindings are generally static
    }
  }

  private _initializeNodeMap(bindings: Binding[]): void {
    // Deprecated in favor of _buildDOM direct application
  }

  private _applyBindings(bindings: Binding[]): void {
    // Deprecated in favor of _buildDOM direct application
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

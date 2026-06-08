/**
 * Registers a cleanup function to be executed when the current reactive context is disposed.
 * @param fn The function to execute during cleanup.
 */
export function onCleanup(fn: () => void) {
  const stack = tracker.currentCleanupStack;
  if (stack) {
    stack.push(fn);
  }
}

/**
 * A reactive primitive that holds a value and notifies subscribers when it changes.
 * It synchronizes with the WASM engine for cross-language reactivity.
 */
export class Signal<T = unknown> {
  protected _id: number;
  protected _value: T;
  protected _initialized = false;
  protected _subscribers: Set<SignalSubscriber> = new Set();
 
  /**
   * Creates a new Signal.
   * @param key A unique identifier for the signal, used for WASM synchronization.
   * @param initial The initial value of the signal.
   */
  constructor(key: string, initial: T) {
    this._id = wasm.getOrCreateSignalId(key);
    this._value = initial;
  }
 
  private _init() {
    if (!this._initialized) {
      wasm.createSignal(this._id, this._value);
      this._initialized = true;
    }
  }
 
  /**
   * Gets the current value of the signal and tracks it as a dependency.
   */
  get value(): T {
    this._init();
    tracker.track(this._id);
    return this._value;
  }
 
  /**
   * Sets the signal value, updates the WASM engine, and notifies all subscribers.
   */
  set value(v: T) {
    this._init();
    this._value = v;
    wasm.setSignal(this._id, v);
    
    // Notify JS subscribers
    this._subscribers.forEach(cb => cb(v));
    
    // Notify the global tracker
    tracker.notify(this._id);
  }
 
  /**
   * Returns the current value without tracking it as a dependency.
   */
  peek(): T {
    return this._value;
  }
 
  /**
   * Subscribes to signal changes.
   * @param cb The callback to invoke on change.
   * @returns A function to unsubscribe from the signal.
   */
  subscribe(cb: SignalSubscriber): () => void {
    this._subscribers.add(cb);
    
    const wasmCb = (val: unknown) => {
      cb(val);
    };
    wasm.onSignalChange(this._id, wasmCb as any);
 
    return () => {
      this._subscribers.delete(cb);
    };
  }
 
  /**
   * The internal unique ID of the signal.
   */
  get key(): string {
    return this._id.toString();
  }
}


/**
 * A read-only signal that derives its value from another signal or a calculation.
 * It automatically updates whenever its dependencies change.
 */
export class Computed<T = unknown> extends Signal<T> {
  private _fn: () => T;

  /**
   * Creates a computed signal based on the provided function.
   * @param fn The derivation function.
   */
  constructor(fn: () => T) {
    super(null as any, fn());
    this._fn = fn;
    this._update();
  }

  get value(): T {
    tracker.track(this.key);
    return this._value;
  }

  /**
   * Internal update logic that re-evaluates the computed function.
   */
  private _update = () => {
    tracker.begin(this._update);
    const newValue = this._fn();
    tracker.end();
    if (newValue !== this._value) {
      this._value = newValue;
      wasm.setSignal(this._id, newValue);
      this._subscribers.forEach(cb => cb(newValue));
      tracker.notify(this._id.toString());
    }
  }
}

/**
 * Creates a reactive side-effect that runs whenever its dependencies change.
 * @param fn The effect function. Can return a cleanup function.
 * @returns A function to dispose of the effect.
 */
export function createEffect(fn: () => void | (() => void)) {
  const effect = () => {
    tracker.begin(effect);
    const cleanup = fn();
    tracker.end();
    
    if (typeof cleanup === 'function') {
      onCleanup(cleanup);
    }
  };
  
  const dispose = () => {
    // In a full implementation, we'd remove the effect from the tracker's subscribers
  };
  
  effect();
  return dispose;
}

const storeKeys = new WeakMap<object, string>();
let storeCounter = 0;

function getStoreKey(obj: object): string {
  let key = storeKeys.get(obj);
  if (!key) {
    key = `store_${++storeCounter}`;
    storeKeys.set(obj, key);
  }
  return key;
}

/**
 * Creates a deeply reactive state object using a Proxy.
 * Updates to properties in the store automatically notify subscribers.
 * @param initialState The initial state object.
 */
export function createStore<T extends object>(initialState: T): T {
  const handler: ProxyHandler<any> = {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      const key = `${getStoreKey(target)}:${String(prop)}`;
      tracker.track(key);
      
      if (typeof value === 'object' && value !== null) {
        return createStore(value);
      }
      return value;
    },
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      const key = `${getStoreKey(target)}:${String(prop)}`;
      tracker.notify(key);
      return result;
    }
  };

  return new Proxy(initialState, handler);
}

let signalCounter = 0;
const signalCache = new Map<string, Signal>();

/**
 * Creates or retrieves a signal from the global cache.
 * @param key Optional unique key for the signal.
 * @param initial Initial value.
 */
export function createSignal<T>(key: string | null, initial: T): Signal<T> {
  const actualKey = key ?? `__signal_${++signalCounter}`;
  const existing = signalCache.get(actualKey);
  if (existing) return existing as Signal<T>;
  const signal = new Signal<T>(actualKey, initial);
  signalCache.set(actualKey, signal);
  return signal;
}

/**
 * Retrieves an existing signal by its key.
 */
export function getSignal<T>(key: string): Signal<T> | undefined {
  return signalCache.get(key) as Signal<T> | undefined;
}

/**
 * Clears the global signal cache, useful for testing or hot-reloading.
 */
export function clearSignalCache() {
  signalCache.clear();
}

export type { SignalSubscriber };

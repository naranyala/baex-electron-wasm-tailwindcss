import { wasm } from './wasm';
import { tracker } from './dependency-tracker';

type SignalSubscriber = (value: unknown) => void;

export function onCleanup(fn: () => void) {
  const stack = tracker.currentCleanupStack;
  if (stack) {
    stack.push(fn);
  }
}

export class Signal<T = unknown> {
  protected _id: number;
  protected _value: T;
  protected _initialized = false;
  protected _subscribers: Set<SignalSubscriber> = new Set();
 
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
 
  get value(): T {
    this._init();
    tracker.track(this._id);
    return this._value;
  }
 
  set value(v: T) {
    this._init();
    this._value = v;
    wasm.setSignal(this._id, v);
    
    // Notify JS subscribers
    this._subscribers.forEach(cb => cb(v));
    
    // Notify the global tracker
    tracker.notify(this._id);
  }
 
  peek(): T {
    return this._value;
  }
 
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
 
  get key(): string {
    return this._id.toString();
  }
}


export class Computed<T = unknown> extends Signal<T> {
  private _fn: () => T;

  constructor(fn: () => T) {
    super(null as any, fn());
    this._fn = fn;
    this._update();
  }

  get value(): T {
    tracker.track(this.key);
    return this._value;
  }

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

export function createSignal<T>(key: string | null, initial: T): Signal<T> {
  const actualKey = key ?? `__signal_${++signalCounter}`;
  const existing = signalCache.get(actualKey);
  if (existing) return existing as Signal<T>;
  const signal = new Signal<T>(actualKey, initial);
  signalCache.set(actualKey, signal);
  return signal;
}

export function getSignal<T>(key: string): Signal<T> | undefined {
  return signalCache.get(key) as Signal<T> | undefined;
}

export function clearSignalCache() {
  signalCache.clear();
}

export type { SignalSubscriber };

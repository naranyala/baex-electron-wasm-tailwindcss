import { wasm } from './wasm';
import { tracker } from './dependency-tracker';

type SignalSubscriber = (value: unknown) => void;

export class Signal<T = unknown> {
  private _key: string;
  private _value: T;
  private _initialized = false;
  private _subscribers: Set<SignalSubscriber> = new Set();

  constructor(key: string, initial: T) {
    this._key = key;
    this._value = initial;
  }

  private _init() {
    if (!this._initialized) {
      wasm.createSignal(this._key, this._value);
      this._initialized = true;
    }
  }

  get value(): T {
    this._init();
    tracker.track(this._key, () => {});
    return this._value;
  }

  set value(v: T) {
    this._init();
    this._value = v;
    wasm.setSignal(this._key, v);
    
    // Notify JS subscribers
    this._subscribers.forEach(cb => cb(v));
    
    // Notify the global tracker
    tracker.notify(this._key);
  }

  peek(): T {
    return this._value;
  }

  subscribe(cb: SignalSubscriber): () => void {
    this._subscribers.add(cb);
    
    const wasmCb = (val: unknown) => {
      cb(val);
    };
    wasm.onSignalChange(this._key, wasmCb as any);

    return () => {
      this._subscribers.delete(cb);
    };
  }

  get key(): string {
    return this._key;
  }
}

export class Computed<T = unknown> extends Signal<T> {
  private _fn: () => T;

  constructor(fn: () => T) {
    super(null as any, fn());
    this._fn = fn;
  }

  get value(): T {
    tracker.begin();
    const result = this._fn();
    const deps = tracker.end();

    deps.forEach(depKey => {
      const dep = getSignal(depKey);
      if (dep) {
        dep.subscribe(() => {
            this.value = this._fn();
        });
      }
    });

    return result;
  }
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

export type { SignalSubscriber };

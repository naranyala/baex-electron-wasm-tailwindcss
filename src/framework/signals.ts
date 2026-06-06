import { wasm } from './wasm';
import { tracker } from './dependency-tracker';

type SignalSubscriber = (value: unknown) => void;

export class Signal<T = unknown> {
  private _key: string;
  private _value: T;
  private _initialized = false;

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
    tracker.track(this._key, () => {
      console.log(`[Signal] Dependency triggered for ${this._key}`);
    });
    return this._value;
  }

  set value(v: T) {
    this._init();
    this._value = v;
    wasm.setSignal(this._key, v);
    tracker.notify(this._key);
  }

  peek(): T {
    return this._value;
  }

  subscribe(cb: SignalSubscriber): () => void {
    let subscribed = true;
    const wasmCb = (val: unknown) => {
      console.log('[Signal] Callback triggered for', this._key);
      if (subscribed) cb(val);
    };
    wasm.onSignalChange(this._key, wasmCb as unknown as (...args: unknown[]) => unknown);
    return () => {
      subscribed = false;
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

    // Subscribe dependencies to re-trigger computation
    deps.forEach(depKey => {
      const dep = getSignal(depKey);
      if (dep) {
        dep.subscribe(() => {
            // Use the base class setter
            (this as any).value = this._fn();
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

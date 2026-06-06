import { wasm } from './wasm';
import { getTrackingElement } from './tracker';

type SignalSubscriber = (value: unknown) => void;


export class Signal<T = unknown> {
  private _key: string;
  private _value: T;

  constructor(key: string, initial: T) {
    this._key = key;
    this._value = initial;
    wasm.createSignal(key, initial);
  }

  get value(): T {
    const tracker = getTrackingElement();
    if (tracker && typeof tracker.requestUpdate === 'function') {
      this.subscribe(() => tracker.requestUpdate(true));
    }
    console.log(`[Signal] get value for ${this._key}:`, this._value);
    return this._value;
  }

  set value(v: T) {
    console.log(`[Signal] set value for ${this._key}:`, v);
    this._value = v;
    wasm.setSignal(this._key, v);
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

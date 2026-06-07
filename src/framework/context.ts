type ContextKey = symbol;

class ContextManager {
  private _providers = new Map<ContextKey, Map<HTMLElement, any>>();

  provide<T>(element: HTMLElement, key: ContextKey, value: T) {
    if (!this._providers.has(key)) {
      this._providers.set(key, new Map());
    }
    this._providers.get(key)!.set(element, value);
  }

  consume<T>(element: HTMLElement, key: ContextKey): T | undefined {
    const providerMap = this._providers.get(key);
    if (!providerMap) return undefined;

    let current: HTMLElement | null = element;
    while (current) {
      if (providerMap.has(current)) {
        return providerMap.get(current);
      }
      current = current.parentElement;
    }
    return undefined;
  }

  removeProvider(element: HTMLElement, key: ContextKey) {
    this._providers.get(key)?.delete(element);
  }
}

export const contextManager = new ContextManager();

export function createContext() {
  return Symbol('context') as ContextKey;
}

export function provideContext<T>(element: HTMLElement, key: ContextKey, value: T) {
  contextManager.provide(element, key, value);
}

export function consumeContext<T>(element: HTMLElement, key: ContextKey): T | undefined {
  return contextManager.consume(element, key);
}

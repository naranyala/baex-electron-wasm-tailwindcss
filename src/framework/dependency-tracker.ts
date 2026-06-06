// @RULE: DependencyTracker MUST support re-entrant calls for nested component rendering.

type Callback = () => void;

class DependencyTracker {
  // Global map of signal keys to their subscribers
  private _subscribers = new Map<string, Callback[]>();
  // Stack of active subscriber sets for the current context (e.g., render())
  private _contextStack: Set<string>[] = [];

  // Start tracking in a new context
  begin() {
    this._contextStack.push(new Set());
  }

  // Stop tracking in current context and return the tracked dependencies
  end(): Set<string> {
    return this._contextStack.pop() || new Set();
  }

  track(key: string, callback: Callback) {
    // Add to global subscribers
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, []);
    }
    this._subscribers.get(key)!.push(callback);

    // Track in active context
    if (this._contextStack.length > 0) {
      this._contextStack[this._contextStack.length - 1].add(key);
    }
  }

  notify(key: string) {
    const callbacks = this._subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  reset() {
    this._subscribers.clear();
    this._contextStack = [];
  }
}

export const tracker = new DependencyTracker();

// @RULE: DependencyTracker MUST support re-entrant calls for nested component rendering.

export type Callback = () => void;

class DependencyTracker {
  // Global map of signal keys to their subscribers
  private _subscribers = new Map<string | number, Set<Callback>>();
  // Stack of active subscriber sets for the current context (e.g., render())
  private _contextStack: Set<string | number>[] = [];
  // Currently active listener for automatic dependency tracking
  private _activeListener: Callback | null = null;
  // The current cleanup stack associated with the active context
  private _currentCleanupStack: Callback[] | null = null;

  get currentCleanupStack() {
    return this._currentCleanupStack;
  }

  // Start tracking in a new context. Optional cleanup stack for component-level lifecycle.
  begin(listener?: Callback, cleanupStack?: Callback[] | null) {
    if (listener) this._activeListener = listener;
    this._currentCleanupStack = cleanupStack || null;
    this._contextStack.push(new Set());
  }

  // Stop tracking in current context and return the tracked dependencies
  end(): Set<string | number> {
    const deps = this._contextStack.pop() || new Set();
    this._activeListener = null;
    this._currentCleanupStack = null;
    return deps;
  }

  track(key: string | number) {
    // Automatic subscription if a listener is active
    if (this._activeListener) {
      if (!this._subscribers.has(key)) {
        this._subscribers.set(key, new Set());
      }
      this._subscribers.get(key)!.add(this._activeListener);
    }

    // Track in active context
    if (this._contextStack.length > 0) {
      this._contextStack[this._contextStack.length - 1].add(key);
    }
  }

  notify(key: string | number) {
    const callbacks = this._subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  // Execute and clear a specific cleanup stack
  cleanupStack(stack: Callback[]) {
    while (stack.length > 0) {
      const fn = stack.pop();
      if (fn) fn();
    }
  }

  reset() {
    this._subscribers.clear();
    this._contextStack = [];
    this._activeListener = null;
    this._currentCleanupStack = null;
  }
}

export const tracker = new DependencyTracker();

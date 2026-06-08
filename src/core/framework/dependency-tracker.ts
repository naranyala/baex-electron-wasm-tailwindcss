/**
 * Global dependency tracker for the reactive system.
 * Manages automatic subscription of effects and components to signals.
 */
class DependencyTracker {
  // Global map of signal keys to their subscribers
  private _subscribers = new Map<string | number, Set<Callback>>();
  // Stack of active subscriber sets for the current context (e.g., render())
  private _contextStack: Set<string | number>[] = [];
  // Currently active listener for automatic dependency tracking
  private _activeListener: Callback | null = null;
  // The current cleanup stack associated with the active context
  private _currentCleanupStack: Callback[] | null = null;

  /** Returns the active cleanup stack for the current reactive context. */
  get currentCleanupStack() {
    return this._currentCleanupStack;
  }

  /**
   * Starts tracking dependencies for a given listener.
   * @param listener The callback to trigger when any tracked signal changes.
   * @param cleanupStack Optional stack for storing cleanup functions.
   */
  begin(listener?: Callback, cleanupStack?: Callback[] | null) {
    if (listener) this._activeListener = listener;
    this._currentCleanupStack = cleanupStack || null;
    this._contextStack.push(new Set());
  }

  /**
   * Stops tracking and returns the set of dependencies collected in the current context.
   */
  end(): Set<string | number> {
    const deps = this._contextStack.pop() || new Set();
    this._activeListener = null;
    this._currentCleanupStack = null;
    return deps;
  }

  /**
   * Marks a signal as a dependency of the active listener.
   * @param key The unique identifier of the signal.
   */
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

  /**
   * Notifies all subscribers that a signal has changed.
   * @param key The identifier of the signal that changed.
   */
  notify(key: string | number) {
    const callbacks = this._subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(cb => cb());
    }
  }

  /**
   * Executes and clears all functions in the provided cleanup stack.
   * @param stack The stack of cleanup callbacks.
   */
  cleanupStack(stack: Callback[]) {
    while (stack.length > 0) {
      const fn = stack.pop();
      if (fn) fn();
    }
  }

  /**
   * Completely resets the tracker state.
   */
  reset() {
    this._subscribers.clear();
    this._contextStack = [];
    this._activeListener = null;
    this._currentCleanupStack = null;
  }
}

export const tracker = new DependencyTracker();

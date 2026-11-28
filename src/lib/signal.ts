/** A list of listeners to call when something happens. `subscribe` returns the matching unsubscribe. */
export function createSignal() {
  const listeners = new Set<() => void>();
  return {
    subscribe(fn: () => void): () => void {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
    emit(): void {
      listeners.forEach((fn) => fn());
    },
  };
}

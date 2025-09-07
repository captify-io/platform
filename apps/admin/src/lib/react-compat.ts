"use client";

import React from "react";

// Ensure React is available in the global scope for monorepo compatibility
if (typeof window !== "undefined" && !window.React) {
  (window as any).React = React;
}

// Safe hook wrapper that prevents SSR errors
export function useSafeRef<T>(initialValue: T) {
  if (typeof window === "undefined") {
    // SSR: Return a simple object that acts like a ref
    return { current: initialValue };
  }
  return React.useRef<T>(initialValue);
}

export function useSafeState<T>(initialState: T | (() => T)) {
  if (typeof window === "undefined") {
    // SSR: Return initial state and a no-op setter
    const initial =
      typeof initialState === "function"
        ? (initialState as () => T)()
        : initialState;
    return [initial, () => {}] as const;
  }
  return React.useState(initialState);
}

export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  if (typeof window === "undefined") {
    // SSR: Do nothing
    return;
  }
  return React.useEffect(effect, deps);
}

// Export safe hooks with standard names for easy replacement
export const useState = useSafeState;
export const useRef = useSafeRef;
export const useEffect = useSafeEffect;

export default React;

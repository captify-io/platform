import React from "react";

// Ensure React is available in the global scope for monorepo compatibility
if (typeof window !== "undefined" && !window.React) {
  (window as any).React = React;
}

// Use standard React hooks - Next.js handles SSR properly
export function useSafeRef<T>(initialValue: T) {
  return React.useRef<T>(initialValue);
}

export function useSafeState<T>(initialState: T | (() => T)) {
  return React.useState(initialState);
}

export function useSafeEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(effect, deps);
}

// Export safe hooks with standard names for easy replacement
export const useState = useSafeState;
export const useRef = useSafeRef;
export const useEffect = useSafeEffect;

// Export React as named export instead of default to avoid mixed export issues
export { default as React } from "react";

"use client";

import React from 'react';

// Ensure React is available in the global scope for monorepo compatibility
if (typeof window !== 'undefined' && !window.React) {
  (window as any).React = React;
}

// Safe hook wrapper that prevents SSR errors
export function useSafeRef<T>(initialValue: T) {
  const [isClient, setIsClient] = React.useState(false);
  const ref = React.useRef<T>(initialValue);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Return a proxy that handles SSR safely
  return {
    get current() {
      return isClient ? ref.current : initialValue;
    },
    set current(value: T) {
      if (isClient) {
        ref.current = value;
      }
    }
  };
}

export function useSafeEffect(effect: React.EffectCallback, deps?: React.DependencyList) {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  React.useEffect(() => {
    if (isClient) {
      return effect();
    }
  }, [isClient, ...(deps || [])]);
}

export default React;

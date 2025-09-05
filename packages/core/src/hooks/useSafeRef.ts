"use client";

import { useRef, MutableRefObject } from "react";

/**
 * A safer version of useRef that includes additional error handling
 * and SSR protection for client-side operations
 */
export function useSafeRef<T>(initialValue: T): MutableRefObject<T> {
  try {
    return useRef<T>(initialValue);
  } catch (error) {
    console.warn("useSafeRef failed, returning fallback:", error);
    // Return a safe fallback object
    return {
      current: initialValue,
    } as MutableRefObject<T>;
  }
}

/**
 * A useRef wrapper specifically for DOM elements that are null during SSR
 */
export function useDOMRef<
  T extends HTMLElement = HTMLElement
>(): MutableRefObject<T | null> {
  try {
    return useRef<T | null>(null);
  } catch (error) {
    console.warn("useDOMRef failed, returning fallback:", error);
    // Return a safe fallback for SSR
    return {
      current: null,
    } as MutableRefObject<T | null>;
  }
}

/**
 * Safe way to access ref.current with error handling
 */
export function safeRefAccess<T>(
  ref: MutableRefObject<T | null>,
  callback: (current: T) => void,
  fallback?: () => void
): void {
  try {
    if (typeof window !== "undefined" && ref?.current) {
      callback(ref.current);
    } else if (fallback) {
      fallback();
    }
  } catch (error) {
    console.warn("safeRefAccess failed:", error);
    if (fallback) {
      fallback();
    }
  }
}

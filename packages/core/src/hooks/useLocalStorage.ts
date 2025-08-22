/**
 * Local storage hook with type safety
 */

import { useState, useEffect } from "react";

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return defaultValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Silent fail - localStorage might be disabled
      }
    }
  }, [key, value]);

  return [value, setValue];
}

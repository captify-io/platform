"use client";

import { ComponentType, ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  // This ensures the component only renders on the client
  if (typeof window === "undefined") {
    return fallback as ReactNode;
  }

  return children as ReactNode;
}

export default ClientOnly;

"use client";

import { ReactNode } from "react";

interface TestLayoutProps {
  children: ReactNode;
}

export function TestLayout({ children }: TestLayoutProps) {
  return <div className="test-layout">{children}</div>;
}

// app/layout.tsx
import "./globals.css";
import * as React from "react";
import type { ReactNode } from "react";
import { CaptifyProviders } from "@captify/core/components";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <CaptifyProviders>
          <div className="min-h-screen bg-background">{children}</div>
        </CaptifyProviders>
      </body>
    </html>
  );
}

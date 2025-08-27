"use client";

import { TopNavigation, SmartBreadcrumb } from "@captify/client";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavigation
        currentApplication={{
          id: "captify-platform",
          name: "Captify Platform",
        }}
      />
      <SmartBreadcrumb />
      <main className="flex-1">{children}</main>
    </div>
  );
}

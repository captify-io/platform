"use client";

import { TopNavigation } from "@captify/client";

interface ClientLayoutProps {
  children: React.ReactNode;
  appName: string;
}

export function ClientLayout({ children, appName }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNavigation
        currentApplication={{
          id: appName,
          name: appName,
        }}
      />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

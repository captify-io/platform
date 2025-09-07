"use client";

import { ThreePanelLayout } from "@captify/core/components";

interface ClientCaptifyLayoutProps {
  children: React.ReactNode;
  packageName: string;
}

export function ClientCaptifyLayout({
  children,
  packageName,
}: ClientCaptifyLayoutProps) {
  // Identity pool will be set by ThreePanelLayout based on DynamoDB app data

  // Since the status check is done in LayoutContent,
  // we know that if we reach here, the user is approved
  return (
    <div
      data-package={packageName}
      className="h-screen flex flex-col overflow-hidden"
    >
      <div className="flex-1 min-h-0">
        <ThreePanelLayout>{children}</ThreePanelLayout>
      </div>
    </div>
  );
}

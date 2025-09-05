import { ReactNode } from "react";
import {
  FavoritesBar,
  SmartBreadcrumb,
  ThreePanelLayout,
} from "@captify/core/components";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string[] }>;
}

export default async function CaptifyPageLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify } = await params;

  console.log("called [captify]/layout.tsx with package:", captify[0]);

  // Pass the package name through a data attribute so the context can pick it up
  return (
    <div data-package={captify[0] || ""} className="h-full">
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <FavoritesBar />
          <SmartBreadcrumb />
          <ThreePanelLayout>{children}</ThreePanelLayout>
        </div>
      </div>
    </div>
  );
}

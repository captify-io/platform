"use client";
import { ThreePanelLayout } from "@captify/core/components";
import { useCaptify } from "@captify/core/context";
import { useEffect, useState } from "react";
import { TopNavigation, SmartBreadcrumb } from "@captify/core/components";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string }>;
}

export default function CaptifyPageLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const [captify, setCaptify] = useState<string>("");
  const captifyContext = useCaptify();

  useEffect(() => {
    // Resolve params in useEffect since this is now a client component
    params.then((resolvedParams) => {
      console.log("DEBUG: resolvedParams:", resolvedParams);
      console.log("DEBUG: window.location.pathname:", window.location.pathname);
      setCaptify(resolvedParams.captify);
    });
  }, [params]);

  useEffect(() => {
    if (captify) {
      console.log("called [captify]/layout.tsx with package:", captify);
    }
  }, [captify]);

  // Pass the package name through a data attribute so the context can pick it up
  return (
    <div data-package={captify} className="h-full">
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <TopNavigation captifyContext={captifyContext} />
          <SmartBreadcrumb captifyContext={captifyContext} />
          <ThreePanelLayout captifyContext={captifyContext}>
            {children}
          </ThreePanelLayout>
        </div>
      </div>
    </div>
  );
}

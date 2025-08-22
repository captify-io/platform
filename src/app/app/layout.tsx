"use client";

import { AppLayout } from "@captify/core";
import { useCaptify } from "@captify/core";

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentAppId } = useCaptify();

  return (
    <AppLayout
      applicationId={currentAppId || ""}
      showMenu={true}
      showChat={true}
    >
      {children}
    </AppLayout>
  );
}

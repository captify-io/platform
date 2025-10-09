"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
  CaptifyProvider,
  CaptifyLayout,
} from "@captify-io/core/components";
import { config } from "../../config";

export default function CaptifyLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  // If loading, show nothing (brief flash only)
  if (status === "loading") {
    return null;
  }

  // If no session, this will be handled by root layout
  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  return (
    <CaptifyProvider session={session}>
      <CaptifyLayout config={config} session={session}>
        {children}
      </CaptifyLayout>
    </CaptifyProvider>
  );
}

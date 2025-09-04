"use client";

import NextDynamic from "next/dynamic";

// Client-side only ThreePanelLayout to avoid SSR issues with hooks
export const ClientThreePanelLayout = NextDynamic(
  () => import("@captify/core/components").then((mod) => ({ default: mod.ThreePanelLayout })),
  { ssr: false }
);

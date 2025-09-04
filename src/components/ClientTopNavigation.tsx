"use client";

import NextDynamic from "next/dynamic";
import { Session } from "next-auth";

// Client-side only TopNavigation to avoid SSR issues with hooks
const TopNavigation = NextDynamic(
  () => import("@captify/core/components").then((mod) => ({ default: mod.TopNavigation })),
  { ssr: false }
);

interface ClientTopNavigationProps {
  session: Session;
}

export function ClientTopNavigation({ session }: ClientTopNavigationProps) {
  return <TopNavigation session={session} />;
}

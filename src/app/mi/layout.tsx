"use client";

import { AppLayout } from "@/components/apps/AppLayout";

export default function MILayout({ children }: { children: React.ReactNode }) {
  return <AppLayout applicationId="mi">{children}</AppLayout>;
}

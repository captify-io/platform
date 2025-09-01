"use client";

import { ApplicationLauncher } from "@captify/core/components";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

export default function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  // Package loading is now handled by the layout's CaptifyProvider
  // This component just renders the ApplicationLauncher
  return <ApplicationLauncher />;
}

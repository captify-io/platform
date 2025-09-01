"use client";

import { useEffect } from "react";
import { useCaptify } from "@captify/core/context";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

export default function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { loadPackageConfig } = useCaptify();

  useEffect(() => {
    async function loadPackage() {
      const { captify: slug } = await params;
      if (slug) {
        loadPackageConfig(slug);
      }
    }
    loadPackage();
  }, [params, loadPackageConfig]);

  // The actual package content is rendered by the layout's ThreePanelLayout
  // This page component handles loading the package configuration
  return null;
}

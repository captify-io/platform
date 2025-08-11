"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { useNavigation } from "@/context/NavigationContext";
import { ApplicationLayout } from "@/components/apps/ApplicationLayout";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface AppMetadata {
  id: string;
  title: string;
  description: string;
}

export default function ApplicationPage({ params }: PageProps) {
  const { id } = use(params);
  const { setBreadcrumbs } = useNavigation();
  const [appMetadata, setAppMetadata] = useState<AppMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppMetadata() {
      try {
        const response = await fetch(`/api/apps/metadata?app_id=${id}`);

        if (!response.ok) {
          if (response.status === 404) {
            notFound();
          }
          throw new Error(`Failed to load application: ${response.statusText}`);
        }

        const data = await response.json();
        setAppMetadata(data);
      } catch (err) {
        console.error("Error fetching app metadata:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAppMetadata();
  }, [id]);

  // Set breadcrumbs when app metadata is loaded
  useEffect(() => {
    if (appMetadata) {
      setBreadcrumbs([
        {
          label: "Captify",
          href: "/",
        },
        {
          label: "Applications",
          href: "/apps",
        },
        {
          label: appMetadata.title,
          href: undefined, // Current page, not clickable
          isActive: true,
        },
      ]);
    }
  }, [appMetadata, setBreadcrumbs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !appMetadata) {
    notFound();
  }

  return (
    <ApplicationLayout applicationId={id} applicationName={appMetadata.title}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">{appMetadata.title}</h1>
        <p className="text-gray-600 mb-6">{appMetadata.description}</p>
        <div className="text-center py-12">
          <p className="text-gray-500">
            Application content will be loaded here
          </p>
        </div>
      </div>
    </ApplicationLayout>
  );
}

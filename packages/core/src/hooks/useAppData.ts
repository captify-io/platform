"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CaptifyClient } from "../api/client";
import type { App } from "../types";

interface UseAppDataReturn {
  data: App | null;
  loading: boolean;
  error: string | null;
}

export function useAppData(slug: string): UseAppDataReturn {
  const { data: session, status } = useSession();
  const [data, setData] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    // Don't fetch if not authenticated
    if (status === "loading") {
      return; // Still loading session
    }

    if (status === "unauthenticated") {
      setLoading(false);
      setError("Authentication required");
      return;
    }

    const fetchAppData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create Captify client with session
        const client = new CaptifyClient({
          appId: "appman",
          session: session,
        });

        // Query the captify-appman-App table by slug
        const response = await client.get<App>({
          table: "captify-appman-App",
          operation: "scan",
          params: {
            FilterExpression: "slug = :slug",
            ExpressionAttributeValues: {
              ":slug": slug,
            },
          },
        });

        if (response.success && response.data) {
          // If scan returns an array, get the first item
          const appData = Array.isArray(response.data)
            ? response.data[0]
            : response.data;
          setData(appData || null);
        } else {
          setError(response.error || "Failed to fetch app data");
          setData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchAppData();
    }
  }, [slug, session, status]);

  return { data, loading, error };
}

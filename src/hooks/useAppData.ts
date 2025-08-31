"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CaptifyClient } from "../lib/api/client";
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

        console.log("useAppData - fetching data for slug:", slug);

        // Create Captify client with session
        const client = new CaptifyClient({
          appId: "appman",
          session: session,
        });

        console.log("useAppData - created client, querying table");

        // Query the captify-core-App table by slug
        const response = await client.get({
          table: "captify-core-App",
          params: {
            filterExpression: "slug = :slug",
            expressionAttributeValues: {
              ":slug": slug,
            },
          },
        });

        console.log("useAppData - received response:", response);

        if (response.success && response.data) {
          // If scan returns an array, get the first item
          const appData = Array.isArray(response.data)
            ? response.data[0]
            : response.data;
          console.log("useAppData - processed appData:", appData);
          setData(appData || null);
        } else {
          console.log("useAppData - no data or failed response:", response);
          setError(response.error || "Failed to fetch app data");
          setData(null);
        }
      } catch (err) {
        console.error("useAppData - error:", err);
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

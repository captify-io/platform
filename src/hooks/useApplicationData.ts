import { useState, useEffect } from "react";

interface ApplicationData {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description?: string;
  version?: string;
  agentId?: string;
  agentAliasId?: string;
  menu?: Array<{
    id: string;
    label: string;
    icon: string;
    href?: string;
    order?: number;
    parent_id?: string;
  }>;
  capabilities?: string[];
  permissions?: string[];
  category?: string;
  status?: string;
}

interface UseApplicationDataReturn {
  data: ApplicationData | null;
  loading: boolean;
  error: string | null;
}

export function useApplicationData(slug: string): UseApplicationDataReturn {
  const [data, setData] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/applications/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Application not found");
          }
          throw new Error("Failed to fetch application data");
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || "Invalid response format");
        }
      } catch (err) {
        console.error("Error fetching application data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [slug]);

  return { data, loading, error };
}

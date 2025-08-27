/**
 * VeriPicks Hooks
 *
 * Custom React hooks for VeriPicks components
 */

import { useEffect, useState } from "react";
import { CaptifyClient } from "@captify/client";

/**
 * Hook to create a CaptifyClient instance with session
 */
export function useCaptifyClient(session?: any) {
  return new CaptifyClient({
    appId: "veripicks",
    session,
  });
}

/**
 * Hook to fetch user preferences
 */
export function useUserPreferences(userId: string, session?: any) {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useCaptifyClient(session);

  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const response = await client.get({
          table: "veripicks-user-preferences",
          key: { userId },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch preferences");
        }

        setPreferences(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [userId, client]);

  const updatePreferences = async (newPreferences: any) => {
    try {
      const response = await client.put({
        table: "veripicks-user-preferences",
        item: {
          userId,
          ...newPreferences,
          updatedAt: new Date().toISOString(),
        },
      });

      if (!response.success) {
        throw new Error(response.error || "Failed to update preferences");
      }

      setPreferences(response.data);
      return response.data;
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : "Failed to update preferences"
      );
    }
  };

  return { preferences, loading, error, updatePreferences };
}

/**
 * Hook to fetch current odds for a game
 */
export function useCurrentOdds(gameId: string, session?: any) {
  const [odds, setOdds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useCaptifyClient(session);

  useEffect(() => {
    const fetchOdds = async () => {
      if (!gameId) return;

      try {
        setLoading(true);
        const response = await client.get({
          table: "veripicks-odds",
          key: { gameId },
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch odds");
        }

        setOdds(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOdds();
  }, [gameId, client]);

  return { odds, loading, error };
}

/**
 * Hook to fetch betting trends
 */
export function useBettingTrends(
  query: { sport?: string; timeframe: string; market?: string },
  session?: any
) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = useCaptifyClient(session);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await client.get({
          table: "veripicks-betting-trends",
          params: query,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch trends");
        }

        setTrends(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [query, client]);

  return { trends, loading, error };
}

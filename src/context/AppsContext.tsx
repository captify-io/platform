"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { Application } from "@/types/application";
import {
  demoApplications,
  getApplicationByAlias,
} from "@/apps/applications-loader";

export interface AppDefinition {
  alias: string;
  name: string;
  agentId: string;
}

interface AppsContextValue {
  availableApps: AppDefinition[];
  demoApplications: Application[];
  getApplicationByAlias: (alias: string) => Application | undefined;
  favoriteApps: string[];
  toggleFavorite: (alias: string) => void;
  recentApps: string[];
  markAsRecent: (alias: string) => void;
}

const AppsContext = createContext<AppsContextValue | undefined>(undefined);

export function AppsProvider({ children }: { children: ReactNode }) {
  const [favoriteApps, setFavoriteApps] = useState<string[]>([]);
  const [recentApps, setRecentApps] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem("titan-favorite-apps");
    const storedRecent = localStorage.getItem("titan-recent-apps");

    if (storedFavorites) {
      setFavoriteApps(JSON.parse(storedFavorites));
    }

    if (storedRecent) {
      setRecentApps(JSON.parse(storedRecent));
    }
  }, []);

  // Legacy apps for backward compatibility
  const availableApps: AppDefinition[] = demoApplications.map((app) => ({
    alias: app.metadata.alias,
    name: app.metadata.name,
    agentId: app.aiAgent.agentId,
  }));

  const toggleFavorite = (alias: string) => {
    const newFavorites = favoriteApps.includes(alias)
      ? favoriteApps.filter((id) => id !== alias)
      : [...favoriteApps, alias];

    setFavoriteApps(newFavorites);
    localStorage.setItem("titan-favorite-apps", JSON.stringify(newFavorites));
  };

  const markAsRecent = (alias: string) => {
    const newRecent = [alias, ...recentApps.filter((id) => id !== alias)].slice(
      0,
      10
    );
    setRecentApps(newRecent);
    localStorage.setItem("titan-recent-apps", JSON.stringify(newRecent));
  };

  return (
    <AppsContext.Provider
      value={{
        availableApps,
        demoApplications,
        getApplicationByAlias,
        favoriteApps,
        toggleFavorite,
        recentApps,
        markAsRecent,
      }}
    >
      {children}
    </AppsContext.Provider>
  );
}

export function useApps() {
  const context = useContext(AppsContext);
  if (!context) {
    throw new Error("useApps must be used within an AppsProvider");
  }
  return context;
}

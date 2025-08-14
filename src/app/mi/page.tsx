"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

// Import the individual page components
import AdvancedForecastPage from "./advanced-forecast/page";
import BOMExplorerPage from "./bom-explorer/page";
import WorkbenchPage from "./workbench/page";
import SupplyChainPage from "./supply-chain/page";

export default function MIPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState("advanced-forecast");

  useEffect(() => {
    // Function to extract hash from URL
    const getHashSection = () => {
      if (typeof window !== "undefined") {
        const hash = window.location.hash.replace("#", "");
        // Only return the part before any query parameters
        const baseHash = hash.split("?")[0];
        return baseHash || "advanced-forecast"; // Default to advanced-forecast if no hash
      }
      return "advanced-forecast";
    };

    // Set initial section from hash
    const initialSection = getHashSection();
    setActiveSection(initialSection);

    // If no hash is present, set default hash to advanced-forecast
    if (
      typeof window !== "undefined" &&
      !window.location.hash &&
      isAuthenticated
    ) {
      window.location.hash = "advanced-forecast";
    }

    // Listen for hash changes
    const handleHashChange = () => {
      setActiveSection(getHashSection());
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">
            Welcome to Material Insights
          </h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  // Render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case "advanced-forecast":
        return <AdvancedForecastPage />;
      case "forecast":
        return <AdvancedForecastPage />; // Fallback for legacy
      case "bom-explorer":
        return <BOMExplorerPage />;
      case "workbench":
        return <WorkbenchPage />;
      case "supply-chain":
        return <SupplyChainPage />;
      case "analytics":
        return (
          <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Analytics & Reports</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "settings":
        return (
          <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-4">Settings</h1>
            <p className="text-muted-foreground">
              Configuration options coming soon...
            </p>
          </div>
        );
      default:
        return <AdvancedForecastPage />;
    }
  };

  return <div className="h-full w-full">{renderContent()}</div>;
}

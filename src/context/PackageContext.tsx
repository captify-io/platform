/**
 * Package Context Provider
 * Extends CaptifyContext with package-specific state management
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useCaptify } from "./CaptifyContext";
import { apiClient } from "@/lib/api/client";
import {
  PackageConfig,
  PackageState,
  PackageContextType,
  PackageMenuItem,
} from "../types/package";
import { AppCategory } from "../types";
import { UUID } from "crypto";

const PackageContext = createContext<PackageContextType | null>(null);

interface PackageProviderProps {
  children: React.ReactNode;
  packageName: string;
}

export function PackageProvider({
  children,
  packageName,
}: PackageProviderProps) {
  const captifyContext = useCaptify();
  const [packageConfig, setPackageConfig] = useState<PackageConfig | null>(
    null
  );
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageState, setPackageState] = useState<PackageState>({
    currentPackage: packageName,
    currentRoute: "home", // Default route
    agentPanelOpen: false,
    agentWidth: 320,
  });
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // Load package configuration from DynamoDB
  const loadPackageConfig = useCallback(async () => {
    try {
      setPackageLoading(true);

      // Load app config (extends existing App loading)
      const appResponse = await apiClient.run({
        service: "dynamo",
        operation: "get",
        table: "App", // Use existing applications table
        data: {
          key: { slug: packageName },
        },
      });

      if (!appResponse.success || !appResponse.data) {
        // If package not found in DynamoDB, create a default configuration
        console.warn(
          `Package ${packageName} not found in DynamoDB, using default configuration`
        );

        const defaultConfig: PackageConfig = {
          id:
            packageName as `${string}-${string}-${string}-${string}-${string}`,
          name: packageName.charAt(0).toUpperCase() + packageName.slice(1),
          slug: packageName,
          app: packageName, // Which app/package this belongs to
          fields: {}, // Extensible JSON object
          description: `Default configuration for ${packageName}`,
          ownerId: "system", // Required from Core
          version: "1.0.0",
          category: "other" as AppCategory,
          status: "active",
          visibility: "internal",
          icon: "package", // Default icon
          menu: [], // Empty menu array
          identityPoolId: "", // Will need to be set properly
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "system",
          updatedBy: "system",
          menuItems: [],
          defaultRoute: "home",
          agentConfig: {
            agentId: "",
            agentAliasId: "",
            capabilities: [],
          },
        };

        setPackageConfig(defaultConfig);
        setPackageLoading(false);
        return;
      }

      const app = appResponse.data;

      // Load menu items from DynamoDB
      const menuResponse = await apiClient.run({
        service: "dynamo",
        operation: "query",
        table: "menu-items", // New table for package menus
        data: {
          keyConditionExpression: "packageName = :packageName",
          expressionAttributeValues: {
            ":packageName": packageName,
          },
        },
      });

      const menuItems: PackageMenuItem[] = menuResponse.success
        ? menuResponse.data?.items || []
        : [];

      // Combine into package config
      const config: PackageConfig = {
        ...app,
        menuItems,
        defaultRoute: app.defaultRoute || "home",
        agentConfig: {
          agentId: app.agentId || "",
          agentAliasId: app.agentAliasId || "",
          capabilities: app.capabilities || [],
        },
      };

      setPackageConfig(config);

      // Set initial route from URL hash or default
      const hashRoute = window.location.hash.replace("#", "");
      if (hashRoute && menuItems.some((item) => item.route === hashRoute)) {
        setPackageState((prev) => ({ ...prev, currentRoute: hashRoute }));
      } else {
        setPackageState((prev) => ({
          ...prev,
          currentRoute: config.defaultRoute,
        }));
      }
    } catch (error) {
      console.error("Failed to load package config:", error);
    } finally {
      setPackageLoading(false);
    }
  }, [packageName]);

  // Load package config on mount
  useEffect(() => {
    loadPackageConfig();
  }, [loadPackageConfig]);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hashRoute = window.location.hash.replace("#", "");
      if (
        hashRoute &&
        packageConfig?.menuItems.some((item) => item.route === hashRoute)
      ) {
        setPackageState((prev) => ({ ...prev, currentRoute: hashRoute }));
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [packageConfig]);

  // Navigation functions
  const setCurrentRoute = useCallback((route: string) => {
    setPackageState((prev) => ({ ...prev, currentRoute: route }));
    window.location.hash = route;
  }, []);

  // Panel control functions
  const toggleAgentPanel = useCallback(() => {
    setPackageState((prev) => ({
      ...prev,
      agentPanelOpen: !prev.agentPanelOpen,
    }));
  }, []);

  const setAgentWidth = useCallback((width: number) => {
    setPackageState((prev) => ({ ...prev, agentWidth: width }));
  }, []);

  // Chat functionality
  const sendMessage = useCallback(
    async (message: string) => {
      if (!packageConfig?.agentConfig) return;

      // Add user message to history
      const userMessage = {
        id: Date.now().toString(),
        role: "user" as const,
        content: message,
        timestamp: new Date(),
      };

      setChatHistory((prev) => [...prev, userMessage]);

      try {
        // Send to agent using existing Bedrock integration
        const response = await apiClient.run({
          service: "bedrock-agent",
          operation: "invoke",
          data: {
            agentId: packageConfig.agentConfig.agentId,
            agentAliasId: packageConfig.agentConfig.agentAliasId,
            sessionId: (captifyContext.session as any)?.user?.id || "anonymous",
            inputText: message,
            context: {
              packageName,
              currentRoute: packageState.currentRoute,
              userId: (captifyContext.session as any)?.user?.email,
            },
          },
        });

        if (response.success) {
          const assistantMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant" as const,
            content:
              response.data?.completion ||
              "Sorry, I couldn't process that request.",
            timestamp: new Date(),
          };

          setChatHistory((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    },
    [packageConfig, packageState, packageName, captifyContext.session]
  );

  const contextValue: PackageContextType = {
    packageConfig,
    packageLoading,
    packageState,
    setCurrentRoute,
    toggleAgentPanel,
    setAgentWidth,
    chatHistory,
    sendMessage,
  };

  return (
    <PackageContext.Provider value={contextValue}>
      {children}
    </PackageContext.Provider>
  );
}

export function usePackageContext(): PackageContextType {
  const context = useContext(PackageContext);
  if (!context) {
    throw new Error("usePackageContext must be used within a PackageProvider");
  }
  return context;
}

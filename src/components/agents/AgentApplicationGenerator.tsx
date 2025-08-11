"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DynamicIcon } from "lucide-react/dynamic";
import { getDefaultAgentConfig } from "@/lib/aws-bedrock";
import type { Application } from "@/types/application";

interface GeneratedComponentData {
  type: "dashboard" | "chart" | "table" | "form" | "widget";
  title: string;
  chartType?: string;
  columns?: string[];
  widgets?: Array<{
    title: string;
    value: string;
    description: string;
  }>;
  sampleData?: Record<string, unknown>[];
  metadata?: {
    priority: string;
    category: string;
  };
}

interface GeneratedApplication {
  id: string;
  title: string;
  description: string;
  components: GeneratedComponent[];
  metadata: {
    generatedAt: string;
    userId: string;
    applicationId: string;
  };
}

interface AgentApplicationGeneratorProps {
  application: Application;
  userId: string;
  onApplicationGenerated?: (generatedApp: GeneratedApplication) => void;
}

interface GeneratedComponent {
  id: string;
  type: "dashboard" | "chart" | "table" | "form" | "widget";
  title: string;
  component: React.ReactNode;
  metadata: {
    generatedAt: string;
    agentModel: string;
    userPrompt?: string;
  };
}

export default function AgentApplicationGenerator({
  application,
  userId,
  onApplicationGenerated,
}: AgentApplicationGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedComponents, setGeneratedComponents] = useState<
    GeneratedComponent[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState("");

  const agentConfig = useMemo(() => {
    return getDefaultAgentConfig(application.metadata.alias);
  }, [application.metadata.alias]);

  const generateApplicationComponents = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Call your agent to generate UI components
      const response = await fetch("/api/agents/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: application.metadata.alias,
          userPrompt:
            userPrompt ||
            `Generate a comprehensive dashboard for ${application.metadata.name}`,
          agentConfig,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate application components");
      }

      const generatedData = await response.json();

      // Transform agent response into UI components
      const newComponents: GeneratedComponent[] = generatedData.components.map(
        (comp: GeneratedComponentData, index: number) => ({
          id: `generated-${Date.now()}-${index}`,
          type: comp.type,
          title: comp.title,
          component: renderGeneratedComponent(comp),
          metadata: {
            generatedAt: new Date().toISOString(),
            agentModel: agentConfig.foundationModel,
            userPrompt: userPrompt,
          },
        })
      );

      setGeneratedComponents((prev) => [...prev, ...newComponents]);
      onApplicationGenerated?.(generatedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate application"
      );
    } finally {
      setIsGenerating(false);
    }
  }, [application, agentConfig, userPrompt, userId, onApplicationGenerated]);

  const renderGeneratedComponent = (
    componentData: GeneratedComponentData
  ): React.ReactNode => {
    switch (componentData.type) {
      case "dashboard":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {componentData.widgets?.map(
              (
                widget: { title: string; value: string; description: string },
                index: number
              ) => (
                <Card key={index} className="p-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      {widget.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{widget.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {widget.description}
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        );

      case "chart":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{componentData.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded flex items-center justify-center">
                <DynamicIcon
                  name="bar-chart-3"
                  className="h-8 w-8 text-muted-foreground"
                />
                <span className="ml-2 text-muted-foreground">
                  Chart: {componentData.chartType}
                </span>
              </div>
            </CardContent>
          </Card>
        );

      case "table":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{componentData.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {componentData.columns?.map(
                        (col: string, index: number) => (
                          <th key={index} className="text-left p-2 font-medium">
                            {col}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {componentData.sampleData?.map(
                      (row: Record<string, unknown>, rowIndex: number) => (
                        <tr key={rowIndex} className="border-t">
                          {Object.values(row).map(
                            (cell: unknown, cellIndex: number) => (
                              <td key={cellIndex} className="p-2">
                                {String(cell)}
                              </td>
                            )
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Generated component: {componentData.type}
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  const capabilities = agentConfig.capabilities || [];

  return (
    <div className="space-y-6">
      {/* Agent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DynamicIcon name="bot" className="h-5 w-5" />
            AI Application Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Agent Capabilities:
              </p>
              <div className="flex flex-wrap gap-2">
                {capabilities.map((capability: string) => (
                  <Badge key={capability} variant="secondary">
                    {capability
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="user-prompt" className="text-sm font-medium">
                Describe what you need (optional):
              </label>
              <textarea
                id="user-prompt"
                className="w-full mt-1 p-2 border rounded-md resize-none"
                rows={3}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={`Tell the agent what specific features or layout you need for ${application.metadata.name}`}
              />
            </div>

            <Button
              onClick={generateApplicationComponents}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <DynamicIcon
                    name="loader-2"
                    className="mr-2 h-4 w-4 animate-spin"
                  />
                  Generating Application...
                </>
              ) : (
                <>
                  <DynamicIcon name="wand-2" className="mr-2 h-4 w-4" />
                  Generate Application
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <DynamicIcon name="alert-circle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* Generated Components */}
      {generatedComponents.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">
            Generated Application Components
          </h3>
          {generatedComponents.map((component) => (
            <div key={component.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{component.title}</h4>
                <Badge variant="outline">{component.type}</Badge>
              </div>
              {component.component}
              <p className="text-xs text-muted-foreground">
                Generated at{" "}
                {new Date(component.metadata.generatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

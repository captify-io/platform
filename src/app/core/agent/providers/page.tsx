"use client";

import {
  PageToolbar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
} from "@captify-io/core/components";
import { Plus, Plug, Check, X, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core/lib/api";
import type { Provider, ProviderModel } from "@captify-io/core/types";

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Record<string, ProviderModel[]>>({});
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      // Load all providers
      const providersResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-Provider",
        data: {},
      });

      if (providersResult.success && providersResult.data?.Items) {
        const providersList = providersResult.data.Items as Provider[];
        setProviders(providersList.sort((a, b) => a.order.localeCompare(b.order)));

        // Load models for each provider
        const modelsMap: Record<string, ProviderModel[]> = {};
        await Promise.all(
          providersList.map(async (provider) => {
            const modelsResult = await apiClient.run({
              service: "platform.dynamodb",
              operation: "query",
              table: "core-ProviderModel",
              data: {
                IndexName: "providerId-index",
                KeyConditionExpression: "providerId = :pid",
                ExpressionAttributeValues: {
                  ":pid": provider.id,
                },
              },
            });

            if (modelsResult.success && modelsResult.data?.Items) {
              modelsMap[provider.id] = (modelsResult.data.Items as ProviderModel[]).sort(
                (a, b) => a.order.localeCompare(b.order)
              );
            }
          })
        );
        setModels(modelsMap);
      }
    } catch (error) {
      console.error("Failed to load providers:", error);
    }
  };

  const toggleProvider = (providerId: string) => {
    setExpandedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "deprecated":
        return "bg-yellow-500";
      case "maintenance":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "deprecated":
        return "bg-yellow-500";
      case "preview":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageToolbar
        title="Providers"
        description="Manage LLM providers and models"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">LLM Providers</h2>
              <p className="text-muted-foreground">
                {providers.length} {providers.length === 1 ? "provider" : "providers"} configured
              </p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Provider
            </Button>
          </div>

          {/* Providers List */}
          {providers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Plug className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No providers configured</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Add your first LLM provider to start using AI features
                </p>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {providers.map((provider) => {
                const isExpanded = expandedProviders.has(provider.id);
                const providerModels = models[provider.id] || [];

                return (
                  <Card key={provider.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleProvider(provider.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <Plug className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-xl">{provider.name}</CardTitle>
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(provider.status)} text-white border-0`}
                              >
                                {provider.status}
                              </Badge>
                              <Badge variant="outline">
                                {providerModels.length} {providerModels.length === 1 ? "model" : "models"}
                              </Badge>
                            </div>
                            <CardDescription className="mt-1">
                              {provider.description}
                            </CardDescription>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {provider.features.streaming && (
                                <Badge variant="secondary" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Streaming
                                </Badge>
                              )}
                              {provider.features.functionCalling && (
                                <Badge variant="secondary" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Tools
                                </Badge>
                              )}
                              {provider.features.vision && (
                                <Badge variant="secondary" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Vision
                                </Badge>
                              )}
                              {provider.features.embeddings && (
                                <Badge variant="secondary" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Embeddings
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="border-t pt-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground mb-3">
                            Available Models
                          </h4>
                          {providerModels.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No models configured for this provider
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {providerModels.map((model) => (
                                <div
                                  key={model.id}
                                  className="border rounded-lg p-3 hover:bg-muted/50"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="font-medium text-sm">{model.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {model.modelId}
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`${getModelStatusColor(model.status)} text-white border-0 text-xs`}
                                    >
                                      {model.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {model.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {model.features.streaming && (
                                      <Badge variant="outline" className="text-xs">
                                        Streaming
                                      </Badge>
                                    )}
                                    {model.features.tools && (
                                      <Badge variant="outline" className="text-xs">
                                        Tools
                                      </Badge>
                                    )}
                                    {model.features.vision && (
                                      <Badge variant="outline" className="text-xs">
                                        Vision
                                      </Badge>
                                    )}
                                    {model.features.jsonMode && (
                                      <Badge variant="outline" className="text-xs">
                                        JSON
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                                    <div>Context: {model.limits.contextWindow.toLocaleString()} tokens</div>
                                    <div>Max output: {model.limits.maxTokens.toLocaleString()} tokens</div>
                                    {model.pricing && (
                                      <div className="mt-1">
                                        ${model.pricing.inputTokens}/M in • ${model.pricing.outputTokens}/M out
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

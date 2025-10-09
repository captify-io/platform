"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Brain, Eye, RefreshCw } from "lucide-react";
import { getEntitiesByTenant, listSageMakerModels, listSageMakerEndpoints } from "@/lib/ontology";
import type { Model } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function ModelsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [sageMakerModels, setSageMakerModels] = useState<any[]>([]);
  const [sageMakerEndpoints, setSageMakerEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSageMaker, setLoadingSageMaker] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadModels();
      loadSageMakerResources();
    }
  }, [session]);

  async function loadModels() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<Model>(ONTOLOGY_TABLES.MODEL, tenantId);
    if (response.success && response.data?.items) {
      setModels(response.data.items);
    }
    setLoading(false);
  }

  async function loadSageMakerResources() {
    setLoadingSageMaker(true);
    const [modelsRes, endpointsRes] = await Promise.all([
      listSageMakerModels(),
      listSageMakerEndpoints(),
    ]);
    if (modelsRes.success && modelsRes.data?.Models) {
      setSageMakerModels(modelsRes.data.Models);
    }
    if (endpointsRes.success && endpointsRes.data?.Endpoints) {
      setSageMakerEndpoints(endpointsRes.data.Endpoints);
    }
    setLoadingSageMaker(false);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Models</h1>
          <p className="text-muted-foreground">Manage ML models and SageMaker resources</p>
        </div>
        <button
          onClick={() => router.push("/captify/ontology/models/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Model
        </button>
      </div>

      {/* SageMaker Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <h2 className="text-xl font-semibold">SageMaker Models</h2>
            </div>
            <button
              onClick={loadSageMakerResources}
              disabled={loadingSageMaker}
              className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${loadingSageMaker ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loadingSageMaker ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : sageMakerModels.length > 0 ? (
            <div className="space-y-2">
              {sageMakerModels.slice(0, 5).map((model) => (
                <div key={model.ModelName} className="border rounded p-2 text-sm">
                  <div className="font-medium">{model.ModelName}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(model.CreationTime).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {sageMakerModels.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{sageMakerModels.length - 5} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No models found</div>
          )}
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5" />
            <h2 className="text-xl font-semibold">SageMaker Endpoints</h2>
          </div>
          {loadingSageMaker ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : sageMakerEndpoints.length > 0 ? (
            <div className="space-y-2">
              {sageMakerEndpoints.slice(0, 5).map((endpoint) => (
                <div key={endpoint.EndpointName} className="border rounded p-2 text-sm">
                  <div className="font-medium">{endpoint.EndpointName}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded ${
                      endpoint.EndpointStatus === "InService"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {endpoint.EndpointStatus}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(endpoint.CreationTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {sageMakerEndpoints.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{sageMakerEndpoints.length - 5} more
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No endpoints found</div>
          )}
        </div>
      </div>

      {/* Registered Models */}
      {loading ? (
        <div className="text-center py-12">Loading models...</div>
      ) : models.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No models registered yet</p>
          <button
            onClick={() => router.push("/captify/ontology/models/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Register First Model
          </button>
        </div>
      ) : (
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Registered Models ({models.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="border rounded p-4 hover:bg-muted cursor-pointer"
                onClick={() => router.push(`/captify/ontology/models/${model.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium">{model.name}</div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
                {model.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {model.description}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded">
                    {model.framework}
                  </span>
                  <span className="text-muted-foreground">v{model.version}</span>
                </div>
                {model.sageMakerModelName && (
                  <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                    SageMaker: {model.sageMakerModelName}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

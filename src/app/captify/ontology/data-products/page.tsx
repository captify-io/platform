"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Database, Eye, RefreshCw } from "lucide-react";
import { getEntitiesByTenant, listGlueDatabases, listGlueTables } from "@/lib/ontology";
import type { DataProduct } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function DataProductsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [dataProducts, setDataProducts] = useState<DataProduct[]>([]);
  const [glueDatabases, setGlueDatabases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGlue, setLoadingGlue] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadDataProducts();
      loadGlueResources();
    }
  }, [session]);

  async function loadDataProducts() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<DataProduct>(ONTOLOGY_TABLES.DATA_PRODUCT, tenantId);
    if (response.success && response.data?.items) {
      setDataProducts(response.data.items);
    }
    setLoading(false);
  }

  async function loadGlueResources() {
    setLoadingGlue(true);
    const response = await listGlueDatabases();
    if (response.success && response.data?.DatabaseList) {
      setGlueDatabases(response.data.DatabaseList);
    }
    setLoadingGlue(false);
  }

  const byStage = dataProducts.reduce((acc, dp) => {
    const stage = dp.lifecycleStage;
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(dp);
    return acc;
  }, {} as Record<string, DataProduct[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Products</h1>
          <p className="text-muted-foreground">Manage data assets and AWS Glue resources</p>
        </div>
        <button
          onClick={() => router.push("/captify/ontology/data-products/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Data Product
        </button>
      </div>

      {/* AWS Glue Resources */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h2 className="text-xl font-semibold">AWS Glue Databases</h2>
          </div>
          <button
            onClick={loadGlueResources}
            disabled={loadingGlue}
            className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 ${loadingGlue ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
        {loadingGlue ? (
          <div className="text-sm text-muted-foreground">Loading Glue resources...</div>
        ) : glueDatabases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {glueDatabases.map((db) => (
              <div key={db.Name} className="border rounded p-3 hover:bg-muted">
                <div className="font-medium">{db.Name}</div>
                <div className="text-sm text-muted-foreground">{db.Description || "No description"}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No Glue databases found</div>
        )}
      </div>

      {/* Data Products by Stage */}
      {loading ? (
        <div className="text-center py-12">Loading data products...</div>
      ) : dataProducts.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No data products yet</p>
          <button
            onClick={() => router.push("/captify/ontology/data-products/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create First Data Product
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {["operational", "continuous", "prototype", "validation", "ideation", "retired"].map((stage) => {
            const products = byStage[stage] || [];
            if (products.length === 0) return null;

            return (
              <div key={stage} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 capitalize">{stage} ({products.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((dp) => (
                    <div
                      key={dp.id}
                      className="border rounded p-4 hover:bg-muted cursor-pointer"
                      onClick={() => router.push(`/captify/ontology/data-products/${dp.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">{dp.name}</div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {dp.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {dp.description}
                        </p>
                      )}
                      {dp.glueDatabase && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          <Database className="h-3 w-3" />
                          {dp.glueDatabase}{dp.glueTable ? `.${dp.glueTable}` : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

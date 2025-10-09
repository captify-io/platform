"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Zap, Eye } from "lucide-react";
import { getEntitiesByTenant } from "@/lib/ontology";
import type { Capability } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function CapabilitiesPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadCapabilities();
    }
  }, [session]);

  async function loadCapabilities() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<Capability>(ONTOLOGY_TABLES.CAPABILITY, tenantId);
    if (response.success && response.data?.items) {
      setCapabilities(response.data.items);
    }
    setLoading(false);
  }

  const capsByMaturity = capabilities.reduce((acc, cap) => {
    acc[cap.maturity] = (acc[cap.maturity] || []);
    acc[cap.maturity].push(cap);
    return acc;
  }, {} as Record<string, Capability[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Capabilities</h1>
          <p className="text-muted-foreground">Track business and technical capabilities</p>
        </div>
        <button
          onClick={() => router.push("/captify/ontology/capabilities/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Capability
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading capabilities...</div>
      ) : capabilities.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No capabilities defined yet</p>
          <button
            onClick={() => router.push("/captify/ontology/capabilities/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Define First Capability
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {["operational", "continuous", "prototype", "validation", "ideation", "retired"].map((stage) => {
            const stageCaps = capsByMaturity[stage] || [];
            if (stageCaps.length === 0) return null;

            return (
              <div key={stage} className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 capitalize">{stage} ({stageCaps.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stageCaps.map((cap) => (
                    <div
                      key={cap.id}
                      className="border rounded p-4 hover:bg-muted cursor-pointer"
                      onClick={() => router.push(`/captify/ontology/capabilities/${cap.id}`)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-medium">{cap.name}</div>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                      {cap.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {cap.description}
                        </p>
                      )}
                      {cap.refreshCadence && (
                        <div className="text-xs text-muted-foreground">
                          Refresh: {cap.refreshCadence}
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

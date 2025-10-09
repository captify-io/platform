"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Server, Eye } from "lucide-react";
import { getEntitiesByTenant } from "@/lib/ontology";
import type { System } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function SystemsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      loadSystems();
    }
  }, [session]);

  async function loadSystems() {
    setLoading(true);
    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<System>(ONTOLOGY_TABLES.SYSTEM, tenantId);
    if (response.success && response.data?.items) {
      setSystems(response.data.items);
    }
    setLoading(false);
  }

  const systemsByType = systems.reduce((acc, system) => {
    acc[system.type] = (acc[system.type] || []);
    acc[system.type].push(system);
    return acc;
  }, {} as Record<string, System[]>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Systems</h1>
          <p className="text-muted-foreground">Manage integrated systems and platforms</p>
        </div>
        <button
          onClick={() => router.push("/captify/ontology/systems/new")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New System
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading systems...</div>
      ) : systems.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-lg">
          <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">No systems registered yet</p>
          <button
            onClick={() => router.push("/captify/ontology/systems/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Register First System
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(systemsByType).map(([type, typeSystems]) => (
            <div key={type} className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 capitalize">{type} ({typeSystems.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {typeSystems.map((system) => (
                  <div
                    key={system.id}
                    className="border rounded p-4 hover:bg-muted cursor-pointer"
                    onClick={() => router.push(`/captify/ontology/systems/${system.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{system.name}</div>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {system.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {system.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        system.status === "active" ? "bg-green-100 text-green-800" :
                        system.status === "inactive" ? "bg-muted text-foreground" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {system.status}
                      </span>
                      {system.url && (
                        <span className="text-xs text-blue-600">Has URL</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

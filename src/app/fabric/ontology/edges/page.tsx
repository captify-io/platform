"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core/lib/api";
import { Plus, Search, Filter, ArrowRight } from "lucide-react";
import { Button, Input } from "@captify-io/core/ui";

interface OntologyEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  sourceType?: string;
  targetType?: string;
  active: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EdgesPage() {
  const [edges, setEdges] = useState<OntologyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [relationFilter, setRelationFilter] = useState<string>("all");

  useEffect(() => {
    loadEdges();
  }, []);

  async function loadEdges() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "core-ontology-edge",
        data: {
          ProjectionExpression:
            "id,#src,#tgt,relation,sourceType,targetType,active,description,createdAt,updatedAt",
          ExpressionAttributeNames: {
            "#src": "source",
            "#tgt": "target",
          },
        },
      });

      if (response.success && response.data?.Items) {
        setEdges(response.data.Items as OntologyEdge[]);
      }
    } catch (error) {
      console.error("Failed to load edges:", error);
    } finally {
      setLoading(false);
    }
  }

  // Filter edges
  const filteredEdges = edges.filter((edge) => {
    const matchesSearch =
      searchTerm === "" ||
      edge.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edge.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      edge.relation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRelation =
      relationFilter === "all" || edge.relation === relationFilter;

    return matchesSearch && matchesRelation;
  });

  // Get unique relations for filter
  const relations = Array.from(new Set(edges.map((e) => e.relation))).sort();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading edges...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search edges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={relationFilter}
                onChange={(e) => setRelationFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Relations</option>
                {relations.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Edge
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="border-b bg-muted/50 px-6 py-2 text-sm text-muted-foreground">
        Showing {filteredEdges.length} of {edges.length} edges
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 border-b bg-background">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Source
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground">
                Relation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEdges.map((edge) => (
              <tr key={edge.id} className="hover:bg-muted/50">
                <td className="px-6 py-4 text-sm font-mono">{edge.id}</td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{edge.source}</div>
                    {edge.sourceType && (
                      <div className="text-xs text-muted-foreground">
                        {edge.sourceType}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span className="inline-flex rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-500">
                      {edge.relation}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium">{edge.target}</div>
                    {edge.targetType && (
                      <div className="text-xs text-muted-foreground">
                        {edge.targetType}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                  {edge.description || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      edge.active === "true"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}
                  >
                    {edge.active === "true" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEdges.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground">No edges found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

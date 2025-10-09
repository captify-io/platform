"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, FileText, DollarSign, Calendar, Eye, Edit, Trash2 } from "lucide-react";
import { getEntitiesByTenant, deleteEntity } from "@/lib/ontology";
import type { Contract } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function ContractsPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userGroups = (session as any)?.groups || [];
  const hasEditAccess = userGroups.some((g: string) =>
    g.includes("admin") || g.includes("program-manager")
  );

  useEffect(() => {
    if (session?.user) {
      loadContracts();
    }
  }, [session]);

  async function loadContracts() {
    setLoading(true);
    setError("");

    const tenantId = (session.user as any).tenantId || "default";
    const response = await getEntitiesByTenant<Contract>(
      ONTOLOGY_TABLES.CONTRACT,
      tenantId
    );

    if (response.success && response.data?.items) {
      setContracts(response.data.items);
    } else {
      setError(response.error || "Failed to load contracts");
    }

    setLoading(false);
  }

  async function handleDelete(contractId: string) {
    if (!confirm("Are you sure you want to delete this contract? This will also affect linked CLINs.")) {
      return;
    }

    const response = await deleteEntity(ONTOLOGY_TABLES.CONTRACT, contractId);
    if (response.success) {
      setContracts(contracts.filter((c) => c.id !== contractId));
    } else {
      alert("Failed to delete contract: " + response.error);
    }
  }

  const activeContracts = contracts.filter((c) => c.status === "active");
  const completedContracts = contracts.filter((c) => c.status === "completed");
  const terminatedContracts = contracts.filter((c) => c.status === "terminated");

  return (
    <div className="h-full w-full bg-background p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contracts & CLINs</h1>
            <p className="text-muted-foreground">
              Manage contracts and link funding to outcomes
            </p>
          </div>
          {hasEditAccess && (
            <button
              onClick={() => router.push("/captify/strategy/contracts/new")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Contract
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading contracts...</div>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            Error: {error}
          </div>
        )}

        {!loading && !error && contracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No contracts found</p>
            {hasEditAccess && (
              <button
                onClick={() => router.push("/captify/strategy/contracts/new")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Create Your First Contract
              </button>
            )}
          </div>
        )}

        {!loading && !error && contracts.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 border rounded-lg bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Contracts
                </div>
                <div className="text-2xl font-bold">{contracts.length}</div>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <div className="text-sm text-muted-foreground mb-1">Active</div>
                <div className="text-2xl font-bold text-green-600">
                  {activeContracts.length}
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  Completed
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {completedContracts.length}
                </div>
              </div>
              <div className="p-4 border rounded-lg bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  Terminated
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {terminatedContracts.length}
                </div>
              </div>
            </div>

            {/* Contracts Table */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-gray-200">
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-muted">
                      <td className="px-6 py-4">
                        <div className="font-medium">{contract.name}</div>
                        {contract.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {contract.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {contract.contractNumber}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {contract.customer}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {new Date(contract.startDate).toLocaleDateString()} -{" "}
                        {new Date(contract.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            contract.status === "active"
                              ? "bg-green-100 text-green-800"
                              : contract.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              router.push(`/captify/strategy/contracts/${contract.id}`)
                            }
                            className="p-2 hover:bg-muted rounded"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {hasEditAccess && (
                            <>
                              <button
                                onClick={() =>
                                  router.push(`/captify/strategy/contracts/${contract.id}/edit`)
                                }
                                className="p-2 hover:bg-muted rounded"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(contract.id)}
                                className="p-2 hover:bg-red-100 rounded text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

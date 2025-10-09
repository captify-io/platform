"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { createEntity, createBaseEntity } from "@/lib/ontology";
import type { Contract } from "@/types/ontology";
import { ONTOLOGY_TABLES } from "@/types/ontology";

export default function NewContractPage() {
  const { session } = useCaptify();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contractNumber: "",
    customer: "",
    startDate: "",
    endDate: "",
    status: "active" as const,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.contractNumber.trim() || !formData.customer.trim()) {
      setError("Name, contract number, and customer are required");
      return;
    }

    setLoading(true);

    try {
      const tenantId = (session.user as any).tenantId || "default";
      const userId = session.user.id || (session.user as any).userId;

      const baseEntity = createBaseEntity(tenantId, userId, formData.name, formData.description);

      const contract: Contract = {
        ...baseEntity,
        id: baseEntity.id!,
        slug: baseEntity.slug!,
        tenantId: baseEntity.tenantId!,
        name: baseEntity.name!,
        app: baseEntity.app!,
        order: baseEntity.order!,
        fields: baseEntity.fields!,
        description: baseEntity.description!,
        ownerId: baseEntity.ownerId!,
        createdAt: baseEntity.createdAt!,
        createdBy: baseEntity.createdBy!,
        updatedAt: baseEntity.updatedAt!,
        updatedBy: baseEntity.updatedBy!,
        contractNumber: formData.contractNumber,
        customer: formData.customer,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        totalValue: 0,
        clins: [],
      };

      const response = await createEntity<Contract>(ONTOLOGY_TABLES.CONTRACT, contract);

      if (response.success) {
        router.push("/captify/strategy/contracts");
      } else {
        setError(response.error || "Failed to create contract");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push("/captify/strategy/contracts")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Contracts
        </button>
        <h1 className="text-3xl font-bold">Create New Contract</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
            {error}
          </div>
        )}

        <div className="bg-card border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Contract Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Contract Number <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Customer <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Creating..." : "Create Contract"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/captify/strategy/contracts")}
            className="px-6 py-3 border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

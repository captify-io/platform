import React from "react";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { UnifiedSearchPage } from "@/components/search/UnifiedSearchPage";

export default function SearchDemoPage() {
  return (
    <AuthenticatedLayout>
      <div className="p-6">
        <UnifiedSearchPage />
      </div>
    </AuthenticatedLayout>
  );
}

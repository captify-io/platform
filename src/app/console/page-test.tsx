"use client";

import { ApplicationLayout } from "@/components/layout/ApplicationLayout";

export default function ConsolePage() {
  return (
    <ApplicationLayout
      applicationName="Aircraft Readiness Assistant"
      applicationId="aircraft-console"
      chatWelcomeMessage="Hello! I'm your Aircraft Readiness Assistant."
      chatPlaceholder="Ask about aircraft status..."
      showChat={true}
      chatWidth={420}
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Aircraft Readiness Dashboard
          </h1>
          <p className="text-sm text-gray-600">
            Real-time aircraft status and maintenance overview
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-4 border border-gray-200">
            <h2 className="text-lg font-semibold">Test Section</h2>
            <p>This is a minimal test to verify the structure works.</p>
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}

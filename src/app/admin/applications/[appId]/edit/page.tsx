"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useApps } from "@/context/AppsContext";
import { ApplicationLayout } from "@/components/apps/ApplicationLayout";
import { ApplicationEntity } from "@/types/database";
import { ApplicationSettingsTab } from "@/components/admin/application-editor/ApplicationSettingsTab";
import { ApplicationAgentTab } from "@/components/admin/application-editor/ApplicationAgentTab";
import { ApplicationMenuItemsTab } from "@/components/admin/application-editor/ApplicationMenuItemsTab";
import { ApplicationPermissionsTab } from "@/components/admin/application-editor/ApplicationPermissionsTab";

export default function ApplicationEditPage() {
  const params = useParams();
  const { applications, loading } = useApps();
  const [application, setApplication] = useState<ApplicationEntity | null>(
    null
  );
  const [activeTab] = useState<string>("settings");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const appId = params?.appId as string;

  // Find the application
  useEffect(() => {
    if (appId && applications.length > 0) {
      const app = applications.find(
        (app) => app.id === appId || app.app_id === appId
      );
      if (app) {
        setApplication(app);
      }
    }
  }, [appId, applications]);

  const renderTabContent = () => {
    if (!application) return null;

    switch (activeTab) {
      case "settings":
        return (
          <ApplicationSettingsTab
            application={application}
            onUpdate={setApplication}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        );
      case "agent":
        return (
          <ApplicationAgentTab
            application={application}
            onUpdate={setApplication}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        );
      case "menu-items":
        return (
          <ApplicationMenuItemsTab
            application={application}
            onUpdate={setApplication}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        );
      case "permissions":
        return (
          <ApplicationPermissionsTab
            application={application}
            onUpdate={setApplication}
            onUnsavedChanges={setHasUnsavedChanges}
          />
        );
      default:
        return <div>Tab not found</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Loading application details</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Application Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The application with ID &quot;{appId}&quot; could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ApplicationLayout
      applicationId={`editor-${application.id}`}
      applicationName={`Edit: ${
        application.metadata?.name || application.app_id
      }`}
      showChat={false}
    >
      <div className="h-full bg-background overflow-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Edit Application
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Configure settings, agent, menu items, and permissions for{" "}
                  <span className="font-medium">
                    {application.metadata?.name || application.app_id}
                  </span>
                </p>
              </div>
              {hasUnsavedChanges && (
                <div className="flex items-center space-x-2 text-amber-600">
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-card border border-border rounded-lg">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </ApplicationLayout>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ApplicationEntity } from "@/types/database";
import { ApplicationCategory } from "@/types/application";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, RefreshCw, AlertCircle } from "lucide-react";

interface ApplicationSettingsTabProps {
  application: ApplicationEntity;
  onUpdate: (application: ApplicationEntity) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function ApplicationSettingsTab({
  application,
  onUpdate,
  onUnsavedChanges,
}: ApplicationSettingsTabProps) {
  const [formData, setFormData] = useState({
    name: application.metadata?.name || "",
    description: application.metadata?.description || "",
    status: application.status || "active",
    category: application.metadata?.category || "",
    tags: application.metadata?.tags?.join(", ") || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track changes
  useEffect(() => {
    const hasChanges =
      formData.name !== (application.metadata?.name || "") ||
      formData.description !== (application.metadata?.description || "") ||
      formData.status !== (application.status || "active") ||
      formData.category !== (application.metadata?.category || "") ||
      formData.tags !== (application.metadata?.tags?.join(", ") || "");

    onUnsavedChanges(hasChanges);
  }, [formData, application, onUnsavedChanges]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare update data
      const updateData = {
        metadata: {
          ...application.metadata,
          id: application.metadata?.id ?? "",
          alias: application.metadata?.alias ?? "",
          name: formData.name,
          description: formData.description,
          version: application.metadata?.version ?? "1.0.0",
          category: formData.category as ApplicationCategory,
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          icon: application.metadata?.icon ?? "App",
          color: application.metadata?.color ?? "bg-blue-500",
          status: application.metadata?.status ?? "active",
          visibility: application.metadata?.visibility ?? "public",
          createdAt:
            application.metadata?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: application.metadata?.createdBy ?? "",
          organization: application.metadata?.organization ?? "",
        },
        status: formData.status,
      };

      // For now, we'll just update the local state
      // In a real implementation, you'd call an API to save the data
      const updatedApp = { ...application, ...updateData };
      onUpdate(updatedApp);

      setSuccess("Application settings saved successfully!");
      onUnsavedChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to save application settings:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save settings"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Application Settings
          </h2>
          <p className="text-muted-foreground">
            Configure basic application details and metadata
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter application name"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display name for this application
              </p>
            </div>

            <div>
              <Label htmlFor="app-description">Description</Label>
              <Textarea
                id="app-description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe what this application does..."
                className="mt-1"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Brief description of the application&apos;s purpose
              </p>
            </div>

            <div>
              <Label htmlFor="app-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="productivity">Productivity</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Current status of the application
              </p>
            </div>

            <div>
              <Label htmlFor="app-tags">Tags</Label>
              <Input
                id="app-tags"
                value={formData.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Comma-separated tags for organization
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  <strong>Application ID:</strong> {application.app_id}
                </div>
                <div>
                  <strong>Created:</strong>{" "}
                  {application.metadata?.createdAt
                    ? new Date(
                        application.metadata.createdAt
                      ).toLocaleDateString()
                    : "Unknown"}
                </div>
                <div>
                  <strong>Last Updated:</strong>{" "}
                  {application.metadata?.updatedAt
                    ? new Date(
                        application.metadata.updatedAt
                      ).toLocaleDateString()
                    : "Unknown"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Application Type</Label>
              <p className="text-sm text-muted-foreground">
                Standard Application
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Organization</Label>
              <p className="text-sm text-muted-foreground">
                {application.metadata?.organization || "Default"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

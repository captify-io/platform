"use client";

import {
  PageToolbar,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@captify-io/core";
import { Plus, AppWindow, ExternalLink, Database, Bot, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core";
import type { App } from "@captify-io/core/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);

      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "captify-core-app",
        data: {},
      });

      if (result.success && result.data?.Items) {
        const apps = result.data.Items as App[];
        setApplications(apps.sort((a, b) => a.order.localeCompare(b.order)));
      }
    } catch (error) {
      console.error("Failed to load applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-gray-500";
      case "maintenance":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case "public":
        return "bg-blue-500";
      case "internal":
        return "bg-purple-500";
      case "private":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <PageToolbar
          title="Applications"
          description="Manage platform applications"
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageToolbar
        title="Applications"
        description="Manage platform applications"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Platform Applications</h2>
              <p className="text-muted-foreground">
                {applications.length} {applications.length === 1 ? "application" : "applications"} registered
              </p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>

          {/* Applications Grid */}
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <AppWindow className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No applications found</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Get started by adding your first application
                </p>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Application
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applications.map((app) => (
                <Card
                  key={app.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <AppWindow className="h-8 w-8" />
                        <div>
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(app.status)} text-white border-0 text-xs`}
                            >
                              {app.status}
                            </Badge>
                            {app.visibility && (
                              <Badge
                                variant="outline"
                                className={`${getVisibilityColor(app.visibility)} text-white border-0 text-xs`}
                              >
                                {app.visibility}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {app.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Slug:</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{app.slug}</code>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Version:</span>
                        <span className="text-xs">{app.version}</span>
                      </div>
                      {app.category && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Category:</span>
                          <Badge variant="secondary" className="text-xs">
                            {app.category}
                          </Badge>
                        </div>
                      )}
                      {app.menu && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Menu Items:</span>
                          <span className="text-xs">{app.menu.length}</span>
                        </div>
                      )}
                    </div>

                    {/* AWS Resources */}
                    {(app.agentId || app.knowledgeBaseId || app.s3BucketName) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="text-xs text-muted-foreground mb-2 font-semibold">
                          AWS Resources:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {app.agentId && (
                            <Badge variant="outline" className="text-xs">
                              <Bot className="h-3 w-3 mr-1" />
                              Agent
                            </Badge>
                          )}
                          {app.knowledgeBaseId && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              KB
                            </Badge>
                          )}
                          {app.s3BucketName && (
                            <Badge variant="outline" className="text-xs">
                              <Database className="h-3 w-3 mr-1" />
                              S3
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                      {app.href && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(app.href, "_blank");
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AppWindow className="h-5 w-5" />
              {selectedApp?.name}
            </DialogTitle>
            <DialogDescription>{selectedApp?.description}</DialogDescription>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">ID</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedApp.id}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Slug</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedApp.slug}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Version</div>
                    <div>{selectedApp.version}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Status</div>
                    <Badge className={`${getStatusColor(selectedApp.status)} text-white border-0`}>
                      {selectedApp.status}
                    </Badge>
                  </div>
                  {selectedApp.visibility && (
                    <div>
                      <div className="text-muted-foreground mb-1">Visibility</div>
                      <Badge className={`${getVisibilityColor(selectedApp.visibility)} text-white border-0`}>
                        {selectedApp.visibility}
                      </Badge>
                    </div>
                  )}
                  {selectedApp.category && (
                    <div>
                      <div className="text-muted-foreground mb-1">Category</div>
                      <Badge variant="secondary">{selectedApp.category}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* AWS Resources */}
              {(selectedApp.agentId || selectedApp.knowledgeBaseId || selectedApp.s3BucketName) && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">AWS Resources</h3>
                  <div className="space-y-2 text-sm">
                    {selectedApp.agentId && (
                      <div className="flex items-start justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">Bedrock Agent</div>
                          <code className="text-xs text-muted-foreground">{selectedApp.agentId}</code>
                        </div>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {selectedApp.knowledgeBaseId && (
                      <div className="flex items-start justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">Knowledge Base</div>
                          <code className="text-xs text-muted-foreground">{selectedApp.knowledgeBaseId}</code>
                        </div>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {selectedApp.s3BucketName && (
                      <div className="flex items-start justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="font-medium">S3 Bucket</div>
                          <code className="text-xs text-muted-foreground">{selectedApp.s3BucketName}</code>
                        </div>
                        <Database className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Menu Structure */}
              {selectedApp.menu && selectedApp.menu.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Menu Structure ({selectedApp.menu.length} items)</h3>
                  <div className="space-y-2">
                    {selectedApp.menu.map((item) => (
                      <div key={item.id} className="border rounded p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.label}</span>
                          <Badge variant="secondary" className="text-xs">
                            Order: {item.order}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{item.description}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <code className="bg-muted px-2 py-1 rounded">{item.href}</code>
                          {item.icon && (
                            <Badge variant="outline" className="text-xs">
                              {item.icon}
                            </Badge>
                          )}
                        </div>
                        {item.children && item.children.length > 0 && (
                          <div className="mt-2 ml-4 space-y-1">
                            {item.children.map((child) => (
                              <div key={child.id} className="text-xs text-muted-foreground">
                                • {child.label} ({child.href})
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Created</div>
                    <div className="text-xs">{new Date(selectedApp.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Updated</div>
                    <div className="text-xs">{new Date(selectedApp.updatedAt).toLocaleString()}</div>
                  </div>
                  {selectedApp.createdBy && (
                    <div>
                      <div className="text-muted-foreground mb-1">Created By</div>
                      <div className="text-xs">{selectedApp.createdBy}</div>
                    </div>
                  )}
                  {selectedApp.updatedBy && (
                    <div>
                      <div className="text-muted-foreground mb-1">Updated By</div>
                      <div className="text-xs">{selectedApp.updatedBy}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" disabled>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Configuration
                </Button>
                <Button variant="outline" onClick={() => setSelectedApp(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

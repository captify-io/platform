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
  Input,
  Label,
  Textarea,
} from "@captify-io/core/components";
import { Plus, Database, Folder, Users, Settings, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@captify-io/core/lib/api";
import type { Space } from "@captify-io/core/types";

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "team" as const,
    visibility: "team" as const,
  });

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);

      const result = await apiClient.run({
        service: "platform.dynamodb",
        operation: "scan",
        table: "captify-core-Space",
        data: {},
      });

      if (result.success && result.data?.Items) {
        const spacesList = result.data.Items as Space[];
        setSpaces(spacesList.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error("Failed to load spaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a space name");
      return;
    }

    try {
      setCreating(true);

      // Generate UUID for space
      const spaceId = `space-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const now = new Date().toISOString();

      // S3 bucket name (must be globally unique and lowercase)
      const s3Bucket = `captify-space-${spaceId}`;
      const s3Prefix = "files";

      // Create S3 bucket first
      const s3Result = await apiClient.run({
        service: "platform.s3",
        operation: "createBucket",
        data: {
          Bucket: s3Bucket,
          CreateBucketConfiguration: {
            LocationConstraint: "us-east-1"
          }
        }
      });

      if (!s3Result.success) {
        throw new Error(`Failed to create S3 bucket: ${s3Result.error}`);
      }

      console.log("S3 bucket created:", s3Bucket);

      // Create DynamoDB entry
      const dynamoResult = await apiClient.run({
        service: "platform.dynamodb",
        operation: "put",
        table: "captify-core-Space",
        data: {
          Item: {
            id: spaceId,
            slug: slug,
            tenantId: "default",
            name: formData.name,
            description: formData.description,
            app: "platform",
            type: formData.type,
            visibility: formData.visibility,
            status: "active",

            // S3 configuration
            s3Bucket: s3Bucket,
            s3Prefix: s3Prefix,

            // Initialize empty members array with current user as owner
            members: [{
              userId: "current-user", // TODO: Get from session
              role: "owner",
              joinedAt: now
            }],

            // Settings
            settings: {
              allowUploads: true,
              maxFileSize: 104857600, // 100MB
              allowedFileTypes: ["*"],
              autoSync: false,
              syncSchedule: "manual"
            },

            // Stats
            stats: {
              fileCount: 0,
              totalSize: 0,
              knowledgeItemCount: 0,
              lastActivityAt: now
            },

            order: Date.now().toString(),
            fields: {},
            ownerId: "current-user", // TODO: Get from session
            createdAt: now,
            createdBy: "current-user", // TODO: Get from session
            updatedAt: now,
            updatedBy: "current-user" // TODO: Get from session
          }
        }
      });

      if (!dynamoResult.success) {
        throw new Error(`Failed to create space: ${dynamoResult.error}`);
      }

      console.log("Space created in DynamoDB:", spaceId);

      // Reset form and reload
      setFormData({
        name: "",
        description: "",
        type: "team",
        visibility: "team",
      });
      setCreateDialogOpen(false);
      await loadSpaces();

      alert(`Space "${formData.name}" created successfully!\nS3 Bucket: ${s3Bucket}`);
    } catch (error) {
      console.error("Failed to create space:", error);
      alert(`Error creating space: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "archived":
        return "bg-gray-500";
      default:
        return "bg-blue-500";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "team":
        return <Users className="h-4 w-4" />;
      case "project":
        return <Folder className="h-4 w-4" />;
      case "personal":
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <PageToolbar
          title="Spaces"
          description="Manage data spaces with files and knowledge"
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageToolbar
        title="Spaces"
        description="Manage data spaces with files and knowledge"
      />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Spaces</h2>
              <p className="text-muted-foreground">
                {spaces.length} {spaces.length === 1 ? "space" : "spaces"} created
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Space
            </Button>
          </div>

          {/* Spaces Grid */}
          {spaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Database className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No spaces yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Create your first space to organize files, knowledge, and resources for your team
                </p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Space
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.map((space) => (
                <Card
                  key={space.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedSpace(space)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(space.type)}
                        <div>
                          <CardTitle className="text-lg">{space.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(space.status)} text-white border-0 text-xs`}
                            >
                              {space.status}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {space.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2 line-clamp-2">
                      {space.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Files:</span>
                          <span className="font-medium">{space.stats?.fileCount || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Members:</span>
                          <span className="font-medium">{space.members?.length || 0}</span>
                        </div>
                      </div>

                      {/* S3 Bucket */}
                      <div className="pt-3 border-t">
                        <div className="text-xs text-muted-foreground mb-1">S3 Bucket:</div>
                        <code className="text-xs bg-muted px-2 py-1 rounded block truncate">
                          {space.s3Bucket}
                        </code>
                      </div>

                      {/* Action Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpace(space);
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Space Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Space</DialogTitle>
            <DialogDescription>
              Create a space to organize files, knowledge, and resources
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSpace} className="space-y-4">
            <div>
              <Label htmlFor="name">Space Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Project Documentation"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will this space be used for?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="team">Team</option>
                <option value="project">Project</option>
                <option value="personal">Personal</option>
                <option value="shared">Shared</option>
              </select>
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <select
                id="visibility"
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Space
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Space Detail Dialog */}
      <Dialog open={!!selectedSpace} onOpenChange={(open) => !open && setSelectedSpace(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSpace && getTypeIcon(selectedSpace.type)}
              {selectedSpace?.name}
            </DialogTitle>
            <DialogDescription>{selectedSpace?.description}</DialogDescription>
          </DialogHeader>

          {selectedSpace && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">ID</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{selectedSpace.id}</code>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Type</div>
                    <Badge variant="secondary">{selectedSpace.type}</Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Status</div>
                    <Badge className={`${getStatusColor(selectedSpace.status)} text-white border-0`}>
                      {selectedSpace.status}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Visibility</div>
                    <Badge variant="outline">{selectedSpace.visibility}</Badge>
                  </div>
                </div>
              </div>

              {/* S3 Configuration */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Storage Configuration</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-muted rounded">
                    <div className="text-sm font-medium mb-1">S3 Bucket</div>
                    <code className="text-xs">{selectedSpace.s3Bucket}</code>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <div className="text-sm font-medium mb-1">S3 Prefix</div>
                    <code className="text-xs">{selectedSpace.s3Prefix}</code>
                  </div>
                </div>
              </div>

              {/* Stats */}
              {selectedSpace.stats && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Files</div>
                      <div className="text-2xl font-bold">{selectedSpace.stats.fileCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Total Size</div>
                      <div className="text-2xl font-bold">
                        {((selectedSpace.stats.totalSize || 0) / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Members</div>
                      <div className="text-2xl font-bold">{selectedSpace.members?.length || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Members */}
              {selectedSpace.members && selectedSpace.members.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Members ({selectedSpace.members.length})</h3>
                  <div className="space-y-2">
                    {selectedSpace.members.map((member, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <div className="text-sm font-medium">{member.userId}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="secondary">{member.role}</Badge>
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
                    <div className="text-xs">{new Date(selectedSpace.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Updated</div>
                    <div className="text-xs">{new Date(selectedSpace.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" disabled>
                  <Folder className="h-4 w-4 mr-2" />
                  Browse Files
                </Button>
                <Button variant="outline" onClick={() => setSelectedSpace(null)}>
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

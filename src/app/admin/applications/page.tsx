"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApps } from "@/context/AppsContext";
import { ApiClient } from "@/lib/api-client";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge, BadgeProps } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApplicationEntity } from "@/types/database";

interface ApplicationStats {
  total: number;
  active: number;
  inactive: number;
  withAgents: number;
}

interface DeleteState {
  isDeleting: boolean;
  appToDelete: ApplicationEntity | null;
  showConfirmation: boolean;
  error: string | null;
}

interface EditState {
  isEditing: boolean;
  appToEdit: ApplicationEntity | null;
  showEditDialog: boolean;
  editFormData: {
    name: string;
    description: string;
    status: string;
  } | null;
  error: string | null;
}

export default function ApplicationManagementPage() {
  const router = useRouter();
  const { applications, loading, refreshApplications } = useApps();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    active: 0,
    inactive: 0,
    withAgents: 0,
  });
  const [deleteState, setDeleteState] = useState<DeleteState>({
    isDeleting: false,
    appToDelete: null,
    showConfirmation: false,
    error: null,
  });
  const [editState, setEditState] = useState<EditState>({
    isEditing: false,
    appToEdit: null,
    showEditDialog: false,
    editFormData: null,
    error: null,
  });

  // Calculate statistics
  useEffect(() => {
    if (applications.length > 0) {
      const activeApps = applications.filter((app) => app.status === "active");
      const withAgents = applications.filter((app) => app.ai_agent?.agentId);

      setStats({
        total: applications.length,
        active: activeApps.length,
        inactive: applications.length - activeApps.length,
        withAgents: withAgents.length,
      });
    }
  }, [applications]);

  // Filter applications based on search and filter criteria
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.metadata?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.app_id &&
        app.app_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.metadata?.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "active" && app.status === "active") ||
      (selectedFilter === "inactive" && app.status !== "active") ||
      (selectedFilter === "with-agents" && app.ai_agent?.agentId) ||
      (selectedFilter === "without-agents" && !app.ai_agent?.agentId);

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (
    app: ApplicationEntity
  ): { variant: BadgeProps["variant"]; text: string } => {
    if (app.status === "archived") {
      return { variant: "secondary", text: "Archived" };
    }
    if (app.status === "draft") {
      return { variant: "outline", text: "Draft" };
    }
    if (app.status === "active" && app.ai_agent?.agentId) {
      return { variant: "default", text: "Active" };
    }
    return { variant: "outline", text: "Configured" };
  };

  const handleDeleteApplication = async (app: ApplicationEntity) => {
    setDeleteState({
      isDeleting: false,
      appToDelete: app,
      showConfirmation: true,
      error: null,
    });
  };

  const confirmDeleteApplication = async () => {
    if (!deleteState.appToDelete) return;

    console.log(
      `🗑️ Starting deletion of application: ${deleteState.appToDelete.app_id}`
    );
    setDeleteState((prev) => ({ ...prev, isDeleting: true, error: null }));

    try {
      const apiClient = new ApiClient();
      console.log(
        `📡 Calling API to delete application: ${deleteState.appToDelete.app_id}`
      );
      await apiClient.delete(`/api/apps/${deleteState.appToDelete.app_id}`);

      console.log(
        `✅ Successfully deleted application: ${deleteState.appToDelete.app_id}`
      );

      // Close confirmation dialog
      setDeleteState({
        isDeleting: false,
        appToDelete: null,
        showConfirmation: false,
        error: null,
      });

      // Refresh the applications list
      console.log(`🔄 Refreshing applications list`);
      await refreshApplications();
    } catch (error) {
      console.error("❌ Failed to delete application:", error);
      setDeleteState((prev) => ({
        ...prev,
        isDeleting: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete application. Please try again.",
      }));
    }
  };

  const cancelDeleteApplication = () => {
    setDeleteState({
      isDeleting: false,
      appToDelete: null,
      showConfirmation: false,
      error: null,
    });
  };

  const handleEditApplication = async (app: ApplicationEntity) => {
    // Navigate to the comprehensive edit page
    router.push(`/admin/applications/${app.app_id}/edit`);
  };

  const handleEditFormChange = (
    field: "name" | "description" | "status",
    value: string
  ) => {
    setEditState((prev) => ({
      ...prev,
      editFormData: prev.editFormData
        ? {
            ...prev.editFormData,
            [field]: value,
          }
        : null,
    }));
  };

  const confirmEditApplication = async () => {
    if (!editState.appToEdit || !editState.editFormData) return;

    console.log(
      `✏️ Starting edit of application: ${editState.appToEdit.app_id}`
    );
    setEditState((prev) => ({ ...prev, isEditing: true, error: null }));

    try {
      const apiClient = new ApiClient();
      const updateData = {
        metadata: {
          ...editState.appToEdit.metadata,
          name: editState.editFormData.name,
          description: editState.editFormData.description,
        },
        status: editState.editFormData.status,
      };

      console.log(
        `📡 Calling API to update application: ${editState.appToEdit.app_id}`,
        updateData
      );
      await apiClient.put(
        `/api/apps/${editState.appToEdit.app_id}`,
        updateData
      );

      console.log(
        `✅ Successfully updated application: ${editState.appToEdit.app_id}`
      );

      // Close edit dialog
      setEditState({
        isEditing: false,
        appToEdit: null,
        showEditDialog: false,
        editFormData: null,
        error: null,
      });

      // Refresh the applications list
      console.log(`🔄 Refreshing applications list`);
      await refreshApplications();
    } catch (error) {
      console.error("❌ Failed to update application:", error);
      setEditState((prev) => ({
        ...prev,
        isEditing: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update application. Please try again.",
      }));
    }
  };

  const cancelEditApplication = () => {
    setEditState({
      isEditing: false,
      appToEdit: null,
      showEditDialog: false,
      editFormData: null,
      error: null,
    });
  };

  const handleRefresh = async () => {
    await refreshApplications();
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Application Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage applications, configure settings, and monitor status
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Applications
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Registered applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                With AI Agents
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.withAgents}
              </div>
              <p className="text-xs text-muted-foreground">AI-powered apps</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.inactive}
              </div>
              <p className="text-xs text-muted-foreground">
                Disabled or paused
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Applications</CardTitle>
            <CardDescription>
              Search and filter applications by name, status, or configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter:{" "}
                    {selectedFilter === "all"
                      ? "All"
                      : selectedFilter
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
                    All Applications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("active")}>
                    Active Only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedFilter("inactive")}
                  >
                    Inactive Only
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setSelectedFilter("with-agents")}
                  >
                    With AI Agents
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedFilter("without-agents")}
                  >
                    Without AI Agents
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Applications ({filteredApplications.length})</CardTitle>
            <CardDescription>
              Manage your applications and their configurations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                <span>Loading applications...</span>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No applications found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedFilter !== "all"
                    ? "No applications match your current filters."
                    : "Get started by adding your first application."}
                </p>
                {!searchTerm && selectedFilter === "all" && (
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Application
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Agent</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((app) => {
                      const statusBadge = getStatusBadge(app);
                      const isBeingDeleted =
                        deleteState.isDeleting &&
                        deleteState.appToDelete?.app_id === app.app_id;
                      return (
                        <TableRow
                          key={app.app_id}
                          className={isBeingDeleted ? "opacity-50" : ""}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-foreground">
                                {app.metadata?.name || app.app_id}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {app.metadata?.description || "No description"}
                              </div>
                              <div className="text-xs text-muted-foreground/70 mt-1">
                                ID: {app.app_id}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {app.ai_agent?.agentId ? (
                              <div>
                                <div className="text-sm font-medium text-foreground">
                                  {app.ai_agent.agentId}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Model: {app.ai_agent.model || "Unknown"}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Not configured
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {app.metadata?.updatedAt
                                ? new Date(
                                    app.metadata.updatedAt
                                  ).toLocaleDateString()
                                : "Unknown"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(`/apps/${app.id}`, "_blank")
                                }
                                title="View Application"
                                disabled={isBeingDeleted}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditApplication(app)}
                                title="Edit Application"
                                disabled={isBeingDeleted}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteApplication(app)}
                                title="Delete Application"
                                className="text-red-600 hover:text-red-700"
                                disabled={deleteState.isDeleting}
                              >
                                {isBeingDeleted ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteState.showConfirmation && deleteState.appToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-semibold text-foreground">
                Delete Application
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">
                Are you sure you want to delete the application{" "}
                <span className="font-medium text-foreground">
                  &quot;
                  {deleteState.appToDelete.metadata?.name ||
                    deleteState.appToDelete.app_id}
                  &quot;
                </span>
                ?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800 font-medium mb-1">
                  ⚠️ This action cannot be undone
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• The application will be permanently deleted</li>
                  <li>• All menu items will be removed</li>
                  <li>• All workspace content will be deleted</li>
                  <li>• User states and configurations will be lost</li>
                </ul>
              </div>

              {deleteState.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-red-800">{deleteState.error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeleteApplication}
                disabled={deleteState.isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteApplication}
                disabled={deleteState.isDeleting}
              >
                {deleteState.isDeleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Application
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Application Modal */}
      {editState.showEditDialog &&
        editState.appToEdit &&
        editState.editFormData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  Edit Application
                </h2>
                <p className="text-sm text-muted-foreground">
                  Update the details for &quot;{editState.appToEdit.app_id}
                  &quot;
                </p>
              </div>

              {editState.error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-destructive mr-2" />
                    <span className="text-sm text-destructive">
                      {editState.error}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Application Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editState.editFormData.name}
                    onChange={(e) =>
                      handleEditFormChange("name", e.target.value)
                    }
                    placeholder="Enter application name"
                    className="mt-1"
                    disabled={editState.isEditing}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editState.editFormData.description}
                    onChange={(e) =>
                      handleEditFormChange("description", e.target.value)
                    }
                    placeholder="Enter application description"
                    className="mt-1"
                    rows={3}
                    disabled={editState.isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="edit-status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={editState.editFormData.status}
                    onValueChange={(value) =>
                      handleEditFormChange("status", value)
                    }
                    disabled={editState.isEditing}
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
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={cancelEditApplication}
                  disabled={editState.isEditing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmEditApplication}
                  disabled={
                    editState.isEditing || !editState.editFormData.name.trim()
                  }
                >
                  {editState.isEditing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Application
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

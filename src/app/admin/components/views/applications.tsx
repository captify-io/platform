"use client";

/**
 * Applications Management View
 * Manage platform applications with PM2 health monitoring and Identity Pool configuration
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  DataTable as Table,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Badge,
  Card,
  CardContent,
  SlidePanel,
  SlidePanelContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@captify-io/core';
import {
  AppWindow,
  Activity,
  RefreshCw,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { apiClient } from '@captify-io/core/lib/api';

interface App {
  id: string;
  name: string;
  slug: string;
  category?: string;
  status?: string;
  port?: number;
  identityPoolId?: string;
  useSharedPool?: boolean;
  poolConfig?: {
    authenticatedRole: string;
    unauthenticatedRole?: string;
    customPolicies?: string[];
  };
  health?: {
    status: string;
    message?: string;
    cpu?: number;
    memory?: number;
    uptime?: number;
    restarts?: number;
  };
}

export function ApplicationsView() {
  const { data: session } = useSession();
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dialogs
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [poolDialogOpen, setPoolDialogOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);

  // Form states
  const [poolId, setPoolId] = useState('');
  const [authenticatedRole, setAuthenticatedRole] = useState('');

  // Edit form states
  const [editForm, setEditForm] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    status: '',
    version: '',
    icon: '',
    href: '',
    port: '',
  });

  // Load apps on mount
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.app',
        operation: 'listApps',
        data: {},
      });

      if (result.success) {
        setApps(result.apps || []);
      } else {
        setError(result.error || 'Failed to load applications');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  };

  const handleViewDetails = async (app: App) => {
    try {
      setError(null);
      setSelectedApp(app);

      const result = await apiClient.run({
        service: 'platform.admin.app',
        operation: 'getApp',
        data: {
          appId: app.id,
          includePoolInfo: true,
        },
      });

      if (result.success) {
        setSelectedApp(result.app);
        setDetailsDialogOpen(true);
      } else {
        setError(result.error || 'Failed to load app details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleAssignPool = async () => {
    if (!selectedApp || !poolId.trim() || !authenticatedRole.trim()) {
      setError('Pool ID and Authenticated Role are required');
      return;
    }

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.app',
        operation: 'assignIdentityPool',
        data: {
          appId: selectedApp.id,
          poolId: poolId.trim(),
          poolConfig: {
            authenticatedRole: authenticatedRole.trim(),
          },
        },
      });

      if (result.success) {
        setPoolDialogOpen(false);
        setPoolId('');
        setAuthenticatedRole('');
        setSelectedApp(null);
        await loadApps();
      } else {
        setError(result.error || 'Failed to assign Identity Pool');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRemovePool = async (app: App) => {
    if (!app.identityPoolId) return;

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.app',
        operation: 'removeIdentityPool',
        data: {
          appId: app.id,
        },
      });

      if (result.success) {
        await loadApps();
      } else {
        setError(result.error || 'Failed to remove Identity Pool');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleEditApp = (app: App) => {
    setSelectedApp(app);
    setEditForm({
      name: app.name || '',
      slug: app.slug || '',
      description: app.description || '',
      category: app.category || '',
      status: app.status || '',
      version: app.version || '',
      icon: app.icon || '',
      href: app.href || '',
      port: app.port?.toString() || '',
    });
    setEditSheetOpen(true);
  };

  const handleSaveApp = async () => {
    if (!selectedApp) return;

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.app',
        operation: 'updateApp',
        data: {
          appId: selectedApp.id,
          updates: {
            name: editForm.name.trim(),
            slug: editForm.slug.trim(),
            description: editForm.description.trim(),
            category: editForm.category || undefined,
            status: editForm.status || undefined,
            version: editForm.version.trim(),
            icon: editForm.icon.trim() || undefined,
            href: editForm.href.trim() || undefined,
            port: editForm.port ? parseInt(editForm.port) : undefined,
          },
        },
      });

      if (result.success) {
        setEditSheetOpen(false);
        setSelectedApp(null);
        await loadApps();
      } else {
        setError(result.error || 'Failed to update application');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'stopped':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Stopped</Badge>;
      case 'errored':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(0)} MB`;
  };

  const formatUptime = (ms?: number) => {
    if (!ms) return 'N/A';
    const hours = Math.floor(ms / 1000 / 60 / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Applications</h3>
          <p className="text-sm text-muted-foreground">
            Platform applications with PM2 health monitoring
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardContent className="p-6">
          <Table
            data={apps}
            onRowClick={handleEditApp}
            columns={[
              {
                header: 'Application',
                accessorKey: 'name',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <AppWindow className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.slug}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Category',
                accessorKey: 'category',
                cell: (row) => (
                  <Badge variant="secondary">{row.category || 'app'}</Badge>
                ),
              },
              {
                header: 'Port',
                accessorKey: 'port',
                cell: (row) => (
                  <span className="text-sm">{row.port || 'N/A'}</span>
                ),
              },
              {
                header: 'PM2 Status',
                accessorKey: 'health',
                cell: (row) => (
                  <div className="flex flex-col gap-1">
                    {getStatusBadge(row.health?.status)}
                    {row.health?.status === 'online' && (
                      <div className="text-xs text-muted-foreground">
                        CPU: {row.health.cpu?.toFixed(1)}% | Mem: {formatBytes(row.health.memory)}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                header: 'Identity Pool',
                accessorKey: 'useSharedPool',
                cell: (row) => (
                  <div className="flex flex-col gap-1">
                    {row.useSharedPool ? (
                      <Badge variant="outline">Shared</Badge>
                    ) : row.identityPoolId ? (
                      <div>
                        <Badge variant="default" className="bg-blue-500">Dedicated</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.identityPoolId.split(':')[1]?.substring(0, 8)}...
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">None</Badge>
                    )}
                  </div>
                ),
              },
              {
                header: 'Actions',
                accessorKey: 'id',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(row)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    {!row.identityPoolId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApp(row);
                          setPoolDialogOpen(true);
                        }}
                      >
                        <Shield className="h-4 w-4 text-blue-500" />
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            emptyMessage="No applications found"
          />
        </CardContent>
      </Card>

      {/* App Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details - {selectedApp?.name}</DialogTitle>
            <DialogDescription>
              View and manage application configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Slug</Label>
                <p className="font-medium">{selectedApp?.slug}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Category</Label>
                <p className="font-medium">{selectedApp?.category || 'application'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Port</Label>
                <p className="font-medium">{selectedApp?.port || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <p className="font-medium">{selectedApp?.status || 'active'}</p>
              </div>
            </div>

            {selectedApp?.health && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">PM2 Health</Label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-medium">{selectedApp.health.status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CPU</p>
                    <p className="font-medium">{selectedApp.health.cpu?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Memory</p>
                    <p className="font-medium">{formatBytes(selectedApp.health.memory)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-medium">{formatUptime(selectedApp.health.uptime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Restarts</p>
                    <p className="font-medium">{selectedApp.health.restarts || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {selectedApp?.identityPoolId && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Identity Pool</Label>
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Pool ID</p>
                    <p className="font-mono text-sm">{selectedApp.identityPoolId}</p>
                  </div>
                  {selectedApp.poolConfig?.authenticatedRole && (
                    <div>
                      <p className="text-xs text-muted-foreground">Authenticated Role</p>
                      <p className="font-mono text-sm break-all">{selectedApp.poolConfig.authenticatedRole}</p>
                    </div>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleRemovePool(selectedApp);
                      setDetailsDialogOpen(false);
                    }}
                  >
                    Switch to Shared Pool
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Identity Pool Dialog */}
      <Dialog open={poolDialogOpen} onOpenChange={setPoolDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Dedicated Identity Pool</DialogTitle>
            <DialogDescription>
              Assign a dedicated AWS Identity Pool to {selectedApp?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="poolId">Identity Pool ID *</Label>
              <Input
                id="poolId"
                value={poolId}
                onChange={(e) => setPoolId(e.target.value)}
                placeholder="us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authenticatedRole">Authenticated Role ARN *</Label>
              <Input
                id="authenticatedRole"
                value={authenticatedRole}
                onChange={(e) => setAuthenticatedRole(e.target.value)}
                placeholder="arn:aws:iam::123456789012:role/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoolDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignPool}>Assign Pool</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Application Panel */}
      <SlidePanel open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SlidePanelContent>
          <div className="space-y-3">
            <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-3 items-center">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />

              <Label htmlFor="slug" className="text-right">Slug</Label>
              <Input
                id="slug"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
              />

              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />

              <Label htmlFor="version" className="text-right">Version</Label>
              <Input
                id="version"
                value={editForm.version}
                onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
              />

              <Label htmlFor="category" className="text-right">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm({ ...editForm, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="application">Application</SelectItem>
                  <SelectItem value="tool">Tool</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="status" className="text-right">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>

              <Label htmlFor="icon" className="text-right">Icon</Label>
              <Input
                id="icon"
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
              />

              <Label htmlFor="href" className="text-right">URL</Label>
              <Input
                id="href"
                value={editForm.href}
                onChange={(e) => setEditForm({ ...editForm, href: e.target.value })}
              />

              <Label htmlFor="port" className="text-right">Port</Label>
              <Input
                id="port"
                type="number"
                value={editForm.port}
                onChange={(e) => setEditForm({ ...editForm, port: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setEditSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApp}>
                Save
              </Button>
            </div>
          </div>
        </SlidePanelContent>
      </SlidePanel>
    </div>
  );
}

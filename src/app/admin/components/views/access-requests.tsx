"use client";

/**
 * Access Requests Management View
 * Review and approve/deny user access requests
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@captify-io/core';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  User,
  AppWindow,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@captify-io/core/lib/api';

interface AccessRequest {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  appSlug: string;
  appName: string;
  status: 'pending' | 'approved' | 'denied';
  reason: string;
  reviewedBy?: string;
  reviewedAt?: string;
  denialReason?: string;
  groupsGranted?: string[];
  createdAt: string;
  updatedAt: string;
}

export function AccessRequestsView() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dialogs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  // Form states
  const [groups, setGroups] = useState<string>('');
  const [denialReason, setDenialReason] = useState('');

  // Load requests on mount and when filter changes
  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.accessRequest',
        operation: 'listAccessRequests',
        data: {
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });

      if (result.success) {
        setRequests(result.requests || []);
      } else {
        setError(result.error || 'Failed to load access requests');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (request: AccessRequest) => {
    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.accessRequest',
        operation: 'getRequestDetails',
        data: {
          requestId: request.id,
          includeUserInfo: true,
        },
      });

      if (result.success) {
        setSelectedRequest({
          ...request,
          ...result.request,
        });
        setDetailsDialogOpen(true);
      } else {
        setError(result.error || 'Failed to load request details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest || !groups.trim()) {
      setError('At least one group is required');
      return;
    }

    try {
      setError(null);

      const groupList = groups.split(',').map(g => g.trim()).filter(g => g);

      const result = await apiClient.run({
        service: 'platform.admin.accessRequest',
        operation: 'approveRequest',
        data: {
          requestId: selectedRequest.id,
          groups: groupList,
          adminId: session?.user?.userId || session?.user?.id || 'unknown',
        },
      });

      if (result.success) {
        setApproveDialogOpen(false);
        setGroups('');
        setSelectedRequest(null);
        await loadRequests();
      } else {
        setError(result.error || 'Failed to approve request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeny = async () => {
    if (!selectedRequest || !denialReason.trim()) {
      setError('Denial reason is required');
      return;
    }

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.accessRequest',
        operation: 'denyRequest',
        data: {
          requestId: selectedRequest.id,
          adminId: session?.user?.userId || session?.user?.id || 'unknown',
          reason: denialReason.trim(),
        },
      });

      if (result.success) {
        setDenyDialogOpen(false);
        setDenialReason('');
        setSelectedRequest(null);
        await loadRequests();
      } else {
        setError(result.error || 'Failed to deny request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading access requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Access Requests</h3>
          <p className="text-sm text-muted-foreground">
            {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}` : 'No pending requests'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Requests Table */}
      <Card>
        <CardContent className="p-6">
          <Table
            data={requests}
            columns={[
              {
                header: 'User',
                accessorKey: 'userId',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{row.userName || row.userId}</p>
                      <p className="text-xs text-muted-foreground">{row.userEmail || row.userId}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Application',
                accessorKey: 'appName',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <AppWindow className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{row.appName}</p>
                      <p className="text-xs text-muted-foreground">{row.appSlug}</p>
                    </div>
                  </div>
                ),
              },
              {
                header: 'Reason',
                accessorKey: 'reason',
                cell: (row) => (
                  <p className="text-sm max-w-xs truncate">{row.reason}</p>
                ),
              },
              {
                header: 'Status',
                accessorKey: 'status',
                cell: (row) => getStatusBadge(row.status),
              },
              {
                header: 'Requested',
                accessorKey: 'createdAt',
                cell: (row) => (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </span>
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
                      <FileText className="h-4 w-4" />
                    </Button>
                    {row.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(row);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(row);
                            setDenyDialogOpen(true);
                          }}
                        >
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                ),
              },
            ]}
            emptyMessage="No access requests found"
          />
        </CardContent>
      </Card>

      {/* Request Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Access Request Details</DialogTitle>
            <DialogDescription>
              Full information about this access request
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">User</Label>
                <p className="font-medium">{selectedRequest?.userName || selectedRequest?.userId}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Application</Label>
                <p className="font-medium">{selectedRequest?.appName}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                {selectedRequest && getStatusBadge(selectedRequest.status)}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Requested</Label>
                <p className="font-medium">{selectedRequest && formatDate(selectedRequest.createdAt)}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Reason</Label>
              <p className="text-sm p-3 bg-muted rounded-lg">{selectedRequest?.reason}</p>
            </div>

            {selectedRequest?.status === 'approved' && selectedRequest.groupsGranted && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Groups Granted</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.groupsGranted.map(group => (
                    <Badge key={group} variant="secondary">{group}</Badge>
                  ))}
                </div>
              </div>
            )}

            {selectedRequest?.status === 'denied' && selectedRequest.denialReason && (
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Denial Reason</Label>
                <p className="text-sm p-3 bg-destructive/10 text-destructive rounded-lg">
                  {selectedRequest.denialReason}
                </p>
              </div>
            )}

            {selectedRequest?.reviewedBy && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Reviewed By</Label>
                  <p className="font-medium">{selectedRequest.reviewedBy}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Reviewed At</Label>
                  <p className="font-medium">{selectedRequest.reviewedAt && formatDate(selectedRequest.reviewedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Access Request</DialogTitle>
            <DialogDescription>
              Grant {selectedRequest?.userName || selectedRequest?.userId} access to {selectedRequest?.appName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groups">Groups (comma-separated) *</Label>
              <Input
                id="groups"
                value={groups}
                onChange={(e) => setGroups(e.target.value)}
                placeholder="e.g., app-user, app-viewer"
              />
              <p className="text-xs text-muted-foreground">
                User will be added to these Cognito groups
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Reason:</strong> {selectedRequest?.reason}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-green-500 hover:bg-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Access Request</DialogTitle>
            <DialogDescription>
              Deny {selectedRequest?.userName || selectedRequest?.userId}'s request for {selectedRequest?.appName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm"><strong>Reason:</strong> {selectedRequest?.reason}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="denialReason">Denial Reason *</Label>
              <Input
                id="denialReason"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="e.g., Insufficient justification"
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear reason for denying this request
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeny}>
              <XCircle className="h-4 w-4 mr-2" />
              Deny Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

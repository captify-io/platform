"use client";

/**
 * Access Administration Page
 * Admin dashboard for managing application access requests
 */

import React, { useState } from "react";
import {
  useApplicationAdmin,
  useUser,
  useUserAdmin,
} from "@captify/core/hooks";
import { UserRegistrationForm } from "../../../components/users/UserRegistrationForm";
import { Button } from "@captify/core/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Input } from "@captify/core/ui";
import { Textarea } from "@captify/core/ui";
import { Label } from "@captify/core/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@captify/core/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@captify/core/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@captify/core/ui";
import {
  UserCheck,
  UserX,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import type { AppAccessRequest } from "../../../types";

export default function AccessAdminPage() {
  const { userStatus, loading: userLoading } = useUser();
  const {
    users,
    loading: usersLoading,
    error: usersError,
    updateUserStatus,
    refresh: refreshUsers,
  } = useUserAdmin();
  const {
    pendingRequests,
    loading,
    error,
    approveRequest,
    rejectRequest,
    grantAccess,
    revokeAccess,
    refresh,
  } = useApplicationAdmin();

  const [selectedRequest, setSelectedRequest] =
    useState<AppAccessRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [processing, setProcessing] = useState(false);

  // Direct grant dialog state
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantAppId, setGrantAppId] = useState("");
  const [grantRoleId, setGrantRoleId] = useState("");
  const [grantJustification, setGrantJustification] = useState("");
  const [showRegistration, setShowRegistration] = useState(false);

  const handleApprove = async () => {
    if (!selectedRequest || !selectedRole) return;

    setProcessing(true);
    const success = await approveRequest(
      selectedRequest.id,
      selectedRole,
      reviewNotes
    );
    setProcessing(false);

    if (success) {
      setSelectedRequest(null);
      setActionType(null);
      setReviewNotes("");
      setSelectedRole("");
      refresh.pendingRequests();
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !reviewNotes) return;

    setProcessing(true);
    const success = await rejectRequest(selectedRequest.id, reviewNotes);
    setProcessing(false);

    if (success) {
      setSelectedRequest(null);
      setActionType(null);
      setReviewNotes("");
      refresh.pendingRequests();
    }
  };

  const handleDirectGrant = async () => {
    if (!grantUserId || !grantAppId || !grantRoleId) return;

    setProcessing(true);
    const success = await grantAccess(
      grantUserId,
      grantAppId,
      grantRoleId,
      grantJustification,
      undefined
    );
    setProcessing(false);

    if (success) {
      setShowGrantDialog(false);
      setGrantUserId("");
      setGrantAppId("");
      setGrantRoleId("");
      setGrantJustification("");
    }
  };

  // Check if user is loading
  if (userLoading || loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is not registered
  if (!userStatus?.isRegistered) {
    return (
      <div className="p-6">
        <UserRegistrationForm
          onRegistrationComplete={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  // Check if user is pending approval
  if (userStatus?.status === "pending") {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Account Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account registration has been received and is pending
              administrator approval. You will be notified once your account has
              been activated.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is not active or not admin
  if (userStatus?.status !== "active" || !userStatus?.isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have administrator privileges to access this page.
              Please contact your system administrator if you believe this is an
              error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Access Administration</h1>
          <p className="text-muted-foreground">
            Manage application access requests and permissions
          </p>
        </div>
        <Button onClick={() => setShowGrantDialog(true)}>
          <UserCheck className="h-4 w-4 mr-2" />
          Grant Direct Access
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Access granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Rejected Today
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Access denied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">With app access</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="approved">Recently Approved</TabsTrigger>
          <TabsTrigger value="rejected">Recently Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Access Requests</CardTitle>
              <CardDescription>
                Review and process access requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Application</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead>Justification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.userId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{request.appId}</TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="truncate">{request.justification}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType("approve");
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setActionType("reject");
                              }}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : users.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.profile?.firstName} {user.profile?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.userId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.status === "active"
                                ? "default"
                                : user.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.profile?.department || "-"}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.status}
                            onValueChange={(value) => {
                              updateUserStatus(user.id, value as any);
                            }}
                            disabled={processing}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="suspended">
                                Suspended
                              </SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">
                No recently approved requests
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mb-4" />
              <p className="text-muted-foreground">
                No recently rejected requests
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve/Reject Dialog */}
      {selectedRequest && actionType && (
        <Dialog
          open={true}
          onOpenChange={() => {
            setSelectedRequest(null);
            setActionType(null);
            setReviewNotes("");
            setSelectedRole("");
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve"
                  ? "Approve Access Request"
                  : "Reject Access Request"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "Grant access to the requested application"
                  : "Deny access to the requested application"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User</Label>
                <p className="text-sm">{selectedRequest.userId}</p>
              </div>

              <div className="space-y-2">
                <Label>Application</Label>
                <p className="text-sm">{selectedRequest.appId}</p>
              </div>

              <div className="space-y-2">
                <Label>Justification</Label>
                <p className="text-sm">{selectedRequest.justification}</p>
              </div>

              {actionType === "approve" && (
                <div className="space-y-2">
                  <Label htmlFor="role">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">
                  Review Notes {actionType === "reject" && "*"}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={
                    actionType === "approve"
                      ? "Optional notes about this approval"
                      : "Required: Reason for rejection"
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setActionType(null);
                  setReviewNotes("");
                  setSelectedRole("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={
                  actionType === "approve" ? handleApprove : handleReject
                }
                disabled={
                  processing ||
                  (actionType === "approve" && !selectedRole) ||
                  (actionType === "reject" && !reviewNotes)
                }
              >
                {processing
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Approve"
                  : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Direct Grant Dialog */}
      {showGrantDialog && (
        <Dialog open={true} onOpenChange={setShowGrantDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Direct Access</DialogTitle>
              <DialogDescription>
                Manually grant application access to a user
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID or Email</Label>
                <Input
                  id="userId"
                  value={grantUserId}
                  onChange={(e) => setGrantUserId(e.target.value)}
                  placeholder="Enter user ID or email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appId">Application ID</Label>
                <Input
                  id="appId"
                  value={grantAppId}
                  onChange={(e) => setGrantAppId(e.target.value)}
                  placeholder="Enter application ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleId">Role</Label>
                <Select value={grantRoleId} onValueChange={setGrantRoleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="justification">Justification</Label>
                <Textarea
                  id="justification"
                  placeholder="Reason for granting access"
                  value={grantJustification}
                  onChange={(e) => setGrantJustification(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowGrantDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDirectGrant}
                disabled={
                  processing || !grantUserId || !grantAppId || !grantRoleId
                }
              >
                {processing ? "Granting..." : "Grant Access"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

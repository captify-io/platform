"use client";

/**
 * Groups Management View
 * Manage Cognito user groups with member management
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
} from '@captify-io/core';
import { Shield, Plus, Users, Trash2, UserPlus, UserMinus, AlertCircle } from 'lucide-react';
import { apiClient } from '@captify-io/core/lib/api';

interface Group {
  GroupName: string;
  Description?: string;
  CreationDate?: string;
  LastModifiedDate?: string;
  members?: any[];
  memberCount?: number;
}

export function GroupsView() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [memberUserId, setMemberUserId] = useState('');

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'listGroups',
        data: {},
      });

      if (result.success) {
        setGroups(result.groups || []);
      } else {
        setError(result.error || 'Failed to load groups');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      setError('Group name is required');
      return;
    }

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'createGroup',
        data: {
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
        },
      });

      if (result.success) {
        setCreateDialogOpen(false);
        setNewGroupName('');
        setNewGroupDescription('');
        await loadGroups();
      } else {
        setError(result.error || 'Failed to create group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) return;

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'deleteGroup',
        data: {
          name: selectedGroup.GroupName,
        },
      });

      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedGroup(null);
        await loadGroups();
      } else {
        setError(result.error || 'Failed to delete group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleViewMembers = async (group: Group) => {
    try {
      setError(null);
      setSelectedGroup(group);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'getGroup',
        data: {
          name: group.GroupName,
        },
      });

      if (result.success) {
        setSelectedGroup({
          ...group,
          members: result.members || [],
          memberCount: result.memberCount || 0,
        });
        setMembersDialogOpen(true);
      } else {
        setError(result.error || 'Failed to load group members');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !memberUserId.trim()) return;

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'addUserToGroup',
        data: {
          userId: memberUserId.trim(),
          groupName: selectedGroup.GroupName,
        },
      });

      if (result.success) {
        setAddMemberDialogOpen(false);
        setMemberUserId('');
        // Reload members
        await handleViewMembers(selectedGroup);
      } else {
        setError(result.error || 'Failed to add user to group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      setError(null);

      const result = await apiClient.run({
        service: 'platform.admin.group',
        operation: 'removeUserFromGroup',
        data: {
          userId: userId,
          groupName: selectedGroup.GroupName,
        },
      });

      if (result.success) {
        // Reload members
        await handleViewMembers(selectedGroup);
      } else {
        setError(result.error || 'Failed to remove user from group');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  const isProtectedGroup = (groupName: string) => {
    return groupName === 'captify-admin' || groupName === 'captify-operations';
  };

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">All Groups</h3>
          <p className="text-sm text-muted-foreground">
            Manage Cognito user groups and their members
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Group
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

      {/* Groups Table */}
      <Card>
        <CardContent className="p-6">
          <Table
            data={groups}
            columns={[
              {
                header: 'Group Name',
                accessorKey: 'GroupName',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{row.GroupName}</span>
                    {isProtectedGroup(row.GroupName) && (
                      <Badge variant="secondary" className="text-xs">Protected</Badge>
                    )}
                  </div>
                ),
              },
              {
                header: 'Description',
                accessorKey: 'Description',
                cell: (row) => (
                  <span className="text-muted-foreground text-sm">
                    {row.Description || 'No description'}
                  </span>
                ),
              },
              {
                header: 'Members',
                accessorKey: 'memberCount',
                cell: (row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewMembers(row)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    View Members
                  </Button>
                ),
              },
              {
                header: 'Actions',
                accessorKey: 'GroupName',
                cell: (row) => (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(row);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={isProtectedGroup(row.GroupName)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ),
              },
            ]}
            emptyMessage="No groups found"
          />
        </CardContent>
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new user group for access control.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Group Name *</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., marketing-team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Group Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the group "{selectedGroup?.GroupName}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteGroup}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Group Members - {selectedGroup?.GroupName}</DialogTitle>
            <DialogDescription>
              Manage members of this group.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {selectedGroup?.memberCount || 0} members
              </p>
              <Button
                size="sm"
                onClick={() => setAddMemberDialogOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
            <div className="space-y-2">
              {selectedGroup?.members?.map((member: any) => (
                <div
                  key={member.Username}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{member.Username}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.Attributes?.find((a: any) => a.Name === 'email')?.Value}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.Username)}
                    disabled={
                      selectedGroup.GroupName === 'captify-admin' &&
                      selectedGroup.members?.length === 1
                    }
                  >
                    <UserMinus className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {(!selectedGroup?.members || selectedGroup.members.length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No members in this group
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to {selectedGroup?.GroupName}</DialogTitle>
            <DialogDescription>
              Enter the user ID (Cognito username) to add to this group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                value={memberUserId}
                onChange={(e) => setMemberUserId(e.target.value)}
                placeholder="e.g., user@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

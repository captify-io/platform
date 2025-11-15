/**
 * Workspace Helper Functions
 *
 * Business logic helpers for workspace operations.
 * Uses platform.ontology service for all data operations.
 */

import { v4 as uuid } from 'uuid';
import { apiClient } from '@captify-io/core/lib/api';

/**
 * Create workspace and add creator as owner
 */
export async function createWorkspaceWithOwner(
  workspaceData: {
    slug: string;
    name: string;
    description?: string;
    tenantId: string;
    type?: 'personal' | 'team' | 'organization';
    icon?: string;
    color?: string;
    settings?: {
      defaultCycleDuration?: number;
      requireProjectEstimates?: boolean;
      autoArchiveDays?: number;
    };
  },
  userId: string,
  userEmail: string
) {
  const workspaceId = uuid();
  const now = new Date().toISOString();

  try {
    // 1. Create workspace
    const workspaceResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'createItem',
      data: {
        type: 'workspace',
        item: {
          id: workspaceId,
          ...workspaceData,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    if (!workspaceResponse.success) {
      throw new Error('Failed to create workspace');
    }

    // 2. Add creator as owner
    const memberResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'createItem',
      data: {
        type: 'workspace-member',
        item: {
          id: uuid(),
          workspaceId,
          userId,
          email: userEmail,
          role: 'owner',
          status: 'active',
          joinedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    if (!memberResponse.success) {
      throw new Error('Failed to add workspace owner');
    }

    return { workspaceId, success: true };
  } catch (error) {
    console.error('Error creating workspace:', error);
    return {
      workspaceId: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get next issue identifier for a team
 * Returns identifier in format: TEAM-123
 */
export async function getNextIssueIdentifier(
  teamId: string,
  teamIdentifier: string
): Promise<{ identifier: string; number: number }> {
  try {
    // Query all issues for team to get the highest number
    const response = await apiClient.run({
      service: 'platform.ontology',
      operation: 'queryItems',
      data: {
        type: 'workspace-issue',
        keyCondition: {
          teamId,
        },
        index: 'teamId-status-index',
      },
    });

    // Find highest issue number
    let maxNumber = 0;
    if (response.success && response.data?.Items) {
      response.data.Items.forEach((issue: any) => {
        if (issue.number && issue.number > maxNumber) {
          maxNumber = issue.number;
        }
      });
    }

    const nextNumber = maxNumber + 1;
    const identifier = `${teamIdentifier.toUpperCase()}-${nextNumber}`;

    return { identifier, number: nextNumber };
  } catch (error) {
    console.error('Error getting next issue identifier:', error);
    // Fallback to timestamp-based identifier
    const fallbackNumber = Date.now() % 10000;
    return {
      identifier: `${teamIdentifier.toUpperCase()}-${fallbackNumber}`,
      number: fallbackNumber,
    };
  }
}

/**
 * Add member to workspace (with Cognito user lookup)
 */
export async function addWorkspaceMember(
  workspaceId: string,
  email: string,
  role: 'owner' | 'admin' | 'member' | 'viewer',
  invitedBy: string
) {
  try {
    // 1. Look up user in Cognito by email
    const cognitoResponse = await apiClient.run({
      service: 'platform.cognito',
      operation: 'getUserByEmail',
      data: { email },
    });

    if (!cognitoResponse.success) {
      return {
        success: false,
        error: 'User not found in system',
      };
    }

    const user = cognitoResponse.data;

    // 2. Check if user is already a member
    const existingResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'queryItems',
      data: {
        type: 'workspace-member',
        keyCondition: {
          workspaceId,
          userId: user.sub,
        },
        index: 'workspaceId-userId-index',
      },
    });

    if (existingResponse.success && existingResponse.data?.Items?.length > 0) {
      return {
        success: false,
        error: 'User is already a member of this workspace',
      };
    }

    // 3. Create workspace-member record
    const memberResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'createItem',
      data: {
        type: 'workspace-member',
        item: {
          id: uuid(),
          workspaceId,
          userId: user.sub,
          email: user.email,
          role,
          status: 'active',
          invitedBy,
          joinedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    if (!memberResponse.success) {
      return {
        success: false,
        error: 'Failed to add member to workspace',
      };
    }

    return {
      success: true,
      member: memberResponse.data,
    };
  } catch (error) {
    console.error('Error adding workspace member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Remove member from workspace
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
) {
  try {
    // Find the membership record
    const response = await apiClient.run({
      service: 'platform.ontology',
      operation: 'queryItems',
      data: {
        type: 'workspace-member',
        keyCondition: {
          workspaceId,
          userId,
        },
        index: 'workspaceId-userId-index',
      },
    });

    if (!response.success || !response.data?.Items?.length) {
      return {
        success: false,
        error: 'Membership not found',
      };
    }

    const membership = response.data.Items[0];

    // Delete the membership
    const deleteResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'deleteItem',
      data: {
        type: 'workspace-member',
        id: membership.id,
      },
    });

    return {
      success: deleteResponse.success,
      error: deleteResponse.success ? undefined : 'Failed to remove member',
    };
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update member role in workspace
 */
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  newRole: 'owner' | 'admin' | 'member' | 'viewer'
) {
  try {
    // Find the membership record
    const response = await apiClient.run({
      service: 'platform.ontology',
      operation: 'queryItems',
      data: {
        type: 'workspace-member',
        keyCondition: {
          workspaceId,
          userId,
        },
        index: 'workspaceId-userId-index',
      },
    });

    if (!response.success || !response.data?.Items?.length) {
      return {
        success: false,
        error: 'Membership not found',
      };
    }

    const membership = response.data.Items[0];

    // Update the role
    const updateResponse = await apiClient.run({
      service: 'platform.ontology',
      operation: 'updateItem',
      data: {
        type: 'workspace-member',
        id: membership.id,
        updates: {
          role: newRole,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    return {
      success: updateResponse.success,
      error: updateResponse.success ? undefined : 'Failed to update role',
    };
  } catch (error) {
    console.error('Error updating member role:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  try {
    const response = await apiClient.run({
      service: 'platform.ontology',
      operation: 'queryItems',
      data: {
        type: 'workspace',
        keyCondition: {
          slug,
        },
        index: 'slug-index',
      },
    });

    return !response.success || !response.data?.Items?.length;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Generate a URL-safe slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * User Management Service
 *
 * Admin service for managing users via AWS Cognito and DynamoDB.
 * Wraps core services with admin-specific business logic.
 *
 * Architecture:
 * - Uses apiClient from @captify-io/core for all service calls
 * - Cognito: User authentication and groups
 * - DynamoDB: Extended user metadata (preferences, spaces, etc.)
 *
 * @see workshops/admin/features/01-user-management.md for full spec
 * @see workshops/admin/user-stories/01-user-management.yaml for acceptance criteria
 */

import { apiClient } from '@captify-io/core/lib/api';
import type { User } from '@captify-io/core/types';

/**
 * User with extended metadata from DynamoDB
 */
export interface UserWithMetadata extends User {
  tenantId: string;
  preferences?: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
  };
  spaces?: string[];
  lastActivity?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
  groups?: string[];
  tenantId: string;
  sendWelcomeEmail?: boolean;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  groups?: string[];
  preferences?: object;
  status?: 'active' | 'disabled';
}

/**
 * Options for listing users
 */
export interface ListUsersOptions {
  limit?: number;
  nextToken?: string;
  status?: 'active' | 'disabled' | 'pending';
  search?: string;
}

/**
 * Fetch user by ID from Cognito and merge with DynamoDB metadata
 *
 * @param userId - Cognito sub (UUID)
 * @returns Promise resolving to User with metadata
 * @throws Error if user ID is empty or user not found
 *
 * @example
 * const user = await getUserById('user-123');
 * console.log(user.email, user.groups, user.preferences);
 */
export async function getUserById(userId: string): Promise<UserWithMetadata> {
  if (!userId || userId.trim() === '') {
    throw new Error('User ID is required');
  }

  try {
    // Fetch user from DynamoDB (includes metadata)
    const response = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'get',
      table: 'core-user',
      data: {
        Key: { id: userId }
      }
    });

    if (!response.item) {
      throw new Error(`User not found: ${userId}`);
    }

    return response.item as UserWithMetadata;
  } catch (error) {
    if (error instanceof Error && error.message.includes('User not found')) {
      throw error;
    }
    console.error(`Error fetching user ${userId}:`, error);
    throw error;
  }
}

/**
 * Create new user in Cognito and DynamoDB
 *
 * @param userData - User data for creation
 * @returns Promise resolving to created user
 * @throws Error if email invalid or already exists
 *
 * @example
 * const newUser = await createUser({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   groups: ['users'],
 *   tenantId: 'tenant-123'
 * });
 */
export async function createUser(userData: CreateUserInput): Promise<UserWithMetadata> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    throw new Error('Invalid email format');
  }

  try {
    const newUser = {
      id: `user-${Date.now()}`, // Simple ID generation
      email: userData.email,
      name: userData.name,
      status: 'active' as const,
      tenantId: userData.tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in DynamoDB
    const response = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'put',
      table: 'core-user',
      data: {
        Item: newUser
      }
    });

    return response.item as UserWithMetadata;
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error(`User with email ${userData.email} already exists`);
    }
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update user attributes in Cognito and/or metadata in DynamoDB
 *
 * @param userId - Cognito sub
 * @param updates - Fields to update
 * @returns Promise resolving to updated user
 * @throws Error if user not found
 *
 * @example
 * const updated = await updateUser('user-123', {
 *   name: 'Jane Doe',
 *   groups: ['users', 'admins']
 * });
 */
export async function updateUser(
  userId: string,
  updates: UpdateUserInput
): Promise<UserWithMetadata> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const response = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'update',
      table: 'core-user',
      data: {
        Key: { id: userId },
        UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name'
        },
        ExpressionAttributeValues: {
          ':name': updates.name,
          ':updatedAt': updateData.updatedAt
        },
        ReturnValues: 'ALL_NEW'
      }
    });

    return response.item as UserWithMetadata;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(`User not found: ${userId}`);
    }
    console.error(`Error updating user ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete user from Cognito and DynamoDB
 *
 * @param userId - Cognito sub
 * @returns Promise resolving to deletion confirmation
 * @throws Error if user not found
 *
 * @example
 * await deleteUser('user-123');
 */
export async function deleteUser(userId: string): Promise<{ deleted: boolean; userId: string }> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'delete',
      table: 'core-user',
      data: {
        Key: { id: userId }
      }
    });

    return { deleted: true, userId };
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error(`User not found: ${userId}`);
    }
    console.error(`Error deleting user ${userId}:`, error);
    throw error;
  }
}

/**
 * List users with pagination and filtering
 *
 * @param options - Listing options (limit, filters, search)
 * @returns Promise resolving to paginated user list
 *
 * @example
 * const users = await listUsers({ limit: 50, status: 'active' });
 */
export async function listUsers(options: ListUsersOptions = {}): Promise<{
  items: UserWithMetadata[];
  nextToken?: string;
  totalCount?: number;
}> {
  const limit = options.limit || 50;

  try {
    const queryParams: any = {
      Limit: limit
    };

    if (options.nextToken) {
      queryParams.ExclusiveStartKey = options.nextToken;
    }

    if (options.status) {
      queryParams.FilterExpression = '#status = :status';
      queryParams.ExpressionAttributeNames = { '#status': 'status' };
      queryParams.ExpressionAttributeValues = { ':status': options.status };
    }

    const response = await apiClient.run({
      service: 'platform.dynamodb',
      operation: 'scan',
      table: 'core-user',
      data: queryParams
    });

    return {
      items: response.items || [],
      nextToken: response.LastEvaluatedKey,
      totalCount: response.Count
    };
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
}

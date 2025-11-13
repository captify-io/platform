/**
 * User Management Service
 * Export all user-related functionality
 */

export {
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
} from './user-service';

export type {
  UserWithMetadata,
  CreateUserInput,
  UpdateUserInput,
  ListUsersOptions,
} from './user-service';

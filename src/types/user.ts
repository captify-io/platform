/**
 * User types and state management
 */

import type { Core } from "./core";

// User entity in DynamoDB
export interface User extends Core {
  email: string;
  userId: string; // Cognito sub
  groups?: string[];
  isAdmin?: boolean;
  lastLogin?: string;
  preferences?: UserPreferences;
}

// User preferences stored in the User table
export interface UserPreferences {
  theme?: "light" | "dark" | "system";
  favoriteApps?: string[];
  recentApps?: string[];
  dashboardLayout?: Record<string, any>;
  notifications?: {
    email?: boolean;
    inApp?: boolean;
  };
}

// UserState for client-side state management
export interface UserState extends Core {
  userId: string;
  favoriteApps: string[];
  recentApps: string[];
  preferences: UserPreferences;
}

// API response for user operations
export interface UserResponse {
  user: User;
  preferences?: UserPreferences;
}
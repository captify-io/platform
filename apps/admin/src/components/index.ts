"use client";

// Export all components organized by category

// Application components
export { ApplicationLauncher } from "./applications/ApplicationLauncher";
export { ApplicationLauncherAWS } from "./applications/ApplicationLauncherAWS";

// Layout components - moved to root

// Provider components - moved to root

// Package components - moved to root

// User components
export { UserRegistrationForm } from "./users/UserRegistrationForm";
export { UserStatusWrapper } from "./users/UserStatusWrapper";

// Debug components
export { SessionDebug } from "./debug/SessionDebug";

// Constants and types
export { APP_CATEGORY_LABELS } from "../types/app";
export type { AppCategory, ApplicationMenuItem } from "../types/app";

// Re-export from subfolders
export * from "./applications";
export * from "./users";
export * from "./debug";

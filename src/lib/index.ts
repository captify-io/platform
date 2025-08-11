// Main lib exports - centralized access to all lib modules

// Services
export * from "./services";

// Providers
export * from "./providers";

// Configuration - explicit exports to avoid conflicts
export {
  SHARED_TABLES,
  getSharedTable,
  getEnvironmentTable,
} from "./config/database";
export type {
  ApiResponse,
  ApiResponseMeta,
  PaginationMeta,
  SessionInfo,
} from "./types/api";
export { createApiResponse, createApiError, HTTP_STATUS } from "./types/api";
export type { AppConfig, AppDatabaseConfig, AppMenuItem } from "./types/config";
export {
  loadAppConfig,
  validateAppConfig,
  getAppTable,
} from "./services/config";
export type { ApiHandlerContext } from "./api/handler";
export { createAppApiHandler } from "./api/handler";

// Other lib modules (existing)
export * from "./auth";
export * from "./utils";
export * from "./tokens";
// Add other existing lib modules as needed

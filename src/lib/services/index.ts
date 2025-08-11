// Service exports for easy importing
export { NeptuneClient, GremlinClient } from "./neptune-client";

// Database services
export {
  DatabaseService,
  ApplicationsService,
  OrganizationsService,
  UsersService,
  UserOrganizationsService,
  OrganizationApplicationsService,
  UserApplicationsService,
  OrganizationSettingsService,
  applicationsService,
  organizationsService,
  usersService,
  userOrganizationsService,
  organizationApplicationsService,
  userApplicationsService,
  organizationSettingsService,
  userApplicationStateService, // Legacy alias
  docClient,
  dynamoClient,
} from "./database";

// Notification service
export {
  NotificationService,
  notificationService,
  NotificationHelpers,
} from "./notifications";
export type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
} from "./notifications";

// Audit service
export { AuditService, auditService, AuditHelpers } from "./audit";
export type { AuditLog, CreateAuditLogInput, AuditLogFilters } from "./audit";

// Add other services here as they are implemented
// export { S3Service } from './s3-service';
// export { DynamoDBService } from './dynamodb-service';

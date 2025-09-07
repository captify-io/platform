// Export pages from their sections
// Note: Many pages must be imported directly from their files to preserve "use client" directive

// Access pages
export { AccessPage } from "./access";
// AccessAdminPage must be imported directly from ./access/admin to preserve "use client" directive
// AccessUsersPage must be imported directly from ./access/users to preserve "use client" directive
// AccessPoolsPage must be imported directly from ./access/pools to preserve "use client" directive

// Applications pages
export { ApplicationsPage } from "./applications";
// MyAppsPage must be imported directly from ./applications/my-apps to preserve "use client" directive

// Dashboard
export { Dashboard } from "./dashboard";

// Monitor pages must be imported directly from ./monitor/page to preserve "use client" directive

// Policies
export { PoliciesPage } from "./policies";

// Services
export { ServicesPage } from "./services";

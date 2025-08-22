/**
 * Core Services Registry
 * Central access point for all core data services
 */

import { OrganizationService } from "./OrganizationService";
import { UserService } from "./UserService";
import { UserRoleService } from "./UserRoleService";
import { UserStateService } from "./UserStateService";

export class CoreServices {
  private session?: any;
  private _organizationService?: OrganizationService;
  private _userService?: UserService;
  private _userRoleService?: UserRoleService;
  private _userStateService?: UserStateService;

  constructor(session?: any) {
    this.session = session;
  }

  /**
   * Get Organization service instance
   */
  get organizations(): OrganizationService {
    if (!this._organizationService) {
      this._organizationService = new OrganizationService(this.session);
    }
    return this._organizationService;
  }

  /**
   * Get User service instance
   */
  get users(): UserService {
    if (!this._userService) {
      this._userService = new UserService(this.session);
    }
    return this._userService;
  }

  /**
   * Get User Role service instance
   */
  get roles(): UserRoleService {
    if (!this._userRoleService) {
      this._userRoleService = new UserRoleService(this.session);
    }
    return this._userRoleService;
  }

  /**
   * Get User State service instance
   */
  get userStates(): UserStateService {
    if (!this._userStateService) {
      this._userStateService = new UserStateService(this.session);
    }
    return this._userStateService;
  }

  /**
   * Update session for all services
   */
  updateSession(session: any): void {
    this.session = session;
    // Reset all service instances to pick up new session
    this._organizationService = undefined;
    this._userService = undefined;
    this._userRoleService = undefined;
    this._userStateService = undefined;
  }
}

// Export individual services for direct import if needed
export { OrganizationService } from "./OrganizationService";
export { UserService } from "./UserService";
export { UserRoleService } from "./UserRoleService";
export { UserStateService } from "./UserStateService";

// Export convenience instance
export const coreServices = new CoreServices();

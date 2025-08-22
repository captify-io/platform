import type { UserSession } from "@captify/core";

export class SessionService {
  /**
   * Extract session information from request headers
   */
  static extractSession(request: Request): UserSession | null {
    const idToken = request.headers.get("X-ID-Token");
    const awsSessionToken = request.headers.get("X-AWS-Session-Token");
    const userEmail = request.headers.get("X-User-Email");

    if (!userEmail) {
      return null;
    }

    return {
      userId: userEmail, // For now, use email as ID
      email: userEmail,
      idToken: idToken || undefined,
      awsSessionToken: awsSessionToken || undefined,
    };
  }

  /**
   * Validate session and throw error if invalid
   */
  static requireSession(request: Request): UserSession {
    const session = this.extractSession(request);
    if (!session) {
      throw new Error("Authentication required");
    }
    return session;
  }

  /**
   * Get user ID from session
   */
  static getUserId(session: UserSession): string {
    return session.userId;
  }
}

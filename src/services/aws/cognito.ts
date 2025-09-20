/**
 * Cognito Service
 * 
 * AWS Cognito user management service using Identity Pool credentials.
 * 
 * Authentication:
 * - Uses temporary credentials from Cognito Identity Pool
 * - Credentials are obtained at the API layer using the user's ID token
 * - User must be authenticated and in 'Admins' group for admin operations
 * - Provides user-specific, temporary, scoped access with audit trail
 * 
 * Security Benefits:
 * - No hardcoded AWS credentials
 * - Temporary credentials that auto-rotate
 * - User-specific access control
 * - Full audit trail of who performed each action
 * - Instantly revocable by removing user from Admins group
 * 
 * Required Configuration:
 * - COGNITO_USER_POOL_ID: The Cognito User Pool ID
 * - COGNITO_IDENTITY_POOL_ID: Identity Pool ID (configured at API layer)
 * - AWS_REGION: AWS region (defaults to us-east-1)
 */

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminResetUserPasswordCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  ListGroupsCommand,
  AdminListGroupsForUserCommand,
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  GetUserCommand,
  UpdateUserAttributesCommand,
  DescribeUserPoolCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  CognitoIdentityClient,
  GetIdCommand,
  GetCredentialsForIdentityCommand
} from "@aws-sdk/client-cognito-identity";
interface CognitoRequest {
  service: string;
  operation: string;
  params?: any;
  data?: any;
  schema?: string;
  app?: string;
}

/**
 * Execute Cognito user management operations
 * Uses Identity Pool credentials obtained at the API layer
 * Requires user to be in Admins group
 */
export async function execute(
  request: CognitoRequest,
  credentials?: any, // Identity Pool credentials from API (optional)
  session?: any // User session from API
): Promise<any> {
  // Validate that Identity Pool credentials were provided
  if (!credentials?.accessKeyId || !credentials?.secretAccessKey || !credentials?.sessionToken) {
    console.error("❌ No Identity Pool credentials provided");
    return {
      success: false,
      error: "Authentication required. Please ensure you are logged in and have the necessary permissions.",
      details: "This service requires Identity Pool credentials which are obtained through the API layer."
    };
  }

  // Validate user session
  if (!session?.user) {
    return {
      success: false,
      error: "No user session found. Please log in to continue."
    };
  }

  // Check if user is admin
  const isAdmin = session?.isAdmin || session?.user?.isAdmin ||
                   session?.groups?.includes('Admins') ||
                   session?.user?.groups?.includes('Admins');

  // List of operations that don't require admin privileges
  const userLevelOperations = ['updateOwnAttributes', 'getOwnProfile'];

  if (!isAdmin && !userLevelOperations.includes(request.operation)) {
    console.error("🚫 Access denied: User is not in Admins group:", session.user.email || session.user.id);
    return {
      success: false,
      error: "Access denied. You must be an administrator to perform Cognito management operations.",
      details: "Please contact your system administrator to request access to the Admins group."
    };
  }


  const region = credentials.region || process.env.AWS_REGION || "us-east-1";

  const client = new CognitoIdentityProviderClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });

  const userPoolId = process.env.COGNITO_USER_POOL_ID || "us-east-1_k3Fp77c09";

  if (!userPoolId) {
    return { success: false, error: "Cognito User Pool ID not configured" };
  }

  try {
    const params = request.params || request.data || {};
    
    switch (request.operation) {
      case "listUsers": {
        const command = new ListUsersCommand({
          UserPoolId: userPoolId,
          Limit: params.limit || 60,
          PaginationToken: params.paginationToken,
          Filter: params.filter,
        });
        const response = await client.send(command);
        return { success: true, data: response.Users || [] };
      }

      case "getUser": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminGetUserCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        const response = await client.send(command);
        return { success: true, data: response };
      }

      case "updateUser": {
        if (!params.Username || !params.UserAttributes) {
          return { success: false, error: "Username and UserAttributes are required" };
        }
        const command = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
          UserAttributes: params.UserAttributes,
        });
        await client.send(command);
        return { success: true, message: "User attributes updated successfully" };
      }

      case "enableUser": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminEnableUserCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        await client.send(command);
        return { success: true, message: "User enabled successfully" };
      }

      case "disableUser": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminDisableUserCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        await client.send(command);
        return { success: true, message: "User disabled successfully" };
      }

      case "resetPassword": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminResetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        await client.send(command);
        return { success: true, message: "Password reset email sent" };
      }

      case "setPassword": {
        if (!params.Username || !params.Password) {
          return { success: false, error: "Username and Password are required" };
        }
        const command = new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
          Password: params.Password,
          Permanent: params.Permanent !== false,
        });
        await client.send(command);
        return { success: true, message: "Password set successfully" };
      }

      case "addToGroup": {
        if (!params.Username || !params.GroupName) {
          return { success: false, error: "Username and GroupName are required" };
        }
        const command = new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
          GroupName: params.GroupName,
        });
        await client.send(command);
        return { success: true, message: "User added to group successfully" };
      }

      case "removeFromGroup": {
        if (!params.Username || !params.GroupName) {
          return { success: false, error: "Username and GroupName are required" };
        }
        const command = new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
          GroupName: params.GroupName,
        });
        await client.send(command);
        return { success: true, message: "User removed from group successfully" };
      }

      case "listGroups": {
        const command = new ListGroupsCommand({
          UserPoolId: userPoolId,
          Limit: params.limit || 60,
          NextToken: params.nextToken,
        });
        const response = await client.send(command);
        return { success: true, data: response.Groups || [] };
      }

      case "getUserGroups": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
          Limit: params.limit || 60,
          NextToken: params.nextToken,
        });
        const response = await client.send(command);
        return { success: true, data: response.Groups || [] };
      }

      case "confirmSignUp": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminConfirmSignUpCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        await client.send(command);
        return { success: true, message: "User sign up confirmed" };
      }

      case "deleteUser": {
        if (!params.Username) {
          return { success: false, error: "Username is required" };
        }
        const command = new AdminDeleteUserCommand({
          UserPoolId: userPoolId,
          Username: params.Username,
        });
        await client.send(command);
        return { success: true, message: "User deleted successfully" };
      }

      case "describeUserPool": {
        const command = new DescribeUserPoolCommand({
          UserPoolId: userPoolId,
        });
        const response = await client.send(command);
        return { success: true, data: response.UserPool };
      }

      case "updateOwnAttributes": {
        // Users can update their own attributes using their access token
        if (!session?.accessToken) {
          return { success: false, error: "Access token is required for this operation" };
        }

        if (!params.UserAttributes) {
          return { success: false, error: "UserAttributes are required" };
        }

        // Use the user's access token instead of admin credentials
        const userClient = new CognitoIdentityProviderClient({
          region,
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
        });

        const command = new UpdateUserAttributesCommand({
          AccessToken: session.accessToken,
          UserAttributes: params.UserAttributes,
        });

        await userClient.send(command);
        return { success: true, message: "User attributes updated successfully" };
      }

      case "getOwnProfile": {
        // Users can get their own profile using their access token
        if (!session?.accessToken) {
          return { success: false, error: "Access token is required for this operation" };
        }

        const userClient = new CognitoIdentityProviderClient({
          region,
          credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken,
          },
        });

        const command = new GetUserCommand({
          AccessToken: session.accessToken,
        });

        const response = await userClient.send(command);
        return { success: true, data: response };
      }

      case "checkCorePoolAccess": {
        // Check if user can access the captify-core-identity-pool
        const canAccess = await canAccessCoreIdentityPool(session);
        return {
          success: true,
          data: {
            canAccess,
            identityPoolId: process.env.CAPTIFY_CORE_IDENTITY_POOL_ID
          }
        };
      }

      default:
        return { success: false, error: `Unknown operation: ${request.operation}` };
    }
  } catch (error: any) {
    console.error("Cognito operation error:", error);
    
    // Provide more specific error messages
    if (error.name === "AccessDeniedException" || error.$metadata?.httpStatusCode === 403) {
      return {
        success: false,
        error: "Access denied. Please ensure you are in the Admins group to perform this operation.",
        details: error.$metadata,
      };
    }
    
    if (error.name === "NotAuthorizedException") {
      return {
        success: false,
        error: "Not authorized. Your session may have expired. Please log in again.",
        details: error.$metadata,
      };
    }
    
    if (error.name === "ExpiredTokenException") {
      return {
        success: false,
        error: "Your authentication token has expired. Please refresh the page to get new credentials.",
        details: error.$metadata,
      };
    }
    
    return {
      success: false,
      error: error.message || "Cognito operation failed",
      details: error.$metadata,
    };
  }
}

/**
 * Check if user can access the captify-core-identity-pool
 * @param session - User session with idToken
 */
export async function canAccessCoreIdentityPool(session?: any): Promise<boolean> {
  console.log("🔍 Checking core identity pool access for session:", {
    hasSession: !!session,
    hasIdToken: !!session?.idToken,
    hasUser: !!session?.user,
    userId: session?.user?.id
  });

  if (!session?.idToken) {
    console.log("❌ No ID token in session for identity pool check. Session keys:", Object.keys(session || {}));
    return false;
  }

  const coreIdentityPoolId = process.env.CAPTIFY_CORE_IDENTITY_POOL_ID;
  if (!coreIdentityPoolId) {
    console.log("❌ CAPTIFY_CORE_IDENTITY_POOL_ID not configured");
    return false;
  }

  try {
    const region = process.env.AWS_REGION || "us-east-1";
    const userPoolId = process.env.COGNITO_USER_POOL_ID;
    const issuer = process.env.COGNITO_ISSUER;

    if (!userPoolId || !issuer) {
      console.log("❌ Missing COGNITO_USER_POOL_ID or COGNITO_ISSUER");
      return false;
    }

    // For core identity pool check, we need to handle this differently
    // This function will be called server-side with session tokens
    // We'll use the session tokens to check access without needing credentials

    // Since this is a server-side check, we'll return true for now
    // and implement proper verification later
    console.log("✅ Core identity pool access check - allowing access");
    return true;
  } catch (error: any) {
    console.log("❌ Error checking core identity pool access:", error.message);
    return false;
  }
}

/**
 * Check if user has admin privileges
 * @param session - User session containing groups or role information
 */
export function isAdmin(session?: any): boolean {
  if (!session) return false;
  
  // Check session-level isAdmin flag (set by NextAuth)
  if (session.isAdmin === true) {
    return true;
  }
  
  // Check user-level isAdmin flag
  if (session.user?.isAdmin === true) {
    return true;
  }
  
  // Check if user has admin group membership in their Cognito groups
  if (session.user?.groups?.includes("Admins")) {
    return true;
  }
  
  // Check groups from session level
  if (session.groups?.includes("Admins")) {
    return true;
  }
  
  // Check cognito:groups claim (legacy support)
  if (session?.['cognito:groups']?.includes("Admins")) {
    return true;
  }
  
  return false;
}

export const cognito = {
  execute,
  isAdmin,
  canAccessCoreIdentityPool,
};
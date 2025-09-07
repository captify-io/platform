import NextAuth from "next-auth";
import Cognito from "next-auth/providers/cognito";
import type { NextAuthConfig } from "next-auth";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
// Session configuration moved inline since we're in the core package now
function getSessionConfig() {
  const defaultDuration = 3600; // 1 hour
  const defaultRefreshBuffer = 300; // 5 minutes

  const nextAuthDuration = parseInt(
    process.env.NEXTAUTH_SESSION_DURATION || defaultDuration.toString()
  );
  const refreshBuffer = parseInt(
    process.env.COGNITO_TOKEN_REFRESH_BUFFER || defaultRefreshBuffer.toString()
  );

  return {
    nextAuthDuration,
    nextAuthUpdateAge: nextAuthDuration - refreshBuffer,
  };
}

// Get session configuration
const sessionConfig = getSessionConfig();

// Token refresh function using Cognito OAuth endpoint
async function refreshCognitoTokens(refreshToken: string) {
  const tokenUrl = `https://account.anautics.ai/oauth2/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Token refresh failed:", response.status, errorText);
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const tokens = await response.json();
  console.log("✅ Successfully refreshed tokens");

  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    refresh_token: tokens.refresh_token || refreshToken, // Use new refresh token if provided
    expires_in: tokens.expires_in || 3600, // Default to 1 hour if not provided
  };
}

// Auth configuration
export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
    maxAge: sessionConfig.nextAuthDuration,
    updateAge: sessionConfig.nextAuthUpdateAge,
  },
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
      wellKnown: `https://cognito-idp.us-east-1.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/openid_configuration`,
      authorization: {
        url: "https://account.anautics.ai/oauth2/authorize",
        params: {
          scope: "openid email profile",
          response_type: "code",
        },
      },
      token: {
        url: "https://account.anautics.ai/oauth2/token",
      },
      userinfo: {
        url: "https://account.anautics.ai/oauth2/userInfo",
      },
      checks: ["pkce", "state"],
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  // Always trust host in production due to load balancer configuration
  trustHost: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 900, // 15 minutes
      },
    },
  },
  callbacks: {
    async jwt({ token, account, profile, trigger }) {
      // Helper function to decode JWT and extract groups
      const extractGroupsFromToken = (idToken: string): string[] => {
        try {
          // Decode the JWT payload (base64 decode the middle part)
          const parts = idToken.split('.');
          if (parts.length !== 3) return [];
          
          const payload = JSON.parse(
            Buffer.from(parts[1], 'base64').toString('utf-8')
          );
          
          // Cognito stores groups in 'cognito:groups' claim
          return payload['cognito:groups'] || [];
        } catch (error) {
          console.error('Failed to decode ID token:', error);
          return [];
        }
      };

      // Helper function to check/create user in DynamoDB
      const handleUserInDynamoDB = async (userId: string, email: string, name?: string, groups?: string[], isAdmin?: boolean) => {
        try {
          if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.warn("AWS credentials not configured");
            return null;
          }

          const client = new DynamoDBClient({
            region: process.env.AWS_REGION || "us-east-1",
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          
          const docClient = DynamoDBDocumentClient.from(client);
          const tableName = "captify-core-User";
          
          // 1. Check if user exists
          let user = null;
          try {
            const getCommand = new GetCommand({
              TableName: tableName,
              Key: { id: userId },
            });
            const response = await docClient.send(getCommand);
            user = response.Item;
          } catch (error) {
            console.log("User not found by ID, checking by email");
          }
          
          // If not found by ID, try by email
          if (!user && email) {
            const scanCommand = new ScanCommand({
              TableName: tableName,
              FilterExpression: "email = :email",
              ExpressionAttributeValues: {
                ":email": email,
              },
            });
            
            const scanResponse = await docClient.send(scanCommand);
            if (scanResponse.Items && scanResponse.Items.length > 0) {
              user = scanResponse.Items[0];
              console.log(`Found existing user by email: ${email}`);
            }
          }
          
          const now = new Date().toISOString();
          
          // 2. If user exists, update their information if needed
          if (user) {
            // Update user with latest information from Cognito
            const updatedUser = {
              ...user,
              email: email || user.email,
              name: name || user.name || email,
              groups: groups || user.groups || [],
              isAdmin: isAdmin !== undefined ? isAdmin : user.isAdmin,
              lastLogin: now,
              updatedAt: now,
              updatedBy: userId,
            };
            
            // Only update if there are changes
            if (
              user.email !== email ||
              user.name !== (name || user.name) ||
              JSON.stringify(user.groups) !== JSON.stringify(groups || []) ||
              user.isAdmin !== isAdmin
            ) {
              const updateCommand = new PutCommand({
                TableName: tableName,
                Item: updatedUser,
              });
              
              await docClient.send(updateCommand);
              console.log(`Updated user ${userId} with latest Cognito information`);
            }
            
            return user.status || "registered";
          }
          
          // 3. If user doesn't exist, create them with all Cognito information
          const newUser = {
            id: userId,
            userId: userId,
            email: email,
            username: email.split("@")[0],
            name: name || email,
            status: "unregistered", // New users start as unregistered
            app: "core",
            slug: `user-${userId}`,
            description: `User profile for ${email}`,
            profile: {
              firstName: name ? name.split(" ")[0] : "",
              lastName: name && name.split(" ").length > 1 ? name.split(" ").slice(1).join(" ") : "",
              title: "",
              department: "",
              phone: "",
            },
            roles: [],
            groups: groups || [],
            isAdmin: isAdmin || false,
            preferences: {
              theme: "auto",
              notifications: {
                email: true,
                inApp: true,
                security: true,
              },
            },
            fields: {},
            ownerId: userId,
            createdAt: now,
            createdBy: userId,
            updatedAt: now,
            updatedBy: userId,
            lastLogin: now,
          };
          
          const putCommand = new PutCommand({
            TableName: tableName,
            Item: newUser,
          });
          
          await docClient.send(putCommand);
          console.log(`Created new user: ${userId} (${email})`);
          
          return "unregistered";
        } catch (error) {
          console.error("Error handling user in DynamoDB:", error);
          return null;
        }
      };
      
      // Initial sign-in: store all tokens with proper expiration
      if (account && profile) {
        console.log("🔐 Initial sign-in, storing tokens");
        console.log("📋 Account tokens received:", {
          access_token: account.access_token
            ? `Present (${account.access_token.substring(0, 20)}...)`
            : "Missing",
          id_token: account.id_token
            ? `Present (${account.id_token.substring(0, 20)}...)`
            : "Missing",
          refresh_token: account.refresh_token
            ? `Present (${account.refresh_token.substring(0, 20)}...)`
            : "Missing",
          expires_in: account.expires_in,
          token_type: account.token_type,
          scope: account.scope,
        });

        const now = Math.floor(Date.now() / 1000);
        const expiresIn = account.expires_in || 3600; // Default to 1 hour

        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
        token.sub = profile.sub || undefined;
        token.email = profile.email || undefined;
        token.name = profile.name || undefined;
        token.awsTokenExpiresAt = now + expiresIn; // Track AWS token expiration separately
        
        // Extract groups from ID token and check admin status
        if (account.id_token) {
          const groups = extractGroupsFromToken(account.id_token);
          token.groups = groups;
          token.isAdmin = groups.includes('Admins');
          console.log(`👤 User groups: ${groups.join(', ') || 'none'}`);
          console.log(`🔑 Admin status: ${token.isAdmin ? 'Yes' : 'No'}`);
        }
        
        // Check/create user in DynamoDB and get their status
        const captifyStatus = await handleUserInDynamoDB(
          profile.sub || "",
          profile.email || "",
          profile.name || undefined,
          token.groups as string[],
          token.isAdmin as boolean
        );
        token.captifyStatus = captifyStatus;

        console.log(
          `🕐 AWS tokens will expire at: ${new Date(
            (now + expiresIn) * 1000
          ).toISOString()}`
        );

        if (!account.refresh_token) {
          console.warn(
            "⚠️  No refresh token received - check Cognito User Pool settings"
          );
          console.log(
            "📝 Note: Cognito should provide refresh tokens by default"
          );
        } else {
          console.log("✅ Refresh token received successfully");
        }

        return token;
      }

      // Check if this is a session call (when /api/auth/session is accessed)
      // or if AWS tokens need refresh (refresh 5 minutes before expiry)
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = (token.awsTokenExpiresAt as number) - now;
      const shouldRefresh = timeUntilExpiry <= 300; // Refresh if expiring within 5 minutes

      if (shouldRefresh && token.refreshToken) {
        try {
          console.log(
            `🔄 AWS tokens expire in ${timeUntilExpiry} seconds, refreshing...`
          );
          const refreshedTokens = await refreshCognitoTokens(
            token.refreshToken as string
          );

          const newExpiresAt = now + refreshedTokens.expires_in;

          console.log(
            `✅ AWS tokens refreshed, new expiry: ${new Date(
              newExpiresAt * 1000
            ).toISOString()}`
          );

          // Extract groups from new ID token
          const groups = extractGroupsFromToken(refreshedTokens.id_token);
          const isAdmin = groups.includes('Admins');

          // Update user in DynamoDB with refreshed groups/admin status
          if (token.sub && token.email) {
            await handleUserInDynamoDB(
              token.sub as string,
              token.email as string,
              token.name as string,
              groups,
              isAdmin
            );
          }

          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token,
            refreshToken: refreshedTokens.refresh_token,
            awsTokenExpiresAt: newExpiresAt,
            groups: groups,
            isAdmin: isAdmin,
          };
        } catch (error) {
          console.error("❌ AWS token refresh failed:", error);
          // Return token with error flag, which will trigger logout
          return { ...token, error: "RefreshTokenError" };
        }
      }

      // Check captifyStatus on each request if not set
      if (!token.captifyStatus && token.sub && token.email) {
        const captifyStatus = await handleUserInDynamoDB(
          token.sub as string,
          token.email as string,
          token.name as string,
          token.groups as string[],
          token.isAdmin as boolean
        );
        token.captifyStatus = captifyStatus;
      }
      
      // Token is still valid, return as-is
      return token;
    },
    async session({ session, token }) {
      // If there's a refresh error, force logout
      if (token.error === "RefreshTokenError") {
        throw new Error("Token refresh failed. Please log in again.");
      }

      if (token.idToken) {
        (session as any).idToken = token.idToken as string;
        (session as any).accessToken = token.accessToken as string;
        (session as any).refreshToken = token.refreshToken as string;
        (session as any).awsTokenExpiresAt = token.awsTokenExpiresAt; // AWS token expiration for quick checking
        (session as any).groups = token.groups || [];
        (session as any).isAdmin = token.isAdmin || false;
      }

      if (session.user && token) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        (session.user as any).id = token.sub as string;
        (session.user as any).groups = token.groups || [];
        (session.user as any).isAdmin = token.isAdmin || false;
        (session as any).captifyStatus = token.captifyStatus;
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to home after authentication
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl; // Default to home page
    },
  },
  debug: false, // Disable debug warnings including cookie chunking messages
};

const authInstance = NextAuth(authConfig);
export const { handlers, auth } = authInstance;
export const signIn: any = authInstance.signIn;
export const signOut: any = authInstance.signOut;

// For backward compatibility, export authOptions-like object
export const authOptions = authConfig;

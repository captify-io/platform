import { ReactNode } from "react";
import { auth } from "../lib/auth";
import { ClientCaptifyProvider } from "../components/ClientCaptifyProvider";
import { UserRegistrationForm } from "../components";
import { AutoSignIn } from "../components/navigation/AutoSignIn";
import "./globals.css";

// Import DynamoDB to check user status
import { services } from "../services";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

async function ServerCaptifyProvider({ children }: ServerCaptifyProviderProps) {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    console.log("Error getting server session:", error);
  }

  // Check 1: Not authenticated - show auto signin component
  if (!session) {
    return <AutoSignIn />;
  }

  // Check 2: Token refresh error - show auto signin component to re-authenticate
  if ((session as any).error === "RefreshAccessTokenError") {
    console.log("🔄 Token refresh error detected, redirecting to sign in");
    return <AutoSignIn />;
  }

  // Check 2: User is authenticated - check core identity pool access
  const userId = (session as any)?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const userGroups = (session as any)?.groups || [];

  // Check user's approval status in DynamoDB
  let userStatus = null;
  try {
    // We need to import credentials helper for server-side DynamoDB access
    const { getAwsCredentialsFromIdentityPool } = await import(
      "./api/lib/credentials"
    );

    const credentials = await getAwsCredentialsFromIdentityPool(
      session,
      process.env.COGNITO_IDENTITY_POOL_ID
    );

    const userRecord = await services.use("dynamo").execute(
      {
        service: "dynamo",
        operation: "get",
        table: "User",
        schema: "captify",
        app: "core",
        data: {
          Key: { id: userId },
        },
      } as any,
      credentials,
      session
    );

    if (userRecord.success && userRecord.data) {
      userStatus = userRecord.data.status;
      console.log("🔍 User status from DynamoDB:", userStatus);
    } else {
      console.log("🔍 No user record found or failed to fetch:", userRecord);
    }
  } catch (error) {
    console.log("🔍 Could not fetch user status:", error);
  }

  // Check if user is authorized via Cognito groups OR has approved status
  const isAuthorized =
    userGroups.includes("captify-authorized") || userStatus === "approved";
  console.log("🔍 User groups:", userGroups);
  console.log("🔍 User status:", userStatus);
  console.log("🔍 User is authorized:", isAuthorized);

  // Check 3: User is NOT authorized - show registration form
  if (!isAuthorized) {
    return (
      <div className="h-screen bg-background overflow-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold mb-2">
                Account Registration is Required
              </h1>
              <p className="text-muted-foreground">
                Please provide your information to access the platform
              </p>
            </div>
            <UserRegistrationForm
              userId={userId}
              userEmail={userEmail}
              userName={userName}
              userGroups={userGroups}
            />
          </div>
        </div>
      </div>
    );
  }

  // Check 4: User IS in captify-authorized group - show full application
  return (
    <ClientCaptifyProvider session={session}>{children}</ClientCaptifyProvider>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className="h-full m-0 p-0">
        <ServerCaptifyProvider>{children}</ServerCaptifyProvider>
      </body>
    </html>
  );
}

// Force dynamic rendering for authentication
export const dynamic = "force-dynamic";

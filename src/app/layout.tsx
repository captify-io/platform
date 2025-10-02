import { ReactNode } from "react";
import { CaptifyProvider, UserRegistrationForm } from "@captify-io/core/components";
import { ThemeProvider } from "next-themes";
import "./globals.css";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

async function ServerCaptifyProvider({ children }: ServerCaptifyProviderProps) {
  // Check if this is the signout page - allow it without authentication
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Allow public pages without authentication
  if (pathname === "/signout") {
    return <>{children}</>;
  }

  let session = null;

  try {
    // Import getServerSession to get full session with tokens
    const { getServerSession } = await import("../lib/auth");
    session = await getServerSession();
  } catch (error) {
    // Error getting server session
  }

  // Check 1: Not authenticated
  if (!session) {
    // If on signout page, allow access without authentication
    if (pathname === "/signout") {
      return <>{children}</>;
    }
    // Otherwise, redirect to signin
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href = "/api/auth/signin";`,
        }}
      />
    );
  }

  // Check 2: Token refresh error - redirect to signin
  if ((session as any).error === "RefreshAccessTokenError") {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.href = "/api/auth/signin";`,
        }}
      />
    );
  }

  // Check 2: User is authenticated - check core identity pool access
  const userId = (session as any)?.user?.id;
  const userEmail = session?.user?.email;
  const userName = session?.user?.name;
  const userGroups = (session as any)?.groups || [];

  // Get user status from session (set during authentication)
  const userStatus = (session as any)?.captifyStatus;

  // Check if user is authorized via Cognito groups only
  const isAuthorized = userGroups.some(
    (group: string) => group.includes("captify-authorized")
  );

  // Check if user has already registered (has any status, even if pending)
  const hasRegistered = userStatus !== null && userStatus !== undefined;

  // Check 3: User is NOT authorized - show registration form (whether they've registered before or not)
  if (!isAuthorized) {
    return (
      <ThemeProvider
        attribute="class"
        defaultTheme="captify"
        enableSystem={false}
        themes={["captify", "lite", "dark"]}
        disableTransitionOnChange={true}
        storageKey="captify-theme"
      >
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
                onRegistrationComplete={() => {
                  // Refresh the page after registration
                  if (typeof window !== 'undefined') {
                    window.location.reload();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Check 4: User IS authorized - show full application
  return (
    <CaptifyProvider session={session}>{children}</CaptifyProvider>
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

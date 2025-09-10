import { ReactNode } from "react";
import { auth } from "../lib/auth";
import { ClientCaptifyProvider } from "../components/ClientCaptifyProvider";
import { UserRegistrationForm } from "../components";
import { SignInForm } from "../components/navigation";
import "./globals.css";

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

  // Check 1: Not authenticated - show SignInForm
  if (!session) {
    return <SignInForm />;
  }

  // Check 2: User is authenticated - continue with status checks
  const captifyStatus = (session as any)?.captifyStatus;
  const userId = (session as any)?.user?.id;

  // Check 3: captifyStatus !== "approved" - show registration form
  if (captifyStatus !== "approved") {
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
              captifyStatus={captifyStatus}
              userId={userId}
            />
          </div>
        </div>
      </div>
    );
  }

  // Check 5: captifyStatus === "approved" - show full application with navigation
  if (captifyStatus === "approved" || captifyStatus === "active") {
    return (
      <ClientCaptifyProvider session={session}>
        {children}
      </ClientCaptifyProvider>
    );
  }

  // Fallback - shouldn't normally reach here
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

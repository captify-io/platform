import { ReactNode } from "react";
import { getServerSession } from "@captify/core/auth";
import {
  CaptifyProvider,
  SignInForm,
  TopNavigation,
} from "@captify/core/components";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

async function ServerCaptifyProvider({ children }: ServerCaptifyProviderProps) {
  let session = null;

  try {
    session = await getServerSession();
  } catch (error) {
    // Handle static generation gracefully
    console.log("Error getting server session:", error);
  }

  return (
    <SessionProvider session={session}>
      <CaptifyProvider session={session ?? undefined}>
        {session ? (
          <div className="h-full w-full bg-background">
            <TopNavigation session={session} />
            <main className="h-full">{children}</main>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-background">
            <div className="w-full max-w-md">
              <SignInForm />
            </div>
          </div>
        )}
      </CaptifyProvider>
    </SessionProvider>
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

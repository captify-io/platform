"use client";

import { AppLayout } from "@/components/apps/AppLayout";
import { useAuth } from "@/hooks/useAuth";

export default function ConsoleDashboard() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Welcome to Captify Console</h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout
      applicationId="console"
      applicationName="Captify Console - Dashboard"
      showChat={true}
      showMenu={true}
    >
      <div className="h-full p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your console dashboard. Monitor your applications and
              services here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Applications</h3>
              <p className="text-2xl font-bold text-primary">3</p>
              <p className="text-sm text-muted-foreground">
                Active applications
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Agents</h3>
              <p className="text-2xl font-bold text-primary">2</p>
              <p className="text-sm text-muted-foreground">AI agents running</p>
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Sessions</h3>
              <p className="text-2xl font-bold text-primary">12</p>
              <p className="text-sm text-muted-foreground">
                Active sessions today
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

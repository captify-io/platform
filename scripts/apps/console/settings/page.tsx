"use client";

import { AppLayout } from "@/components/apps/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConsoleSettings() {
  const { user, isLoading, isAuthenticated } = useAuth();

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
      applicationName="Captify Console - Settings"
      showChat={true}
      showMenu={true}
    >
      <div className="h-full p-6">
        <div className="max-w-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Configure your console preferences and application settings.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Console Preferences</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notifications">Email Notifications</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="notifications"
                    className="rounded border border-input"
                  />
                  <label htmlFor="notifications" className="text-sm">
                    Receive email notifications for important events
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Your API key"
                  defaultValue="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <Button>Save Settings</Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

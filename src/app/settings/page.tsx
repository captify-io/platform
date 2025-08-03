"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Settings as SettingsIcon,
  Bell,
  Shield,
  Palette,
  Globe,
  Monitor,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { ApplicationLayout } from "@/components/layout/ApplicationLayout";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <ApplicationLayout applicationName="Settings" showChat={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </ApplicationLayout>
    );
  }

  if (!session) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <ApplicationLayout applicationName="Settings" showChat={false}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
        </div>

        <div className="space-y-6">
          {/* Settings Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account preferences and application settings
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Settings */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>Account Settings</span>
                </CardTitle>
                <CardDescription>
                  Manage your profile information and security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => router.push("/profile")}
                  className="w-full justify-start"
                >
                  View Profile
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Email notifications: Enabled</p>
                  <p>• Push notifications: Enabled</p>
                  <p>• System alerts: Enabled</p>
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security & Privacy</span>
                </CardTitle>
                <CardDescription>
                  Authentication settings and privacy controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Multi-factor authentication: Required</p>
                  <p>• Session timeout: 24 hours</p>
                  <p>• Data retention: Standard</p>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Appearance</span>
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your interface
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Theme: System default</p>
                  <p>• Layout: Standard</p>
                  <p>• Font size: Medium</p>
                </div>
              </CardContent>
            </Card>

            {/* Region & Language */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Region & Language</span>
                </CardTitle>
                <CardDescription>
                  Set your location and language preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Language: English (US)</p>
                  <p>• Region: United States</p>
                  <p>• Timezone: Auto-detect</p>
                </div>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Connected Devices</span>
                </CardTitle>
                <CardDescription>
                  Manage devices that have access to your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Current Browser</span>
                    </div>
                    <span className="text-xs text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Advanced Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Advanced Settings</CardTitle>
              <CardDescription>
                Dangerous actions that affect your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h3 className="font-medium text-red-900">Sign Out</h3>
                  <p className="text-sm text-red-700">
                    Sign out of your TITAN account
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => router.push("/auth/signout")}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ApplicationLayout>
  );
}

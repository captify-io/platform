"use client";

import { signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCaptify } from "../../context/CaptifyContext";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ArrowLeft, User, Mail, Calendar, Shield } from "lucide-react";

export interface ProfilePageProps {
  /**
   * Optional layout wrapper component
   */
  Layout?: React.ComponentType<{
    children: React.ReactNode;
    applicationName?: string;
    showChat?: boolean;
  }>;
  /**
   * Show back button
   */
  showBackButton?: boolean;
  /**
   * Custom title
   */
  title?: string;
  /**
   * Custom description
   */
  description?: string;
}

export function ProfilePage({
  Layout,
  showBackButton = true,
  title = "Profile",
  description,
}: ProfilePageProps) {
  const { session, isAuthenticated } = useCaptify();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      signIn();
    }
  }, [isAuthenticated]);

  if (!session) {
    const loadingContent = (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );

    if (Layout) {
      return (
        <Layout applicationName={title} showChat={false}>
          {loadingContent}
        </Layout>
      );
    }
    return loadingContent;
  }

  if (!session) {
    return null;
  }

  const handleBack = () => {
    router.back();
  };

  const profileContent = (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      {showBackButton && (
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
      )}

      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={session.user?.image || undefined}
                  alt={session.user?.name || "User"}
                />
                <AvatarFallback className="bg-blue-600 text-white text-lg">
                  {session.user?.name
                    ? session.user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : session.user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">
                  {session.user?.name || "User"}
                </CardTitle>
                <CardDescription className="text-base">
                  {description ||
                    `${
                      process.env.NEXT_PUBLIC_APP_TITLE || "Application"
                    } Platform User`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Display Name
                </label>
                <p className="text-foreground">
                  {session.user?.name || "Not provided"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email Address
                </label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-foreground">
                    {session.user?.email || "Not provided"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Account Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  User ID
                </label>
                <p className="text-foreground font-mono text-sm">
                  {(session as { user?: { id?: string } })?.user?.id ||
                    "Not available"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Account Type
                </label>
                <p className="text-foreground">Standard User</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Authentication Provider
                </label>
                <p className="text-foreground">AWS Cognito</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Session Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Session Expires
                </label>
                <p className="text-foreground">
                  {session.expires
                    ? new Date(session.expires).toLocaleString()
                    : "Not available"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Access Token Status
                </label>
                <p className="text-green-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/settings")}
              >
                Account Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (Layout) {
    return (
      <Layout applicationName={title} showChat={false}>
        {profileContent}
      </Layout>
    );
  }

  return profileContent;
}

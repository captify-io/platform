"use client";

import React, { useEffect } from "react";
import { useUser } from "@captify/core/hooks";
import { UserRegistrationForm } from "./UserRegistrationForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@captify/core/ui";
import { Alert, AlertDescription } from "@captify/core/ui";
import { Clock, Shield, AlertCircle } from "lucide-react";

interface UserStatusWrapperProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function UserStatusWrapper({
  children,
  requireAdmin = false,
}: UserStatusWrapperProps) {
  const { userStatus, loading, checkUserStatus } = useUser();

  useEffect(() => {
    // Recheck status every 30 seconds if pending
    if (userStatus?.status === "pending") {
      const interval = setInterval(() => {
        checkUserStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [userStatus?.status, checkUserStatus]);

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking user status...</p>
        </div>
      </div>
    );
  }

  // Not registered - show registration form
  if (!userStatus?.isRegistered) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Welcome! You need to complete your registration before accessing
              the system.
            </AlertDescription>
          </Alert>
          <UserRegistrationForm
            onRegistrationComplete={() => {
              checkUserStatus();
            }}
          />
        </div>
      </div>
    );
  }

  // Pending approval
  if (userStatus?.status === "pending") {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Account Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your account registration has been received and is pending
              administrator approval.
            </p>
            <p className="text-sm text-muted-foreground">
              This page will automatically update once your account has been
              activated. You can also refresh the page to check your status.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Suspended or inactive
  if (userStatus?.status === "suspended" || userStatus?.status === "inactive") {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Account{" "}
              {userStatus.status === "suspended" ? "Suspended" : "Inactive"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account is currently {userStatus.status}. Please contact your
              system administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check admin requirement
  if (requireAdmin && !userStatus?.isAdmin) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Administrator Access Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This page requires administrator privileges. Please contact your
              system administrator if you believe you should have access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is active and authorized - render children
  return <>{children}</>;
}

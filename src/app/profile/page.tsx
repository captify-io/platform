"use client";

import { User } from "lucide-react";
import { useCaptify } from "@captify-io/core/components";

export default function ProfilePage() {
  const { session } = useCaptify();

  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <User className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Profile</h1>
        <p className="text-muted-foreground mb-4">
          Manage your account information
        </p>
        {session?.user && (
          <div className="text-sm">
            <p><strong>Name:</strong> {session.user.name}</p>
            <p><strong>Email:</strong> {session.user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

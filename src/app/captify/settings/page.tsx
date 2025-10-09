"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <Settings className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure your preferences
        </p>
      </div>
    </div>
  );
}

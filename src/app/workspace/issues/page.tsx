"use client";

import React from "react";

export default function IssuesPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Issues</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track work and tasks across all projects
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">Issues coming soon</p>
          <p className="text-sm mt-2">
            This will show all issues across your workspace
          </p>
        </div>
      </div>
    </div>
  );
}

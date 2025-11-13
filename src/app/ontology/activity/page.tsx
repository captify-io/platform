"use client";

import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">CloudTrail Activity Viewer</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Query AWS CloudTrail for security events and audit logs. View
          DynamoDB operations, Cognito updates, and access attempts.
        </p>
        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-left">
          <h3 className="font-medium mb-2">Coming Soon:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Filter by date range, user, resource type</li>
            <li>• View allowed and denied access attempts</li>
            <li>• Export to CSV/JSON for reporting</li>
            <li>• Real-time event streaming</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

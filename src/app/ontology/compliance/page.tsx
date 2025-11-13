"use client";

import { Shield } from "lucide-react";

export default function CompliancePage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">
          NIST 800-53 Rev 5 Compliance
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Track IL5 compliance status, map AWS-native security features to NIST
          controls, and maintain evidence for audits.
        </p>
        <div className="mt-6 rounded-lg border bg-muted/50 p-4 text-left">
          <h3 className="font-medium mb-2">Coming Soon:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Control family overview (AC, AU, SC, etc.)</li>
            <li>• Implementation status tracking</li>
            <li>• Evidence links (code, CloudTrail queries)</li>
            <li>• Compliance reports (PDF export)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

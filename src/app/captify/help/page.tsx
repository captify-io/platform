"use client";

import { HelpCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-center">
        <HelpCircle className="h-16 w-16 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
        <p className="text-muted-foreground">
          Get help and find answers
        </p>
      </div>
    </div>
  );
}

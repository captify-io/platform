"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Brain } from "lucide-react";

export function ReasoningPanel({ threadId }: { threadId?: string }) {
  const [reasoningHistory] = useState([]);

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Reasoning</h3>
        <Badge variant="outline" className="text-xs">
          0 conversations
        </Badge>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Brain className="w-8 h-8 mx-auto text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Reasoning Coming Soon</p>
            <p className="text-xs text-muted-foreground max-w-48">
              View detailed AI reasoning steps and decision-making processes for
              each conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

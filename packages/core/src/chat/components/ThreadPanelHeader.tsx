"use client";

import { Button, Input } from "../../components";
import { Plus, Search } from "lucide-react";

interface ThreadPanelHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateThread: () => void;
}

export function ThreadPanelHeader({
  searchQuery,
  onSearchChange,
  onCreateThread,
}: ThreadPanelHeaderProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-8 text-sm"
        />
      </div>

      {/* New Thread Button */}
      <Button
        onClick={onCreateThread}
        size="sm"
        className="h-8 w-8 p-0"
        title="New Chat"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

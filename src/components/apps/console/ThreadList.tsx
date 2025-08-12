"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  MoreHorizontal,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatThread } from "@/types/chat";

interface ThreadListProps {
  threads: ChatThread[];
  activeThreadId?: string;
  isLoading?: boolean;
  searchQuery?: string; // Search query controlled externally
  onSearchChange?: (query: string) => void;
  onThreadSelect: (threadId: string) => void;
  onThreadCreate: () => void;
  onThreadRename: (threadId: string, title: string) => void;
  onThreadDelete: (threadId: string) => void;
  onThreadPin: (threadId: string, pinned: boolean) => void;
}

export function ThreadList({
  threads,
  activeThreadId,
  isLoading = false,
  searchQuery = "",
  onSearchChange,
  onThreadSelect,
  onThreadCreate,
  onThreadRename,
  onThreadDelete,
  onThreadPin,
}: ThreadListProps) {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Filter and sort threads
  const filteredThreads = useMemo(() => {
    let filtered = threads;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((thread) =>
        thread.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort: pinned first, then by updated_at descending
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [threads, searchQuery]);

  const handleStartEdit = useCallback((thread: ChatThread) => {
    setEditingThreadId(thread.id);
    setEditingTitle(thread.title);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingThreadId && editingTitle.trim()) {
      onThreadRename(editingThreadId, editingTitle.trim());
    }
    setEditingThreadId(null);
    setEditingTitle("");
  }, [editingThreadId, editingTitle, onThreadRename]);

  const handleCancelEdit = useCallback(() => {
    setEditingThreadId(null);
    setEditingTitle("");
  }, []);

  const formatRelativeTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded border animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? "No matching conversations" : "No conversations yet"}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group relative p-3 rounded-lg border transition-colors cursor-pointer",
                  activeThreadId === thread.id
                    ? "bg-primary/10 border-primary/20"
                    : "hover:bg-muted/50 border-transparent"
                )}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Thread Title */}
                    {editingThreadId === thread.id ? (
                      <Input
                        value={editingTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setEditingTitle(e.target.value)
                        }
                        onBlur={handleSaveEdit}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="h-6 text-sm font-medium"
                        autoFocus
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        {thread.pinned && (
                          <Pin className="h-3 w-3 text-orange-500 flex-shrink-0" />
                        )}
                        <h3 className="text-sm font-medium truncate">
                          {thread.title}
                        </h3>
                      </div>
                    )}

                    {/* Thread Meta */}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      <span>{thread.messageCount} messages</span>
                      <Clock className="h-3 w-3 ml-1" />
                      <span>{formatRelativeTime(thread.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(thread);
                        }}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onThreadPin(thread.id, !thread.pinned);
                        }}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        {thread.pinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onThreadDelete(thread.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

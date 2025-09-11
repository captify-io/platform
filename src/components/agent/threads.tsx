/**
 * Agent Threads Panel Component
 * Left panel showing chat history and thread management
 */

"use client";

import React, { useState } from 'react';
import { useAgent } from './index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Edit2, 
  Search,
  Loader2,
  Calendar,
  Hash,
  Clock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';

export interface ThreadsPanelProps {
  className?: string;
}

export function ThreadsPanel({ className }: ThreadsPanelProps) {
  const {
    currentThread,
    threads,
    isLoadingThreads,
    threadsError,
    tokenUsage,
    createThread,
    selectThread,
    deleteThread,
    updateThreadTitle,
    refreshThreads,
  } = useAgent();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread =>
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleCreateThread = async () => {
    await createThread();
  };

  const handleSelectThread = async (threadId: string) => {
    if (threadId !== currentThread?.id) {
      await selectThread(threadId);
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    await deleteThread(threadId);
  };

  const handleStartEditTitle = (threadId: string, currentTitle: string) => {
    setEditingThreadId(threadId);
    setEditingTitle(currentTitle);
  };

  const handleSaveTitle = async () => {
    if (editingThreadId && editingTitle.trim()) {
      await updateThreadTitle(editingThreadId, editingTitle.trim());
      setEditingThreadId(null);
      setEditingTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingThreadId(null);
    setEditingTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getThreadPreview = (thread: any) => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    if (!lastMessage) return 'New chat';
    
    const preview = lastMessage.content.slice(0, 100);
    return preview + (lastMessage.content.length > 100 ? '...' : '');
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chats
          </h2>
          <Button 
            size="sm" 
            onClick={handleCreateThread}
            disabled={isLoadingThreads}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Token Usage */}
        <div className="mt-3 p-2 bg-muted rounded-md">
          <div className="text-xs text-muted-foreground mb-1">Monthly Usage</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {tokenUsage.total.toLocaleString()} tokens
            </span>
            <Badge variant="outline" className="text-xs">
              {Math.round((tokenUsage.total / tokenUsage.limit) * 100)}%
            </Badge>
          </div>
          <div className="w-full bg-background rounded-full h-1.5 mt-1">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ 
                width: `${Math.min((tokenUsage.total / tokenUsage.limit) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Thread List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingThreads ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : threadsError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive mb-2">{threadsError}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={refreshThreads}
              >
                Try Again
              </Button>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </p>
              {!searchQuery && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="mt-2"
                  onClick={handleCreateThread}
                >
                  Start your first chat
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredThreads.map((thread) => (
                <div
                  key={thread.id}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent",
                    currentThread?.id === thread.id && "bg-accent border"
                  )}
                  onClick={() => handleSelectThread(thread.id)}
                >
                  {/* Thread Content */}
                  <div className="pr-16">
                    {editingThreadId === thread.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-2 text-xs"
                            onClick={handleSaveTitle}
                          >
                            Save
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 px-2 text-xs"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-medium text-sm line-clamp-1 mb-1">
                          {thread.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {getThreadPreview(thread)}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(thread.updatedAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            {thread.metadata.messageCount}
                          </div>
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            {thread.provider}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingThreadId !== thread.id && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEditTitle(thread.id, thread.title);
                                }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit title</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{thread.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteThread(thread.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
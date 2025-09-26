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
  Clock,
  Bot,
  Brain,
  Zap,
  Cpu,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AgentMessage } from "../../types/agent";
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
  onClose?: () => void;
  isMobile?: boolean;
}

export function ThreadsPanel({ className, onClose, isMobile = false }: ThreadsPanelProps) {
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

  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'threads' | 'agents' | 'projects'>('threads');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Filter data based on active tab
  const getFilteredData = () => {
    switch (activeTab) {
      case 'threads':
        return threads.slice(0, 50);
      case 'agents':
        // For now, return unique agents from threads
        const agentMap = new Map();
        threads.forEach(thread => {
          if (thread.threadType === 'agent' || thread.agentId) {
            const agentId = thread.agentId || thread.id;
            const agentName = thread.metadata?.agentName || thread.provider || 'Agent';
            agentMap.set(agentId, {
              id: agentId,
              name: agentName,
              provider: thread.provider,
              model: thread.model,
              threadCount: (agentMap.get(agentId)?.threadCount || 0) + 1
            });
          }
        });
        return Array.from(agentMap.values());
      case 'projects':
        // For now, return unique projects from threads
        const projectMap = new Map();
        threads.forEach(thread => {
          if (thread.threadType === 'project' || thread.projectId) {
            const projectId = thread.projectId || thread.id;
            const projectName = thread.metadata?.projectName || 'Project';
            projectMap.set(projectId, {
              id: projectId,
              name: projectName,
              threadCount: (projectMap.get(projectId)?.threadCount || 0) + 1,
              updatedAt: thread.updatedAt
            });
          }
        });
        return Array.from(projectMap.values());
      default:
        return threads.slice(0, 50);
    }
  };

  const filteredData = getFilteredData();

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

  const formatDate = (timestamp: number | string) => {
    // Handle both number and string timestamps
    const date = new Date(typeof timestamp === 'string' ? parseInt(timestamp) : timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }

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
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getThreadPreview = (thread: any) => {
    const lastMessage = thread.messages[thread.messages.length - 1];
    if (!lastMessage) return 'New chat';
    
    const preview = lastMessage.content.slice(0, 100);
    return preview + (lastMessage.content.length > 100 ? '...' : '');
  };

  const getProviderIcon = (provider: string, model?: string, threadType?: string) => {
    const iconProps = { className: "h-4 w-4" };

    // Special handling for different thread types
    if (threadType === 'agent') {
      return <Zap {...iconProps} className="h-4 w-4 text-purple-500" />;
    }

    if (threadType === 'project') {
      return <Hash {...iconProps} className="h-4 w-4 text-blue-500" />;
    }

    // Provider-specific icons
    switch (provider?.toLowerCase()) {
      case 'openai':
        // Differentiate between GPT models
        if (model?.includes('gpt-4')) {
          return <Bot {...iconProps} className="h-4 w-4 text-green-600" />;
        }
        return <Bot {...iconProps} className="h-4 w-4 text-green-500" />;
      case 'anthropic':
        // Claude models
        if (model?.includes('claude-3-opus')) {
          return <Brain {...iconProps} className="h-4 w-4 text-orange-600" />;
        } else if (model?.includes('claude-3-sonnet')) {
          return <Brain {...iconProps} className="h-4 w-4 text-orange-500" />;
        } else if (model?.includes('claude-3-haiku')) {
          return <Brain {...iconProps} className="h-4 w-4 text-orange-400" />;
        }
        return <Brain {...iconProps} className="h-4 w-4 text-orange-500" />;
      case 'bedrock':
        // AWS Bedrock models
        if (model?.includes('claude')) {
          return <Cpu {...iconProps} className="h-4 w-4 text-blue-600" />;
        } else if (model?.includes('titan')) {
          return <Cpu {...iconProps} className="h-4 w-4 text-blue-500" />;
        } else if (model?.includes('llama')) {
          return <Cpu {...iconProps} className="h-4 w-4 text-blue-400" />;
        }
        return <Cpu {...iconProps} className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare {...iconProps} className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-muted/20", className)}>
      {/* Header */}
      <div className="p-4">
        {isMobile && onClose && (
          <div className="flex justify-end mb-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-4 bg-background/50 rounded-lg p-1">
          <Button
            size="sm"
            variant={activeTab === 'threads' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('threads')}
            className="flex-1 h-8 text-xs"
          >
            threads
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'agents' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('agents')}
            className="flex-1 h-8 text-xs"
          >
            agents
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'projects' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('projects')}
            className="flex-1 h-8 text-xs"
          >
            projects
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateThread}
            disabled={isLoadingThreads}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
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
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {activeTab === 'threads' ? 'No conversations' :
                 activeTab === 'agents' ? 'No agents found' : 'No projects found'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activeTab === 'threads' ? (
                // Render threads
                filteredData.map((thread: any) => (
                <div
                  key={thread.id}
                  className={cn(
                    "group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-background/80 hover:shadow-sm",
                    currentThread?.id === thread.id && "bg-primary/5 ring-1 ring-primary/20 shadow-sm"
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
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10">
                            {getProviderIcon(thread.provider || 'openai', thread.model, thread.threadType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm line-clamp-1 text-foreground mb-1">
                              {thread.title}
                            </h3>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(thread.updatedAt)} • {(thread.metadata?.tokenUsage?.total || thread.metadata?.totalTokens || 0).toLocaleString()} • {thread.model || 'gpt-4'}
                            </div>
                          </div>
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
                                  handleStartEditTitle(thread.id, thread.title || '');
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
                ))
              ) : activeTab === 'agents' ? (
                // Render agents
                filteredData.map((agent: any) => (
                  <div
                    key={agent.id}
                    className="group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-background/80 hover:shadow-sm"
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      // TODO: Filter threads by agent
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10">
                        {getProviderIcon(agent.provider, agent.model, 'agent')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 text-foreground mb-1">
                          {agent.name}
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {agent.threadCount} conversation{agent.threadCount !== 1 ? 's' : ''} • {agent.model}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Render projects
                filteredData.map((project: any) => (
                  <div
                    key={project.id}
                    className="group relative p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-background/80 hover:shadow-sm"
                    onClick={() => {
                      setSelectedProject(project.id);
                      // TODO: Filter threads by project
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 p-1.5 rounded-lg bg-primary/10">
                        {getProviderIcon('', '', 'project')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 text-foreground mb-1">
                          {project.name}
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {project.threadCount} conversation{project.threadCount !== 1 ? 's' : ''} • {formatDate(project.updatedAt || Date.now())}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
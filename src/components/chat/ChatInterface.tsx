"use client";

import React, { useState } from 'react';
import { useChat } from 'ai/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Settings,
  MessageSquare,
  Minimize2,
  Maximize2,
  Brain,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  className?: string;
  onWorkspaceUpdate?: (data: any) => void;
  applicationId?: string;
  applicationName?: string;
  agentId?: string;
  welcomeMessage?: string;
  placeholder?: string;
  isCollapsible?: boolean;
  isSliding?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
  onChatReady?: (submitMessage: (message: string) => void) => void;
}

// Provider types
type ProviderType = 'bedrock-agent' | 'llm';
type LLMProvider = 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'bedrock';

interface Provider {
  value: string;
  label: string;
  type: ProviderType;
  icon: any;
  description: string;
}

export function ChatInterface({ 
  className, 
  onWorkspaceUpdate,
  applicationId,
  applicationName = "AI Assistant",
  agentId,
  welcomeMessage,
  placeholder = "Type your message...",
  isCollapsible = true,
  isSliding = false,
  isOpen = true,
  onToggle,
  onChatReady
}: ChatInterfaceProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('bedrock-agent');
  const [showSettings, setShowSettings] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  const providers: Provider[] = [
    {
      value: 'bedrock-agent',
      label: 'Bedrock Agent',
      type: 'bedrock-agent',
      icon: Brain,
      description: 'AI Agent with reasoning and tools'
    },
    {
      value: 'openai',
      label: 'OpenAI GPT',
      type: 'llm',
      icon: Zap,
      description: 'ChatGPT models'
    },
    {
      value: 'anthropic',
      label: 'Claude',
      type: 'llm',
      icon: Zap,
      description: 'Anthropic Claude models'
    },
    {
      value: 'azure-openai',
      label: 'Azure OpenAI',
      type: 'llm',
      icon: Zap,
      description: 'Microsoft Azure OpenAI'
    },
    {
      value: 'grok',
      label: 'Grok',
      type: 'llm',
      icon: Zap,
      description: 'xAI Grok models'
    },
    {
      value: 'bedrock',
      label: 'Amazon Bedrock',
      type: 'llm',
      icon: Zap,
      description: 'AWS Bedrock models'
    },
  ];

  const currentProvider = providers.find(p => p.value === selectedProvider);
  const apiEndpoint = currentProvider?.type === 'bedrock-agent' ? '/api/chat/bedrock-agent' : '/api/chat/llm';

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    append,
  } = useChat({
    api: apiEndpoint,
    body: {
      ...(currentProvider?.type === 'bedrock-agent' 
        ? {
            sessionId,
            agentId: process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ID,
            agentAliasId: process.env.NEXT_PUBLIC_AWS_BEDROCK_AGENT_ALIAS_ID,
          }
        : {
            provider: selectedProvider,
          }
      ),
    },
    onError: (error) => {
      console.error('💥 Chat error occurred:', error);
    },
    onFinish: (message) => {
      console.log('✅ Chat response finished:', {
        messageLength: message.content?.length,
        role: message.role,
        id: message.id
      });
    },
  });

  // Log provider changes
  React.useEffect(() => {
    console.log('🔄 Provider changed:', {
      selectedProvider,
      providerType: currentProvider?.type,
      apiEndpoint,
      sessionId: currentProvider?.type === 'bedrock-agent' ? sessionId : 'N/A'
    });
  }, [selectedProvider, currentProvider, apiEndpoint, sessionId]);

  // Expose submit function to parent component - only call once
  React.useEffect(() => {
    if (onChatReady) {
      const submitMessage = (message: string) => {
        // Validate message content before appending
        if (message && message.trim()) {
          console.log('📤 Submitting message via callback:', message.substring(0, 100));
          append({
            role: 'user',
            content: message.trim(),
          });
        } else {
          console.warn('⚠️ Attempted to submit empty message, ignoring');
        }
      };
      
      onChatReady(submitMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChatReady]); // Only depend on onChatReady, not append

  // Custom submit handler with logging
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Submitting message:', {
      input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
      inputLength: input.length,
      provider: selectedProvider,
      providerType: currentProvider?.type,
      apiEndpoint,
      isLoading,
      messageCount: messages.length
    });
    handleSubmit(e);
  };

  if (isMinimized && !isSliding) {
    return (
      <div className={cn("fixed right-4 top-1/2 -translate-y-1/2 z-50", className)}>
        <Button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 shadow-lg bg-white border border-gray-200 hover:bg-gray-50"
          size="sm"
        >
          <MessageSquare className="h-5 w-5 text-gray-700" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out",
      isSliding && !isOpen && "translate-x-full",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {currentProvider?.icon && (
              <div className={cn(
                "p-1.5 border",
                currentProvider.type === 'bedrock-agent' 
                  ? "border-purple-200 bg-purple-50" 
                  : "border-blue-200 bg-blue-50"
              )}>
                <currentProvider.icon 
                  className={cn(
                    "h-4 w-4",
                    currentProvider.type === 'bedrock-agent' 
                      ? 'text-purple-600' 
                      : 'text-blue-600'
                  )} 
                />
              </div>
            )}
            <h3 className="font-semibold text-gray-900 text-sm">
              {applicationName}
            </h3>
          </div>
          {currentProvider && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-medium border",
                currentProvider.type === 'bedrock-agent'
                  ? 'border-purple-200 text-purple-700 bg-purple-50'
                  : 'border-blue-200 text-blue-700 bg-blue-50'
              )}
            >
              {currentProvider.type === 'bedrock-agent' ? 'AI Agent' : 'LLM'}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="h-8 w-8 p-0 hover:bg-gray-100 border border-transparent hover:border-gray-200"
          >
            <Settings className="h-4 w-4 text-gray-600" />
          </Button>
          
          {isSliding && onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </Button>
          )}
          
          {isCollapsible && !isSliding && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <Minimize2 className="h-4 w-4 text-gray-600" />
            </Button>
          )}
        </div>
      </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-b border-gray-200 p-4 bg-gray-50">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-2 block">AI Provider</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="h-9 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-gray-200">
                    <div className="p-1">
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                        AI Agents
                      </div>
                      {providers.filter(p => p.type === 'bedrock-agent').map((provider) => (
                        <SelectItem key={provider.value} value={provider.value} className="py-2">
                          <div className="flex items-center space-x-2">
                            <provider.icon className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="font-medium">{provider.label}</div>
                              <div className="text-xs text-gray-500">{provider.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                      
                      <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1 mt-3">
                        Language Models
                      </div>
                      {providers.filter(p => p.type === 'llm').map((provider) => (
                        <SelectItem key={provider.value} value={provider.value} className="py-2">
                          <div className="flex items-center space-x-2">
                            <provider.icon className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">{provider.label}</div>
                              <div className="text-xs text-gray-500">{provider.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              
              {currentProvider?.type === 'bedrock-agent' && (
                <div className="text-xs text-purple-600 bg-purple-50 p-3 border border-purple-200">
                  <Brain className="h-3 w-3 inline mr-1" />
                  Agent mode: Advanced reasoning and tool usage enabled
                </div>
              )}
            </div>
          </div>
        )}

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-500 py-12">
                <Bot className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p className="font-medium">Start a conversation</p>
                <p className="text-xs text-gray-400 mt-1">
                  {welcomeMessage || "Ask me anything about your workspace"}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start space-x-3",
                  message.role === 'user' ? "flex-row-reverse space-x-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-7 h-7 border flex items-center justify-center",
                    message.role === 'user'
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-gray-100 border-gray-200 text-gray-600"
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 max-w-[85%]",
                    message.role === 'user' ? "text-right" : ""
                  )}
                >
                  <div
                    className={cn(
                      "px-3 py-2 text-sm border",
                      message.role === 'user'
                        ? "bg-blue-600 border-blue-600 text-white ml-auto inline-block"
                        : "bg-white border-gray-200 text-gray-900"
                    )}
                  >
                    {message.content}
                  </div>
                  <div className={cn(
                    "text-xs text-gray-500 mt-1",
                    message.role === 'user' ? "text-right" : ""
                  )}>
                    {new Date().toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 border bg-gray-100 border-gray-200 text-gray-600 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="px-3 py-2 bg-white border border-gray-200 text-gray-900 text-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 border bg-red-100 border-red-200 text-red-600 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-800 text-sm">
                    Sorry, I encountered an error. Please try again.
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleCustomSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder || "Type your message..."}
            disabled={isLoading}
            className="flex-1 text-sm border-gray-200 focus:border-gray-300 focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCustomSubmit(e as any);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            variant="outline"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          {isLoading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stop}
              className="px-3 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
            >
              Stop
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

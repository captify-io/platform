/**
 * Agent Chat Panel Component
 * Middle/Main panel for chat interface with streaming support
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import NextImage from "next/image";
import { useAgent } from "./index";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "../ui";
import { Textarea } from "../ui";
import { ScrollArea } from "../ui";
import {
  Send,
  Bot,
  User,
  Loader2,
  Copy,
  RefreshCw,
  Code,
  BarChart3,
  Image,
  FileText,
  Search,
  Sparkles,
  Plus,
  Paperclip,
  Settings,
  ChevronDown,
  Brain,
  Zap,
  Cpu,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui";
import { Input } from "../ui";
import type { AgentMessage, AgentTool } from "../types/agent";

export interface ChatPanelProps {
  className?: string;
}

export function ChatPanel({ className }: ChatPanelProps) {
  const {
    currentThread,
    messages,
    isStreaming,
    streamingMessage,
    sendMessage,
    streamMessage,
    settings,
  } = useAgent();

  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [input]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const messageContent = input.trim();
    setInput("");

    // Use streaming for better UX
    await streamMessage(messageContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case 'openai':
        return <Bot className="h-4 w-4 text-green-500" />;
      case 'anthropic':
        return <Brain className="h-4 w-4 text-orange-500" />;
      case 'bedrock':
        return <Cpu className="h-4 w-4 text-blue-500" />;
      case 'agent':
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const availableProviders = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus'] },
    { id: 'bedrock', name: 'AWS Bedrock', models: ['claude-3-sonnet', 'titan-text', 'llama2-70b'] },
    { id: 'agent', name: 'Custom Agent', models: ['captify-mi', 'captify-pmbook', 'captify-rmf'] },
  ];

  const renderMessageContent = (message: AgentMessage) => {
    // Handle different content types
    if (typeof message.content === "string") {
      return (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ node, className, children, ...props }: any) => {
                const inline = !className;
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : "";

                return !inline ? (
                  <SyntaxHighlighter
                    style={tomorrow as any}
                    language={language}
                    PreTag="div"
                    className="rounded-md"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className="bg-muted px-1 py-0.5 rounded text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <>{children}</>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      );
    }

    return <div className="text-sm">{String(message.content)}</div>;
  };

  const renderTools = (tools: AgentTool[]) => {
    if (!tools || tools.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {tools.map((tool, index) => (
          <div key={index} className="border rounded-lg p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {getToolIcon(tool.type || 'function')}
              <span className="text-sm font-medium">{tool.name}</span>
              <Badge variant="outline" className="text-xs">
                {tool.type || 'function'}
              </Badge>
            </div>
            {renderToolOutput(tool)}
          </div>
        ))}
      </div>
    );
  };

  const getToolIcon = (type: string) => {
    switch (type) {
      case "code":
        return <Code className="h-4 w-4" />;
      case "chart":
        return <BarChart3 className="h-4 w-4" />;
      case "image":
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        return <Image className="h-4 w-4" />;
      case "file":
        return <FileText className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const renderToolOutput = (tool: AgentTool) => {
    switch (tool.type) {
      case "code":
        return (
          <div className="bg-background rounded border">
            <SyntaxHighlighter
              style={tomorrow as any}
              language={tool.input.language || "javascript"}
              PreTag="div"
              className="text-xs"
            >
              {tool.output}
            </SyntaxHighlighter>
          </div>
        );

      case "chart":
        return (
          <div className="bg-background rounded border p-4">
            <div className="text-center text-sm text-muted-foreground">
              Chart: {tool.input.type || "Unknown"}
            </div>
            {/* Chart rendering would go here */}
          </div>
        );

      case "image":
        return (
          <div className="bg-background rounded border p-2">
            {tool.output ? (
              <NextImage
                src={tool.output}
                alt={tool.input.description || "Generated image"}
                width={500}
                height={300}
                className="max-w-full h-auto rounded"
                unoptimized
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                Image generation in progress...
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-sm bg-background rounded border p-3">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(tool.output, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Always show the chat interface, even without a current thread

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getProviderIcon(settings.provider || 'openai')}
            <h2 className="font-semibold">{currentThread?.title || "AI Assistant"}</h2>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {settings.provider} · {settings.model}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel>Select Provider & Model</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableProviders.map((provider) => (
                <div key={provider.id}>
                  <DropdownMenuItem className="font-medium py-1 opacity-60">
                    <div className="flex items-center gap-2">
                      {getProviderIcon(provider.id)}
                      {provider.name}
                    </div>
                  </DropdownMenuItem>
                  {provider.models.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      className="pl-8 text-sm"
                      onClick={() => {
                        if (settings.provider !== provider.id || settings.model !== model) {
                          // Update settings would go here
                          console.log('Switching to:', provider.id, model);
                        }
                      }}
                    >
                      {model}
                      {settings.provider === provider.id && settings.model === model && (
                        <span className="ml-auto text-xs text-primary">●</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="text-xs text-muted-foreground">
            {currentThread ? (currentThread.metadata?.messageCount || currentThread.messages.length) : 0} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {!currentThread && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Bot className="h-16 w-16 mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Welcome to AI Assistant</h3>
              <p className="text-muted-foreground mb-4 max-w-md">
                Ask me anything! I can help with analysis, writing, coding, and more.
              </p>
              <p className="text-sm text-muted-foreground">
                Start typing below or create a new chat from the sidebar.
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] group",
                  message.role === "user" ? "order-1" : "order-2"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg p-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {renderMessageContent(message)}
                  {message.tools && renderTools(message.tools)}

                  <div className="flex items-center justify-between mt-2 gap-2">
                    <div
                      className={cn(
                        "text-xs opacity-70",
                        message.role === "user"
                          ? "text-primary-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {formatTime(
                        (message.createdAt || Date.now()).toString()
                      )}
                      {message.tokenUsage && (
                        <span className="ml-2">
                          •{" "}
                          {(message.tokenUsage.input || 0) + (message.tokenUsage.output || 0)}{" "}
                          tokens
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() =>
                        handleCopyMessage(
                          typeof message.content === "string"
                            ? message.content
                            : String(message.content)
                        )
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Streaming Message */}
          {isStreaming && streamingMessage && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
              </div>

              <div className="max-w-[80%]">
                <div className="rounded-lg p-4 bg-muted">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isStreaming && !streamingMessage && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>

              <div className="max-w-[80%]">
                <div className="rounded-lg p-4 bg-muted">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t">
        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-sm"
              >
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeFile(index)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="px-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload file</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              disabled={isStreaming}
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
            />
            {/* Tools/Actions inside textarea */}
            <div className="absolute right-2 top-2 flex gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    disabled={isStreaming}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Tools</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setInput(prev => prev + '\n\n/generate-ppt ')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate PPT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInput(prev => prev + '\n\n/analytics ')}>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInput(prev => prev + '\n\n/search ')}>
                    <Search className="h-4 w-4 mr-2" />
                    Search Data
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInput(prev => prev + '\n\n/code ')}>
                    <Code className="h-4 w-4 mr-2" />
                    Run Code
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isStreaming}
            size="sm"
            className="px-3"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
          accept=".txt,.doc,.docx,.pdf,.csv,.xlsx,.json,.md"
        />

        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <div>Press Enter to send, Shift+Enter for new line</div>
          <div>
            {settings.temperature}° · {settings.maxTokens} max tokens
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { ScrollArea } from "../ui";
import {
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
  PanelLeftOpen,
  PanelRightOpen,
  PanelLeftClose,
  PanelRightClose,
  Share2,
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
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Textarea } from "../ui";
import type { AgentMessage, AgentToolCall } from "../../types/agent";

export interface ChatPanelProps {
  className?: string;
  onToggleThreads?: () => void;
  onToggleHelper?: () => void;
  showThreads?: boolean;
  showHelper?: boolean;
  isMobile?: boolean;
}

export function ChatPanel({
  className,
  onToggleThreads,
  onToggleHelper,
  showThreads = true,
  showHelper = true,
  isMobile = false,
}: ChatPanelProps) {
  const {
    currentThread,
    messages,
    isStreaming,
    streamingMessage,
    sendMessage,
    streamMessage,
    settings,
    tokenUsage,
    updateSettings,
  } = useAgent();

  const [input, setInput] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [shareUrl, setShareUrl] = useState('');
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
    // This will auto-create a thread if none exists
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
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Share conversation handlers
  const handleShareConversation = async () => {
    if (!currentThread) return;

    // Generate shareable link
    const shareId = `share_${currentThread.id}_${Date.now()}`;
    setShareUrl(`${window.location.origin}/share/${shareId}`);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Export conversation
  const handleExportConversation = () => {
    if (!currentThread) return;

    const exportData = {
      title: currentThread.title,
      messages: currentThread.messages,
      settings: currentThread.settings,
      createdAt: currentThread.createdAt,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentThread.title || 'chat').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider?.toLowerCase()) {
      case "openai":
        return <Bot className="h-4 w-4 text-green-500" />;
      case "anthropic":
        return <Brain className="h-4 w-4 text-orange-500" />;
      case "bedrock":
        return <Cpu className="h-4 w-4 text-blue-500" />;
      case "agent":
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <Bot className="h-4 w-4 text-gray-500" />;
    }
  };

  const availableProviders = [
    {
      id: "openai",
      name: "OpenAI",
      models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    },
    {
      id: "anthropic",
      name: "Anthropic",
      models: ["claude-3-5-sonnet", "claude-3-haiku", "claude-3-opus"],
    },
    {
      id: "bedrock",
      name: "AWS Bedrock",
      models: ["claude-3-sonnet", "titan-text", "llama2-70b"],
    },
    {
      id: "agent",
      name: "Custom Agent",
      models: ["captify-mi", "captify-pmbook", "captify-rmf"],
    },
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

  const renderTools = (tools: AgentToolCall[]) => {
    if (!tools || tools.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {tools.map((tool, index) => (
          <div key={index} className="border rounded-lg p-3 bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              {getToolIcon(tool.type || "function")}
              <span className="text-sm font-medium">{tool.name}</span>
              <Badge variant="outline" className="text-xs">
                {tool.type || "function"}
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
        {
          /* eslint-disable-next-line jsx-a11y/alt-text */
        }
        return <Image className="h-4 w-4" />;
      case "file":
        return <FileText className="h-4 w-4" />;
      case "search":
        return <Search className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const renderToolOutput = (tool: AgentToolCall) => {
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

  const formatTime = (timestamp: string | number) => {
    const date = new Date(
      typeof timestamp === "string" ? parseInt(timestamp) : timestamp
    );
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Always show the chat interface, even without a current thread

  return (
    <div className={cn("flex flex-col h-full bg-background relative", className)}>
      {/* Chat Header */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-2">
        {/* Left: Thread toggle + Title + Model */}
        <div className="flex items-center gap-3 flex-1">
          {(isMobile || !showThreads) && onToggleThreads && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={onToggleThreads}
                  >
                    {showThreads ? (
                      <PanelLeftClose className="h-4 w-4" />
                    ) : (
                      <PanelLeftOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showThreads ? "Hide" : "Show"} threads
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}


          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  {settings.model}
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
                          if (
                            settings.provider !== provider.id ||
                            settings.model !== model
                          ) {
                            // Update settings would go here
                            console.log("Switching to:", provider.id, model);
                          }
                        }}
                      >
                        {model}
                        {settings.provider === provider.id &&
                          settings.model === model && (
                            <span className="ml-auto text-xs text-primary">
                              ●
                            </span>
                          )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>


        {/* Right: Refresh + Settings + Helper toggle */}
        <div className="flex items-center gap-1">
          {/* Mobile Model/Settings Selector */}
          {isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Model & Settings</DropdownMenuLabel>
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
                          if (
                            settings.provider !== provider.id ||
                            settings.model !== model
                          ) {
                            console.log("Switching to:", provider.id, model);
                          }
                        }}
                      >
                        {model}
                        {settings.provider === provider.id &&
                          settings.model === model && (
                            <span className="ml-auto text-xs text-primary">
                              ●
                            </span>
                          )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh chat</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Share Dropdown */}
          {!isMobile && currentThread && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Share Conversation</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="p-3 space-y-3">
                  <Button
                    onClick={handleShareConversation}
                    size="sm"
                    className="w-full justify-start gap-2"
                    variant="ghost"
                  >
                    <Share2 className="h-4 w-4" />
                    Create Share Link
                  </Button>

                  <Button
                    onClick={handleExportConversation}
                    size="sm"
                    className="w-full justify-start gap-2"
                    variant="ghost"
                  >
                    <FileText className="h-4 w-4" />
                    Export as JSON
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Settings Dropdown */}
          {!isMobile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel>AI Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Temperature */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[settings.temperature || 0.7]}
                    onValueChange={(value) =>
                      updateSettings({ temperature: value[0] })
                    }
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Lower = focused, Higher = creative
                  </p>
                </div>

                <DropdownMenuSeparator />

                {/* Max Tokens */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">
                      {settings.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[settings.maxTokens || 4000]}
                    onValueChange={(value) =>
                      updateSettings({ maxTokens: value[0] })
                    }
                    max={8000}
                    min={100}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum response length
                  </p>
                </div>

                <DropdownMenuSeparator />

                {/* System Prompt */}
                <div className="p-3 space-y-2">
                  <Label className="text-sm">System Prompt</Label>
                  <Textarea
                    placeholder="Custom instructions..."
                    value={settings.systemPrompt || ""}
                    onChange={(e) =>
                      updateSettings({ systemPrompt: e.target.value })
                    }
                    className="min-h-[80px] resize-none text-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    How the AI should behave
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {(isMobile || !showHelper) && onToggleHelper && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={onToggleHelper}
                  >
                    {showHelper ? (
                      <PanelRightClose className="h-4 w-4" />
                    ) : (
                      <PanelRightOpen className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showHelper ? "Hide" : "Show"} assistant
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="overflow-hidden" style={{ height: "calc(100% - 164px)" }}>
        <ScrollArea className="h-full p-3" ref={scrollAreaRef}>
          <div className="space-y-4">
            {!currentThread && messages.length === 0 && (
              <div className="flex gap-3 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm p-2 max-w-2xl">
                    <p className="text-sm text-foreground">
                      Hello, I'm your AI assistant. How can I help you?
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Just now
                  </div>
                </div>
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
                      "rounded-lg p-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    {renderMessageContent(message)}
                    {/* Tool calls would be rendered here if present */}
                  </div>

                  {/* Time and tokens outside message box */}
                  <div className="flex items-center justify-between mt-1 px-1">
                    <div className="text-xs text-muted-foreground">
                      {formatTime(
                        (message.createdAt || Date.now()).toString()
                      )}
                      {(message as any).tokenUsage && (message as any).tokenUsage.total > 0 && (
                        <span className="ml-2">
                          • {(message as any).tokenUsage.total.toLocaleString()} tokens
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
                  <div className="rounded-lg p-2 bg-muted">
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
                  <div className="rounded-lg p-2 bg-muted">
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
      </div>

      {/* Input Area */}
      <div className="h-[100px] flex-shrink-0 px-4 py-3 bg-background">
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

        <div className="relative">
          <Textarea
            ref={inputRef}
            placeholder="Ask anything"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            disabled={isStreaming}
            className="min-h-[48px] max-h-[72px] resize-none pr-12"
            rows={3}
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
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  Add photo & files
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setInput((prev) => prev + "\n\n/deep-research ")
                  }
                >
                  <Search className="h-4 w-4 mr-2" />
                  Deep research
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setInput((prev) => prev + "\n\n/create-image ")
                  }
                >
                  <Image className="h-4 w-4 mr-2" />
                  Create image
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setInput((prev) => prev + "\n\n/agent-mode ")}
                >
                  <Bot className="h-4 w-4 mr-2" />
                  Agent mode
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setInput((prev) => prev + "\n\n/data-connections ")
                  }
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Connections
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
          <div className="flex items-center gap-3">
            <span>{settings.temperature}° temp</span>
            <span>{tokenUsage.total.toLocaleString()} tokens</span>
            <span>{settings.provider}</span>
            <span>{settings.model}</span>
          </div>
        </div>
      </div>

    </div>
  );
}

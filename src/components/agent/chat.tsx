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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui";
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  if (!currentThread) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full bg-background",
          className
        )}
      >
        <div className="text-center max-w-md">
          <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">
            Welcome to AI Assistant
          </h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation or select an existing chat from the
            sidebar.
          </p>
          <Button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("create-thread"))
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">{currentThread.title}</h2>
          </div>
          <Badge variant="outline" className="text-xs">
            {settings.provider} · {settings.model}
          </Badge>
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
            {currentThread.metadata?.messageCount || currentThread.messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
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
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              ref={inputRef}
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              disabled={isStreaming}
              className="min-h-[40px] max-h-[120px] resize-none"
            />
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

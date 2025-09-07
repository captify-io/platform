/**
 * Package Agent Panel Component
 * Chat interface with package-specific agent
 */

"use client";

import React, { useRef, useEffect } from "react";
import { useState } from "../../lib/react-compat";
import { cn } from "../../lib";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { X, Send, Settings, Bot } from "lucide-react";
import { ChatMessage, PackageAgentPanelProps } from "../../types/package";

export function PackageAgentPanel({ packageInfo }: PackageAgentPanelProps) {
  // Remove dependency on CaptifyContext - session can be passed as prop if needed
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    try {
      if (typeof window !== "undefined" && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      console.warn("ScrollToBottom failed:", error);
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      scrollToBottom();
    }
  }, [chatHistory]);

  // Local sendMessage implementation
  const sendMessage = async (message: string) => {
    if (!packageInfo?.agentConfig) {
      console.warn("No agent config available");
      return;
    }

    // Add user message to history
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);

    try {
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `I received your message: "${message}". This is a placeholder response since agent integration needs to be implemented.`,
          timestamp: new Date(),
        };
        setChatHistory((prev) => [...prev, assistantMessage]);
      }, 1000);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      await sendMessage(message);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Agent Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">AI Assistant</h3>
            {packageInfo?.agentConfig && (
              <p className="text-xs text-muted-foreground">
                {packageInfo.name} Agent
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Hi! I'm your {packageInfo?.name || "package"} assistant.
              <br />
              How can I help you today?
            </p>
          </div>
        )}

        {chatHistory.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {message.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

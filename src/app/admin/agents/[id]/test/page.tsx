"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Bot, Send, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApplicationLayout } from "@/components/apps/ApplicationLayout";

export default function AgentTestPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;

  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);

  const handleSendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await fetch("/api/agents/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId,
          sessionId,
          inputText: userMessage.content,
          enableTrace: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant" as const,
        content: result.completion || "No response received",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error testing agent:", error);
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: "assistant" as const,
        content:
          "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBack = () => {
    router.push(`/agents/${agentId}`);
  };

  return (
    <ApplicationLayout applicationName="Test Agent" showChat={false}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Agent</span>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Bot className="h-8 w-8 text-blue-600" />
            <span>Test Agent</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Interactive testing interface for agent {agentId}
          </p>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Conversation</span>
            </CardTitle>
            <CardDescription>Session ID: {sessionId}</CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Start a conversation with your agent!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={`text-xs mt-1 opacity-70 ${
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Agent is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={loading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={loading || !inputText.trim()}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ApplicationLayout>
  );
}

"use client";

/**
 * Designer Chat
 * Conversational interface for building agents with natural language
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDesigner } from '../context/DesignerContext';
import { Button } from '@captify-io/core';
import { Send, Sparkles, User, Bot } from 'lucide-react';

export function DesignerChat() {
  const { chatHistory, addChatMessage, clearChat } = useDesigner();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    addChatMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // TODO: Integrate with Bedrock Claude for Designer Agent
      // For now, show a placeholder response
      setTimeout(() => {
        addChatMessage(
          'assistant',
          `I understand you want to: "${userMessage}". The Designer Agent will be integrated soon to interpret your request and update the canvas automatically.`
        );
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('Error processing message:', error);
      addChatMessage(
        'assistant',
        'Sorry, I encountered an error processing your request.'
      );
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat header */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Designer Agent</span>
        </div>
        {chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-semibold mb-2">Start Designing</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Describe your agent in natural language and I'll help you build it.
              </p>

              <div className="text-left space-y-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  Example prompts:
                </div>

                <div
                  className="p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setInput("I want to speed up hiring for data engineers")}
                >
                  <div className="text-sm font-medium mb-1">Hiring Workflow</div>
                  <div className="text-xs text-muted-foreground">
                    "I want to speed up hiring for data engineers"
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setInput("Add a decision to check budget before advertising")}
                >
                  <div className="text-sm font-medium mb-1">Budget Check</div>
                  <div className="text-xs text-muted-foreground">
                    "Add a decision to check budget before advertising"
                  </div>
                </div>

                <div
                  className="p-3 rounded-lg bg-muted/50 border cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => setInput("Connect resume ranking to end")}
                >
                  <div className="text-sm font-medium mb-1">Connect Nodes</div>
                  <div className="text-xs text-muted-foreground">
                    "Connect resume ranking to end"
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {chatHistory.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-60 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4 bg-muted/30">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build..."
            className="flex-1 px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
            disabled={isProcessing}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            size="sm"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

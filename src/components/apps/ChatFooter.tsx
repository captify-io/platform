"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface ChatFooterProps {
  input: string;
  isLoading: boolean;
  placeholder?: string;
  totalTokens: number;
  onInputChange: (value: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  onStop: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatFooter({
  input,
  isLoading,
  placeholder = "Type your message...",
  totalTokens,
  onInputChange,
  onSubmit,
  onStop,
  onKeyDown,
}: ChatFooterProps) {
  return (
    <div className="border-t border-border p-4 pb-6 bg-background space-y-2">
      <div className="text-xs text-muted-foreground">
        ~{totalTokens.toLocaleString()} tokens (est.)
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
        className="flex space-x-2 items-end"
      >
        <Textarea
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onInputChange(e.target.value)
          }
          placeholder={placeholder}
          disabled={isLoading}
          className="flex-1 text-sm border-border focus:border-primary focus:ring-1 focus:ring-primary min-h-[44px] max-h-32 resize-none"
          onKeyDown={onKeyDown}
          rows={2}
        />

        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          size="sm"
          className="px-3 h-11"
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
            onClick={onStop}
            className="px-3 h-11"
          >
            Stop
          </Button>
        )}
      </form>
    </div>
  );
}

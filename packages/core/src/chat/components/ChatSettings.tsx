"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components";
import { Brain } from "lucide-react";

// Define Provider type locally since it was from main app
export interface Provider {
  value: string;
  label: string;
  type: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ChatSettingsProps {
  selectedProvider: string;
  providers: Provider[];
  currentProvider?: Provider;
  onProviderChange: (value: string) => void;
}

export function ChatSettings({
  selectedProvider,
  providers,
  currentProvider,
  onProviderChange,
}: ChatSettingsProps) {
  return (
    <div className="border-b border-border p-4 bg-muted/50">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            AI Provider
          </label>
          <Select value={selectedProvider} onValueChange={onProviderChange}>
            <SelectTrigger className="h-9 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border">
              <div className="p-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
                  AI Agents
                </div>
                {providers
                  .filter((p) => p.type === "bedrock-agent")
                  .map((provider) => (
                    <SelectItem
                      key={provider.value}
                      value={provider.value}
                      className="py-2"
                    >
                      <div className="flex items-center space-x-2">
                        {provider.icon && (
                          <provider.icon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        )}
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          {provider.description && (
                            <div className="text-xs text-muted-foreground">
                              {provider.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}

                <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1 mt-3">
                  Language Models
                </div>
                {providers
                  .filter((p) => p.type === "llm")
                  .map((provider) => (
                    <SelectItem
                      key={provider.value}
                      value={provider.value}
                      className="py-2"
                    >
                      <div className="flex items-center space-x-2">
                        {provider.icon && (
                          <provider.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                        <div>
                          <div className="font-medium">{provider.label}</div>
                          {provider.description && (
                            <div className="text-xs text-muted-foreground">
                              {provider.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        {currentProvider?.type === "bedrock-agent" && (
          <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 p-3 border border-purple-200 dark:border-purple-800 rounded">
            <Brain className="h-3 w-3 inline mr-1" />
            Agent mode: Advanced reasoning and tool usage enabled
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * @captify/chat - Minimal client-side exports
 *
 * This package exports React components and hooks for chat functionality.
 * Server-side handlers are exposed through captify.manifest.ts
 */

"use client";

// Re-export basic types
export * from "./types.js";

// Simple chat hook for demonstration
export const useChatDemo = () => {
  return {
    messages: [],
    sendMessage: async (message: string) => {
      console.log("Sending message:", message);
    },
    isLoading: false,
  };
};

// Simple chat component for demonstration
export const ChatDemo = () => {
  return null; // Placeholder component
};

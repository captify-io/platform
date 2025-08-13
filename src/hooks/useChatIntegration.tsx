"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useLayout } from "@/context/LayoutContext";

interface ChatIntegrationContextType {
  sendMessage: (message: string) => void;
  setChatReady: (submitFn: (message: string) => void) => void;
  openChat: () => void;
  isAvailable: boolean;
}

const ChatIntegrationContext = createContext<ChatIntegrationContextType | null>(
  null
);

export function ChatIntegrationProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const { isChatVisible, toggleChat, setHasChat } = useLayout();
  const submitMessageRef = useRef<((message: string) => void) | null>(null);

  const sendMessage = useCallback(
    (message: string) => {
      if (!submitMessageRef.current) {
        console.warn("Chat is not ready yet");
        return;
      }

      // Open chat if it's not visible
      if (!isChatVisible) {
        toggleChat();
      }

      // Send the message
      submitMessageRef.current(message);
    },
    [isChatVisible, toggleChat]
  );

  const openChat = useCallback(() => {
    if (!isChatVisible) {
      toggleChat();
    }
  }, [isChatVisible, toggleChat]);

  const setChatReady = useCallback(
    (submitFn: (message: string) => void) => {
      submitMessageRef.current = submitFn;
      setHasChat(true);
    },
    [setHasChat]
  );

  return (
    <ChatIntegrationContext.Provider
      value={{
        sendMessage,
        openChat,
        isAvailable: !!submitMessageRef.current,
        setChatReady,
      }}
    >
      {children}
    </ChatIntegrationContext.Provider>
  );
}

export interface ChatIntegrationHook {
  sendMessage: (message: string) => void;
  openChat: () => void;
  isAvailable: boolean;
}

export function useChatIntegration(): ChatIntegrationHook {
  const context = useContext(ChatIntegrationContext);
  if (!context) {
    throw new Error(
      "useChatIntegration must be used within a ChatIntegrationProvider"
    );
  }

  return {
    sendMessage: context.sendMessage,
    openChat: context.openChat,
    isAvailable: context.isAvailable,
  };
}

export function useChatIntegrationInternal() {
  const context = useContext(ChatIntegrationContext);
  if (!context) {
    throw new Error(
      "useChatIntegrationInternal must be used within a ChatIntegrationProvider"
    );
  }

  return context;
}

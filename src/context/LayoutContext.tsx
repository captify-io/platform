"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface LayoutContextType {
  isMenuVisible: boolean;
  isChatVisible: boolean;
  hasMenu: boolean;
  hasChat: boolean;
  toggleMenu: () => void;
  toggleChat: () => void;
  setHasMenu: (hasMenu: boolean) => void;
  setHasChat: (hasChat: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isMenuVisible, setIsMenuVisible] = useState(true);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [hasMenu, setHasMenuState] = useState(false);
  const [hasChat, setHasChatState] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const setHasMenu = (value: boolean) => {
    setHasMenuState(value);
  };

  const setHasChat = (value: boolean) => {
    setHasChatState(value);
  };

  return (
    <LayoutContext.Provider
      value={{
        isMenuVisible,
        isChatVisible,
        hasMenu,
        hasChat,
        toggleMenu,
        toggleChat,
        setHasMenu,
        setHasChat,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}

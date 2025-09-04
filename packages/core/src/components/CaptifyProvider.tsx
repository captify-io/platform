"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Session } from "next-auth";

interface CaptifyContextType {
  session: Session | null;
  isLoading: boolean;
}

const CaptifyContext = createContext<CaptifyContextType>({
  session: null,
  isLoading: true,
});

interface CaptifyProviderProps {
  children: ReactNode;
  session?: Session | null | undefined;
}

export function CaptifyProvider({ children, session = null }: CaptifyProviderProps) {
  const contextValue: CaptifyContextType = {
    session,
    isLoading: false,
  };

  return (
    <CaptifyContext.Provider value={contextValue}>
      {children}
    </CaptifyContext.Provider>
  );
}

export function useCaptify(): CaptifyContextType {
  const context = useContext(CaptifyContext);
  if (!context) {
    throw new Error("useCaptify must be used within a CaptifyProvider");
  }
  return context;
}

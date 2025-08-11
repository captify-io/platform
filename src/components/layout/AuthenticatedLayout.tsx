/**
 * Authenticated Layout Component
 *
 * Provides a layout wrapper for authenticated pages.
 */

"use client";

import React from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { TopNavigation } from "./TopNavigation";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const handleSearchFocus = () => {
    // Handle search focus logic if needed
  };

  const handleApplicationMenuClick = () => {
    // Handle application menu click logic if needed
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background">
        <TopNavigation
          onSearchFocus={handleSearchFocus}
          onApplicationMenuClick={handleApplicationMenuClick}
        />
        <main className="container mx-auto">{children}</main>
      </div>
    </AuthWrapper>
  );
}

"use client";

import { AppLayout } from "@captify/core";
import { ReactNode } from "react";

interface VeriPicksLayoutProps {
  children: ReactNode;
}

export default function VeriPicksLayout({ children }: VeriPicksLayoutProps) {
  return (
    <AppLayout applicationId="veripicks" showMenu={true} showChat={true}>
      {children}
    </AppLayout>
  );
}

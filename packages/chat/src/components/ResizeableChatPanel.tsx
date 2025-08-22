"use client";

import React, { useState, useCallback, useRef } from "react";
import { ChatInterface, type ChatInterfaceProps } from "./ChatInterface";
import { cn } from "@captify/core";
interface ResizableChatPanelProps extends ChatInterfaceProps {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
}

export function ResizableChatPanel({
  className,
  minWidth = 280,
  maxWidth = 600,
  defaultWidth = 320,
  onWidthChange,
  ...chatProps
}: ResizableChatPanelProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      setWidth(clampedWidth);
      onWidthChange?.(clampedWidth);
    },
    [isResizing, minWidth, maxWidth, onWidthChange]
  );

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", resize);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, resize, stopResizing]);

  return (
    <div
      ref={panelRef}
      className={cn("relative flex-shrink-0 h-full", className)}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className="absolute left-0 top-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors z-10 group"
        onMouseDown={startResizing}
      >
        <div className="absolute left-0 top-0 w-1 h-full bg-border group-hover:bg-blue-500 transition-colors" />
      </div>

      {/* Chat Interface */}
      <ChatInterface {...chatProps} className="h-full border-l border-border" />
    </div>
  );
}

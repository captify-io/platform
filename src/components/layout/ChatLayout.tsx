"use client";

import { ReactNode, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sidebar, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  children: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  showLeftPanel?: boolean;
  showRightPanel?: boolean;
  leftPanelTitle?: string;
  rightPanelTitle?: string;
  leftPanelHeaderContent?: ReactNode; // Additional content for left panel header
  rightPanelHeaderContent?: ReactNode; // Additional content for right panel header
  onLeftPanelToggle?: () => void;
  onRightPanelToggle?: () => void;
  className?: string;
  leftPanelDefaultWidth?: number;
  rightPanelDefaultWidth?: number;
  leftPanelMinWidth?: number;
  rightPanelMinWidth?: number;
  leftPanelMaxWidth?: number;
  rightPanelMaxWidth?: number;
  showLeftPanelToggle?: boolean; // Control whether to show the left panel toggle button
  showRightPanelToggle?: boolean; // Control whether to show the right panel toggle button
}

export function ChatLayout({
  children,
  leftPanel,
  rightPanel,
  showLeftPanel = true,
  showRightPanel = true,
  leftPanelTitle = "Threads",
  rightPanelTitle,
  leftPanelHeaderContent,
  onLeftPanelToggle,
  onRightPanelToggle,
  className,
  leftPanelDefaultWidth = 280,
  rightPanelDefaultWidth = 320,
  leftPanelMinWidth = 200,
  rightPanelMinWidth = 250,
  leftPanelMaxWidth = 500,
  rightPanelMaxWidth = 600,
  showLeftPanelToggle = true,
  showRightPanelToggle = true,
}: ChatLayoutProps) {
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(leftPanelDefaultWidth);
  const [rightWidth, setRightWidth] = useState(rightPanelDefaultWidth);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const layoutRef = useRef<HTMLDivElement>(null);

  const handleLeftToggle = useCallback(() => {
    const newCollapsed = !isLeftCollapsed;
    setIsLeftCollapsed(newCollapsed);
    onLeftPanelToggle?.();
  }, [isLeftCollapsed, onLeftPanelToggle]);

  const handleRightToggle = useCallback(() => {
    const newCollapsed = !isRightCollapsed;
    setIsRightCollapsed(newCollapsed);
    onRightPanelToggle?.();
  }, [isRightCollapsed, onRightPanelToggle]);

  // Left panel resize handlers
  const startResizingLeft = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLeft(true);
  }, []);

  const resizeLeft = useCallback(
    (e: MouseEvent) => {
      if (!isResizingLeft || !layoutRef.current) return;

      const rect = layoutRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      const clampedWidth = Math.min(
        Math.max(newWidth, leftPanelMinWidth),
        leftPanelMaxWidth
      );

      setLeftWidth(clampedWidth);
    },
    [isResizingLeft, leftPanelMinWidth, leftPanelMaxWidth]
  );

  // Right panel resize handlers
  const startResizingRight = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingRight(true);
  }, []);

  const resizeRight = useCallback(
    (e: MouseEvent) => {
      if (!isResizingRight || !layoutRef.current) return;

      const rect = layoutRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const clampedWidth = Math.min(
        Math.max(newWidth, rightPanelMinWidth),
        rightPanelMaxWidth
      );

      setRightWidth(clampedWidth);
    },
    [isResizingRight, rightPanelMinWidth, rightPanelMaxWidth]
  );

  const stopResizing = useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
  }, []);

  // Handle mouse events for resizing
  useEffect(() => {
    if (isResizingLeft || isResizingRight) {
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizingLeft) resizeLeft(e);
        if (isResizingRight) resizeRight(e);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizingLeft, isResizingRight, resizeLeft, resizeRight, stopResizing]);

  return (
    <div
      ref={layoutRef}
      className={cn("h-full w-full bg-background flex", className)}
    >
      {/* Left Panel - Threads */}
      {showLeftPanel && !isLeftCollapsed && (
        <>
          <div
            className="bg-muted/30 border-r border-border flex flex-col flex-shrink-0"
            style={{ width: `${leftWidth}px` }}
          >
            {/* Left Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              {leftPanelHeaderContent ? (
                <div className="flex-1">{leftPanelHeaderContent}</div>
              ) : (
                <h2 className="text-sm font-semibold text-foreground">
                  {leftPanelTitle}
                </h2>
              )}
              {showLeftPanelToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLeftToggle}
                  className="h-6 w-6 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Left Panel Content */}
            <div className="flex-1 overflow-hidden">{leftPanel}</div>
          </div>

          {/* Left Resize Handle */}
          <div
            className="w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-colors relative group"
            onMouseDown={startResizingLeft}
          >
            <div className="absolute inset-0 bg-border group-hover:bg-blue-500 transition-colors" />
          </div>
        </>
      )}

      {/* Center Panel - Chat */}
      <div className="flex-1 bg-background relative h-full min-w-0">
        <div className="h-full flex flex-col">
          {/* Floating Toggle Buttons */}
          <div className="absolute top-4 z-10 flex justify-between w-full px-4 pointer-events-none">
            {/* Left panel toggle when collapsed */}
            {showLeftPanel && isLeftCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLeftToggle}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
            )}

            <div className="flex-1" />

            {/* Right panel toggle when collapsed */}
            {showRightPanel && isRightCollapsed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRightToggle}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm pointer-events-auto"
              >
                <Bot className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Center Panel Content */}
          <div className="flex-1 h-full pb-4">{children}</div>
        </div>
      </div>

      {/* Right Panel - Tools/Context/Agent */}
      {showRightPanel && !isRightCollapsed && (
        <>
          {/* Right Resize Handle */}
          <div
            className="w-1 bg-transparent hover:bg-blue-500/50 cursor-col-resize transition-colors relative group"
            onMouseDown={startResizingRight}
          >
            <div className="absolute inset-0 bg-border group-hover:bg-blue-500 transition-colors" />
          </div>

          <div
            className="bg-muted/30 border-l border-border flex flex-col flex-shrink-0"
            style={{ width: `${rightWidth}px` }}
          >
            {/* Right Panel Header - only show if title is provided */}
            {rightPanelTitle && (
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">
                  {rightPanelTitle}
                </h2>
                {showRightPanelToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRightToggle}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Right Panel Content */}
            <div className="flex-1 overflow-hidden">{rightPanel}</div>
          </div>
        </>
      )}
    </div>
  );
}

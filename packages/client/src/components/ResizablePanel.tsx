"use client";

import React, {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface ResizablePanelProps {
  children: ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  className?: string;
  showCloseButton?: boolean;
  position?: "left" | "right";
  title?: string;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  children,
  isOpen = true,
  onClose,
  minWidth = 280,
  maxWidth = 600,
  defaultWidth = 320,
  className,
  showCloseButton = true,
  position = "right",
  title,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      let newWidth: number;

      if (position === "right") {
        newWidth = rect.right - e.clientX;
      } else {
        newWidth = e.clientX - rect.left;
      }

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, position]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
    // Return undefined for the else case
    return undefined;
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative bg-background border-border flex flex-col",
        position === "right" ? "border-l" : "border-r",
        className
      )}
      style={{
        width: `${width}px`,
        minWidth: `${minWidth}px`,
        maxWidth: `${maxWidth}px`,
      }}
    >
      {/* Resizer handle */}
      <div
        ref={resizerRef}
        className={cn(
          "absolute top-0 bottom-0 w-1 cursor-col-resize hover:bg-border/50 transition-colors",
          position === "right" ? "-left-0.5" : "-right-0.5",
          isResizing && "bg-border"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Panel Header */}
      {(title || showCloseButton) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          {title && (
            <h3 className="text-sm font-medium text-foreground">{title}</h3>
          )}
          {showCloseButton && onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
};

// Legacy alias for backward compatibility
export const ResizableChatPanel = ResizablePanel;

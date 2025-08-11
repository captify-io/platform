"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { usePathname } from "next/navigation";

export function MenuToggle() {
  const { isMenuVisible, hasMenu, toggleMenu } = useLayout();
  const pathname = usePathname();

  // Show toggle for console routes even if hasMenu is not yet loaded
  const isConsoleRoute = pathname?.startsWith("/console");
  const shouldShow = hasMenu || isConsoleRoute;

  // Don't show the toggle if there's no menu available
  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleMenu}
      className="h-8 w-8 p-0 mr-2"
      title={isMenuVisible ? "Hide menu" : "Show menu"}
    >
      <Menu className="h-4 w-4" />
    </Button>
  );
}

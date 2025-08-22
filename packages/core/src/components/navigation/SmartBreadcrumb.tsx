"use client";

import React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Menu } from "lucide-react";
import { useCaptify } from "../../context/CaptifyContext";
import { cn } from "../../lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb";

interface SmartBreadcrumbProps {
  className?: string;
  maxItems?: number;
  showMenuToggle?: boolean;
}

export function SmartBreadcrumb({
  className,
  maxItems = 5,
  showMenuToggle = true,
}: SmartBreadcrumbProps) {
  const { breadcrumbs, hasMenu, toggleSidebar, isSidebarOpen } = useCaptify();

  if (breadcrumbs.length <= 1) {
    return showMenuToggle && hasMenu ? (
      <div className={cn("flex items-center", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0 mr-2"
          title={isSidebarOpen ? "Hide menu" : "Show menu"}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    ) : null; // Don't show breadcrumbs if we're just at root
  }

  // Truncate breadcrumbs if too many
  const displayBreadcrumbs =
    breadcrumbs.length > maxItems
      ? [
          breadcrumbs[0], // Always show root
          { label: "...", href: undefined }, // Ellipsis
          ...breadcrumbs.slice(-2), // Show last 2 items
        ]
      : breadcrumbs;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showMenuToggle && hasMenu && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
          title={isSidebarOpen ? "Hide menu" : "Show menu"}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
      <Breadcrumb className="justify-start">
        <BreadcrumbList>
          {displayBreadcrumbs.map((item, index) => {
            const isLast = index === displayBreadcrumbs.length - 1;
            const isEllipsis = item.label === "...";

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <BreadcrumbItem>
                  {isEllipsis ? (
                    <span className="text-muted-foreground">...</span>
                  ) : isLast || !item.href ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-foreground cursor-pointer"
                    >
                      {item.label}
                    </Link>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

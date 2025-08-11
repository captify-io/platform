"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "@/context/NavigationContext";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface SmartBreadcrumbProps {
  className?: string;
  maxItems?: number;
}

export function SmartBreadcrumb({
  className,
  maxItems = 5,
}: SmartBreadcrumbProps) {
  const { breadcrumbs } = useNavigation();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if we're just at root
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
    <Breadcrumb className={cn("justify-start", className)}>
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
  );
}

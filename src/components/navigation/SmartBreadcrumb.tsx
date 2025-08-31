"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

interface BreadcrumbItemType {
  label: string;
  href?: string;
  isActive?: boolean;
}

export function SmartBreadcrumb({
  className,
  maxItems = 5,
  showMenuToggle = true,
}: SmartBreadcrumbProps) {
  const { isAuthenticated } = useCaptify();
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const breadcrumbs = useMemo((): BreadcrumbItemType[] => {
    if (!pathname) return [];

    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItemType[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      items.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isActive: isLast,
      });
    });

    return items;
  }, [pathname]);

  // Don't show breadcrumbs if we're just at root
  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Limit the number of breadcrumbs shown
  const displayedBreadcrumbs =
    breadcrumbs.length > maxItems
      ? [
          breadcrumbs[0], // Always show root
          { label: "...", href: undefined }, // Ellipsis
          ...breadcrumbs.slice(-2), // Show last 2 items
        ]
      : breadcrumbs;

  return (
    <div
      className={cn(
        "flex items-center px-4 py-2 border-b border-border",
        className
      )}
    >
      <Breadcrumb>
        <BreadcrumbList>
          {displayedBreadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.href && !item.isActive ? (
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <BreadcrumbPage
                    className={
                      item.isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < displayedBreadcrumbs.length - 1 && (
                <BreadcrumbSeparator />
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

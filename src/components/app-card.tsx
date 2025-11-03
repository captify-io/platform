"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button, Badge } from "@captify-io/core";
import {
  AppWindow,
  ArrowRight,
  Lock,
  Globe,
  Users,
  ExternalLink
} from "lucide-react";
import type { AppRegistryEntry } from "@/types/app-config";

interface AppCardProps {
  app: AppRegistryEntry;
  showLaunchButton?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function AppCard({ app, showLaunchButton = true, showDetails = false, className = "" }: AppCardProps) {
  const manifest = app.manifest || {};
  const icon = manifest.icon || "AppWindow";
  const color = manifest.color || "#3b82f6";
  const visibility = manifest.visibility || "internal";
  const category = manifest.category || "productivity";
  const tags = manifest.tags || [];

  // Visibility icon and label
  const visibilityConfig = {
    public: { icon: Globe, label: "Public", color: "bg-green-500/10 text-green-600 border-green-500/20" },
    internal: { icon: Users, label: "Internal", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    private: { icon: Lock, label: "Private", color: "bg-purple-500/10 text-purple-600 border-purple-500/20" }
  };

  const visConfig = visibilityConfig[visibility as keyof typeof visibilityConfig] || visibilityConfig.internal;
  const VisibilityIcon = visConfig.icon;

  // Category styling
  const categoryColors: Record<string, string> = {
    productivity: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    collaboration: "bg-green-500/10 text-green-600 border-green-500/20",
    analytics: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    development: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    admin: "bg-red-500/10 text-red-600 border-red-500/20",
    system: "bg-gray-500/10 text-gray-600 border-gray-500/20"
  };

  const categoryColor = categoryColors[category] || categoryColors.productivity;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className}`}>
      <CardHeader className="space-y-3">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <AppWindow className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg truncate">{app.name}</CardTitle>
              {!app.isValid && (
                <Badge variant="destructive" className="text-xs">
                  Invalid
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {app.description}
            </CardDescription>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={categoryColor}>
            {category}
          </Badge>
          <Badge variant="outline" className={visConfig.color}>
            <VisibilityIcon className="w-3 h-3 mr-1" />
            {visConfig.label}
          </Badge>
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Features - shown when showDetails is true */}
      {showDetails && app.features && app.features.length > 0 && (
        <CardContent className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Features:</p>
          <ul className="space-y-1">
            {app.features.filter(f => f.enabled !== false).slice(0, 3).map((feature) => (
              <li key={feature.id} className="text-sm text-muted-foreground flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-current" />
                {feature.name}
              </li>
            ))}
          </ul>
        </CardContent>
      )}

      {/* Footer with actions */}
      {showLaunchButton && (
        <CardFooter className="flex gap-2 border-t pt-4">
          <Link href={`/${app.slug}`} className="flex-1">
            <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
              Launch App
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link href={`/apps/${app.slug}`}>
            <Button variant="outline" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </CardFooter>
      )}

      {/* Validation errors - shown when invalid */}
      {!app.isValid && app.validationErrors && app.validationErrors.length > 0 && (
        <CardFooter className="flex-col items-start gap-2 border-t pt-4 bg-destructive/5">
          <p className="text-sm font-medium text-destructive">Validation Errors:</p>
          <ul className="space-y-1 text-xs text-destructive/80">
            {app.validationErrors.map((error, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </CardFooter>
      )}
    </Card>
  );
}

/**
 * Compact version of AppCard for list views
 */
export function AppCardCompact({ app, className = "" }: { app: AppRegistryEntry; className?: string }) {
  const manifest = app.manifest || {};
  const color = manifest.color || "#3b82f6";
  const visibility = manifest.visibility || "internal";

  const visibilityConfig = {
    public: { icon: Globe, color: "text-green-600" },
    internal: { icon: Users, color: "text-blue-600" },
    private: { icon: Lock, color: "text-purple-600" }
  };

  const visConfig = visibilityConfig[visibility as keyof typeof visibilityConfig] || visibilityConfig.internal;
  const VisibilityIcon = visConfig.icon;

  return (
    <Link href={`/${app.slug}`}>
      <div className={`flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:shadow-md transition-all ${className}`}>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}20` }}
        >
          <AppWindow className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{app.name}</p>
          <p className="text-sm text-muted-foreground truncate">{app.description}</p>
        </div>
        <VisibilityIcon className={`w-4 h-4 shrink-0 ${visConfig.color}`} />
        <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground" />
      </div>
    </Link>
  );
}

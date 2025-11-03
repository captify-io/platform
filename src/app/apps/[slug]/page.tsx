"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Badge,
  Separator,
  apiClient
} from "@captify-io/core";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  AppWindow,
  CheckCircle,
  Lock,
  Globe,
  Users,
  Loader2
} from "lucide-react";
import type { AppRegistryEntry } from "@/types/app-config";

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [app, setApp] = useState<AppRegistryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    loadApp();
  }, [slug]);

  const loadApp = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await apiClient.run({
        service: 'platform.app',
        operation: 'getAppBySlug',
        data: { slug }
      });

      if (response.success && response.data) {
        setApp(response.data);
      } else {
        setError("App not found");
      }
    } catch (err) {
      console.error('Error loading app:', err);
      setError("Failed to load app");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <AppWindow className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-2xl font-bold mb-2">App Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The application you're looking for doesn't exist."}
          </p>
          <Link href="/apps">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const manifest = app.manifest || {};
  const icon = manifest.icon || "AppWindow";
  const color = manifest.color || "#3b82f6";
  const visibility = manifest.visibility || "internal";
  const category = manifest.category || "productivity";
  const tags = manifest.tags || [];

  const visibilityConfig = {
    public: { icon: Globe, label: "Public", description: "Available to all users", color: "text-green-600 bg-green-500/10 border-green-500/20" },
    internal: { icon: Users, label: "Internal", description: "Available to organization members", color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    private: { icon: Lock, label: "Private", description: "Requires special access", color: "text-purple-600 bg-purple-500/10 border-purple-500/20" }
  };

  const visConfig = visibilityConfig[visibility as keyof typeof visibilityConfig] || visibilityConfig.internal;
  const VisibilityIcon = visConfig.icon;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Back button */}
      <Link href="/apps" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to App Catalog
      </Link>

      {/* App Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start gap-6">
            <div
              className="flex items-center justify-center w-20 h-20 rounded-xl shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <AppWindow className="w-10 h-10" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-3xl">{app.name}</CardTitle>
                {!app.isValid && (
                  <Badge variant="destructive">Invalid</Badge>
                )}
              </div>
              <CardDescription className="text-lg mb-4">
                {app.description}
              </CardDescription>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={visConfig.color}>
                  <VisibilityIcon className="w-3 h-3 mr-1" />
                  {visConfig.label}
                </Badge>
                <Badge variant="outline">
                  {category}
                </Badge>
                <Badge variant="outline">
                  v{app.version}
                </Badge>
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardFooter className="flex gap-3 border-t pt-6">
          <Link href={`/${app.slug}`} className="flex-1">
            <Button size="lg" className="w-full">
              Launch Application
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" asChild>
            <a href={`/${app.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </CardFooter>
      </Card>

      {/* Access Information */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Access Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Visibility</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <VisibilityIcon className={`w-4 h-4 ${visConfig.color.split(' ')[0]}`} />
              <span>{visConfig.description}</span>
            </div>
          </div>

          {app.access && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Access Settings</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    {app.access.requiresApproval ? (
                      <>
                        <Lock className="w-4 h-4 text-orange-500" />
                        <span>Requires admin approval</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Self-service access</span>
                      </>
                    )}
                  </div>
                  {app.access.defaultRole && (
                    <div className="text-xs">
                      Default role: <Badge variant="outline" className="ml-1">{app.access.defaultRole}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Features */}
      {app.features && app.features.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              What this application can do
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {app.features.filter(f => f.enabled !== false).map((feature) => (
                <div key={feature.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{feature.name}</h4>
                    {feature.description && (
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    )}
                  </div>
                  {feature.href && (
                    <Link href={feature.href}>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu Structure */}
      {app.menu && app.menu.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>
              Available sections in this app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {app.menu.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.href && (
                    <Link href={item.href}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

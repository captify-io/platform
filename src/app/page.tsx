"use client";
import { TopNavigation } from "@captify/core/components";
import { useCaptify } from "@captify/core/context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Rocket, Shield, Zap, Users } from "lucide-react";

export default function HomePage() {
  const captifyContext = useCaptify();
  const { session } = captifyContext;

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation captifyContext={captifyContext} />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Welcome to Captify
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent platform for secure application management and
            deployment. Build, monitor, and scale your applications with
            confidence.
          </p>
          {session?.user && (
            <p className="text-lg text-primary mt-4">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Rocket className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Fast Deployment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Deploy applications quickly with our streamlined workflow and
                automated processes.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with security-first principles and compliance standards
                for enterprise use.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>High Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Optimized for speed and efficiency with real-time monitoring and
                analytics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Work together seamlessly with integrated tools and shared
                workspaces.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Get Started
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Card className="flex-1 max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg">Explore Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Browse and manage your applications from the dashboard.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="flex-1 max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg">Monitor Services</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  Keep track of your services and their performance metrics.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

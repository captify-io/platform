"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, Database, Wrench, BarChart3, Shield, Users } from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const features = [
    {
      icon: Plane,
      title: "Aircraft Readiness",
      description: "Real-time aircraft status monitoring and maintenance tracking",
    },
    {
      icon: Database,
      title: "Data Operations",
      description: "Centralized data management and analytics platform",
    },
    {
      icon: Wrench,
      title: "Materiel Insights",
      description: "Advanced analytics for supply chain and materiel management",
    },
    {
      icon: BarChart3,
      title: "Decision Intelligence",
      description: "AI-powered insights for strategic decision making",
    },
    {
      icon: Shield,
      title: "Zero Trust Security",
      description: "Enterprise-grade security with comprehensive access controls",
    },
    {
      icon: Users,
      title: "Collaborative Workflows",
      description: "Team-based tools for enhanced operational efficiency",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-6">
              <span className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">
                AFSC
              </span>
              <span className="text-white ml-2">TITAN</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered decision-making platform for the Air Force Sustainment Center.
              Enhance operational readiness through intelligent data analysis and collaborative workflows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {session ? (
                <Button
                  onClick={() => router.push("/console")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Go to Console
                </Button>
              ) : (
                <Button
                  onClick={() => router.push("/auth/signin")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                >
                  Get Started
                </Button>
              )}
              <Button
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Comprehensive Mission Support
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Integrated tools and intelligence systems designed specifically for Air Force operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-400">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to enhance your operations?
            </h3>
            <p className="text-lg text-gray-400 mb-8">
              Join the future of Air Force sustainment operations with TITAN.
            </p>
            {!session && (
              <Button
                onClick={() => router.push("/auth/signin")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Access TITAN
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

export default function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const [captify, setCaptify] = useState<string>("");

  useEffect(() => {
    // Resolve params in useEffect since this is now a client component
    params.then((resolvedParams) => {
      console.log("DEBUG PAGE: resolvedParams:", resolvedParams);
      console.log(
        "DEBUG PAGE: window.location.pathname:",
        window.location.pathname
      );
      setCaptify(resolvedParams.captify);
    });
  }, [params]);

  if (!captify) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-6 rounded-lg border">
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {captify.charAt(0).toUpperCase() + captify.slice(1)} Application
        </h1>
        <p className="text-muted-foreground">
          Welcome to the {captify} application workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
          <p className="text-muted-foreground mb-4">
            Explore the features and capabilities of the {captify} application.
          </p>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Application initialized
            </div>
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Context loaded
            </div>
            <div className="flex items-center text-sm">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Ready for interaction
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Quick Actions</h2>
          <p className="text-muted-foreground mb-4">
            Common tasks and shortcuts for the {captify} application.
          </p>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 bg-muted rounded hover:bg-muted/80 transition-colors">
              View Dashboard
            </button>
            <button className="w-full text-left px-3 py-2 bg-muted rounded hover:bg-muted/80 transition-colors">
              Access Settings
            </button>
            <button className="w-full text-left px-3 py-2 bg-muted rounded hover:bg-muted/80 transition-colors">
              View Reports
            </button>
          </div>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-3">Recent Activity</h2>
          <p className="text-muted-foreground mb-4">
            Latest updates and activity in the {captify} application.
          </p>
          <div className="space-y-2 text-sm">
            <div className="border-l-2 border-blue-500 pl-3 py-1">
              Application loaded successfully
            </div>
            <div className="border-l-2 border-green-500 pl-3 py-1">
              User authenticated
            </div>
            <div className="border-l-2 border-yellow-500 pl-3 py-1">
              Context initialized
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

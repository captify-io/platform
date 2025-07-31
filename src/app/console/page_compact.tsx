"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConsoleLayout } from "@/components/layout/ConsoleLayout";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ConsolePage() {
  return (
    <ConsoleLayout>
      <div className="flex h-screen overflow-hidden">
        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto scrollbar-hide p-6">
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Aircraft Readiness Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Real-time aircraft status and maintenance overview
              </p>
            </div>

            {/* Aircraft Readiness Metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="text-lg font-bold text-green-600">42</div>
                <p className="text-xs text-gray-500">Ready (87.5%)</p>
              </Card>
              <Card className="p-4">
                <div className="text-lg font-bold text-red-600">12</div>
                <p className="text-xs text-gray-500">Critical MICAPs</p>
              </Card>
              <Card className="p-4">
                <div className="text-lg font-bold text-blue-600">89%</div>
                <p className="text-xs text-gray-500">Parts Available</p>
              </Card>
              <Card className="p-4">
                <div className="text-lg font-bold text-orange-600">7</div>
                <p className="text-xs text-gray-500">Maint Due</p>
              </Card>
            </div>

            {/* Critical Status Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-red-200 bg-red-50 p-4">
                <h3 className="text-red-800 text-sm font-medium mb-2">
                  Critical MICAPs
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>88-0123 Engine Mount</span>
                    <Badge variant="destructive" className="text-xs">
                      72h
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>88-0456 Hydraulic</span>
                    <Badge variant="destructive" className="text-xs">
                      48h
                    </Badge>
                  </div>
                </div>
              </Card>

              <Card className="border-orange-200 bg-orange-50 p-4">
                <h3 className="text-orange-800 text-sm font-medium mb-2">
                  Problem Parts
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Engine Components</span>
                    <span className="text-gray-600">3 affected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hydraulic Systems</span>
                    <span className="text-gray-600">2 affected</span>
                  </div>
                </div>
              </Card>

              <Card className="border-blue-200 bg-blue-50 p-4">
                <h3 className="text-blue-800 text-sm font-medium mb-2">
                  Supply Issues
                </h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Vendor Delays</span>
                    <span className="text-gray-600">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality Issues</span>
                    <span className="text-gray-600">25%</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="w-80 border-l bg-gray-50 overflow-hidden">
          <ChatInterface
            applicationName="Aircraft Readiness Assistant"
            applicationId="aircraft-console"
            welcomeMessage="Hello! I'm your Aircraft Readiness Assistant. I can help you with aircraft status, maintenance schedules, parts availability, and MICAP issues. What would you like to know?"
            placeholder="Ask about aircraft status, MICAPs, parts..."
          />
        </div>
      </div>
    </ConsoleLayout>
  );
}

/**
 * Policies Component for Core Package
 * Dynamically loaded when URL is /core#policies
 */

"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Shield, FileText, Download, Eye } from "lucide-react";

const mockPolicies = [
  {
    id: 1,
    name: "Security Policy",
    version: "v2.1",
    status: "Active",
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    name: "Data Privacy Policy",
    version: "v1.8",
    status: "Active",
    lastUpdated: "2024-01-10",
  },
  {
    id: 3,
    name: "Access Control Policy",
    version: "v3.0",
    status: "Draft",
    lastUpdated: "2024-01-20",
  },
  {
    id: 4,
    name: "Incident Response",
    version: "v1.5",
    status: "Active",
    lastUpdated: "2024-01-05",
  },
];

export default function Policies() {
  return (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Policies & SOPs
          </h1>
          <p className="text-muted-foreground">
            Manage organizational policies and standard operating procedures
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          New Policy
        </Button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockPolicies.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {policy.name}
                </CardTitle>
                <Badge
                  variant={policy.status === "Active" ? "default" : "secondary"}
                >
                  {policy.status}
                </Badge>
              </div>
              <CardDescription>
                Version {policy.version} • Updated {policy.lastUpdated}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Last reviewed: {policy.lastUpdated}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common policy management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Create Policy</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Download className="h-6 w-6" />
              <span>Export All</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <span>Review Queue</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

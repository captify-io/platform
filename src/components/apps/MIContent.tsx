"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Package,
  Users,
  Plus,
  Wrench,
  BarChart3,
} from "lucide-react";

// Import the forecast dashboard page content
import AdvancedForecastPage from "../../app/mi/advanced-forecast/page";

interface MIContentProps {
  activeSection: string;
}

export function MIContent({ activeSection }: MIContentProps) {
  const [currentSection, setCurrentSection] = useState(activeSection);

  useEffect(() => {
    setCurrentSection(activeSection);
  }, [activeSection]);

  const renderForecast = () => <AdvancedForecastPage />;

  const renderWorkbench = () => (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MI Workbench</h1>
          <p className="text-muted-foreground">
            Manage cases, tasks, and workflows for material insights
          </p>
        </div>
        <Button
          onClick={() => (window.location.hash = "forecast")}
          variant="outline"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Dashboard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Cases
            </CardTitle>
            <CardDescription>
              Cases requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+3 from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Parts Under Review
            </CardTitle>
            <CardDescription>Parts flagged for analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">High priority items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Team Workload
            </CardTitle>
            <CardDescription>Current assignment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              Capacity utilization
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>
                Latest workbench activity and status updates
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Case
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="destructive">High</Badge>
                <div>
                  <p className="font-medium">B-52H Engine Mount Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    NSN: 1560-01-123-4567
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Sarah Chen</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Medium</Badge>
                <div>
                  <p className="font-medium">Hydraulic System Review</p>
                  <p className="text-sm text-muted-foreground">
                    NSN: 1650-01-987-6543
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Mike Rodriguez</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBOM360 = () => (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOM360</h1>
          <p className="text-muted-foreground">
            Comprehensive bill of materials analysis and insights
          </p>
        </div>
        <Button
          onClick={() => (window.location.hash = "forecast")}
          variant="outline"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>BOM360 Analysis</CardTitle>
          <CardDescription>
            Coming soon in the Dashboard-Polish phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>BOM360 integration under development</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  switch (currentSection) {
    case "forecast":
    case "dashboard":
      return renderForecast();
    case "workbench":
      return renderWorkbench();
    case "bom360":
      return renderBOM360();
    default:
      return renderForecast();
  }
}

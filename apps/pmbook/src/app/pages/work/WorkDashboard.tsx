"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Progress,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@captify/core/components/ui";
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  Zap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export function WorkDashboardPage() {
  const { session } = useCaptify();
  const [activeWork, setActiveWork] = useState<any>(null);
  const [workQueue, setWorkQueue] = useState<any>(null);
  const [productivity, setProductivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    loadWorkData();
    const interval = setInterval(() => {
      if (activeWork) {
        setTimer((prev) => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWork]);

  const loadWorkData = async () => {
    try {
      const [queueData, prodData] = await Promise.all([
        apiClient.run({
          service: "work",
          operation: "getWorkQueue",
          data: { userId: session?.user?.id },
        }),
        apiClient.run({
          service: "work",
          operation: "calculateProductivity",
          data: { userId: session?.user?.id, period: "daily" },
        }),
      ]);

      setWorkQueue(queueData);
      setProductivity(prodData);
    } catch (error) {
      console.error("Failed to load work data:", error);
    } finally {
      setLoading(false);
    }
  };

  const startWork = async (workItem: any) => {
    try {
      const workSession = await apiClient.run({
        service: "work",
        operation: "startWork",
        data: {
          userId: session?.user?.id,
          workItemId: workItem.id,
        },
      });
      setActiveWork(workItem);
      setTimer(0);
    } catch (error) {
      console.error("Failed to start work:", error);
    }
  };

  const stopWork = async () => {
    try {
      await apiClient.run({
        service: "work",
        operation: "stopActiveWork",
        data: { userId: session?.user?.id },
      });
      setActiveWork(null);
      setTimer(0);
      loadWorkData(); // Refresh data
    } catch (error) {
      console.error("Failed to stop work:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Work</h1>
          <p className="text-muted-foreground">Focus on value delivery</p>
        </div>
      </div>

      {/* Active Work Session */}
      {activeWork ? (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-500" />
                Current Focus
              </span>
              <Badge variant="default">{formatTime(timer)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{activeWork.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {activeWork.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge>{activeWork.type}</Badge>
              <Badge variant="outline">Value: {activeWork.valueScore}/10</Badge>
              <Badge variant="outline">{activeWork.complexity}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={stopWork}
                variant="destructive"
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Stop Work
              </Button>
              <Button
                onClick={() => stopWork()}
                variant="default"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Work</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Select a work item below to start tracking
            </p>
          </CardContent>
        </Card>
      )}

      {/* Productivity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivity?.totalHours?.toFixed(1) || 0}h
            </div>
            <Progress
              value={(productivity?.totalHours / 8) * 100 || 0}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Value Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(productivity?.totalValue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ROI: {productivity?.valuePerHour?.toFixed(0) || 0}/hr
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Strategic Alignment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivity?.strategicAlignment?.toFixed(0) || 0}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Target className="h-3 w-3 mr-1" />
              On critical path
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Focus Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {productivity?.focusTime?.toFixed(1) || 0}h
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mr-1" />
              Deep work
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Work Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recommended">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="recommended">Recommended</TabsTrigger>
              <TabsTrigger value="critical">Critical Path</TabsTrigger>
              <TabsTrigger value="quick">Quick Wins</TabsTrigger>
              <TabsTrigger value="debt">Tech Debt</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>

            <TabsContent value="recommended" className="space-y-3">
              {workQueue?.recommended?.map((item: any) => (
                <WorkItem key={item.id} item={item} onStart={startWork} />
              ))}
            </TabsContent>

            <TabsContent value="critical" className="space-y-3">
              {workQueue?.criticalPath?.map((item: any) => (
                <WorkItem
                  key={item.id}
                  item={item}
                  onStart={startWork}
                  critical
                />
              ))}
            </TabsContent>

            <TabsContent value="quick" className="space-y-3">
              {workQueue?.quickWins?.map((item: any) => (
                <WorkItem key={item.id} item={item} onStart={startWork} />
              ))}
            </TabsContent>

            <TabsContent value="debt" className="space-y-3">
              {workQueue?.techDebt?.map((item: any) => (
                <WorkItem key={item.id} item={item} onStart={startWork} />
              ))}
            </TabsContent>

            <TabsContent value="blocked" className="space-y-3">
              {workQueue?.blocked?.map((item: any) => (
                <WorkItem key={item.id} item={item} blocked />
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkItem({ item, onStart, critical, blocked }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{item.title}</h4>
          {critical && <AlertCircle className="h-4 w-4 text-red-500" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{item.type}</Badge>
          <Badge variant="outline">{item.complexity}</Badge>
          <Badge variant="outline">{item.estimatedHours}h</Badge>
          <Badge variant="default">Value: {item.valueScore}</Badge>
        </div>
      </div>
      <Button onClick={() => onStart(item)} disabled={blocked} size="sm">
        <Play className="h-4 w-4 mr-1" />
        Start
      </Button>
    </div>
  );
}

export default WorkDashboardPage;

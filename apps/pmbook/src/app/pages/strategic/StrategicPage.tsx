"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@captify/core/components/ui";

export function StrategicPage() {
  const { session } = useCaptify();
  const [objectives, setObjectives] = useState([]);
  const [alignment, setAlignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategicData();
  }, []);

  const loadStrategicData = async () => {
    try {
      // Load strategic objectives
      const objectivesResponse = await apiClient.run({
        service: "strategic",
        operation: "getObjectivesHierarchy",
        data: {},
      });
      setObjectives(objectivesResponse.data || []);

      // Load alignment data
      const alignmentResponse = await apiClient.run({
        service: "strategic",
        operation: "calculateAlignment",
        data: { userId: session?.user?.id },
      });
      setAlignment(alignmentResponse.data || null);
    } catch (error) {
      console.error("Failed to load strategic data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Strategic Alignment</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategic Alignment Score</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : alignment ? (
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Math.round(alignment.alignmentScore)}%
                </div>
                <p className="text-sm text-muted-foreground">
                  {alignment.strategicHours} of {alignment.totalHours} hours
                  aligned
                </p>
              </div>
            ) : (
              <p>No alignment data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Work Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : alignment?.workBreakdown ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Strategic:</span>
                  <span className="font-medium">
                    {alignment.workBreakdown.strategic}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Operational:</span>
                  <span className="font-medium">
                    {alignment.workBreakdown.operational}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Maintenance:</span>
                  <span className="font-medium">
                    {alignment.workBreakdown.maintenance}
                  </span>
                </div>
              </div>
            ) : (
              <p>No breakdown data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Strategic Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading objectives...</p>
          ) : objectives.length > 0 ? (
            <div className="space-y-4">
              {objectives.map((objective: any) => (
                <div
                  key={objective.id}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <h3 className="font-semibold">{objective.statement}</h3>
                  <p className="text-sm text-muted-foreground">
                    {objective.vision}
                  </p>
                  {objective.children && objective.children.length > 0 && (
                    <div className="ml-4 mt-2 space-y-2">
                      {objective.children.map((child: any) => (
                        <div key={child.id} className="text-sm">
                          • {child.statement}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No strategic objectives defined</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// CRITICAL: Must have default export for dynamic imports
export default StrategicPage;

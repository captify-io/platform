"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

import { MIApiClient } from "../services/api-client";
import { useChatIntegration } from "@/hooks/useChatIntegration";
import type { HeroKPI, PredictionRow } from "../types";

// Components
import { HeroKPICards, Top10RiskPanel, GlobalFilters } from "./components";

export default function AdvancedForecastPage() {
  // State for filters
  const [weaponSystem, setWeaponSystem] = useState<string>("B52H");
  const [horizon, setHorizon] = useState<"Now" | "12mo" | "5yr">("Now");
  const [scenario, setScenario] = useState<"Baseline" | "What-if">("Baseline");

  // State for data
  const [kpiData, setKpiData] = useState<HeroKPI[]>([]);
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat integration
  const { sendMessage } = useChatIntegration();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch KPIs and predictions in parallel
      const [kpiResponse, predictionResponse] = await Promise.all([
        MIApiClient.getDashboardKPIs({
          weapon_system_id: weaponSystem,
          horizon,
          scenario,
        }),
        MIApiClient.getDashboardPredictions({
          weapon_system_id: weaponSystem,
          horizon,
          page: "1",
          sort: "risk_score_desc",
        }),
      ]);

      if (!kpiResponse.ok) {
        throw new Error(kpiResponse.error || "Failed to fetch KPI data");
      }

      if (!predictionResponse.ok) {
        throw new Error(
          predictionResponse.error || "Failed to fetch prediction data"
        );
      }

      setKpiData(kpiResponse.data?.kpis || []);
      setPredictions(predictionResponse.data?.predictions || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, [weaponSystem, horizon, scenario]);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading advanced forecast data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Global Filters as Header */}
      <div className="flex-shrink-0 border-b bg-background">
        <GlobalFilters
          weaponSystem={weaponSystem}
          setWeaponSystem={setWeaponSystem}
          horizon={horizon}
          setHorizon={setHorizon}
          scenario={scenario}
          setScenario={setScenario}
        />
      </div>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="container mx-auto p-6 space-y-6">

      {/* Hero KPIs */}
      <HeroKPICards kpis={kpiData} horizon={horizon} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="risk-panel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="risk-panel">Top-10 Problem Parts</TabsTrigger>
          <TabsTrigger value="forecast-charts">
            Forecast Charts
          </TabsTrigger>
          <TabsTrigger value="fleet-tempo">
            Fleet Tempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk-panel" className="space-y-4">
          <Top10RiskPanel
            predictions={predictions}
            horizon={horizon}
            weaponSystem={weaponSystem}
            onRefresh={fetchDashboardData}
            onChatMessage={sendMessage}
          />
        </TabsContent>

        <TabsContent value="forecast-charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MICAP Forecast</CardTitle>
              <CardDescription>
                Predicted mission capability degradation over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Chart placeholder */}
                <div className="h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="text-lg font-medium text-muted-foreground">MICAP Forecast Chart</div>
                    <div className="text-sm text-muted-foreground">Interactive timeline showing predicted capability gaps</div>
                  </div>
                </div>
                
                {/* Summary metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">12</div>
                    <div className="text-sm text-muted-foreground">Critical Parts (Next 30d)</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">28</div>
                    <div className="text-sm text-muted-foreground">High Risk Parts (Next 90d)</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-muted-foreground">Sorties at Risk</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-muted-foreground">Mission Capability</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet-tempo" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Tempo & Environment</CardTitle>
                <CardDescription>
                  Sortie rates and environmental factors by base
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sortie Rate Chart */}
                  <div className="h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-lg font-medium text-muted-foreground">Sortie Rate Trends</div>
                      <div className="text-sm text-muted-foreground">Monthly sortie rates by base</div>
                    </div>
                  </div>
                  
                  {/* Base Summary */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Base Operations Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Minot AFB:</span>
                        <span className="font-medium">24 sorties/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Barksdale AFB:</span>
                        <span className="font-medium">28 sorties/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Whiteman AFB:</span>
                        <span className="font-medium">22 sorties/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Environmental Factors</CardTitle>
                <CardDescription>
                  Weather and operational conditions impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Environmental Impact Chart */}
                  <div className="h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="text-lg font-medium text-muted-foreground">Environmental Impact</div>
                      <div className="text-sm text-muted-foreground">Corrosion, temperature, humidity effects</div>
                    </div>
                  </div>
                  
                  {/* Environmental Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-orange-600">High</div>
                      <div className="text-xs text-muted-foreground">Corrosion Risk</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-yellow-600">Moderate</div>
                      <div className="text-xs text-muted-foreground">Temp Stress</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-blue-600">75%</div>
                      <div className="text-xs text-muted-foreground">Humidity Avg</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="text-lg font-bold text-green-600">Good</div>
                      <div className="text-xs text-muted-foreground">Air Quality</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}

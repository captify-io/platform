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
import { AlertTriangle } from "lucide-react";

import { MIApiClient } from "../services/api-client";
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
          <p className="text-muted-foreground">Loading forecast data...</p>
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Advanced Forecast Dashboard
        </h1>
        <p className="text-muted-foreground">
          Fleet readiness and tri-horizon risk analysis for {weaponSystem}
        </p>
      </div>

      {/* Global Filters */}
      <GlobalFilters
        weaponSystem={weaponSystem}
        setWeaponSystem={setWeaponSystem}
        horizon={horizon}
        setHorizon={setHorizon}
        scenario={scenario}
        setScenario={setScenario}
      />

      {/* Hero KPIs */}
      <HeroKPICards kpis={kpiData} horizon={horizon} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="risk-panel" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="risk-panel">Top-10 Problem Parts</TabsTrigger>
          <TabsTrigger value="forecast-charts" disabled>
            Forecast Charts
          </TabsTrigger>
          <TabsTrigger value="fleet-tempo" disabled>
            Fleet Tempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="risk-panel" className="space-y-4">
          <Top10RiskPanel
            predictions={predictions}
            horizon={horizon}
            weaponSystem={weaponSystem}
            onRefresh={fetchDashboardData}
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
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Coming in Dashboard-Forecast+Scenario phase
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet-tempo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Tempo & Environment</CardTitle>
              <CardDescription>
                Sortie rates and environmental factors by base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Coming in Dashboard-Tempo+Env phase
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

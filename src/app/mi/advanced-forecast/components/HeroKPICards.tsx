import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Clock,
  Package,
  Users,
  Shield,
  Wrench,
  Truck,
} from "lucide-react";
import type { HeroKPI } from "../../types";

interface HeroKPICardsProps {
  kpis: HeroKPI[];
  horizon: "Now" | "12mo" | "5yr";
}

export function HeroKPICards({ kpis }: HeroKPICardsProps) {
  const getKPIIcon = (id: string) => {
    switch (id) {
      case "mission_capable_rate":
        return Shield;
      case "projected_micaps_90d":
        return AlertTriangle;
      case "predicted_assistance_rate":
        return Wrench;
      case "top_risked_nsns_count":
        return Package;
      case "days_of_supply_at_risk":
        return Clock;
      case "supplier_risk_index":
        return Truck;
      default:
        return Users;
    }
  };

  const getTrendIcon = (delta: number) => {
    if (delta > 0) return TrendingUp;
    if (delta < 0) return TrendingDown;
    return Minus;
  };

  const getTrendColor = (id: string, delta: number) => {
    // For some KPIs, positive is good, for others it's bad
    const positiveIsGood = ["mission_capable_rate", "days_of_supply_at_risk"];
    const isGoodChange = positiveIsGood.includes(id) ? delta > 0 : delta < 0;

    if (delta === 0) return "text-muted-foreground";
    return isGoodChange ? "text-green-600" : "text-red-600";
  };

  const getRiskLevel = (id: string, value: number) => {
    switch (id) {
      case "mission_capable_rate":
        if (value >= 85) return "low";
        if (value >= 75) return "medium";
        return "high";
      case "projected_micaps_90d":
        if (value <= 20) return "low";
        if (value <= 50) return "medium";
        return "high";
      case "supplier_risk_index":
        if (value <= 25) return "low";
        if (value <= 50) return "medium";
        return "high";
      default:
        return "medium";
    }
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      default:
        return "outline";
    }
  };

  if (kpis.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = getKPIIcon(kpi.id);
        const TrendIcon = getTrendIcon(kpi.delta);
        const trendColor = getTrendColor(kpi.id, kpi.delta);
        const riskLevel = getRiskLevel(kpi.id, kpi.value);

        return (
          <Card key={kpi.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-2xl font-bold">
                  {typeof kpi.value === "number"
                    ? kpi.value.toLocaleString()
                    : kpi.value}
                </div>
                <span className="text-sm text-muted-foreground">
                  {kpi.unit}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center gap-1 text-xs ${trendColor}`}
                >
                  <TrendIcon className="h-3 w-3" />
                  <span>
                    {kpi.delta > 0 ? "+" : ""}
                    {kpi.delta}
                    {kpi.unit}
                  </span>
                  <span className="text-muted-foreground">vs prev</span>
                </div>

                <Badge
                  variant={getRiskBadgeVariant(riskLevel)}
                  className="text-xs"
                >
                  {riskLevel.toUpperCase()}
                </Badge>
              </div>

              <div className="mt-3 pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Source: {kpi.lineage}</span>
                  <span>{new Date(kpi.lastUpdated).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

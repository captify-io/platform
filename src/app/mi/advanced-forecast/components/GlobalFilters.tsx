"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Clock } from "lucide-react";

interface WeaponSystem {
  value: string;
  label: string;
  status: "demo_ready" | "coming_soon";
  description?: string;
}

interface GlobalFiltersProps {
  weaponSystems: WeaponSystem[];
  filters: {
    weaponSystem: string;
    assembly: string;
    horizon: number;
    scenario: string;
  };
  onFiltersChange: (newFilters: any) => void;
}

export function GlobalFilters({
  weaponSystems,
  filters,
  onFiltersChange,
}: GlobalFiltersProps) {
  const horizons = [
    { value: 90, label: "90 Days", description: "Short-term forecast" },
    { value: 180, label: "180 Days", description: "Medium-term forecast" },
    { value: 270, label: "270 Days", description: "Long-term forecast" },
    { value: 365, label: "365 Days", description: "Annual forecast" },
  ];

  const assemblies = [
    { value: "all", label: "All Assemblies" },
    { value: "engine", label: "Engine Systems" },
    { value: "avionics", label: "Avionics" },
    { value: "hydraulics", label: "Hydraulic Systems" },
    { value: "electrical", label: "Electrical Systems" },
    { value: "structural", label: "Structural Components" },
  ];

  const scenarios = [
    { value: "baseline", label: "Baseline Forecast" },
    { value: "optimistic", label: "Optimistic Scenario" },
    { value: "pessimistic", label: "Pessimistic Scenario" },
    { value: "what-if", label: "What-If Analysis" },
  ];

  const getStatusIcon = (status: string) => {
    return status === "demo_ready" ? (
      <CheckCircle className="h-3 w-3 text-green-600" />
    ) : (
      <Clock className="h-3 w-3 text-yellow-600" />
    );
  };

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ [key]: value });
  };

  return (
    <div className="bg-muted/30 p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weapon System Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Weapon System</label>
          <Select
            value={filters.weaponSystem}
            onValueChange={(value) => handleFilterChange("weaponSystem", value)}
          >
            <SelectTrigger className="rounded-none border-0 bg-background shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-0">
              {weaponSystems.map((system) => (
                <SelectItem key={system.value} value={system.value}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(system.status)}
                    <span>{system.label}</span>
                    {system.status === "coming_soon" && (
                      <Badge
                        variant="secondary"
                        className="text-xs rounded-none"
                      >
                        Soon
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assembly Filter - REMOVED */}

        {/* Forecast Horizon */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Forecast Horizon</label>
          <div className="flex gap-1">
            {horizons.map((horizon) => (
              <Button
                key={horizon.value}
                variant={
                  filters.horizon === horizon.value ? "default" : "outline"
                }
                size="sm"
                onClick={() => handleFilterChange("horizon", horizon.value)}
                className="text-xs whitespace-nowrap rounded-none"
              >
                {horizon.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Scenario Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Scenario</label>
          <Select
            value={filters.scenario}
            onValueChange={(value) => handleFilterChange("scenario", value)}
          >
            <SelectTrigger className="rounded-none border-0 bg-background shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none border-0">
              {scenarios.map((scenario) => (
                <SelectItem key={scenario.value} value={scenario.value}>
                  {scenario.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

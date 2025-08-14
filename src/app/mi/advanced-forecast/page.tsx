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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { GlobalFilters } from "./components/GlobalFilters";
import {
  KPIBar,
  ChartsSection,
  RiskTable,
  ExplainabilityDrawer,
} from "./components";
import {
  AdvancedForecastApiClient,
  AdvancedForecastKPIs,
} from "@/app/mi/services/advanced-forecast-api-client";
import { useChatIntegration } from "@/hooks/useChatIntegration";
import { useRouter } from "next/navigation";

// Weapon systems configuration with status indicators
const weaponSystems: Array<{
  value: string;
  label: string;
  status: "demo_ready" | "coming_soon";
  description: string;
}> = [
  {
    value: "B-52H",
    label: "B-52H Stratofortress",
    status: "demo_ready",
    description: "Demo data available",
  },
  {
    value: "F-16",
    label: "F-16 Fighting Falcon",
    status: "coming_soon",
    description: "Integration in progress",
  },
  {
    value: "F-35",
    label: "F-35 Lightning II",
    status: "coming_soon",
    description: "Planned Q2 2024",
  },
  {
    value: "KC-135",
    label: "KC-135 Stratotanker",
    status: "coming_soon",
    description: "Planned Q3 2024",
  },
  {
    value: "C-130",
    label: "C-130 Hercules",
    status: "coming_soon",
    description: "Planned Q4 2024",
  },
  {
    value: "A-10",
    label: "A-10 Thunderbolt II",
    status: "coming_soon",
    description: "Future release",
  },
];

export default function AdvancedForecastPage() {
  const { sendMessage } = useChatIntegration();
  const router = useRouter();

  // State management
  const [filters, setFilters] = useState<{
    weaponSystem: string;
    assembly: string;
    horizon: 90 | 180 | 270 | 365;
    scenario: string;
  }>({
    weaponSystem: "B-52H",
    assembly: "all",
    horizon: 90,
    scenario: "baseline",
  });

  const [data, setData] = useState<{
    kpis: AdvancedForecastKPIs | null;
    charts: any;
    riskTable: any[];
    loading: boolean;
    error: string | null;
  }>({
    kpis: null,
    charts: null,
    riskTable: [],
    loading: true,
    error: null,
  });

  const [explainability, setExplainability] = useState({
    open: false,
    selectedPart: null,
    explanationData: null,
  });

  // Load data based on filters
  const loadData = async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Only load data for B-52H (demo)
      if (filters.weaponSystem !== "B-52H") {
        setData({
          kpis: null,
          charts: null,
          riskTable: [],
          loading: false,
          error: null,
        });
        return;
      }

      // Fetch all data in parallel
      const [kpisResponse, chartsResponse, riskTableResponse] =
        await Promise.all([
          AdvancedForecastApiClient.getKPIs({
            horizon: filters.horizon,
            system: filters.weaponSystem,
            assembly: filters.assembly !== "all" ? filters.assembly : undefined,
          }),
          AdvancedForecastApiClient.getAllCharts(filters.horizon),
          AdvancedForecastApiClient.getRiskScores({
            horizon: filters.horizon,
            system: filters.weaponSystem,
            assembly: filters.assembly !== "all" ? filters.assembly : undefined,
          }),
        ]);

      setData({
        kpis: kpisResponse.data,
        charts: chartsResponse,
        riskTable: riskTableResponse.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Failed to load advanced forecast data:", error);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load data. Please try again.",
      }));
    }
  };

  // Initial data load and reload on filter changes
  useEffect(() => {
    loadData();
  }, [filters]);

  // Handler functions
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleExplainRisk = async (record: any) => {
    // Send a detailed message to the agent about the part's risk factors
    const message = `I need a detailed risk analysis for ${
      record.nomenclature || record.part_number
    } (NSN: ${
      record.nsn || record.part_number
    }). This part has a risk score of ${record.risk_score} with ${
      record.days_of_supply
    } days of supply remaining. Can you explain the key risk factors and recommend specific mitigation strategies for this part within our ${
      filters.horizon
    }-day horizon?`;
    sendMessage(message);
  };

  const handleBOM360 = (record: any) => {
    // Navigate to BOM Explorer view for this part using hash routing
    const nsn = record.nsn || record.part_number;
    const partName = record.nomenclature || record.part_number;
    window.location.hash = `bom-explorer?nsn=${nsn}&part=${encodeURIComponent(
      partName
    )}`;
  };

  const handleWorkbench = (record: any) => {
    // Navigate to the part's workbench using hash routing
    const nsn = record.nsn || record.part_number;
    const partName = record.nomenclature || record.part_number;
    window.location.hash = `workbench?nsn=${nsn}&part=${encodeURIComponent(
      partName
    )}&context=risk-analysis`;
  };

  const closeExplainability = () => {
    setExplainability({
      open: false,
      selectedPart: null,
      explanationData: null,
    });
  };

  // Get current weapon system info
  const currentWeaponSystem = weaponSystems.find(
    (ws) => ws.value === filters.weaponSystem
  );
  const isB52Demo = filters.weaponSystem === "B-52H";

  return (
    <div className="p-6 space-y-6">
      {/* Global Filters */}
      <GlobalFilters
        weaponSystems={weaponSystems}
        filters={filters}
        onFiltersChange={handleFilterChange}
      />

      {/* Content based on weapon system selection */}
      {!isB52Demo ? (
        // Placeholder for non-B-52H systems
        <Card>
          <CardHeader className="text-center py-12">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              {currentWeaponSystem?.label} Supply Chain Forecasting
            </CardTitle>
            <CardDescription className="max-w-md mx-auto">
              {currentWeaponSystem?.description}. This weapon system integration
              is planned and will provide the same comprehensive forecasting
              capabilities currently demonstrated with the B-52H platform.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <div className="space-y-4">
              <Badge variant="secondary" className="text-sm">
                {currentWeaponSystem?.status === "coming_soon"
                  ? "Coming Soon"
                  : "In Development"}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Features will include:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-sm">
                <div>Multi-horizon forecasting</div>
                <div>Risk assessment</div>
                <div>Supplier analysis</div>
                <div>AI explanations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // B-52H demo content
        <>
          {/* Error Display */}
          {data.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{data.error}</AlertDescription>
            </Alert>
          )}

          {/* KPI Bar */}
          {data.kpis && (
            <KPIBar
              kpis={data.kpis}
              metadata={{}}
              filters={{
                weaponSystem: filters.weaponSystem,
                horizon: filters.horizon,
                scenario: filters.scenario,
              }}
            />
          )}

          {/* Charts Section */}
          <ChartsSection
            charts={
              data.charts || {
                riskTrend: null,
                dosDistribution: null,
                assistanceRequestTrend: null,
                supplierPerformanceTrend: null,
              }
            }
            filters={filters}
            onRefresh={loadData}
          />

          {/* Risk Table */}
          <RiskTable
            data={data.riskTable}
            filters={filters}
            onExplain={handleExplainRisk}
            onBOM360={handleBOM360}
            onWorkbench={handleWorkbench}
          />

          {/* Explainability Drawer */}
          <ExplainabilityDrawer
            open={explainability.open}
            onClose={closeExplainability}
            selectedPart={explainability.selectedPart}
            explanationData={explainability.explanationData}
          />
        </>
      )}
    </div>
  );
}

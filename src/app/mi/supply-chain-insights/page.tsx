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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DynamicIcon } from "lucide-react/dynamic";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SupplierHealth {
  id: string;
  name: string;
  performanceScore: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  onTimeDelivery: number;
  qualityRating: number;
  criticalParts: number;
  totalParts: number;
  lastAssessment: string;
  financialHealth: "Stable" | "Watch" | "Risk";
  region: string;
  certification: string[];
  recentIssues: number;
  avgLeadTime: number;
  priceVariance: number;
}

interface PartAvailability {
  partNumber: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  maxStock: number;
  availabilityStatus: "Available" | "Low" | "Critical" | "Out of Stock";
  primarySupplier: string;
  alternateSuppliers: string[];
  leadTime: number;
  lastRestocked: string;
  demandForecast: number;
  riskFactors: string[];
  unitCost: number;
  category: string;
}

interface SupplyRisk {
  id: string;
  title: string;
  category: "Supplier" | "Geographic" | "Financial" | "Quality" | "Capacity";
  severity: "Low" | "Medium" | "High" | "Critical";
  probability: number;
  impact: number;
  affectedParts: number;
  mitigation: string;
  owner: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Mitigated" | "Closed";
}

interface SupplyChainData {
  suppliers: SupplierHealth[];
  partAvailability: PartAvailability[];
  supplyRisks: SupplyRisk[];
  summary: {
    totalSuppliers: number;
    criticalSuppliers: number;
    partsAtRisk: number;
    averageLeadTime: number;
    supplyChainHealth: number;
  };
  charts: {
    supplierPerformance: Array<{ name: string; score: number; color: string }>;
    riskDistribution: Array<{ name: string; value: number; color: string }>;
    availabilityTrend: Array<{
      month: string;
      available: number;
      critical: number;
    }>;
    leadTimeTrend: Array<{
      month: string;
      avgLeadTime: number;
      target: number;
    }>;
  };
}

export default function SupplyChainInsightsPage() {
  const [supplyChainData, setSupplyChainData] =
    useState<SupplyChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSupplyChainData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      // const response = await MIApiClient.getSupplyChainInsights({
      //   supplier: supplierFilter !== "all" ? supplierFilter : undefined,
      //   risk: riskFilter !== "all" ? riskFilter : undefined,
      // });

      // Mock data structure
      const mockData: SupplyChainData = {
        suppliers: [
          {
            id: "SUP001",
            name: "Pratt & Whitney",
            performanceScore: 92,
            riskLevel: "Low",
            onTimeDelivery: 96.5,
            qualityRating: 94.2,
            criticalParts: 23,
            totalParts: 156,
            lastAssessment: "2025-08-05",
            financialHealth: "Stable",
            region: "North America",
            certification: ["AS9100", "ISO 9001"],
            recentIssues: 1,
            avgLeadTime: 45,
            priceVariance: 2.1,
          },
          {
            id: "SUP002",
            name: "Alternative Manufacturing Inc",
            performanceScore: 78,
            riskLevel: "Medium",
            onTimeDelivery: 89.2,
            qualityRating: 87.6,
            criticalParts: 8,
            totalParts: 42,
            lastAssessment: "2025-08-03",
            financialHealth: "Watch",
            region: "North America",
            certification: ["ISO 9001"],
            recentIssues: 3,
            avgLeadTime: 62,
            priceVariance: 8.4,
          },
          {
            id: "SUP003",
            name: "Global Components Ltd",
            performanceScore: 68,
            riskLevel: "High",
            onTimeDelivery: 82.1,
            qualityRating: 79.3,
            criticalParts: 12,
            totalParts: 89,
            lastAssessment: "2025-07-28",
            financialHealth: "Risk",
            region: "Asia Pacific",
            certification: ["ISO 9001"],
            recentIssues: 7,
            avgLeadTime: 78,
            priceVariance: 15.2,
          },
        ],
        partAvailability: [
          {
            partNumber: "ENG-TF33-001",
            description: "TF33 Engine Turbine Blade",
            currentStock: 8,
            minimumStock: 12,
            maxStock: 50,
            availabilityStatus: "Low",
            primarySupplier: "Pratt & Whitney",
            alternateSuppliers: ["Alternative Manufacturing Inc"],
            leadTime: 45,
            lastRestocked: "2025-07-15",
            demandForecast: 18,
            riskFactors: ["Long lead time", "Single source"],
            unitCost: 28500,
            category: "Engine",
          },
          {
            partNumber: "AVN-NAV-445",
            description: "Navigation Computer Module",
            currentStock: 2,
            minimumStock: 6,
            maxStock: 20,
            availabilityStatus: "Critical",
            primarySupplier: "Global Components Ltd",
            alternateSuppliers: [],
            leadTime: 78,
            lastRestocked: "2025-06-20",
            demandForecast: 8,
            riskFactors: ["Sole source", "Supplier risk", "Obsolescence"],
            unitCost: 45200,
            category: "Avionics",
          },
        ],
        supplyRisks: [
          {
            id: "RISK001",
            title: "Single Source Dependency - Navigation Systems",
            category: "Supplier",
            severity: "High",
            probability: 0.75,
            impact: 8,
            affectedParts: 23,
            mitigation: "Identify and qualify alternate suppliers",
            owner: "Supply Chain Team",
            dueDate: "2025-09-15",
            status: "In Progress",
          },
          {
            id: "RISK002",
            title: "Geopolitical Risk - Asia Pacific Suppliers",
            category: "Geographic",
            severity: "Medium",
            probability: 0.45,
            impact: 6,
            affectedParts: 67,
            mitigation: "Diversify supplier base across regions",
            owner: "Strategic Sourcing",
            dueDate: "2025-10-30",
            status: "Open",
          },
        ],
        summary: {
          totalSuppliers: 34,
          criticalSuppliers: 3,
          partsAtRisk: 156,
          averageLeadTime: 62,
          supplyChainHealth: 78,
        },
        charts: {
          supplierPerformance: [
            { name: "Excellent (90+)", score: 12, color: "#22c55e" },
            { name: "Good (80-89)", score: 15, color: "#3b82f6" },
            { name: "Fair (70-79)", score: 5, color: "#f59e0b" },
            { name: "Poor (<70)", score: 2, color: "#ef4444" },
          ],
          riskDistribution: [
            { name: "Low", value: 18, color: "#22c55e" },
            { name: "Medium", value: 25, color: "#f59e0b" },
            { name: "High", value: 8, color: "#ef4444" },
            { name: "Critical", value: 3, color: "#dc2626" },
          ],
          availabilityTrend: [
            { month: "Mar", available: 89, critical: 11 },
            { month: "Apr", available: 87, critical: 13 },
            { month: "May", available: 91, critical: 9 },
            { month: "Jun", available: 86, critical: 14 },
            { month: "Jul", available: 83, critical: 17 },
            { month: "Aug", available: 79, critical: 21 },
          ],
          leadTimeTrend: [
            { month: "Mar", avgLeadTime: 58, target: 45 },
            { month: "Apr", avgLeadTime: 61, target: 45 },
            { month: "May", avgLeadTime: 59, target: 45 },
            { month: "Jun", avgLeadTime: 64, target: 45 },
            { month: "Jul", avgLeadTime: 67, target: 45 },
            { month: "Aug", avgLeadTime: 62, target: 45 },
          ],
        },
      };

      setSupplyChainData(mockData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch supply chain data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplyChainData();
  }, [supplierFilter, riskFilter]);

  const filteredSuppliers =
    supplyChainData?.suppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.region.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const filteredParts =
    supplyChainData?.partAvailability.filter(
      (part) =>
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low":
        return "text-green-600 bg-green-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "High":
        return "text-orange-600 bg-orange-50";
      case "Critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case "Available":
        return "text-green-600 bg-green-50";
      case "Low":
        return "text-yellow-600 bg-yellow-50";
      case "Critical":
        return "text-orange-600 bg-orange-50";
      case "Out of Stock":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading supply chain insights...
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
            <CardTitle className="text-destructive flex items-center">
              <DynamicIcon name="alert-circle" size={20} className="mr-2" />
              Error Loading Supply Chain Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchSupplyChainData}>
              <DynamicIcon name="refresh-cw" size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!supplyChainData) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Supply Chain Insights</h1>
          <p className="text-muted-foreground">
            Supplier health and part availability from BOM perspective
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <DynamicIcon
              name="search"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search suppliers, parts..."
              className="w-48 pl-10"
            />
          </div>

          <div className="relative">
            <DynamicIcon
              name="building"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            />
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-40 pl-10">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
                <SelectItem value="top-performers">Top Performers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <DynamicIcon
              name="alert-triangle"
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
            />
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-36 pl-10">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={fetchSupplyChainData}
            size="sm"
            variant="outline"
            title="Refresh data"
          >
            <DynamicIcon name="refresh-cw" size={14} />
          </Button>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Suppliers
                </p>
                <p className="text-2xl font-bold">
                  {supplyChainData.summary.totalSuppliers}
                </p>
              </div>
              <DynamicIcon
                name="building"
                size={20}
                className="text-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Critical Suppliers
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {supplyChainData.summary.criticalSuppliers}
                </p>
              </div>
              <DynamicIcon
                name="alert-triangle"
                size={20}
                className="text-red-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Parts at Risk
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {supplyChainData.summary.partsAtRisk}
                </p>
              </div>
              <DynamicIcon
                name="package-x"
                size={20}
                className="text-amber-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Lead Time
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {supplyChainData.summary.averageLeadTime}d
                </p>
              </div>
              <DynamicIcon name="clock" size={20} className="text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  SC Health
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {supplyChainData.summary.supplyChainHealth}%
                </p>
              </div>
              <DynamicIcon name="heart" size={20} className="text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="parts">Part Availability</TabsTrigger>
          <TabsTrigger value="risks">Supply Risks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card
                key={supplier.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">
                          {supplier.name}
                        </CardTitle>
                        <Badge className={getRiskColor(supplier.riskLevel)}>
                          {supplier.riskLevel} Risk
                        </Badge>
                        <Badge variant="outline">{supplier.region}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>ID: {supplier.id}</span>
                        <span>•</span>
                        <span>
                          {supplier.criticalParts} critical of{" "}
                          {supplier.totalParts} parts
                        </span>
                        <span>•</span>
                        <span>Last assessed: {supplier.lastAssessment}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Performance Score
                      </div>
                      <div className="text-2xl font-bold">
                        {supplier.performanceScore}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        On-Time Delivery
                      </div>
                      <div className="font-semibold">
                        {supplier.onTimeDelivery}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Quality Rating
                      </div>
                      <div className="font-semibold">
                        {supplier.qualityRating}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Avg Lead Time
                      </div>
                      <div className="font-semibold">
                        {supplier.avgLeadTime} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Price Variance
                      </div>
                      <div
                        className={`font-semibold ${
                          supplier.priceVariance > 10
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {supplier.priceVariance > 0 ? "+" : ""}
                        {supplier.priceVariance}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge
                        variant={
                          supplier.financialHealth === "Stable"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {supplier.financialHealth}
                      </Badge>
                      <div className="flex space-x-1">
                        {supplier.certification.map((cert) => (
                          <Badge
                            key={cert}
                            variant="outline"
                            className="text-xs"
                          >
                            {cert}
                          </Badge>
                        ))}
                      </div>
                      {supplier.recentIssues > 0 && (
                        <Badge variant="destructive">
                          {supplier.recentIssues} recent issues
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <DynamicIcon name="eye" size={14} className="mr-1" />
                        View Details
                      </Button>
                      <Button size="sm">
                        <DynamicIcon name="edit" size={14} className="mr-1" />
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredParts.map((part) => (
              <Card
                key={part.partNumber}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">
                          {part.partNumber}
                        </CardTitle>
                        <Badge
                          className={getAvailabilityColor(
                            part.availabilityStatus
                          )}
                        >
                          {part.availabilityStatus}
                        </Badge>
                        <Badge variant="outline">{part.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {part.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Unit Cost
                      </div>
                      <div className="text-xl font-bold">
                        ${part.unitCost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stock Level Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Current Stock
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {part.currentStock} / {part.maxStock} units
                        </span>
                      </div>
                      <Progress
                        value={(part.currentStock / part.maxStock) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Min: {part.minimumStock}</span>
                        <span>Forecast: {part.demandForecast}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Primary Supplier
                        </div>
                        <div className="font-semibold">
                          {part.primarySupplier}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Lead Time
                        </div>
                        <div className="font-semibold">
                          {part.leadTime} days
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Last Restocked
                        </div>
                        <div className="font-semibold">
                          {part.lastRestocked}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Alternates
                        </div>
                        <div className="font-semibold">
                          {part.alternateSuppliers.length} available
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {part.riskFactors.length > 0 && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="flex items-center mb-2">
                          <DynamicIcon
                            name="alert-triangle"
                            size={16}
                            className="mr-2 text-amber-500"
                          />
                          <span className="text-sm font-medium">
                            Risk Factors
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {part.riskFactors.map((risk, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {risk}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        Demand forecast: {part.demandForecast} units
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <DynamicIcon
                            name="truck"
                            size={14}
                            className="mr-1"
                          />
                          Order
                        </Button>
                        <Button size="sm">
                          <DynamicIcon name="eye" size={14} className="mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supplyChainData.supplyRisks.map((risk) => (
              <Card key={risk.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getRiskColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                    <Badge variant="outline">{risk.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-medium mb-2">{risk.title}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Probability
                      </div>
                      <div className="font-semibold">
                        {(risk.probability * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Impact
                      </div>
                      <div className="font-semibold">{risk.impact}/10</div>
                    </div>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-lg mb-3">
                    <div className="text-sm font-medium mb-1">
                      Mitigation Plan
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {risk.mitigation}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">Owner: </span>
                      <span className="font-medium">{risk.owner}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due: </span>
                      <span className="font-medium">{risk.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge
                      variant={
                        risk.status === "Closed" ? "default" : "secondary"
                      }
                    >
                      {risk.status}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <DynamicIcon
                        name="arrow-right"
                        size={14}
                        className="mr-1"
                      />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Performance Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={supplyChainData.charts.supplierPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, score }) => `${name}: ${score}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="score"
                    >
                      {supplyChainData.charts.supplierPerformance.map(
                        (entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={supplyChainData.charts.riskDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--chart-1)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Part Availability Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={supplyChainData.charts.availabilityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="available"
                      stroke="#22c55e"
                      name="Available"
                    />
                    <Line
                      type="monotone"
                      dataKey="critical"
                      stroke="#ef4444"
                      name="Critical"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Time Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={supplyChainData.charts.leadTimeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgLeadTime"
                      stroke="#3b82f6"
                      name="Actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#ef4444"
                      strokeDasharray="5 5"
                      name="Target"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon
                  name="activity"
                  size={20}
                  className="mr-2 text-blue-500"
                />
                Real-Time Supply Chain Monitoring
              </CardTitle>
              <CardDescription>
                Continuous monitoring of supplier performance and supply chain
                health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <DynamicIcon
                        name="check-circle"
                        size={16}
                        className="mr-2 text-green-600"
                      />
                      Healthy Indicators
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• 89% suppliers meeting SLA targets</li>
                      <li>• Quality scores above baseline</li>
                      <li>• Lead times within acceptable range</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <DynamicIcon
                        name="alert-triangle"
                        size={16}
                        className="mr-2 text-yellow-600"
                      />
                      Watch List
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Global Components Ltd performance decline</li>
                      <li>• Navigation parts approaching reorder</li>
                      <li>• Asia Pacific shipping delays</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <DynamicIcon
                        name="alert-circle"
                        size={16}
                        className="mr-2 text-red-600"
                      />
                      Critical Alerts
                    </h4>
                    <ul className="text-sm space-y-1">
                      <li>• Single source dependency risk</li>
                      <li>• Critical parts below minimum stock</li>
                      <li>• Supplier financial health concerns</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Automated Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Purchase Order Recommendations
                        </span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Auto-generated POs for parts below minimum stock levels
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Supplier Alerts
                        </span>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Notifications sent for performance degradation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

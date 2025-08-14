"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  X,
  Brain,
  Activity,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  Truck,
  Factory,
  MapPin,
  ExternalLink,
  Download,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Info,
  Target,
} from "lucide-react";

interface ExplainabilityDrawerProps {
  open: boolean;
  onClose: () => void;
  selectedPart: any;
  explanationData: any;
}

export function ExplainabilityDrawer({
  open,
  onClose,
  selectedPart,
  explanationData,
}: ExplainabilityDrawerProps) {
  const [activeTab, setActiveTab] = useState("features");

  // Mock data for demonstration - would come from explanationData in real implementation
  const mockFeatureContributions = [
    {
      feature: "Days of Supply",
      impact: 0.35,
      value: "22 days",
      direction: "negative",
    },
    {
      feature: "Supplier Lead Time",
      impact: 0.28,
      value: "95 days",
      direction: "negative",
    },
    {
      feature: "Demand Variability",
      impact: 0.18,
      value: "High (σ=15)",
      direction: "negative",
    },
    {
      feature: "Supplier Health Score",
      impact: 0.12,
      value: "68/100",
      direction: "negative",
    },
    {
      feature: "Forecast Accuracy",
      impact: 0.07,
      value: "72%",
      direction: "negative",
    },
  ];

  const mockTimelineEvents = [
    {
      date: "2024-01-15",
      type: "supply_disruption",
      title: "Supplier Lead Time Increase",
      description: "Primary supplier increased lead time from 60 to 95 days",
      impact: "high",
      status: "active",
    },
    {
      date: "2024-01-08",
      type: "demand_spike",
      title: "Unexpected Demand Surge",
      description: "Mission-critical maintenance increased demand by 40%",
      impact: "medium",
      status: "resolved",
    },
    {
      date: "2023-12-20",
      type: "inventory_action",
      title: "Emergency Stock Request",
      description:
        "202 Depot assistance request submitted for expedited delivery",
      impact: "low",
      status: "completed",
    },
    {
      date: "2023-12-15",
      type: "supplier_issue",
      title: "Quality Issue Reported",
      description: "PQDR filed against primary supplier - quality concerns",
      impact: "medium",
      status: "investigating",
    },
  ];

  const mockAssistanceRequests = [
    {
      id: "AR-2024-0156",
      type: "202",
      status: "approved",
      submittedDate: "2024-01-10",
      requestedQuantity: 25,
      approvedQuantity: 15,
      expectedDelivery: "2024-02-28",
      justification: "Mission-critical shortage due to supplier delays",
    },
    {
      id: "AR-2024-0089",
      type: "107",
      status: "pending",
      submittedDate: "2024-01-05",
      requestedQuantity: 10,
      approvedQuantity: null,
      expectedDelivery: null,
      justification: "Field-level maintenance requirements",
    },
  ];

  const mockSupplierHealth = {
    primarySupplier: {
      name: "ACME Defense Solutions",
      duns: "123456789",
      onTimeDelivery: 68,
      qualityScore: 85,
      leadTimeAverage: 95,
      pqdrCount: 3,
      contractValue: 2450000,
      riskFactors: [
        "Geographic concentration",
        "Single source",
        "Quality issues",
      ],
    },
    alternativeSuppliers: [
      {
        name: "Defense Components Inc",
        duns: "987654321",
        qualified: true,
        leadTime: 120,
        priceMultiplier: 1.15,
        status: "Available",
      },
      {
        name: "Aerospace Parts Corp",
        duns: "456789123",
        qualified: false,
        leadTime: 85,
        priceMultiplier: 0.95,
        status: "Qualification Required",
      },
    ],
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "resolved":
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "active":
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "investigating":
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  if (!selectedPart) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-4xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                Risk Explanation: {selectedPart.part_number}
              </SheetTitle>
              <SheetDescription>
                AI-powered analysis of supply chain risk factors and
                recommendations
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Risk Score: {selectedPart.risk_score?.toFixed(1)}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          {/* Part Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedPart.nomenclature}
              </CardTitle>
              <CardDescription>
                Part Number: {selectedPart.part_number} | NSN:{" "}
                {selectedPart.nsn || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Current Inventory
                  </div>
                  <div className="font-semibold">
                    {selectedPart.current_inventory || 0} units
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Days of Supply
                  </div>
                  <div className="font-semibold">
                    {selectedPart.days_of_supply || 0} days
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Forecast Demand
                  </div>
                  <div className="font-semibold">
                    {selectedPart.forecast_demand || 0} units
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Primary Supplier
                  </div>
                  <div className="font-semibold">
                    {selectedPart.supplier_name}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="features">Feature Impact</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="requests">Requests</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            </TabsList>

            {/* Feature Contributions */}
            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Feature Contributions to Risk Score
                  </CardTitle>
                  <CardDescription>
                    How different factors contribute to the overall risk
                    assessment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockFeatureContributions.map((feature, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {feature.feature}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                feature.direction === "negative"
                                  ? "border-red-300 text-red-700"
                                  : "border-green-300 text-green-700"
                              }
                            >
                              {feature.value}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {(feature.impact * 100).toFixed(1)}% impact
                          </span>
                        </div>
                        <Progress
                          value={feature.impact * 100}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>

                  <Separator className="my-6" />

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Risk Assessment Summary
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      This part shows <strong>critical risk</strong> primarily
                      due to low inventory levels (22 days of supply) and
                      extended supplier lead times (95 days). The combination of
                      high demand variability and supplier quality concerns
                      further elevates the risk. Immediate action recommended to
                      secure alternative sourcing or expedite current orders.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Risk Event Timeline
                  </CardTitle>
                  <CardDescription>
                    Chronological view of events affecting this part's supply
                    chain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {mockTimelineEvents.map((event, index) => (
                        <div
                          key={index}
                          className="flex gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex flex-col items-center">
                            {getStatusIcon(event.status)}
                            {index < mockTimelineEvents.length - 1 && (
                              <div className="w-px h-8 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold">{event.title}</h4>
                              <div className="flex items-center gap-2">
                                <Badge className={getImpactColor(event.impact)}>
                                  {event.impact} impact
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(event.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                            <Badge variant="outline" className="mt-2 text-xs">
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assistance Requests */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-orange-500" />
                    Active Assistance Requests
                  </CardTitle>
                  <CardDescription>
                    Current and recent requests for additional support
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockAssistanceRequests.map((request, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{request.id}</h4>
                            <Badge
                              variant={
                                request.type === "202"
                                  ? "default"
                                  : request.type === "107"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {request.type} Request
                            </Badge>
                          </div>
                          <Badge
                            variant={
                              request.status === "approved"
                                ? "default"
                                : request.status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-muted-foreground">
                              Submitted
                            </div>
                            <div className="font-medium">
                              {new Date(
                                request.submittedDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Requested Qty
                            </div>
                            <div className="font-medium">
                              {request.requestedQuantity} units
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Approved Qty
                            </div>
                            <div className="font-medium">
                              {request.approvedQuantity
                                ? `${request.approvedQuantity} units`
                                : "Pending"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">
                              Expected Delivery
                            </div>
                            <div className="font-medium">
                              {request.expectedDelivery
                                ? new Date(
                                    request.expectedDelivery
                                  ).toLocaleDateString()
                                : "TBD"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 p-3 bg-muted/50 rounded text-sm">
                          <strong>Justification:</strong>{" "}
                          {request.justification}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Supplier Health */}
            <TabsContent value="suppliers" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Factory className="h-5 w-5 text-purple-500" />
                    Supplier Health Analysis
                  </CardTitle>
                  <CardDescription>
                    Primary supplier performance and alternative sourcing
                    options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Primary Supplier */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-lg">
                          {mockSupplierHealth.primarySupplier.name}
                        </h4>
                        <Badge variant="outline">Primary Supplier</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground">
                            On-Time Delivery
                          </div>
                          <div className="font-semibold">
                            {mockSupplierHealth.primarySupplier.onTimeDelivery}%
                          </div>
                          <Progress
                            value={
                              mockSupplierHealth.primarySupplier.onTimeDelivery
                            }
                            className="h-2 mt-1"
                          />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Quality Score
                          </div>
                          <div className="font-semibold">
                            {mockSupplierHealth.primarySupplier.qualityScore}
                            /100
                          </div>
                          <Progress
                            value={
                              mockSupplierHealth.primarySupplier.qualityScore
                            }
                            className="h-2 mt-1"
                          />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Avg Lead Time
                          </div>
                          <div className="font-semibold">
                            {mockSupplierHealth.primarySupplier.leadTimeAverage}{" "}
                            days
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">
                            Active PQDRs
                          </div>
                          <div className="font-semibold text-red-600">
                            {mockSupplierHealth.primarySupplier.pqdrCount}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-muted-foreground mb-2">
                          Risk Factors
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {mockSupplierHealth.primarySupplier.riskFactors.map(
                            (factor, index) => (
                              <Badge key={index} variant="destructive">
                                {factor}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Alternative Suppliers */}
                    <div>
                      <h4 className="font-semibold mb-3">
                        Alternative Suppliers
                      </h4>
                      <div className="space-y-3">
                        {mockSupplierHealth.alternativeSuppliers.map(
                          (supplier, index) => (
                            <div key={index} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">
                                    {supplier.name}
                                  </h5>
                                  <div className="text-sm text-muted-foreground">
                                    Lead Time: {supplier.leadTime} days | Price:{" "}
                                    {(
                                      (supplier.priceMultiplier - 1) *
                                      100
                                    ).toFixed(0)}
                                    %
                                    {supplier.priceMultiplier > 1
                                      ? " premium"
                                      : " discount"}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      supplier.qualified
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {supplier.status}
                                  </Badge>
                                  <Button size="sm" variant="outline">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicIcon } from "lucide-react/dynamic";
import { useChatIntegration } from "@/hooks/useChatIntegration";

interface PartInfo {
  nsn: string;
  partName: string;
  parentAssembly?: string;
  systemsAffected?: string[];
  alternates?: string[];
  riskScore?: number;
  daysOfSupply?: number;
  leadTime?: number;
  cost?: number;
  supplier?: string;
  description?: string;
}

interface DomainSummary {
  domain: string;
  icon: string;
  status: "critical" | "warning" | "good";
  score: number;
  description: string;
  keyMetrics: { label: string; value: string }[];
}

interface SearchResult {
  nsn: string;
  partName: string;
  description: string;
  riskScore: number;
  category: string;
}

export default function BOMExplorerPage() {
  const { sendMessage } = useChatIntegration();
  const [partInfo, setPartInfo] = useState<PartInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [domainSummaries, setDomainSummaries] = useState<DomainSummary[]>([]);

  // Extract parameters from hash URL
  const getHashParams = useCallback(() => {
    if (typeof window === "undefined") return {};

    const hash = window.location.hash;
    const params: Record<string, string> = {};

    if (hash.includes("?")) {
      const queryString = hash.split("?")[1];
      const urlParams = new URLSearchParams(queryString);
      urlParams.forEach((value, key) => {
        params[key] = decodeURIComponent(value);
      });
    }

    return params;
  }, []);

  // Extract URL parameters from hash
  const hashParams = getHashParams();
  const nsn = hashParams.nsn;
  const partName = hashParams.part;
  const domain = hashParams.domain;

  const fetchPartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current hash parameters
      const currentParams = getHashParams();
      const currentNsn = currentParams.nsn;
      const currentPartName = currentParams.part;

      // Mock domain summaries for all parts overview
      const mockDomainSummaries: DomainSummary[] = [
        {
          domain: "Supply Chain",
          icon: "truck",
          status: "critical",
          score: 45,
          description: "Multiple supply chain vulnerabilities identified",
          keyMetrics: [
            { label: "At-Risk Parts", value: "127" },
            { label: "Single Source", value: "89" },
            { label: "Lead Time Variance", value: "+34%" },
          ],
        },
        {
          domain: "Supplier",
          icon: "building",
          status: "warning",
          score: 72,
          description: "Some supplier performance concerns",
          keyMetrics: [
            { label: "Performance Score", value: "72%" },
            { label: "Delivery Issues", value: "23" },
            { label: "Quality Rating", value: "B+" },
          ],
        },
        {
          domain: "Maintenance",
          icon: "wrench",
          status: "warning",
          score: 68,
          description: "Maintenance intervals need optimization",
          keyMetrics: [
            { label: "MTBF", value: "2,340 hrs" },
            { label: "Scheduled Maint", value: "156" },
            { label: "Unplanned", value: "34" },
          ],
        },
        {
          domain: "Engineering",
          icon: "cog",
          status: "good",
          score: 85,
          description: "Engineering specifications are well maintained",
          keyMetrics: [
            { label: "Config Control", value: "98%" },
            { label: "Change Orders", value: "12" },
            { label: "Compliance", value: "100%" },
          ],
        },
        {
          domain: "Readiness",
          icon: "shield-check",
          status: "warning",
          score: 76,
          description: "Mission readiness affected by supply issues",
          keyMetrics: [
            { label: "Availability", value: "76%" },
            { label: "MICAP Days", value: "145" },
            { label: "Mission Impact", value: "Medium" },
          ],
        },
      ];

      setDomainSummaries(mockDomainSummaries);

      // If no NSN provided, show default view
      if (!currentNsn) {
        const defaultPartInfo: PartInfo = {
          nsn: "Select a part",
          partName: "No part selected",
          description:
            "Navigate from Advanced Forecast or search for a specific part",
        };
        setPartInfo(defaultPartInfo);
        setLoading(false);
        return;
      }

      // Mock data for demonstration - replace with actual API call
      const mockPartInfo: PartInfo = {
        nsn: currentNsn,
        partName: currentPartName || "Unknown Part",
        parentAssembly: "F-35 Engine Assembly (NSN: 2840-01-123-4567)",
        systemsAffected: [
          "Propulsion System",
          "Power Generation",
          "Flight Control",
        ],
        alternates: [
          "2840-00-000002",
          "2840-00-000003",
          "Commercial Alt: PW-TB-001",
        ],
        riskScore: 87,
        daysOfSupply: 15,
        leadTime: 120,
        cost: 45000,
        supplier: "Pratt & Whitney",
        description:
          "Critical turbine blade assembly for F-35 Lightning II aircraft propulsion system",
      };

      setPartInfo(mockPartInfo);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch part data"
      );
    } finally {
      setLoading(false);
    }
  }, [getHashParams]); // Include getHashParams as dependency

  useEffect(() => {
    fetchPartData();
  }, []); // Initial load

  // Listen for hash changes and re-fetch data
  useEffect(() => {
    const handleHashChange = () => {
      // Re-fetch data when hash changes
      fetchPartData();
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [fetchPartData]);

  // Set active tab based on domain parameter
  useEffect(() => {
    const currentParams = getHashParams();
    if (currentParams.domain) {
      const tabMap: Record<string, string> = {
        engineering: "engineering",
        supply: "supply-chain",
        supplier: "supplier",
        maintenance: "maintenance",
        readiness: "readiness",
        summary: "summary",
      };
      const mappedTab = tabMap[currentParams.domain.toLowerCase()];
      if (mappedTab) {
        setActiveTab(mappedTab);
      }
    }
  }, [getHashParams]);

  const handleExplainPart = () => {
    if (!partInfo) return;

    const message = `I need a detailed analysis of ${partInfo.partName} (NSN: ${partInfo.nsn}). This part has a risk score of ${partInfo.riskScore} with ${partInfo.daysOfSupply} days of supply remaining. Can you explain why this part is problematic, what systems it affects, and what specific actions I should take to mitigate risks? Please also analyze the supplier relationship and suggest alternative sourcing options.`;

    sendMessage(message);
  };

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Mock search results - replace with actual API call
    const mockResults: SearchResult[] = [
      {
        nsn: "2840-00-000001",
        partName: "Turbine Blade Assembly",
        description: "Critical turbine blade for F-35 engine",
        riskScore: 87,
        category: "Propulsion",
      },
      {
        nsn: "2840-00-000002",
        partName: "Compressor Disc",
        description: "High-pressure compressor disc",
        riskScore: 76,
        category: "Propulsion",
      },
      {
        nsn: "1560-01-123456",
        partName: "Wing Spar Assembly",
        description: "Primary wing structural component",
        riskScore: 45,
        category: "Airframe",
      },
      {
        nsn: "5999-00-987654",
        partName: "Navigation Computer",
        description: "Flight navigation processing unit",
        riskScore: 62,
        category: "Avionics",
      },
    ].filter(
      (result) =>
        result.partName.toLowerCase().includes(query.toLowerCase()) ||
        result.nsn.includes(query) ||
        result.description.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(mockResults);
  }, []);

  const handlePartSelect = (result: SearchResult) => {
    window.location.hash = `bom-explorer?nsn=${
      result.nsn
    }&part=${encodeURIComponent(result.partName)}`;
    setShowSearch(false);
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading part data...</p>
        </div>
      </div>
    );
  }

  if (error || !partInfo) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center">
              <DynamicIcon name="alert-circle" size={20} className="mr-2" />
              Error Loading Part Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || "No part data available"}
            </p>
            <Button onClick={fetchPartData}>
              <DynamicIcon name="refresh-cw" size={16} className="mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show default view if no NSN
  if (!nsn) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header with Search */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">BOM Explorer</h1>
              <p className="text-muted-foreground">
                Part analysis and supply chain insights across all domains
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  placeholder="Search parts by NSN, name, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                    setShowSearch(e.target.value.length > 0);
                  }}
                  className="w-80"
                />
                <DynamicIcon
                  name="search"
                  size={16}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                />

                {/* Search Results Dropdown */}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.nsn}
                        className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handlePartSelect(result)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{result.partName}</div>
                            <div className="text-sm text-muted-foreground">
                              NSN: {result.nsn}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.description}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                result.riskScore > 75
                                  ? "destructive"
                                  : result.riskScore > 50
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              Risk: {result.riskScore}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => setShowSearch(!showSearch)}
                variant="outline"
              >
                <DynamicIcon name="search" size={16} className="mr-2" />
                Search Parts
              </Button>
            </div>
          </div>
        </div>

        {/* Domain Summary Overview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Domain Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domainSummaries.map((domain) => (
              <Card
                key={domain.domain}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  setActiveTab(domain.domain.toLowerCase().replace(" ", "-"))
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DynamicIcon name={domain.icon as any} size={20} />
                      <CardTitle className="text-lg">{domain.domain}</CardTitle>
                    </div>
                    <Badge
                      variant={
                        domain.status === "critical"
                          ? "destructive"
                          : domain.status === "warning"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {domain.score}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {domain.description}
                  </p>
                  <div className="space-y-1">
                    {domain.keyMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {metric.label}:
                        </span>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DynamicIcon name="info" size={20} className="mr-2" />
              How to Use BOM Explorer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Search for Parts</h4>
                <p className="text-sm text-muted-foreground">
                  Use the search bar above to find specific parts by NSN, part
                  name, or description. Click on a search result to view
                  detailed analysis.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  Navigate from Advanced Forecast
                </h4>
                <p className="text-sm text-muted-foreground">
                  Click the "BOM360" button on any part in the Advanced Forecast
                  to view comprehensive part analysis and supply chain insights.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Domain Overview</h4>
                <p className="text-sm text-muted-foreground">
                  Click on any domain card above to explore that specific area.
                  Each domain provides specialized insights and analytics.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">URL Parameters</h4>
                <p className="text-sm text-muted-foreground">
                  Use URL parameters like:
                  /mi#bom-explorer?nsn=2840-00-000001&part=Turbine+Blade&domain=engineering
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header with Part Information and Search */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">BOM Explorer</h1>
            <p className="text-muted-foreground">
              Part analysis and supply chain insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Search parts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                  setShowSearch(e.target.value.length > 0);
                }}
                className="w-60"
              />
              <DynamicIcon
                name="search"
                size={16}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />

              {/* Search Results Dropdown */}
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.nsn}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => handlePartSelect(result)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {result.partName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            NSN: {result.nsn}
                          </div>
                        </div>
                        <Badge
                          variant={
                            result.riskScore > 75
                              ? "destructive"
                              : result.riskScore > 50
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {result.riskScore}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleExplainPart} className="flex items-center">
              <DynamicIcon name="message-circle" size={16} className="mr-2" />
              Explain Part Issues
            </Button>
          </div>
        </div>

        {/* Part Header Information */}
        <Card>
          <CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <CardTitle className="text-xl">{partInfo.partName}</CardTitle>
                <CardDescription className="mt-2">
                  <span className="font-medium">NSN:</span> {partInfo.nsn}
                </CardDescription>
                {partInfo.description && (
                  <CardDescription className="mt-1">
                    {partInfo.description}
                  </CardDescription>
                )}
              </div>
              <div className="space-y-2">
                {partInfo.riskScore && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Risk Score:</span>
                    <Badge
                      variant={
                        partInfo.riskScore > 75
                          ? "destructive"
                          : partInfo.riskScore > 50
                          ? "secondary"
                          : "default"
                      }
                    >
                      {partInfo.riskScore}
                    </Badge>
                  </div>
                )}
                {partInfo.daysOfSupply && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Days of Supply:</span>
                    <Badge
                      variant={
                        partInfo.daysOfSupply < 30 ? "destructive" : "outline"
                      }
                    >
                      {partInfo.daysOfSupply} days
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {partInfo.parentAssembly && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Parent Assembly
                  </div>
                  <div className="text-sm">{partInfo.parentAssembly}</div>
                </div>
              )}
              {partInfo.systemsAffected &&
                partInfo.systemsAffected.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Systems Affected
                    </div>
                    <div className="text-sm">
                      {partInfo.systemsAffected.join(", ")}
                    </div>
                  </div>
                )}
              {partInfo.alternates && partInfo.alternates.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Alternates
                  </div>
                  <div className="text-sm">
                    {partInfo.alternates.join(", ")}
                  </div>
                </div>
              )}
              {partInfo.supplier && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Primary Supplier
                  </div>
                  <div className="text-sm">{partInfo.supplier}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
          <TabsTrigger value="supplier">Supplier</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="engineering">Engineering</TabsTrigger>
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="space-y-6">
            {/* Domain Summary Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Domain Assessment for {partInfo.partName}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainSummaries.map((domain) => (
                  <Card
                    key={domain.domain}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      setActiveTab(
                        domain.domain.toLowerCase().replace(" ", "-")
                      )
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DynamicIcon name={domain.icon as any} size={16} />
                          <CardTitle className="text-sm">
                            {domain.domain}
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            domain.status === "critical"
                              ? "destructive"
                              : domain.status === "warning"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {domain.score}%
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-2">
                        {domain.description}
                      </p>
                      <div className="space-y-1">
                        {domain.keyMetrics.slice(0, 2).map((metric) => (
                          <div
                            key={metric.label}
                            className="flex justify-between text-xs"
                          >
                            <span className="text-muted-foreground">
                              {metric.label}:
                            </span>
                            <span className="font-medium">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Part Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DynamicIcon name="info" size={20} className="mr-2" />
                    Part Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Lead Time
                      </div>
                      <div className="text-2xl font-bold">
                        {partInfo.leadTime || "N/A"} days
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Unit Cost
                      </div>
                      <div className="text-2xl font-bold">
                        ${partInfo.cost?.toLocaleString() || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Key Characteristics
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline">High-Value Component</Badge>
                      <Badge variant="outline">Critical Path Item</Badge>
                      <Badge variant="outline">Single Source</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DynamicIcon
                      name="alert-triangle"
                      size={20}
                      className="mr-2"
                    />
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Supply Risk</span>
                      <Badge variant="destructive">High</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Obsolescence Risk</span>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mission Impact</span>
                      <Badge variant="destructive">Critical</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="supply-chain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="truck" size={20} className="mr-2" />
                Supply Chain Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DynamicIcon
                  name="construction"
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Supply Chain Analytics
                </h3>
                <p className="text-muted-foreground">
                  Supply chain analytics and logistics data for this part are
                  being prepared.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="supplier">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="building" size={20} className="mr-2" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DynamicIcon
                  name="construction"
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Supplier Analytics
                </h3>
                <p className="text-muted-foreground">
                  Supplier performance data and risk assessments for this part
                  are being prepared.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="wrench" size={20} className="mr-2" />
                Maintenance Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DynamicIcon
                  name="construction"
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Maintenance Analytics
                </h3>
                <p className="text-muted-foreground">
                  Maintenance schedules, failure rates, repair history, and
                  predictive maintenance insights will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engineering">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="cog" size={20} className="mr-2" />
                Engineering Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DynamicIcon
                  name="construction"
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Engineering Analytics
                </h3>
                <p className="text-muted-foreground">
                  Engineering specifications, design changes, technical
                  drawings, and configuration management data will be displayed
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="readiness">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DynamicIcon name="shield-check" size={20} className="mr-2" />
                Readiness Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DynamicIcon
                  name="construction"
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <h3 className="text-lg font-semibold mb-2">
                  Mission Readiness
                </h3>
                <p className="text-muted-foreground">
                  Mission readiness metrics, availability rates, and operational
                  impact assessments will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ExternalLink,
  FileText,
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface RiskTableProps {
  data: any[];
  filters: any;
  onExplain: (record: any) => void;
  onBOM360: (record: any) => void;
  onWorkbench: (record: any) => void;
}

export function RiskTable({
  data,
  filters,
  onExplain,
  onBOM360,
  onWorkbench,
}: RiskTableProps) {
  const [sortField, setSortField] = useState<string>("risk_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [dosFilter, setDosFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Sort and filter data
  const filteredData = (data || [])
    .filter((item) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        item.part_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomenclature?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Risk level filter
      const riskMatch = riskFilter === "all" || item.risk_level === riskFilter;

      // Days of supply filter
      const dosMatch =
        dosFilter === "all" ||
        (dosFilter === "critical" && (item.days_of_supply || 0) < 30) ||
        (dosFilter === "low" &&
          (item.days_of_supply || 0) >= 30 &&
          (item.days_of_supply || 0) < 90) ||
        (dosFilter === "adequate" && (item.days_of_supply || 0) >= 90);

      return searchMatch && riskMatch && dosMatch;
    })
    .sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle numeric values
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      aVal = String(aVal || "").toLowerCase();
      bVal = String(bVal || "").toLowerCase();

      if (sortOrder === "asc") {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const getRiskBadge = (riskLevel: string, riskScore: number) => {
    const variants = {
      critical: "destructive",
      high: "destructive",
      medium: "default",
      moderate: "secondary",
      low: "secondary",
    } as const;

    const colors = {
      critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      medium:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      moderate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    } as const;

    return (
      <div className="flex items-center gap-2">
        <Badge
          variant={variants[riskLevel as keyof typeof variants] || "secondary"}
          className={colors[riskLevel as keyof typeof colors] || ""}
        >
          {riskLevel?.toUpperCase()}
        </Badge>
        <span className="text-sm font-mono">{riskScore?.toFixed(1)}</span>
      </div>
    );
  };

  const getDaysOfSupplyBadge = (days: number) => {
    if (days < 30) {
      return <Badge variant="destructive">Critical: {days}d</Badge>;
    } else if (days < 90) {
      return <Badge variant="default">Low: {days}d</Badge>;
    } else {
      return <Badge variant="secondary">Adequate: {days}d</Badge>;
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  return (
    <div className="space-y-4">
      {/* Table Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Supply Chain Risk Analysis
              </CardTitle>
              <CardDescription>
                Detailed part-level risk assessment for {filters.weaponSystem} -{" "}
                {filters.horizon} day horizon
              </CardDescription>
            </div>
            <Badge variant="outline">
              {filteredData.length} of {(data || []).length} parts
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts, nomenclature, or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dosFilter} onValueChange={setDosFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Days of Supply" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Supply Levels</SelectItem>
                <SelectItem value="critical">Critical (&lt;30 days)</SelectItem>
                <SelectItem value="low">Low (30-90 days)</SelectItem>
                <SelectItem value="adequate">Adequate (&gt;90 days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("part_number")}
                  >
                    <div className="flex items-center">
                      Part Number
                      <SortIcon field="part_number" />
                    </div>
                  </TableHead>
                  <TableHead>Nomenclature</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("risk_score")}
                  >
                    <div className="flex items-center">
                      Risk Level
                      <SortIcon field="risk_score" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("days_of_supply")}
                  >
                    <div className="flex items-center">
                      Days of Supply
                      <SortIcon field="days_of_supply" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("supplier_name")}
                  >
                    <div className="flex items-center">
                      Primary Supplier
                      <SortIcon field="supplier_name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("forecast_demand")}
                  >
                    <div className="flex items-center">
                      Forecast Demand
                      <SortIcon field="forecast_demand" />
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.part_number}>
                    <TableCell className="font-mono font-medium">
                      {item.part_number}
                    </TableCell>
                    <TableCell className="max-w-48 truncate">
                      {item.nomenclature}
                    </TableCell>
                    <TableCell>
                      {getRiskBadge(item.risk_level, item.risk_score)}
                    </TableCell>
                    <TableCell>
                      {getDaysOfSupplyBadge(item.days_of_supply || 0)}
                    </TableCell>
                    <TableCell className="max-w-32 truncate">
                      {item.supplier_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">
                          {item.forecast_demand || 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onExplain(item)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Explain Risk
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onBOM360(item)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            BOM360 View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onWorkbench(item)}>
                            <Wrench className="mr-2 h-4 w-4" />
                            Open in Workbench
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredData.length)} of{" "}
                {filteredData.length} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

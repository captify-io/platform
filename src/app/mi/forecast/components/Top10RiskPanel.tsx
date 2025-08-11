import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpDown,
  Eye,
  ExternalLink,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  Clock,
  Truck,
} from "lucide-react";
import type { PredictionRow } from "../../types";

interface Top10RiskPanelProps {
  predictions: PredictionRow[];
  horizon: "Now" | "12mo" | "5yr";
  weaponSystem: string;
  onRefresh: () => void;
}

export function Top10RiskPanel({
  predictions,
  horizon,
  weaponSystem,
  onRefresh,
}: Top10RiskPanelProps) {
  const [sortField, setSortField] = useState<string>("risk_score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-red-600 bg-red-50 border-red-200";
    if (score >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getRecommendationVariant = (recommendation: string) => {
    switch (recommendation) {
      case "Replace":
        return "destructive";
      case "Inspect":
        return "secondary";
      case "Derate":
        return "outline";
      default:
        return "default";
    }
  };

  const getSupplierTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "declining":
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <div className="h-3 w-3" />;
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedPredictions = [...predictions].sort((a, b) => {
    let aValue: number | string;
    let bValue: number | string;

    switch (sortField) {
      case "risk_score":
        aValue = a.risk_score;
        bValue = b.risk_score;
        break;
      case "part_name":
        aValue = a.part.nomenclature;
        bValue = b.part.nomenclature;
        break;
      case "predicted_window":
        aValue = a.predicted_window;
        bValue = b.predicted_window;
        break;
      default:
        aValue = a.risk_score;
        bValue = b.risk_score;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    // Ensure both values are numbers for arithmetic operations
    const aNum = typeof aValue === "number" ? aValue : 0;
    const bNum = typeof bValue === "number" ? bValue : 0;
    return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
  });

  const handleExplain = (prediction: PredictionRow) => {
    console.log("Opening explainability drawer for:", prediction.id);
    // TODO: Implement explainability drawer
  };

  const handleBOM360 = (prediction: PredictionRow) => {
    // Navigate to BOM explorer with part context
    window.open(
      `/mi/bom-explorer?nodeId=${prediction.part.nsn}&context=${prediction.tail_context}`,
      "_blank"
    );
  };

  const handleAddToWorkbench = (prediction: PredictionRow) => {
    console.log("Adding to workbench:", prediction.id);
    // TODO: Implement workbench case creation
  };

  if (predictions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Top-10 Problem Parts
          </CardTitle>
          <CardDescription>
            Ranked list of predicted problem parts for {horizon} horizon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No predictions for this horizon. Try expanding date range or
              switching horizon.
            </p>
            <Button onClick={onRefresh} variant="outline" className="mt-4">
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top-10 Problem Parts
            </CardTitle>
            <CardDescription>
              Ranked by risk score for {horizon} horizon • {weaponSystem} fleet
            </CardDescription>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("part_name")}
                >
                  <div className="flex items-center gap-1">
                    Part
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("risk_score")}
                >
                  <div className="flex items-center gap-1">
                    Risk Score
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("predicted_window")}
                >
                  <div className="flex items-center gap-1">
                    Window
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Indicators</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Rec.</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPredictions.slice(0, 10).map((prediction) => (
                <TableRow key={prediction.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">
                        {prediction.part.nomenclature}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>NSN: {prediction.part.nsn}</div>
                        <div>P/N: {prediction.part.pn}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        className={`${getRiskScoreColor(
                          prediction.risk_score
                        )} font-bold`}
                        variant="outline"
                      >
                        {prediction.risk_score}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        {Math.round(prediction.confidence * 100)}% conf
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {prediction.predicted_window}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {prediction.leading_indicators
                        .slice(0, 2)
                        .map((indicator, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {indicator}
                          </Badge>
                        ))}
                      {prediction.leading_indicators.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{prediction.leading_indicators.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div>{prediction.projected_impact.micap_days}d MICAP</div>
                      <div>
                        {prediction.projected_impact.sorties_at_risk} sorties
                      </div>
                      <div>
                        $
                        {(
                          prediction.projected_impact.cost_impact / 1000000
                        ).toFixed(1)}
                        M
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {prediction.stock_posture.on_hand} OH
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {prediction.stock_posture.due_in} DI
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {prediction.stock_posture.lead_time_days}d LT
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {prediction.supplier_signal.otd_percent}% OTD
                      </div>
                      <div>
                        PQDR:{" "}
                        {(prediction.supplier_signal.pqdr_rate * 100).toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className="flex items-center gap-1">
                        {getSupplierTrendIcon(
                          prediction.supplier_signal.quality_trend
                        )}
                        <span className="capitalize">
                          {prediction.supplier_signal.quality_trend}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getRecommendationVariant(
                        prediction.recommendation
                      )}
                    >
                      {prediction.recommendation}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExplain(prediction)}
                        className="h-8 w-8 p-0"
                        title="Explain"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBOM360(prediction)}
                        className="h-8 w-8 p-0"
                        title="BOM360"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddToWorkbench(prediction)}
                        className="h-8 w-8 p-0"
                        title="Add to Workbench"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {predictions.length > 10 && (
          <div className="mt-4 text-center">
            <Badge variant="outline">
              Showing top 10 of {predictions.length} predictions
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

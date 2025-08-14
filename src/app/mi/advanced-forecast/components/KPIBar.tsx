import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Layers, Wrench } from "lucide-react";
import { AdvancedForecastKPIs } from "../../services/advanced-forecast-api-client";
import { useChatIntegration } from "@/hooks/useChatIntegration";
import { useRouter } from "next/navigation";

interface KPIBarProps {
  kpis: AdvancedForecastKPIs;
  metadata: any;
  filters: {
    weaponSystem: string;
    horizon: 90 | 180 | 270 | 365;
    scenario: string;
  };
}

// Mock data for top 10 problem parts
const mockProblemParts = [
  {
    rank: 1,
    nsn: "2840-00-000001",
    part_name: "Turbine Blade Assembly",
    horizon: 90,
    risk_score: 0.89,
    leading_indicators:
      "Supplier delays, Failure rate increase, Quality issues",
    micap_days_avoided: 45,
  },
  {
    rank: 2,
    nsn: "1680-00-000003",
    part_name: "Hydraulic Actuator",
    horizon: 90,
    risk_score: 0.85,
    leading_indicators: "Single source, High usage rate, Lead time variance",
    micap_days_avoided: 38,
  },
  {
    rank: 3,
    nsn: "2840-00-000002",
    part_name: "Combustion Module",
    horizon: 90,
    risk_score: 0.75,
    leading_indicators: "Obsolescence risk, Limited stock, Vendor issues",
    micap_days_avoided: 32,
  },
  {
    rank: 4,
    nsn: "5895-00-000004",
    part_name: "Navigation Display",
    horizon: 90,
    risk_score: 0.71,
    leading_indicators: "Tech refresh needed, Vendor consolidation, EOL notice",
    micap_days_avoided: 28,
  },
  {
    rank: 5,
    nsn: "6110-00-000005",
    part_name: "Power Generator",
    horizon: 90,
    risk_score: 0.68,
    leading_indicators:
      "Maintenance interval, Wear patterns, Inspection findings",
    micap_days_avoided: 25,
  },
  {
    rank: 6,
    nsn: "1620-00-000006",
    part_name: "Landing Gear Strut",
    horizon: 90,
    risk_score: 0.64,
    leading_indicators:
      "Corrosion issues, Inspection findings, Material degradation",
    micap_days_avoided: 22,
  },
  {
    rank: 7,
    nsn: "1660-00-000007",
    part_name: "Environmental Control Unit",
    horizon: 90,
    risk_score: 0.61,
    leading_indicators: "Seasonal demand, Repair backlog, Component shortage",
    micap_days_avoided: 19,
  },
  {
    rank: 8,
    nsn: "2915-00-000008",
    part_name: "Fuel System Pump",
    horizon: 90,
    risk_score: 0.58,
    leading_indicators:
      "Quality issues, RFI rate increase, Supplier performance",
    micap_days_avoided: 16,
  },
  {
    rank: 9,
    nsn: "1560-00-000009",
    part_name: "Wing Structure Panel",
    horizon: 90,
    risk_score: 0.55,
    leading_indicators: "Fatigue monitoring, NDI requirements, Service life",
    micap_days_avoided: 14,
  },
  {
    rank: 10,
    nsn: "1270-00-000010",
    part_name: "Flight Control Cable",
    horizon: 90,
    risk_score: 0.52,
    leading_indicators: "Inspection intervals, Wear trends, Safety margin",
    micap_days_avoided: 12,
  },
];

export function KPIBar({ kpis, metadata, filters }: KPIBarProps) {
  const { sendMessage } = useChatIntegration();
  const router = useRouter();

  const getRiskBadgeColor = (score: number) => {
    if (score >= 0.8) return "bg-red-100 text-red-800 border-red-200";
    if (score >= 0.6) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const handleExplain = (part: any) => {
    // Send a detailed message to the agent about the part's risk factors
    const message = `I need help understanding the risk factors for ${part.part_name} (NSN: ${part.nsn}). This part has a risk score of ${part.risk_score} and is showing the following leading indicators: ${part.leading_indicators}. Can you explain what's driving these risks and what actions I should take to mitigate them?`;
    sendMessage(message);
  };

  const handleBOM360 = (part: any) => {
    // Navigate to BOM Explorer view for this part using hash routing
    window.location.hash = `bom-explorer?nsn=${
      part.nsn
    }&part=${encodeURIComponent(part.part_name)}`;
  };

  const handleWorkbench = (part: any) => {
    // Navigate to the part's workbench using hash routing
    window.location.hash = `workbench?nsn=${part.nsn}&part=${encodeURIComponent(
      part.part_name
    )}&context=risk-analysis`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-background">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-16" />
              <col className="w-48" />
              <col className="w-20" />
              <col className="w-24" />
              <col className="w-80" />
              <col className="w-20" />
              <col className="w-24" />
            </colgroup>
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  NSN / Part Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Horizon
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Risk Score
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Leading Indicators
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  MICAP Days Avoided
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {mockProblemParts.map((part) => (
                <tr
                  key={part.rank}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                    {part.rank}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs font-medium text-foreground truncate">
                      {part.nsn}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {part.part_name}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-foreground">
                    {part.horizon} days
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <Badge className={getRiskBadgeColor(part.risk_score)}>
                      {(part.risk_score * 100).toFixed(0)}%
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      {part.leading_indicators
                        .split(",")
                        .map((indicator, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs bg-primary/10 text-primary border-primary/20"
                          >
                            {indicator.trim()}
                          </Badge>
                        ))}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                    {part.micap_days_avoided} days
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleExplain(part)}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                      >
                        <HelpCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleBOM360(part)}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-900 hover:bg-green-50"
                      >
                        <Layers className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleWorkbench(part)}
                        className="h-6 w-6 p-0 text-purple-600 hover:text-purple-900 hover:bg-purple-50"
                      >
                        <Wrench className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

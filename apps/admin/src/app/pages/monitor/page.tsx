"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@captify/core/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@captify/core/ui";
import { Button } from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Progress } from "@captify/core/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@captify/core/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core/ui";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Database,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Filter,
  Info,
  Loader2,
  Lock,
  Mail,
  Minus,
  MoreVertical,
  Package,
  PauseCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import { apiClient } from "@captify/core/lib";
import { useApi } from "@captify/core/hooks";
import { cn } from "@captify/core/lib";
import type {
  OscalControl,
  ControlAssessment,
  SecurityHubFinding,
  Evidence,
  SystemSecurityPlan,
  POAM,
  Policy,
  ChangeRequest,
  ComplianceTask,
  ComplianceReport,
  Alert as MonitorAlert,
  ControlFamilySummary,
  FindingSummary,
  POAMSummary,
} from "../../../types/monitor";

/**
 * NIST 800-53 Rev 5 Control Families
 */
const CONTROL_FAMILIES = [
  { id: "AC", name: "Access Control", icon: Lock, color: "blue" },
  {
    id: "AU",
    name: "Audit and Accountability",
    icon: FileText,
    color: "purple",
  },
  { id: "AT", name: "Awareness and Training", icon: Users, color: "green" },
  {
    id: "CA",
    name: "Assessment, Authorization, and Monitoring",
    icon: Shield,
    color: "orange",
  },
  { id: "CM", name: "Configuration Management", icon: Settings, color: "red" },
  { id: "CP", name: "Contingency Planning", icon: RefreshCw, color: "indigo" },
  {
    id: "IA",
    name: "Identification and Authentication",
    icon: User,
    color: "pink",
  },
  { id: "IR", name: "Incident Response", icon: AlertTriangle, color: "yellow" },
  { id: "MA", name: "Maintenance", icon: Settings, color: "cyan" },
  { id: "MP", name: "Media Protection", icon: Shield, color: "teal" },
  { id: "PS", name: "Personnel Security", icon: Users, color: "blue" },
  {
    id: "PE",
    name: "Physical and Environmental Protection",
    icon: Lock,
    color: "purple",
  },
  { id: "PL", name: "Planning", icon: FileText, color: "green" },
  { id: "PM", name: "Program Management", icon: Package, color: "orange" },
  { id: "RA", name: "Risk Assessment", icon: AlertCircle, color: "red" },
  {
    id: "SA",
    name: "System and Services Acquisition",
    icon: Package,
    color: "indigo",
  },
  {
    id: "SC",
    name: "System and Communications Protection",
    icon: Shield,
    color: "pink",
  },
  {
    id: "SI",
    name: "System and Information Integrity",
    icon: ShieldCheck,
    color: "yellow",
  },
  {
    id: "SR",
    name: "Supply Chain Risk Management",
    icon: Package,
    color: "cyan",
  },
  { id: "PT", name: "Privacy Controls", icon: Lock, color: "teal" },
];

export function Monitor() {
  const [activeTab, setActiveTab] = React.useState("performance");
  const [loading, setLoading] = React.useState(false);
  const [selectedControl, setSelectedControl] =
    React.useState<OscalControl | null>(null);
  const [selectedPOAM, setSelectedPOAM] = React.useState<POAM | null>(null);
  const [selectedPolicy, setSelectedPolicy] = React.useState<Policy | null>(
    null
  );
  const [selectedChange, setSelectedChange] =
    React.useState<ChangeRequest | null>(null);
  const [selectedTask, setSelectedTask] = React.useState<ComplianceTask | null>(
    null
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterFamily, setFilterFamily] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");

  // Fetch compliance data
  const {
    data: complianceScore,
    loading: scoreLoading,
    execute: fetchScore,
  } = useApi(async (client) => {
    return client.run({
      service: "monitor",
      operation: "getComplianceScore",
    });
  });

  // Fetch performance metrics
  const {
    data: performanceMetrics,
    loading: metricsLoading,
    execute: fetchMetrics,
  } = useApi(async (client) => {
    return client.run({
      service: "monitor",
      operation: "getPerformanceMetrics",
      data: {
        namespace: "AWS/EC2",
        metricName: "CPUUtilization",
      },
    });
  });

  React.useEffect(() => {
    if (activeTab === "performance") {
      fetchMetrics();
    } else if (activeTab === "controls") {
      fetchScore();
    }
  }, [activeTab]);

  /**
   * Performance Tab Component
   */
  const PerformanceTab = () => (
    <div className="space-y-6">
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Availability
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.99%</div>
            <p className="text-xs text-muted-foreground">
              <ArrowUp className="inline h-3 w-3 text-green-500" />
              0.01% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              <ArrowDown className="inline h-3 w-3 text-green-500" />
              12ms improvement
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Security Score
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complianceScore?.score || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {complianceScore?.passed || 0} passed /{" "}
              {complianceScore?.failed || 0} failed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 high, 1 medium severity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>Real-time status of AWS services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {["EC2", "RDS", "S3", "Lambda", "CloudFront"].map((service) => (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Cloud className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{service}</p>
                    <p className="text-sm text-muted-foreground">us-east-1</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="default"
                    className="bg-green-500/10 text-green-700"
                  >
                    Operational
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    100% uptime
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>System performance over time</CardDescription>
            </div>
            <Select defaultValue="1h">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mr-2" />
            Performance chart visualization would go here
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Controls Tab Component
   */
  const ControlsTab = () => {
    const [selectedFamily, setSelectedFamily] = React.useState<string | null>(
      null
    );
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

    return (
      <div className="space-y-6">
        {/* Compliance Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Overall Compliance
              </CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complianceScore?.score || 0}%
              </div>
              <Progress value={complianceScore?.score || 0} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Compliant Controls
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complianceScore?.passed || 0}
              </div>
              <p className="text-xs text-muted-foreground">Fully compliant</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Non-Compliant
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complianceScore?.failed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Not Assessed
              </CardTitle>
              <Minus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {complianceScore?.unknown || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending assessment
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Control Families Grid */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>NIST 800-53 Rev 5 Control Families</CardTitle>
                <CardDescription>
                  Compliance status by control family
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-4">
                {CONTROL_FAMILIES.map((family) => {
                  const Icon = family.icon;
                  return (
                    <Card
                      key={family.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedFamily(family.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-5 w-5 text-${family.color}-500`}
                            />
                            <CardTitle className="text-base">
                              {family.id}
                            </CardTitle>
                          </div>
                          <Badge variant="outline">85%</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {family.name}
                        </p>
                        <Progress value={85} className="h-2" />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>42 compliant</span>
                          <span>8 issues</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Family</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Compliant</TableHead>
                    <TableHead>Non-Compliant</TableHead>
                    <TableHead>Not Assessed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CONTROL_FAMILIES.map((family) => {
                    const Icon = family.icon;
                    return (
                      <TableRow
                        key={family.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedFamily(family.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon
                              className={`h-4 w-4 text-${family.color}-500`}
                            />
                            <span className="font-medium">{family.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>{family.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={85} className="w-20 h-2" />
                            <span className="text-sm">85%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="default"
                            className="bg-green-500/10 text-green-700"
                          >
                            42
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">8</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">5</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Selected Family Details */}
        {selectedFamily && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {CONTROL_FAMILIES.find((f) => f.id === selectedFamily)?.name}{" "}
                  Controls
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFamily(null)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Sample controls */}
                {[
                  {
                    id: `${selectedFamily}-1`,
                    title: "Policy and Procedures",
                    status: "compliant",
                  },
                  {
                    id: `${selectedFamily}-2`,
                    title: "Account Management",
                    status: "partial",
                  },
                  {
                    id: `${selectedFamily}-3`,
                    title: "Access Enforcement",
                    status: "non-compliant",
                  },
                ].map((control) => (
                  <div
                    key={control.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {control.status === "compliant" && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {control.status === "partial" && (
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                      )}
                      {control.status === "non-compliant" && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{control.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {control.title}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  /**
   * Policies Tab Component
   */
  const PoliciesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Policies & Procedures</h3>
          <p className="text-sm text-muted-foreground">
            Manage OSCAL-compliant policies and procedures
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Policy
        </Button>
      </div>

      <div className="grid gap-4">
        {[
          {
            title: "Information Security Policy",
            type: "policy",
            version: "2.0",
            status: "approved",
            nextReview: "2024-06-01",
          },
          {
            title: "Incident Response Procedures",
            type: "procedure",
            version: "1.5",
            status: "pending",
            nextReview: "2024-05-15",
          },
          {
            title: "Access Control SOP",
            type: "sop",
            version: "3.1",
            status: "approved",
            nextReview: "2024-07-01",
          },
        ].map((policy) => (
          <Card key={policy.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{policy.title}</CardTitle>
                    <CardDescription>
                      Version {policy.version} • Next review:{" "}
                      {policy.nextReview}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      policy.status === "approved" ? "default" : "secondary"
                    }
                  >
                    {policy.status}
                  </Badge>
                  <Badge variant="outline">{policy.type}</Badge>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );

  /**
   * POA&Ms Tab Component
   */
  const POAMsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Plan of Action & Milestones</h3>
          <p className="text-sm text-muted-foreground">
            Track remediation efforts for non-compliant controls
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create POA&M
        </Button>
      </div>

      {/* POA&M Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open POA&Ms</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">67% on track</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Due This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">2 critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* POA&M List */}
      <Card>
        <CardHeader>
          <CardTitle>Active POA&Ms</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Control</TableHead>
                <TableHead>Weakness</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  id: "POAM-001",
                  control: "AC-2",
                  weakness: "Incomplete account management procedures",
                  risk: "high",
                  dueDate: "2024-03-15",
                  progress: 75,
                  status: "in-progress",
                },
                {
                  id: "POAM-002",
                  control: "AU-4",
                  weakness: "Insufficient audit log storage",
                  risk: "medium",
                  dueDate: "2024-04-01",
                  progress: 40,
                  status: "in-progress",
                },
                {
                  id: "POAM-003",
                  control: "SC-7",
                  weakness: "Missing network segmentation",
                  risk: "critical",
                  dueDate: "2024-02-28",
                  progress: 90,
                  status: "in-progress",
                },
              ].map((poam) => (
                <TableRow key={poam.id}>
                  <TableCell className="font-medium">{poam.id}</TableCell>
                  <TableCell>{poam.control}</TableCell>
                  <TableCell>{poam.weakness}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        poam.risk === "critical"
                          ? "destructive"
                          : poam.risk === "high"
                          ? "destructive"
                          : poam.risk === "medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {poam.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>{poam.dueDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={poam.progress} className="w-20 h-2" />
                      <span className="text-sm">{poam.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{poam.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Change Requests Tab Component
   */
  const ChangeRequestsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Change Requests</h3>
          <p className="text-sm text-muted-foreground">
            Manage system changes with security impact assessment
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Change Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "CR-2024-001",
                title: "Update firewall rules for new application",
                type: "infrastructure",
                priority: "high",
                requestor: "John Doe",
                status: "pending",
              },
              {
                id: "CR-2024-002",
                title: "Deploy security patch for web servers",
                type: "security",
                priority: "critical",
                requestor: "Jane Smith",
                status: "approved",
              },
            ].map((change) => (
              <div
                key={change.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{change.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {change.id} • Requested by {change.requestor}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      change.priority === "critical" ? "destructive" : "default"
                    }
                  >
                    {change.priority}
                  </Badge>
                  <Badge variant="outline">{change.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Reports Tab Component
   */
  const ReportsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate and manage compliance evidence and reports
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Report Schedule */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Security Report</CardTitle>
            <CardDescription>Next: Today at 6:00 PM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-700"
              >
                Scheduled
              </Badge>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Weekly Compliance Summary
            </CardTitle>
            <CardDescription>Next: Monday at 9:00 AM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-700"
              >
                Scheduled
              </Badge>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly ATO Package</CardTitle>
            <CardDescription>Next: March 1, 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Pending</Badge>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  name: "Executive Compliance Summary",
                  type: "executive",
                  generated: "2024-02-15",
                  period: "Q1 2024",
                  format: "PDF",
                },
                {
                  name: "Security Control Assessment",
                  type: "technical",
                  generated: "2024-02-14",
                  period: "February 2024",
                  format: "OSCAL",
                },
                {
                  name: "Continuous Monitoring Report",
                  type: "continuous-monitoring",
                  generated: "2024-02-13",
                  period: "Week 7",
                  format: "JSON",
                },
              ].map((report) => (
                <TableRow key={report.name}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{report.generated}</TableCell>
                  <TableCell>{report.period}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.format}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  /**
   * Alerts Tab Component
   */
  const AlertsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Security Alerts</h3>
          <p className="text-sm text-muted-foreground">
            Real-time security and compliance alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Immediate action required
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Review today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
            <Info className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Informational</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                id: "ALT-001",
                title: "Unauthorized access attempt detected",
                severity: "critical",
                source: "Security Hub",
                time: "5 minutes ago",
                status: "new",
              },
              {
                id: "ALT-002",
                title: "Configuration drift detected in production",
                severity: "high",
                source: "AWS Config",
                time: "1 hour ago",
                status: "acknowledged",
              },
              {
                id: "ALT-003",
                title: "POA&M deadline approaching",
                severity: "medium",
                source: "Captify Monitor",
                time: "3 hours ago",
                status: "investigating",
              },
            ].map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  {alert.severity === "critical" && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {alert.severity === "high" && (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                  {alert.severity === "medium" && (
                    <Info className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.id} • {alert.source} • {alert.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      alert.severity === "critical"
                        ? "destructive"
                        : alert.severity === "high"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {alert.severity}
                  </Badge>
                  <Badge variant="outline">{alert.status}</Badge>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitor</h1>
          <p className="text-muted-foreground mt-1">
            Real-time compliance monitoring and ATO management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fetchScore()}>
            <RefreshCw
              className={cn("mr-2 h-4 w-4", scoreLoading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export OSCAL
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="poams">POA&Ms</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab />
        </TabsContent>

        <TabsContent value="controls" className="space-y-6">
          <ControlsTab />
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <PoliciesTab />
        </TabsContent>

        <TabsContent value="poams" className="space-y-6">
          <POAMsTab />
        </TabsContent>

        <TabsContent value="changes" className="space-y-6">
          <ChangeRequestsTab />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Monitor;

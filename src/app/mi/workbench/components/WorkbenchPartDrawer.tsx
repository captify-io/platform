"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DynamicIcon } from "lucide-react/dynamic";
import { WorkbenchApiClient, type WorkbenchPart, type WorkbenchDecision } from "@/app/mi/services/workbench-api-client";

interface AssistanceRequest {
  id: string;
  form_number: string;
  date_submitted: string;
  unit: string;
  aircraft_tail: string;
  issue_description: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  technician: string;
  location: string;
}

interface WorkbenchPartDrawerProps {
  nsn: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WorkbenchPartDrawer({
  nsn,
  open,
  onOpenChange,
}: WorkbenchPartDrawerProps) {
  const [part, setPart] = useState<WorkbenchPart | null>(null);
  const [decisions, setDecisions] = useState<WorkbenchDecision[]>([]);
  const [assistanceRequests, setAssistanceRequests] = useState<AssistanceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock assistance requests for demo
  const mockAssistanceRequests: AssistanceRequest[] = [
    {
      id: "107-001",
      form_number: "AF Form 107-001",
      date_submitted: "2024-01-15",
      unit: "2nd BW",
      aircraft_tail: "60-0001",
      issue_description: "Turbine blade showing stress fractures after 850 flight hours",
      severity: "High",
      status: "Open",
      technician: "SSgt Johnson",
      location: "Barksdale AFB"
    },
    {
      id: "107-002", 
      form_number: "AF Form 107-002",
      date_submitted: "2024-01-18",
      unit: "5th BW",
      aircraft_tail: "61-0025",
      issue_description: "Vibration detected during engine run-up, suspected blade imbalance",
      severity: "Medium",
      status: "In Progress",
      technician: "TSgt Martinez",
      location: "Minot AFB"
    },
    {
      id: "107-003",
      form_number: "AF Form 107-003", 
      date_submitted: "2024-01-22",
      unit: "96th BW",
      aircraft_tail: "60-0034",
      issue_description: "Coating wear on blade tips exceeding tolerance",
      severity: "Medium",
      status: "Open",
      technician: "SrA Thompson",
      location: "Dyess AFB"
    }
  ];

  useEffect(() => {
    if (nsn && open) {
      fetchPartDetails();
      fetchRelatedDecisions();
    }
  }, [nsn, open]);

  const fetchPartDetails = async () => {
    if (!nsn) return;

    try {
      setLoading(true);
      const response = await WorkbenchApiClient.getPartDetails(nsn);

      if (response.ok && response.data) {
        setPart(response.data);
        // For demo, set mock assistance requests when part loads
        setAssistanceRequests(mockAssistanceRequests);
      }
    } catch (error) {
      console.error("Failed to fetch part details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedDecisions = async () => {
    if (!nsn) return;

    try {
      const response = await WorkbenchApiClient.getDecisions();
      
      if (response.ok && response.data) {
        // Filter decisions that reference this NSN
        const relatedDecisions = response.data.filter(decision =>
          decision.linkedParts.some(partNsn => partNsn.includes(nsn))
        );
        setDecisions(relatedDecisions);
      }
    } catch (error) {
      console.error("Failed to fetch related decisions:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "At Risk":
        return "bg-red-100 text-red-800";
      case "Under Review":
        return "bg-orange-100 text-orange-800";
      case "Qualifying":
        return "bg-yellow-100 text-yellow-800";
      case "Normal":
        return "bg-green-100 text-green-800";
      case "Monitoring":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return "text-green-600";
    if (performance >= 80) return "text-yellow-600";
    if (performance >= 70) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return "bg-red-500";
    if (riskScore >= 60) return "bg-orange-500";
    if (riskScore >= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'destructive';
      case 'In Progress': return 'secondary';
      case 'Resolved': return 'default';
      default: return 'outline';
    }
  };

  if (!nsn) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[800px] max-w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <DynamicIcon name="package" className="h-5 w-5" />
            Part Details
          </SheetTitle>
          <SheetDescription>
            Detailed information for NSN: {nsn}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="py-8 text-center">
            <DynamicIcon name="loader-2" className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading part details...</p>
          </div>
        ) : part ? (
          <div className="space-y-6 py-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="assistance">Field Reports</TabsTrigger>
                <TabsTrigger value="analysis">Risk Analysis</TabsTrigger>
                <TabsTrigger value="decisions">Decisions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Part Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{part.nomenclature}</span>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(part.currentStatus)}>
                          {part.currentStatus}
                        </Badge>
                        {part.missionCritical && (
                          <Badge variant="destructive">Mission Critical</Badge>
                        )}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">NSN</h4>
                        <p className="text-sm font-mono">{part.nsn}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Part Number</h4>
                        <p className="text-sm font-mono">{part.partNumber}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">System</h4>
                        <p className="text-sm">{part.system}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Assembly</h4>
                        <p className="text-sm">{part.assembly}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Risk Score</h4>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Progress 
                            value={part.riskScore} 
                            className="h-3"
                          />
                        </div>
                        <span className="text-lg font-bold">{part.riskScore}/100</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-1">Last Maintenance</h4>
                      <p className="text-sm">{formatDate(part.lastMaintenance)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Posture */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DynamicIcon name="warehouse" className="h-4 w-4" />
                      Stock Posture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">On Hand</h4>
                        <p className="text-2xl font-bold">{part.stockPosture.onHand}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Due In</h4>
                        <p className="text-2xl font-bold">{part.stockPosture.dueIn}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Days of Supply</h4>
                        <p className="text-2xl font-bold">{part.stockPosture.daysOfSupply}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Supplier Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DynamicIcon name="truck" className="h-4 w-4" />
                      Supplier Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Supplier</h4>
                        <p className="text-sm font-semibold">{part.supplier.name}</p>
                        <p className="text-xs text-muted-foreground">CAGE: {part.supplier.cage}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-1">Performance</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={part.supplier.performance} className="flex-1" />
                          <span className={`text-sm font-semibold ${getPerformanceColor(part.supplier.performance)}`}>
                            {part.supplier.performance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assistance" className="space-y-6">
                {/* Field Assistance Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DynamicIcon name="file-text" className="h-4 w-4" />
                      Field Assistance Requests ({assistanceRequests.length})
                    </CardTitle>
                    <CardDescription>
                      Form 107 assistance requests from field maintenance teams
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assistanceRequests.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Form</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Unit/Location</TableHead>
                            <TableHead>Aircraft</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Severity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Technician</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assistanceRequests.map((request) => (
                            <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell className="font-mono text-xs">{request.form_number}</TableCell>
                              <TableCell className="text-sm">{formatDate(request.date_submitted)}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{request.unit}</div>
                                  <div className="text-muted-foreground text-xs">{request.location}</div>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">{request.aircraft_tail}</TableCell>
                              <TableCell className="max-w-xs">
                                <p className="text-sm truncate" title={request.issue_description}>
                                  {request.issue_description}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getSeverityColor(request.severity)}>
                                  {request.severity}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRequestStatusColor(request.status)}>
                                  {request.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">{request.technician}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="py-8 text-center">
                        <DynamicIcon name="clipboard-check" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No assistance requests on file</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                {/* Risk Analysis and Leading Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DynamicIcon name="trending-up" className="h-4 w-4" />
                      Problem Identification & Risk Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DynamicIcon name="alert-triangle" className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Primary Issue Identified</h4>
                      </div>
                      <p className="text-red-700">
                        Multiple stress fracture reports in turbine blades exceeding expected lifecycle. 
                        Pattern indicates potential material fatigue or manufacturing defect.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Leading Indicators</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <DynamicIcon name="alert-circle" className="h-4 w-4 text-orange-500" />
                              3 field reports in 30 days
                            </li>
                            <li className="flex items-center gap-2">
                              <DynamicIcon name="trending-up" className="h-4 w-4 text-red-500" />
                              40% increase in failure rate
                            </li>
                            <li className="flex items-center gap-2">
                              <DynamicIcon name="clock" className="h-4 w-4 text-yellow-500" />
                              Premature failure at 850 hrs (exp: 1200 hrs)
                            </li>
                            <li className="flex items-center gap-2">
                              <DynamicIcon name="map-pin" className="h-4 w-4 text-blue-500" />
                              Multiple geographic locations affected
                            </li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">Suggested Course of Action</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ol className="space-y-2 text-sm list-decimal list-inside">
                            <li>Immediate inspection of all turbine blades with &gt;800 flight hours</li>
                            <li>Contact supplier for quality investigation</li>
                            <li>Implement enhanced monitoring protocol</li>
                            <li>Consider temporary flight hour restrictions</li>
                            <li>Coordinate with engineering for root cause analysis</li>
                          </ol>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Tasks Remaining</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Engineering analysis completion</span>
                            <div className="flex items-center gap-2">
                              <Progress value={75} className="w-20" />
                              <span className="text-xs text-muted-foreground">75%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Supplier investigation</span>
                            <div className="flex items-center gap-2">
                              <Progress value={25} className="w-20" />
                              <span className="text-xs text-muted-foreground">25%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Fleet inspection protocol</span>
                            <div className="flex items-center gap-2">
                              <Progress value={90} className="w-20" />
                              <span className="text-xs text-muted-foreground">90%</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Interim maintenance guidance</span>
                            <div className="flex items-center gap-2">
                              <Progress value={50} className="w-20" />
                              <span className="text-xs text-muted-foreground">50%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="decisions" className="space-y-6">
                {/* Related Decisions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Related Decisions</h3>
                  {decisions.length > 0 ? (
                    <div className="space-y-4">
                      {decisions.map((decision) => (
                        <Card key={decision.id}>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center justify-between">
                              <span>{decision.title}</span>
                              <Badge variant="outline">{decision.status}</Badge>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">
                              {decision.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Approved by {decision.approvedBy} on {formatDate(decision.approvedDate)}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <DynamicIcon name="clipboard-x" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No related decisions found</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Linked Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DynamicIcon name="link" className="h-4 w-4" />
                  Linked Issues ({part.linkedIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {part.linkedIssues.length > 0 ? (
                  <div className="space-y-2">
                    {part.linkedIssues.map((issueId, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm font-mono">{issueId}</span>
                        <Button variant="outline" size="sm">
                          <DynamicIcon name="external-link" className="h-3 w-3 mr-1" />
                          View Issue
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No linked issues</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-8 text-center">
            <DynamicIcon name="package-x" className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Part not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

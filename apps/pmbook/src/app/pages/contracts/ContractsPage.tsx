"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core/components";
import { apiClient } from "@captify/core/lib";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Progress,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@captify/core/components/ui";
import {
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";

export function ContractsPage() {
  const { session } = useCaptify();
  const [contracts, setContracts] = useState<any[]>([]);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [contractDetails, setContractDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      loadContractDetails(selectedContract.id);
    }
  }, [selectedContract]);

  const loadContracts = async () => {
    try {
      const hasAccess = session?.user?.groups?.includes("Operations");

      if (!hasAccess) {
        setLoading(false);
        return;
      }

      const response = await apiClient.run({
        service: "contract",
        operation: "getActiveContracts",
      });

      const data = response?.data || [];
      setContracts(response?.data);
      if (data.length > 0) {
        setSelectedContract(data[0]);
      }
    } catch (error) {
      console.error("Failed to load contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadContractDetails = async (contractId: string) => {
    try {
      const [burn, cdrls, milestones, profitability] = await Promise.all([
        apiClient.run({
          service: "contract",
          operation: "getContractBurn",
          data: { contractId },
        }),
        apiClient.run({
          service: "contract",
          operation: "getCDRLStatus",
          data: { contractId },
        }),
        apiClient.run({
          service: "contract",
          operation: "getMilestoneProgress",
          data: { contractId },
        }),
        apiClient.run({
          service: "contract",
          operation: "calculateProfitability",
          data: { contractId },
        }),
      ]);

      setContractDetails({ burn, cdrls, milestones, profitability });
    } catch (error) {
      console.error("Failed to load contract details:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  if (!session?.user?.groups?.includes("Operations")) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need Operations role to view contracts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contract Management</h1>
        <p className="text-muted-foreground">
          Monitor contracts, deliverables, and financial performance
        </p>
      </div>

      {/* Contract Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {contracts.map((contract) => (
          <Button
            key={contract.id}
            variant={
              selectedContract?.id === contract.id ? "default" : "outline"
            }
            onClick={() => setSelectedContract(contract)}
            className="flex-shrink-0"
          >
            <div className="text-left">
              <div className="font-medium">{contract.contractNumber}</div>
              <div className="text-xs text-muted-foreground">
                ${(contract.totalValue / 1000000).toFixed(1)}M
              </div>
            </div>
          </Button>
        ))}
      </div>

      {selectedContract && (
        <>
          {/* Contract Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(selectedContract.totalValue / 1000000).toFixed(1)}M
                </div>
                <Progress
                  value={
                    (selectedContract.burnedValue /
                      selectedContract.totalValue) *
                    100
                  }
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {(
                    (selectedContract.burnedValue /
                      selectedContract.totalValue) *
                    100
                  ).toFixed(0)}
                  % burned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Monthly Burn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  $
                  {(
                    contractDetails?.burn?.currentMonthBurn / 1000 || 0
                  ).toFixed(0)}
                  k
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {contractDetails?.burn?.trend || "stable"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedContract.healthScore}%
                </div>
                <Badge
                  variant={
                    selectedContract.healthScore > 80
                      ? "default"
                      : "destructive"
                  }
                  className="mt-2"
                >
                  {selectedContract.healthScore > 80 ? "Healthy" : "At Risk"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Time Remaining</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.floor(
                    (new Date(selectedContract.endDate).getTime() -
                      Date.now()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  days
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ends {new Date(selectedContract.endDate).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contract Details Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="cdrls">
                <TabsList className="w-full justify-start rounded-none border-b">
                  <TabsTrigger value="cdrls">CDRLs</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                </TabsList>

                <div className="p-6">
                  <TabsContent value="cdrls" className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {contractDetails?.cdrls?.summary?.total || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total CDRLs
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {contractDetails?.cdrls?.summary?.completed || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Completed
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {contractDetails?.cdrls?.summary?.pending || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {contractDetails?.cdrls?.summary?.overdue || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Upcoming Deadlines</h4>
                      {contractDetails?.cdrls?.upcoming?.map((cdrl: any) => (
                        <div
                          key={cdrl.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">
                              {cdrl.number}: {cdrl.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cdrl.type}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                cdrl.status === "overdue"
                                  ? "destructive"
                                  : "default"
                              }
                            >
                              {cdrl.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {new Date(cdrl.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="milestones" className="space-y-4">
                    <div className="space-y-3">
                      {contractDetails?.milestones?.milestones?.map(
                        (milestone: any) => (
                          <div
                            key={milestone.id}
                            className="p-4 rounded-lg border"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  ${(milestone.value / 1000).toFixed(0)}k value
                                </p>
                              </div>
                              <Badge
                                variant={
                                  milestone.status === "complete"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {milestone.status}
                              </Badge>
                            </div>
                            <Progress
                              value={milestone.progress || 0}
                              className="mt-3"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {milestone.progress || 0}% complete - Due{" "}
                              {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Profit Margin
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {contractDetails?.profitability?.margin?.toFixed(
                              1
                            ) || 0}
                            %
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Target: 15%
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            $
                            {(
                              contractDetails?.profitability?.revenue /
                                1000000 || 0
                            ).toFixed(1)}
                            M
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            $
                            {(
                              contractDetails?.profitability?.profit / 1000 || 0
                            ).toFixed(0)}
                            k
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {contractDetails?.burn?.recommendations?.map(
                      (rec: any, idx: number) => (
                        <Alert key={idx}>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>{rec.message}</strong>
                            <br />
                            {rec.action}
                          </AlertDescription>
                        </Alert>
                      )
                    )}
                  </TabsContent>

                  <TabsContent value="team">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium">Program Manager</p>
                        <p className="text-muted-foreground">
                          {selectedContract.programManager}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Technical Lead</p>
                        <p className="text-muted-foreground">
                          {selectedContract.technicalLead || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Teams</p>
                        <div className="flex gap-2 mt-1">
                          {selectedContract.teams?.map((team: string) => (
                            <Badge key={team} variant="outline">
                              {team}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default ContractsPage;

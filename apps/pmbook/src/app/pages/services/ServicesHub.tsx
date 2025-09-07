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
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@captify/core/components/ui";
import {
  Plus,
  Ticket,
  Clock,
  DollarSign,
  Star,
  TrendingUp,
  Users,
  CheckCircle,
} from "lucide-react";

export function ServicesHubPage() {
  const { session } = useCaptify();
  const [marketplace, setMarketplace] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    serviceArea: "DevOps",
    type: "request",
    priority: "medium",
    bounty: 0,
  });

  useEffect(() => {
    loadMarketplace();
    loadCatalog();
  }, []);

  const loadMarketplace = async () => {
    try {
      const response = await apiClient.run({
        service: "service",
        operation: "getMarketplace",
        data: { userId: session?.user?.id },
      });
      setMarketplace(response?.data || []);
    } catch (error) {
      console.error("Failed to load marketplace:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const response = await apiClient.run({
        service: "service",
        operation: "getServiceCatalog",
      });
      setCatalog(response?.data || []);
    } catch (error) {
      console.error("Failed to load catalog:", error);
    }
  };

  const createTicket = async () => {
    try {
      await apiClient.run({
        service: "service",
        operation: "createTicket",
        data: {
          ...newTicket,
          requestor: session?.user?.id,
        },
      });
      setShowCreateTicket(false);
      setNewTicket({
        title: "",
        description: "",
        serviceArea: "DevOps",
        type: "request",
        priority: "medium",
        bounty: 0,
      });
      loadMarketplace();
    } catch (error) {
      console.error("Failed to create ticket:", error);
    }
  };

  const claimTicket = async (ticketId: string) => {
    try {
      await apiClient.run({
        service: "service",
        operation: "claimTicket",
        data: {
          ticketId,
          userId: session?.user?.id,
        },
      });
      loadMarketplace();
    } catch (error) {
      console.error("Failed to claim ticket:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">Loading...</div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Services Hub</h1>
          <p className="text-muted-foreground">Internal service marketplace</p>
        </div>
        <Button onClick={() => setShowCreateTicket(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Marketplace Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Available Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketplace?.available?.urgent?.length +
                marketplace?.available?.highBounty?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ${marketplace?.potentialEarnings || 0} potential
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketplace?.myTickets?.assigned?.length || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              In progress
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketplace?.myTickets?.requested?.length || 0}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Ticket className="h-3 w-3 mr-1" />
              Submitted
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leaderboard Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#5</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Star className="h-3 w-3 mr-1" />
              Top performer
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Marketplace */}
      <Card>
        <CardHeader>
          <CardTitle>Service Marketplace</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="available">
            <TabsList>
              <TabsTrigger value="available">Available</TabsTrigger>
              <TabsTrigger value="mytickets">My Tickets</TabsTrigger>
              <TabsTrigger value="catalog">Service Catalog</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-4">
              {marketplace?.available?.urgent?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Badge variant="destructive">Urgent</Badge>
                    High Priority Tickets
                  </h4>
                  <div className="space-y-3">
                    {marketplace.available.urgent.map((ticket: any) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClaim={claimTicket}
                      />
                    ))}
                  </div>
                </div>
              )}

              {marketplace?.available?.highBounty?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    High Bounty
                  </h4>
                  <div className="space-y-3">
                    {marketplace.available.highBounty.map((ticket: any) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClaim={claimTicket}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="mytickets" className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Assigned to Me</h4>
                <div className="space-y-3">
                  {marketplace?.myTickets?.assigned?.map((ticket: any) => (
                    <TicketCard key={ticket.id} ticket={ticket} assigned />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">My Requests</h4>
                <div className="space-y-3">
                  {marketplace?.myTickets?.requested?.map((ticket: any) => (
                    <TicketCard key={ticket.id} ticket={ticket} requested />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="catalog" className="space-y-3">
              {catalog.map((service: any) => (
                <div key={service.id} className="p-4 rounded-lg border">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.service}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{service.serviceArea}</Badge>
                        <Badge variant="outline">{service.complexity}</Badge>
                        <Badge variant="outline">
                          {service.estimatedTime}h
                        </Badge>
                      </div>
                    </div>
                    {service.selfService && <Button size="sm">Request</Button>}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="space-y-3">
                {marketplace?.leaderboard?.map((entry: any, idx: number) => (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl font-bold">#{idx + 1}</div>
                      <div>
                        <p className="font-medium">{entry.userId}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.ticketsResolved} resolved
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">
                          {entry.satisfaction}%
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${entry.earnings} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      {showCreateTicket && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Create Service Ticket</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTicket.title}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, title: e.target.value })
                  }
                  placeholder="Brief description of what you need"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  placeholder="Detailed description and acceptance criteria"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Service Area</label>
                  <Select
                    value={newTicket.serviceArea}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, serviceArea: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DevOps">DevOps</SelectItem>
                      <SelectItem value="DataOps">DataOps</SelectItem>
                      <SelectItem value="PlatformOps">PlatformOps</SelectItem>
                      <SelectItem value="HelpDesk">Help Desk</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value) =>
                      setNewTicket({ ...newTicket, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Bounty (optional)</label>
                <Input
                  type="number"
                  value={newTicket.bounty}
                  onChange={(e) =>
                    setNewTicket({
                      ...newTicket,
                      bounty: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Incentive amount for faster completion"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createTicket} className="flex-1">
                  Create Ticket
                </Button>
                <Button
                  onClick={() => setShowCreateTicket(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TicketCard({ ticket, onClaim, assigned, requested }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{ticket.title}</h4>
          <Badge
            variant={ticket.priority === "critical" ? "destructive" : "default"}
          >
            {ticket.priority}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {ticket.description}
        </p>
        <div className="flex items-center gap-4 mt-2">
          <Badge variant="outline">{ticket.serviceArea}</Badge>
          {ticket.bounty > 0 && (
            <div className="flex items-center text-sm">
              <DollarSign className="h-3 w-3" />
              {ticket.bounty}
            </div>
          )}
          {ticket.sla && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              SLA: {ticket.sla}h
            </div>
          )}
        </div>
      </div>
      {!assigned && !requested && onClaim && (
        <Button onClick={() => onClaim(ticket.id)} size="sm">
          Claim
        </Button>
      )}
      {assigned && <Badge variant="default">In Progress</Badge>}
      {requested && <Badge variant="outline">{ticket.status}</Badge>}
    </div>
  );
}

export default ServicesHubPage;

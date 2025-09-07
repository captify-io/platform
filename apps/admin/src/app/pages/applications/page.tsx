"use client";

/**
 * Applications Catalog Page
 * Browse and request access to available applications
 */

import React, { useState } from "react";
import { useApplicationAccess } from "@captify/core/hooks";
import { Button } from "@captify/core/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Input } from "@captify/core/ui";
import { Textarea } from "@captify/core/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@captify/core/ui";
import { Search, Package, Lock, Unlock, Clock } from "lucide-react";
import type { App } from "../../../types";

export default function ApplicationsPage() {
  const { allApps, myApps, loading, error, requestAccess, hasAccess, hasPendingRequest } = useApplicationAccess();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [justification, setJustification] = useState("");
  const [requesting, setRequesting] = useState(false);

  const filteredApps = allApps.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRequestAccess = async () => {
    if (!selectedApp || !justification.trim()) return;
    
    setRequesting(true);
    const success = await requestAccess(selectedApp.id, justification);
    setRequesting(false);
    
    if (success) {
      setSelectedApp(null);
      setJustification("");
    }
  };

  const getAppStatus = (app: App) => {
    if (hasAccess(app.id)) {
      return { label: "Active", icon: Unlock, color: "bg-green-500" };
    }
    if (hasPendingRequest(app.id)) {
      return { label: "Pending", icon: Clock, color: "bg-yellow-500" };
    }
    return { label: "Locked", icon: Lock, color: "bg-gray-500" };
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Application Catalog</h1>
        <p className="text-muted-foreground">
          Browse available applications and request access
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredApps.map((app) => {
          const status = getAppStatus(app);
          const StatusIcon = status.icon;
          
          return (
            <Card key={app.id} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-2 h-full ${status.color}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                  </div>
                  <Badge variant={status.label === "Active" ? "default" : "secondary"}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {app.category && (
                    <Badge variant="outline">{app.category}</Badge>
                  )}
                  {app.visibility && (
                    <Badge variant="outline">{app.visibility}</Badge>
                  )}
                </div>
                
                {status.label === "Locked" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedApp(app)}
                      >
                        Request Access
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Access to {app.name}</DialogTitle>
                        <DialogDescription>
                          Please provide a business justification for accessing this application.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea
                          placeholder="Enter your business justification..."
                          value={justification}
                          onChange={(e) => setJustification(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(null);
                            setJustification("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleRequestAccess}
                          disabled={!justification.trim() || requesting}
                        >
                          {requesting ? "Requesting..." : "Submit Request"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                
                {status.label === "Pending" && (
                  <Button className="w-full" disabled variant="secondary">
                    <Clock className="h-4 w-4 mr-2" />
                    Request Pending
                  </Button>
                )}
                
                {status.label === "Active" && (
                  <Button className="w-full" variant="secondary">
                    <Unlock className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredApps.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "No applications found matching your search" : "No applications available"}
          </p>
        </div>
      )}
    </div>
  );
}
"use client";

/**
 * My Apps Dashboard Page
 * View and manage your application access
 */

import React, { useState, useEffect } from "react";
import { useApplicationAccess } from "@captify/core/hooks";
import { Button } from "@captify/core/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@captify/core/ui";
import { Badge } from "@captify/core/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@captify/core/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@captify/core/ui";
import { Package, Clock, CheckCircle, XCircle, ExternalLink, Shield } from "lucide-react";
import type { UserAccessProfile } from "../../../types";

export default function MyAppsPage() {
  const { myApps, pendingRequests, loading, error, getAccessProfile } = useApplicationAccess();
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [accessProfile, setAccessProfile] = useState<UserAccessProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (selectedApp) {
      setLoadingProfile(true);
      getAccessProfile(selectedApp).then(profile => {
        setAccessProfile(profile);
        setLoadingProfile(false);
      });
    }
  }, [selectedApp, getAccessProfile]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your applications...</p>
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
        <h1 className="text-3xl font-bold mb-2">My Applications</h1>
        <p className="text-muted-foreground">
          Manage your application access and permissions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Apps</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApps.length}</div>
            <p className="text-xs text-muted-foreground">Applications you can access</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myApps.length * 5}
            </div>
            <p className="text-xs text-muted-foreground">Across all applications</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Applications</TabsTrigger>
          <TabsTrigger value="pending">Pending Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {myApps.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myApps.map((app) => (
                <Card key={app.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedApp(app.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{app.name}</CardTitle>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Granted: {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  You don't have access to any applications yet.
                </p>
                <Button className="mt-4" variant="outline">
                  Browse Application Catalog
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.appId}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {request.justification}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No pending access requests.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Access Profile Modal */}
      {selectedApp && accessProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setSelectedApp(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" 
                onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Access Profile</CardTitle>
              <CardDescription>Your permissions and roles for this application</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {accessProfile.roles.map((roleId) => (
                        <Badge key={roleId} variant="outline">
                          {roleId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Permissions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {accessProfile.permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Data Access</h3>
                    <Badge>{accessProfile.dataAccess}</Badge>
                  </div>
                  
                  {accessProfile.expiresAt && (
                    <div>
                      <h3 className="font-semibold mb-2">Expires</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(accessProfile.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
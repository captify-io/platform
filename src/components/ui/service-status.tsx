/**
 * Service Status Component
 * Displays connection health and status for external services
 */

"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useService } from "@/lib/services/hooks";

interface ServiceStatusProps {
  serviceId: string;
  showDetails?: boolean;
}

export function ServiceStatus({
  serviceId,
  showDetails = false,
}: ServiceStatusProps) {
  const { connection, isHealthy, isLoading, error, testConnection } =
    useService(serviceId);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await testConnection();
    setTesting(false);
  };

  const getStatusIcon = () => {
    if (isLoading || testing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }

    if (error) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    if (isHealthy === "healthy") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }

    if (isHealthy === "unhealthy") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }

    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusColor = () => {
    if (error) return "bg-red-100 text-red-800";
    if (isHealthy === "healthy") return "bg-green-100 text-green-800";
    if (isHealthy === "unhealthy") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  if (!connection) {
    return (
      <div className="flex items-center space-x-2">
        <XCircle className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Service not configured</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {getStatusIcon()}
      <span className="text-sm font-medium">{connection.name}</span>
      <Badge variant="secondary" className={getStatusColor()}>
        {error ? "Error" : isHealthy}
      </Badge>

      {showDetails && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testing}
          className="cursor-pointer"
        >
          {testing ? "Testing..." : "Test"}
        </Button>
      )}

      {showDetails && error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

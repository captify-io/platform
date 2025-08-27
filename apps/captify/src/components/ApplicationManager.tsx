import { useState, useEffect } from "react";

interface Application {
  id: string;
  name: string;
  version: string;
  status: string;
  description: string;
}

export function ApplicationManager() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("/api/captify/applications");
      const result = await response.json();

      if (result.success) {
        setApplications(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Applications</h2>
          <p className="text-muted-foreground">Manage installed applications</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
          Install Application
        </button>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="p-6">
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ApplicationCardProps {
  application: Application;
}

function ApplicationCard({ application }: ApplicationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary text-xl">📱</span>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{application.name}</h3>
          <p className="text-sm text-muted-foreground">
            {application.description}
          </p>
          <p className="text-xs text-muted-foreground">
            v{application.version}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            application.status
          )}`}
        >
          {application.status}
        </span>
        <button className="text-sm text-primary hover:underline">
          Configure
        </button>
        <button className="text-sm text-muted-foreground hover:text-foreground">
          ⋮
        </button>
      </div>
    </div>
  );
}

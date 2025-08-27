import { useState, useEffect } from "react";
import { CaptifyClient } from "@captify/client";
import { ApplicationManager } from "./ApplicationManager";
import { UserManager } from "./UserManager";

interface DashboardStats {
  totalApplications: number;
  activeUsers: number;
  totalApiCalls: number;
  systemHealth: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Initialize the Captify client
  const client = new CaptifyClient({
    appId: "captify",
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const testAPI = async () => {
    try {
      console.log("Testing captify API endpoint using CaptifyClient...");

      // Test the simple test endpoint first using the client
      const testResult = await client.get({
        resource: "test",
        operation: "ping",
      });

      console.log("Test API response:", testResult);

      if (testResult.success) {
        console.log("✅ Test API endpoint working!");
      } else {
        console.error("❌ Test API returned error:", testResult);
      }
    } catch (error) {
      console.error("❌ Failed to call test API:", error);
    }
  };

  const fetchDashboardStats = async () => {
    // First test the API to make sure it's working
    await testAPI();

    try {
      // This will call the captify API endpoint using the client
      const result = await client.get({
        resource: "dashboard",
        operation: "stats",
      });

      console.log("Dashboard stats API response:", result);

      if (result.success) {
        setStats(result.data);
      } else {
        console.error("API returned error:", result);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
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
      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", label: "Overview" },
            { id: "applications", label: "Applications" },
            { id: "users", label: "Users" },
            { id: "settings", label: "Settings" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Platform Overview
            </h2>
            <p className="text-muted-foreground">
              Monitor and manage your Captify platform applications and users.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Applications"
              value={stats?.totalApplications || 0}
              icon="📱"
              description="Installed apps"
            />
            <StatCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              icon="👥"
              description="Current users"
            />
            <StatCard
              title="API Calls"
              value={stats?.totalApiCalls || 0}
              icon="🔄"
              description="This month"
            />
            <StatCard
              title="System Health"
              value={stats?.systemHealth || "Unknown"}
              icon="💚"
              description="Current status"
              isText
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <ActivityItem
                action="Application installed"
                target="VeriPicks v1.0.0"
                time="2 hours ago"
              />
              <ActivityItem
                action="User logged in"
                target="admin@captify.com"
                time="4 hours ago"
              />
              <ActivityItem
                action="Configuration updated"
                target="System settings"
                time="1 day ago"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "applications" && <ApplicationManager />}
      {activeTab === "users" && <UserManager />}

      {activeTab === "settings" && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Platform Settings</h3>
          <p className="text-muted-foreground">
            System configuration and settings will be available here.
          </p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  description: string;
  isText?: boolean;
}

function StatCard({ title, value, icon, description, isText }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">
            {isText
              ? value
              : typeof value === "number"
              ? value.toLocaleString()
              : value}
          </p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  action: string;
  target: string;
  time: string;
}

function ActivityItem({ action, target, time }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{action}</p>
        <p className="text-xs text-muted-foreground">{target}</p>
      </div>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  );
}

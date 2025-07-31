"use client";

import { useEffect, useState } from "react";
import { useApps } from "@/context/AppsContext";
import { Application, APPLICATION_CATEGORIES } from "@/types/application";
import { ApplicationLayout } from "@/components/layout/ApplicationLayout";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Users,
  Clock,
  MessageSquare,
  Settings,
  BarChart3,
} from "lucide-react";

interface AppPageProps {
  params: { alias: string };
}

export default function AppPage({ params }: AppPageProps) {
  const { alias } = params;
  const { getApplicationByAlias, markAsRecent, favoriteApps, toggleFavorite } =
    useApps();
  const [application, setApplication] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const app = getApplicationByAlias(alias);
    if (app) {
      setApplication(app);
      markAsRecent(alias);
    }
  }, [alias, getApplicationByAlias, markAsRecent]);

  if (!application) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Application Not Found
          </h1>
          <p className="text-gray-600">
            The application "{alias}" could not be found.
          </p>
        </div>
      </div>
    );
  }

  const isFavorite = favoriteApps.includes(alias);
  const categoryInfo = APPLICATION_CATEGORIES[application.metadata.category];

  return (
    <ApplicationLayout
      applicationId={application.metadata.alias}
      applicationName={application.metadata.name}
      agentId={application.aiAgent.agentId}
      chatWelcomeMessage={`Hello! I'm the ${application.metadata.name} AI assistant. ${application.metadata.description}. How can I help you today?`}
      chatPlaceholder={`Ask about ${application.metadata.name.toLowerCase()}...`}
    >
      <div className="flex h-full">
        {/* Left Sidebar - Application Navigation */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* App Header */}
          <div className="p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3 mb-4">
              <div
                className={`${application.metadata.color} p-2 rounded-lg text-white`}
              >
                <DynamicIcon
                  name={application.metadata.icon}
                  className="h-6 w-6"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {application.metadata.name}
                </h1>
                <p className="text-sm text-gray-500">{categoryInfo?.label}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  application.metadata.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {application.metadata.status}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(alias)}
                className={isFavorite ? "text-yellow-500" : "text-gray-400"}
              >
                <Star
                  className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {application.ui.navigation.map((item) => (
                <button
                  key={item.id}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <DynamicIcon name={item.icon} className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{application.usage.totalUsers} users</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4" />
                <span>{application.usage.totalSessions} sessions</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span>
                  {application.usage.userRatings.average.toFixed(1)} rating
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Content Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col"
          >
            <TabsList className="justify-start border-b border-gray-200 bg-white px-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="chat">Chat Interface</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              <TabsContent value="overview" className="p-6 space-y-6">
                {/* Application Overview */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    About This Application
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {application.metadata.longDescription ||
                      application.metadata.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {application.usage.totalSessions.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total Sessions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {application.usage.totalUsers.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          application.usage.averageSessionDuration / 60
                        )}
                        m
                      </div>
                      <div className="text-sm text-gray-500">Avg. Session</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {application.usage.userRatings.average.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">User Rating</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Capabilities</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {application.aiAgent.capabilities
                          .filter((cap) => cap.enabled)
                          .map((capability) => (
                            <div
                              key={capability.id}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-medium">
                                {capability.name}
                              </span>
                              <span className="text-gray-500">
                                - {capability.description}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.metadata.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Sample Queries */}
                {application.demoData?.sampleQueries && (
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Try These Sample Queries
                    </h2>
                    <div className="space-y-3">
                      {application.demoData.sampleQueries.map(
                        (query, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => setActiveTab("chat")}
                          >
                            <p className="text-sm">{query}</p>
                          </div>
                        )
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="chat" className="p-6">
                <Card className="p-6 h-96">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Chat Interface
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {application.ui.chatConfig?.welcomeMessage ||
                          "Chat interface will be implemented here"}
                      </p>
                      <Button>Start Conversation</Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="p-6">
                <Card className="p-6 h-96">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Analytics Dashboard
                      </h3>
                      <p className="text-gray-500">
                        Usage analytics and insights will be displayed here
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="p-6">
                <Card className="p-6 h-96">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Application Settings
                      </h3>
                      <p className="text-gray-500">
                        Configuration options and preferences will be available
                        here
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Sidebar - Chat Panel (if chat layout) */}
        {application.ui.layout === "chat" && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-500 mt-1">
                Powered by {application.aiAgent.model}
              </p>
            </div>

            <div className="flex-1 p-4">
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Chat interface coming soon</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ApplicationLayout>
  );
}

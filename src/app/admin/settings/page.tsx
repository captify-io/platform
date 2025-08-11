"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Save,
  RefreshCw,
  Bell,
  Palette,
  Globe,
  Database,
  Key,
  Shield,
} from "lucide-react";

export default function SettingsPage() {
  const [systemName, setSystemName] = useState("Captify Platform");
  const [systemDescription, setSystemDescription] = useState(
    "AI-powered application platform"
  );
  const [supportEmail, setSupportEmail] = useState("support@captify.com");
  const [timezone, setTimezone] = useState("UTC");
  const [theme, setTheme] = useState("system");

  const handleSave = () => {
    // Save settings logic here
    alert("Settings saved successfully!");
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="mt-2 text-muted-foreground">
                Configure system settings and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic system information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name</Label>
                    <Input
                      id="systemName"
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="systemDescription">System Description</Label>
                  <Textarea
                    id="systemDescription"
                    value={systemDescription}
                    onChange={(e) => setSystemDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Default Language</Label>
                    <Select defaultValue="en">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Color Scheme</h4>
                  <div className="grid grid-cols-5 gap-3">
                    {["blue", "green", "purple", "orange", "red"].map(
                      (color) => (
                        <div
                          key={color}
                          className={`w-12 h-12 rounded-lg border-2 border-muted cursor-pointer hover:border-primary bg-${color}-500`}
                          title={`${color} theme`}
                        />
                      )
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Layout Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Compact Navigation
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Enabled
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Sidebar Auto-collapse
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Disabled
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when notifications are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Email Notifications</h4>
                  <div className="space-y-3">
                    {[
                      "System alerts and warnings",
                      "User registration and changes",
                      "Application deployments",
                      "Security events",
                      "Weekly usage reports",
                    ].map((notification) => (
                      <div
                        key={notification}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{notification}</span>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">In-App Notifications</h4>
                  <div className="space-y-3">
                    {[
                      "Real-time alerts",
                      "System maintenance notices",
                      "Feature updates",
                    ].map((notification) => (
                      <div
                        key={notification}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{notification}</span>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      defaultValue="30"
                      min="5"
                      max="480"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passwordExpiry">
                      Password Expiry (days)
                    </Label>
                    <Input
                      id="passwordExpiry"
                      type="number"
                      defaultValue="90"
                      min="30"
                      max="365"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Authentication Policies
                  </h4>
                  <div className="space-y-3">
                    {[
                      "Require multi-factor authentication",
                      "Enforce strong passwords",
                      "Lock accounts after failed attempts",
                      "Enable SSO integration",
                    ].map((policy) => (
                      <div
                        key={policy}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{policy}</span>
                        <Button variant="outline" size="sm">
                          Enabled
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Integrations
                </CardTitle>
                <CardDescription>
                  Configure external service integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">AWS Services</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Bedrock</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        AI model access
                      </p>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">DynamoDB</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        Database storage
                      </p>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Authentication Providers
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">Active Directory</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        Enterprise SSO
                      </p>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium mb-2">OAuth 2.0</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        External authentication
                      </p>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Advanced Settings
                </CardTitle>
                <CardDescription>
                  Advanced system configuration and maintenance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">System Maintenance</h4>
                  <div className="space-y-3">
                    <Button variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear Application Cache
                    </Button>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Optimize Database
                    </Button>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      Rotate API Keys
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Debug Options</h4>
                  <div className="space-y-3">
                    {[
                      "Enable debug logging",
                      "Show performance metrics",
                      "Enable API request tracing",
                    ].map((option) => (
                      <div
                        key={option}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm">{option}</span>
                        <Button variant="outline" size="sm">
                          Disabled
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Data Management</h4>
                  <div className="space-y-3">
                    <Button variant="outline">Export System Data</Button>
                    <Button variant="outline">Import Configuration</Button>
                    <Button variant="destructive">Reset to Defaults</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

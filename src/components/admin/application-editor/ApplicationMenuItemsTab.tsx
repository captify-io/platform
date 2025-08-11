"use client";

import { useState, useEffect } from "react";
import { ApplicationEntity } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Menu,
  Bot,
  GripVertical,
  Eye,
  EyeOff,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  order: number;
  enabled: boolean;
  category: string;
}

interface ApplicationMenuItemsTabProps {
  application: ApplicationEntity;
  onUpdate: (application: ApplicationEntity) => void;
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export function ApplicationMenuItemsTab({
  onUnsavedChanges,
}: ApplicationMenuItemsTabProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    {
      id: "1",
      title: "Dashboard",
      description: "Overview and analytics for your application",
      icon: "BarChart3",
      href: "/dashboard",
      order: 1,
      enabled: true,
      category: "core",
    },
    {
      id: "2",
      title: "Data Analysis",
      description: "Analyze your data with AI assistance",
      icon: "TrendingUp",
      href: "/analysis",
      order: 2,
      enabled: true,
      category: "analytics",
    },
    {
      id: "3",
      title: "Reports",
      description: "Generate and view reports",
      icon: "FileText",
      href: "/reports",
      order: 3,
      enabled: false,
      category: "reporting",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    title: "",
    description: "",
    icon: "Circle",
    href: "",
    category: "custom",
  });

  // Track changes
  useEffect(() => {
    // In a real implementation, you'd compare with original menu items from the application
    onUnsavedChanges(true);
  }, [menuItems, onUnsavedChanges]);

  const handleMenuItemUpdate = (
    id: string,
    field: string,
    value: string | boolean | number
  ) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
    setError(null);
    setSuccess(null);
  };

  const handleAddMenuItem = () => {
    if (!newMenuItem.title.trim() || !newMenuItem.href.trim()) {
      setError("Title and URL are required");
      return;
    }

    const newId = Math.max(...menuItems.map((item) => parseInt(item.id))) + 1;
    const newItem: MenuItem = {
      id: newId.toString(),
      title: newMenuItem.title,
      description: newMenuItem.description,
      icon: newMenuItem.icon,
      href: newMenuItem.href,
      order: menuItems.length + 1,
      enabled: true,
      category: newMenuItem.category,
    };

    setMenuItems((prev) => [...prev, newItem]);
    setNewMenuItem({
      title: "",
      description: "",
      icon: "Circle",
      href: "",
      category: "custom",
    });
    setShowAddDialog(false);
    setError(null);
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiGeneratedItems: MenuItem[] = [
        {
          id: (menuItems.length + 1).toString(),
          title: "AI Assistant",
          description: "Chat with your application's AI assistant",
          icon: "Bot",
          href: "/chat",
          order: menuItems.length + 1,
          enabled: true,
          category: "ai",
        },
        {
          id: (menuItems.length + 2).toString(),
          title: "Smart Insights",
          description: "AI-powered insights and recommendations",
          icon: "Brain",
          href: "/insights",
          order: menuItems.length + 2,
          enabled: true,
          category: "ai",
        },
      ];

      setMenuItems((prev) => [...prev, ...aiGeneratedItems]);
      setSuccess("AI-generated menu items added successfully!");

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to generate menu items:", error);
      setError("Failed to generate menu items with AI");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, you'd save the menu items to the database
      // For now, we'll just update the local state
      setSuccess("Menu items saved successfully!");
      onUnsavedChanges(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("Failed to save menu items:", error);
      setError(
        error instanceof Error ? error.message : "Failed to save menu items"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const moveMenuItem = (id: string, direction: "up" | "down") => {
    setMenuItems((prev) => {
      const items = [...prev];
      const currentIndex = items.findIndex((item) => item.id === id);

      if (direction === "up" && currentIndex > 0) {
        [items[currentIndex], items[currentIndex - 1]] = [
          items[currentIndex - 1],
          items[currentIndex],
        ];
      } else if (direction === "down" && currentIndex < items.length - 1) {
        [items[currentIndex], items[currentIndex + 1]] = [
          items[currentIndex + 1],
          items[currentIndex],
        ];
      }

      // Update order values
      items.forEach((item, index) => {
        item.order = index + 1;
      });

      return items;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Menu Items</h2>
          <p className="text-muted-foreground">
            Configure the navigation menu items for this application
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleGenerateWithAI}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Bot className="h-4 w-4 mr-2" />
                Generate with AI
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddDialog(!showAddDialog)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-destructive mr-2" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
          <div className="flex items-center">
            <div className="h-4 w-4 bg-green-500 rounded-full mr-2" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {showAddDialog && (
        <Card>
          <CardHeader>
            <CardTitle>Add Menu Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-title">Title</Label>
                <Input
                  id="new-title"
                  value={newMenuItem.title}
                  onChange={(e) =>
                    setNewMenuItem((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Menu item title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-href">URL</Label>
                <Input
                  id="new-href"
                  value={newMenuItem.href}
                  onChange={(e) =>
                    setNewMenuItem((prev) => ({
                      ...prev,
                      href: e.target.value,
                    }))
                  }
                  placeholder="/path-to-page"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  value={newMenuItem.description}
                  onChange={(e) =>
                    setNewMenuItem((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of this menu item"
                  className="mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="new-category">Category</Label>
                <Select
                  value={newMenuItem.category}
                  onValueChange={(value) =>
                    setNewMenuItem((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMenuItem}>Add Menu Item</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Menu className="h-5 w-5 mr-2" />
            Application Menu Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {menuItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveMenuItem(item.id, "up")}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveMenuItem(item.id, "down")}
                    disabled={index === menuItems.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    ↓
                  </Button>
                </div>

                <GripVertical className="h-4 w-4 text-muted-foreground" />

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor={`title-${item.id}`} className="text-xs">
                      Title
                    </Label>
                    <Input
                      id={`title-${item.id}`}
                      value={item.title}
                      onChange={(e) =>
                        handleMenuItemUpdate(item.id, "title", e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`description-${item.id}`}
                      className="text-xs"
                    >
                      Description
                    </Label>
                    <Input
                      id={`description-${item.id}`}
                      value={item.description}
                      onChange={(e) =>
                        handleMenuItemUpdate(
                          item.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`href-${item.id}`} className="text-xs">
                      URL
                    </Label>
                    <Input
                      id={`href-${item.id}`}
                      value={item.href}
                      onChange={(e) =>
                        handleMenuItemUpdate(item.id, "href", e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        item.category === "core" ? "default" : "secondary"
                      }
                    >
                      {item.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleMenuItemUpdate(item.id, "enabled", !item.enabled)
                    }
                    className={`h-8 w-8 p-0 ${
                      item.enabled ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {item.enabled ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMenuItem(item.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {menuItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Menu className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No menu items configured for this application.</p>
                <p className="text-sm">
                  Add your first menu item to get started.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

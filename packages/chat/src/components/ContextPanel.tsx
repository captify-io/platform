"use client";

import { useState, useRef } from "react";
import {
  Button,
  Input,
  Card,
  CardContent,
  Separator,
  ScrollArea,
} from "@captify/core";
import {
  Upload,
  Database,
  FileText,
  Cloud,
  Layers,
  Plus,
  X,
  GitBranch,
  LucideIcon,
} from "lucide-react";

interface DataSource {
  id: string;
  name: string;
  type: "file" | "aws" | "blade" | "data-product" | "mcp";
  status: "active" | "inactive" | "pending";
  description?: string;
  icon: LucideIcon;
}

export function ContextPanel() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "kb-1",
      name: "App Knowledge Base",
      type: "file",
      status: "active",
      description: "Core application documentation",
      icon: FileText,
    },
  ]);
  const [searchQuery] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const newDataSource: DataSource = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: "file",
          status: "pending",
          description: `${file.type || "unknown type"}`,
          icon: FileText,
        };
        setDataSources((prev) => [...prev, newDataSource]);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setShowAddMenu(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const newDataSource: DataSource = {
          id: `file-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: "file",
          status: "pending",
          description: `${file.type || "unknown type"}`,
          icon: FileText,
        };
        setDataSources((prev) => [...prev, newDataSource]);
      });
    }
  };

  const addAWSService = (service: string) => {
    const newDataSource: DataSource = {
      id: `aws-${Date.now()}-${Math.random()}`,
      name: `AWS ${service}`,
      type: "aws",
      status: "pending",
      description: `AWS ${service} data source`,
      icon: Cloud,
    };
    setDataSources((prev) => [...prev, newDataSource]);
    setShowAddMenu(false);
  };

  const addBLADE = () => {
    const newDataSource: DataSource = {
      id: `blade-${Date.now()}-${Math.random()}`,
      name: "BLADE Data Sources",
      type: "blade",
      status: "pending",
      description: "Multi-source data drill-down",
      icon: Layers,
    };
    setDataSources((prev) => [...prev, newDataSource]);
    setShowAddMenu(false);
  };

  const addDataProduct = (productName: string) => {
    const newDataSource: DataSource = {
      id: `dp-${Date.now()}-${Math.random()}`,
      name: productName,
      type: "data-product",
      status: "pending",
      description: "Data product integration",
      icon: Database,
    };
    setDataSources((prev) => [...prev, newDataSource]);
    setShowAddMenu(false);
  };

  const addTitanMCP = () => {
    const newDataSource: DataSource = {
      id: `mcp-${Date.now()}-${Math.random()}`,
      name: "TITAN MCP",
      type: "mcp",
      status: "pending",
      description: "Model Context Protocol",
      icon: GitBranch,
    };
    setDataSources((prev) => [...prev, newDataSource]);
    setShowAddMenu(false);
  };

  const removeDataSource = (id: string) => {
    if (id === "kb-1") return; // Prevent removal of locked knowledge base
    setDataSources((prev) => prev.filter((ds) => ds.id !== id));
  };

  const getStatusBadge = (status: DataSource["status"]) => {
    if (status === "active") {
      return <div className="w-2 h-2 bg-green-500 rounded-full" />;
    }
    if (status === "pending") {
      return (
        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
      );
    }
    return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
  };

  const getTypeIcon = (type: DataSource["type"]) => {
    const icons = {
      file: FileText,
      aws: Cloud,
      blade: Layers,
      "data-product": Database,
      mcp: GitBranch,
    };
    const Icon = icons[type];
    return <Icon className="w-4 h-4" />;
  };

  const filteredDataSources = dataSources.filter(
    (ds) =>
      ds?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds?.type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Context</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="h-7 px-2"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
      </div>

      {/* Add Menu */}
      {showAddMenu && (
        <Card className="p-0">
          <CardContent className="p-3 space-y-3">
            {/* File Upload */}
            <div
              className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Upload File</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.json,.xlsx,.pptx"
            />

            <Separator />

            {/* AWS Services */}
            <div className="space-y-2">
              <p className="text-xs font-medium">AWS Services</p>
              <div className="grid grid-cols-2 gap-1">
                {["S3", "Athena", "Glue", "Neptune"].map((service) => (
                  <Button
                    key={service}
                    size="sm"
                    variant="ghost"
                    onClick={() => addAWSService(service)}
                    className="h-7 text-xs justify-start"
                  >
                    <Cloud className="w-3 h-3 mr-1" />
                    {service}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Other Sources */}
            <div className="space-y-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={addBLADE}
                className="w-full h-7 text-xs justify-start"
              >
                <Layers className="w-3 h-3 mr-1" />
                BLADE
              </Button>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Data product..."
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      addDataProduct(e.currentTarget.value.trim());
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Database className="w-3 h-3 text-muted-foreground" />
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={addTitanMCP}
                className="w-full h-7 text-xs justify-start"
              >
                <GitBranch className="w-3 h-3 mr-1" />
                TITAN MCP
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Sources List */}
      <div className="flex-1 flex flex-col min-h-0">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Data Sources ({filteredDataSources.length})
        </p>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-3">
              {filteredDataSources.map((dataSource) => (
                <Card key={dataSource.id} className="p-0">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() =>
                          console.log(`Selected: ${dataSource.name}`)
                        }
                      >
                        {getTypeIcon(dataSource.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-medium truncate">
                              {dataSource.name}
                            </p>
                            {getStatusBadge(dataSource.status)}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {dataSource.description}
                          </p>
                        </div>
                      </div>
                      {dataSource.id !== "kb-1" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeDataSource(dataSource.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive ml-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredDataSources.length === 0 && (
                <div className="text-center py-6">
                  <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    No data sources
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

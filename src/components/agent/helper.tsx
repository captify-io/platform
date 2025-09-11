/**
 * Agent Helper Panel Component
 * Right panel for document upload, data sources, agent settings, sharing, etc.
 */

"use client";

import React, { useState } from 'react';
import { useAgent } from './index';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { 
  Upload,
  Database,
  Settings,
  Share2,
  FileText,
  Image,
  Code2,
  Brain,
  Zap,
  Download,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Palette
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '../ui/tooltip';

export interface HelperPanelProps {
  className?: string;
}

export function HelperPanel({ className }: HelperPanelProps) {
  const {
    currentThread,
    settings,
    tokenUsage,
    updateSettings,
  } = useAgent();

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);

  // File upload handling
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => {
      const supportedTypes = [
        'text/plain',
        'text/markdown',
        'text/csv',
        'application/json',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
      ];
      return supportedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Settings handlers
  const handleModelChange = (model: string) => {
    updateSettings({ model });
  };

  const handleProviderChange = (provider: 'openai' | 'anthropic' | 'bedrock') => {
    updateSettings({ provider });
  };

  const handleTemperatureChange = (temperature: number[]) => {
    updateSettings({ temperature: temperature[0] });
  };

  const handleMaxTokensChange = (maxTokens: number[]) => {
    updateSettings({ maxTokens: maxTokens[0] });
  };

  const handleSystemPromptChange = (systemPrompt: string) => {
    updateSettings({ systemPrompt });
  };

  // Share conversation
  const handleShareConversation = async () => {
    if (!currentThread) return;
    
    // Generate shareable link
    const shareId = `share_${currentThread.id}_${Date.now()}`;
    setShareUrl(`${window.location.origin}/share/${shareId}`);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Export conversation
  const handleExportConversation = () => {
    if (!currentThread) return;

    const exportData = {
      title: currentThread.title,
      messages: currentThread.messages,
      settings: currentThread.settings,
      createdAt: currentThread.createdAt,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentThread.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Data source options
  const dataSources = [
    { id: 'vector-db', name: 'Vector Database', icon: Database, status: 'connected' },
    { id: 's3-bucket', name: 'S3 Documents', icon: FileText, status: 'available' },
    { id: 'confluence', name: 'Confluence', icon: FileText, status: 'disabled' },
    { id: 'github', name: 'GitHub Repos', icon: Code2, status: 'available' },
  ];

  const modelOptions = {
    openai: [
      { value: 'gpt-4o', label: 'GPT-4o', description: 'Most capable model' },
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Faster, more economical' },
      { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and affordable' },
    ],
    anthropic: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Most capable' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Fast and efficient' },
    ],
    bedrock: [
      { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet', description: 'Bedrock model' },
      { value: 'amazon.titan-text-express-v1', label: 'Titan Text Express', description: 'AWS model' },
    ],
  };

  return (
    <div className={cn("flex flex-col h-full bg-background border-l", className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Assistant
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="files" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Document Upload
                  </CardTitle>
                  <CardDescription>
                    Upload files to enhance conversations with context
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                      dragOver ? "border-primary bg-primary/10" : "border-muted-foreground/25"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drop files here or click to browse
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      id="file-upload"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        Choose Files
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports PDF, TXT, MD, CSV, JSON, Images (max 10MB)
                    </p>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Uploaded Files</Label>
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)}KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(index)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Sources Tab */}
            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Data Sources
                  </CardTitle>
                  <CardDescription>
                    Connect and manage data sources for enhanced AI capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <source.icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{source.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {source.status}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={source.status === 'connected' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {source.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Data Source
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Accordion type="single" collapsible defaultValue="model">
                <AccordionItem value="model">
                  <AccordionTrigger>Model Configuration</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select 
                        value={settings.provider} 
                        onValueChange={(value: 'openai' | 'anthropic' | 'bedrock') => handleProviderChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="bedrock">AWS Bedrock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Select value={settings.model} onValueChange={handleModelChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {modelOptions[settings.provider]?.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              <div>
                                <div className="font-medium">{model.label}</div>
                                <div className="text-xs text-muted-foreground">{model.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="parameters">
                  <AccordionTrigger>Parameters</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Temperature</Label>
                        <span className="text-sm text-muted-foreground">{settings.temperature}</span>
                      </div>
                      <Slider
                        value={[settings.temperature]}
                        onValueChange={handleTemperatureChange}
                        max={2}
                        min={0}
                        step={0.1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Controls randomness. Lower = more focused, Higher = more creative
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Max Tokens</Label>
                        <span className="text-sm text-muted-foreground">{settings.maxTokens}</span>
                      </div>
                      <Slider
                        value={[settings.maxTokens]}
                        onValueChange={handleMaxTokensChange}
                        max={8000}
                        min={100}
                        step={100}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum length of AI responses
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="prompt">
                  <AccordionTrigger>System Prompt</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Custom Instructions</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                        >
                          {showSystemPrompt ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Enter custom system prompt..."
                        value={settings.systemPrompt || ''}
                        onChange={(e) => handleSystemPromptChange(e.target.value)}
                        className="min-h-[100px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Customize how the AI behaves and responds
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="usage">
                  <AccordionTrigger>Usage & Limits</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Monthly Usage</Label>
                          <Badge variant="outline">
                            {Math.round((tokenUsage.total / tokenUsage.limit) * 100)}%
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all" 
                            style={{ 
                              width: `${Math.min((tokenUsage.total / tokenUsage.limit) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{tokenUsage.total.toLocaleString()} tokens used</span>
                          <span>{tokenUsage.limit.toLocaleString()} limit</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold">{tokenUsage.input.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Input Tokens</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                          <div className="text-lg font-semibold">{tokenUsage.output.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Output Tokens</div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Conversation
                  </CardTitle>
                  <CardDescription>
                    Share this conversation with others or export for later use
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!currentThread ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active conversation to share
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Button 
                          onClick={handleShareConversation} 
                          className="w-full"
                          disabled={!currentThread}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Create Share Link
                        </Button>
                        
                        {shareUrl && (
                          <div className="flex gap-2">
                            <Input 
                              value={shareUrl} 
                              readOnly 
                              className="text-xs"
                            />
                            <Button size="sm" variant="outline" onClick={copyShareUrl}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" asChild>
                              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <Button 
                          variant="outline" 
                          onClick={handleExportConversation}
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export as JSON
                        </Button>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Share links expire after 30 days</p>
                        <p>• Exported files contain full conversation history</p>
                        <p>• Shared conversations are read-only</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
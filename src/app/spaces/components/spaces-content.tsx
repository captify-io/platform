"use client";

/**
 * Spaces Content Area
 * Central content area that displays different views based on sidebar selection
 * Role-aware content rendering using PageContext for TopNavigation
 */

import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, usePageContext } from '@captify-io/core';
import { EmptyState } from '@captify-io/core/components/spaces';
import {
  CheckSquare,
  BookOpen,
  FileText,
  Calendar,
  Inbox,
  Layers,
  Target,
  GitBranch,
  BarChart3,
  DollarSign,
  Settings,
  Plus,
  TrendingUp,
  Send,
  Sparkles,
  ListChecks,
  Package,
  Boxes,
} from 'lucide-react';

export type ViewType =
  // Insights
  | 'insights'
  // My Stuff
  | 'my-tasks' | 'my-journal' | 'my-documents'
  | 'workstreams' | 'capabilities' | 'objectives' | 'reports'
  // Performance
  | 'features' | 'use-cases' | 'backlog' | 'sprints'
  // Financial
  | 'contracts' | 'sow' | 'cdrls' | 'clins'
  | null;

interface SpacesContentProps {
  activeView: ViewType;
  onViewChange?: (view: string) => void;
  loading?: boolean;
}

export function SpacesContent({
  activeView,
  onViewChange,
  loading = false,
}: SpacesContentProps) {

  // No view selected
  if (!activeView) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <EmptyState
          icon={TrendingUp}
          title="Welcome to Spaces"
          description="Select an item from the sidebar to get started."
          action={{
            label: "View Insights",
            onClick: () => onViewChange?.('insights'),
            icon: TrendingUp,
          }}
        />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render view-specific content
  return <ViewRenderer view={activeView} onViewChange={onViewChange} />;
}

/**
 * ViewRenderer Component
 * Renders specific view content and sets page context for TopNavigation
 */
function ViewRenderer({ view, onViewChange }: { view: ViewType; onViewChange?: (view: string) => void }) {
  const { setPageContext } = usePageContext();

  // Insights View
  if (view === 'insights') {
    // Set page context for TopNavigation
    useEffect(() => {
      setPageContext({
        title: 'Insights',
        icon: TrendingUp,
        navButtons: [],
        toolbarButtons: [
          {
            label: "Create",
            icon: Plus,
            onClick: () => console.log('Open request form'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Insights settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Row 1: Workstreams, Use Cases, Tasks */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Workstreams</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('workstreams')}
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    Strategic initiatives
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Layers}
                    title="No workstreams"
                    description="Create workstreams to organize initiatives."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Use Cases</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('use-cases')}
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    System functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={ListChecks}
                    title="No use cases"
                    description="Document use cases for features."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Tasks</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('my-tasks')}
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    Your assigned tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={CheckSquare}
                    title="No tasks"
                    description="Tasks will appear here."
                  />
                </CardContent>
              </Card>

              {/* Row 2: Features, Top Tasks (spans 2 cols) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Features</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewChange?.('features')}
                    >
                      View All
                    </Button>
                  </div>
                  <CardDescription>
                    Product features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Sparkles}
                    title="No features"
                    description="Track product features here."
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-muted-foreground" />
                      <CardTitle>Top Priority Tasks</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">View All</Button>
                  </div>
                  <CardDescription>
                    High priority items requiring attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={Target}
                    title="No priority tasks"
                    description="Priority tasks will appear here based on urgency."
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
  }

  // My Tasks View
  if (view === 'my-tasks') {
    useEffect(() => {
      setPageContext({
        title: 'My Tasks',
        icon: CheckSquare,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Task",
            icon: Plus,
            onClick: () => console.log('Create task'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Task settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create your first task to get started."
          />
        </div>
      </div>
    );
  }

  // My Journal View
  if (view === 'my-journal') {
    useEffect(() => {
      setPageContext({
        title: 'Journal',
        icon: BookOpen,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Entry",
            icon: Plus,
            onClick: () => console.log('New journal entry'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Journal settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={BookOpen}
            title="No journal entries"
            description="Start documenting your daily work."
          />
        </div>
      </div>
    );
  }

  // My Documents View
  if (view === 'my-documents') {
    useEffect(() => {
      setPageContext({
        title: 'Documents',
        icon: FileText,
        navButtons: [],
        toolbarButtons: [
          {
            label: "Upload",
            icon: Plus,
            onClick: () => console.log('Upload document'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Document settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={FileText}
            title="No documents"
            description="Upload your first document."
          />
        </div>
      </div>
    );
  }

  // Capabilities View
  if (view === 'capabilities') {
    useEffect(() => {
      setPageContext({
        title: 'Capabilities',
        icon: Boxes,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Capability",
            icon: Plus,
            onClick: () => console.log('Create capability'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Capability settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Boxes}
            title="No capabilities"
            description="Define capabilities to track your organizational strengths and offerings."
          />
        </div>
      </div>
    );
  }

  // Features View
  if (view === 'features') {
    useEffect(() => {
      setPageContext({
        title: 'Features',
        icon: Sparkles,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Feature",
            icon: Plus,
            onClick: () => console.log('Create feature'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Feature settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Sparkles}
            title="No features"
            description="Define features to track development and delivery."
          />
        </div>
      </div>
    );
  }

  // Use Cases View
  if (view === 'use-cases') {
    useEffect(() => {
      setPageContext({
        title: 'Use Cases',
        icon: ListChecks,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Use Case",
            icon: Plus,
            onClick: () => console.log('Create use case'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Use case settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={ListChecks}
            title="No use cases"
            description="Create use cases to document system functionality."
          />
        </div>
      </div>
    );
  }

  // Sprints View
  if (view === 'sprints') {
    useEffect(() => {
      setPageContext({
        title: 'Sprints',
        icon: Calendar,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Sprint",
            icon: Plus,
            onClick: () => console.log('Create sprint'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Sprint settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Calendar}
            title="No sprints"
            description="Create your first sprint to start planning work."
          />
        </div>
      </div>
    );
  }

  // Backlog View
  if (view === 'backlog') {
    useEffect(() => {
      setPageContext({
        title: 'Backlog',
        icon: Inbox,
        navButtons: [],
        toolbarButtons: [
          {
            label: "AI Prioritize",
            icon: Target,
            onClick: () => console.log('AI prioritize'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Backlog settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Inbox}
            title="Backlog is empty"
            description="Add work items to prioritize for upcoming sprints."
          />
        </div>
      </div>
    );
  }

  // Workstreams View
  if (view === 'workstreams') {
    useEffect(() => {
      setPageContext({
        title: 'Workstreams',
        icon: Layers,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Workstream",
            icon: Plus,
            onClick: () => console.log('Create workstream'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Workstream settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Layers}
            title="No workstreams"
            description="Create workstreams to organize strategic initiatives."
          />
        </div>
      </div>
    );
  }

  // Objectives View
  if (view === 'objectives') {
    useEffect(() => {
      setPageContext({
        title: 'Objectives',
        icon: Target,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Objective",
            icon: Plus,
            onClick: () => console.log('Create objective'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('OKR settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={Target}
            title="No objectives set"
            description="Create objectives to align team efforts with strategic goals."
          />
        </div>
      </div>
    );
  }

  // Reports View
  if (view === 'reports') {
    useEffect(() => {
      setPageContext({
        title: 'Reports',
        icon: BarChart3,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Report",
            icon: Plus,
            onClick: () => console.log('Create report'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Report settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={BarChart3}
            title="No reports"
            description="Create custom reports for insights and analytics."
          />
        </div>
      </div>
    );
  }

  // Contracts View
  if (view === 'contracts') {
    useEffect(() => {
      setPageContext({
        title: 'Contracts',
        icon: DollarSign,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New Contract",
            icon: Plus,
            onClick: () => console.log('Create contract'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('Contract settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={DollarSign}
            title="No contracts"
            description="Add contracts to track funding and deliverables."
          />
        </div>
      </div>
    );
  }

  // SOW View
  if (view === 'sow') {
    useEffect(() => {
      setPageContext({
        title: 'Statement of Work',
        icon: FileText,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New SOW",
            icon: Plus,
            onClick: () => console.log('Create SOW'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('SOW settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={FileText}
            title="No SOWs"
            description="Create statements of work to define deliverables."
          />
        </div>
      </div>
    );
  }

  // CDRLs View
  if (view === 'cdrls') {
    useEffect(() => {
      setPageContext({
        title: 'CDRLs',
        icon: FileText,
        navButtons: [],
        toolbarButtons: [
          {
            label: "New CDRL",
            icon: Plus,
            onClick: () => console.log('Create CDRL'),
          },
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('CDRL settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={FileText}
            title="No CDRLs"
            description="Define contract data requirements list items."
          />
        </div>
      </div>
    );
  }

  // CLINs View
  if (view === 'clins') {
    useEffect(() => {
      setPageContext({
        title: 'CLINs',
        icon: FileText,
        navButtons: [],
        toolbarButtons: [
          {
            label: "Settings",
            icon: Settings,
            onClick: () => console.log('CLIN settings'),
          },
        ],
        actions: []
      });
    }, [setPageContext]);

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <EmptyState
            icon={FileText}
            title="No CLINs"
            description="CLINs will appear here once contracts are added."
          />
        </div>
      </div>
    );
  }

  // Default: View not found
  return (
    <div className="flex items-center justify-center h-full p-12">
      <EmptyState
        icon={TrendingUp}
        title="Coming Soon"
        description={`The ${view} view is under development.`}
        action={{
          label: "Go to Insights",
          onClick: () => onViewChange?.('insights'),
          icon: TrendingUp,
        }}
      />
    </div>
  );
}


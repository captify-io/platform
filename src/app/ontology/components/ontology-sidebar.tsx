"use client";

/**
 * Ontology Sidebar
 * Navigation for ontology nodes, links, and tools
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Badge, Input } from '@captify-io/core';
import {
  Network,
  Link2,
  Zap,
  Calendar,
  Bot,
  LayoutGrid,
  Wrench,
  GitBranch,
  ChevronRight,
  ChevronDown,
  Database,
  Eye,
  Activity,
  FileText,
  Folder,
  Clock,
  Plus,
  Layers,
  Workflow,
  Search,
  Blocks,
} from 'lucide-react';
import { cn } from '@captify-io/core';

interface OntologyNode {
  id?: string;
  name?: string;
  type?: string;
  category?: string;
  domain?: string;
}

interface OntologyEdge {
  id?: string;
  source?: string;
  target?: string;
  relation?: string;
}

interface FilterPill {
  property: string;
  value: string;
}

interface SidebarSection {
  id: string;
  label: string;
  icon: React.ElementType;
  count?: number;
  expanded?: boolean;
  items?: Array<{ id: string; label: string; onClick: () => void }>;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OntologySidebarProps {
  onCreateNode?: () => void;
  onCreateLink?: () => void;
  onCreateAction?: () => void;
  onCreate?: () => void;
  onViewChange?: (view: string) => void;
  activeView?: string | null;
  filters?: FilterPill[];
  onFiltersChange?: (filters: FilterPill[]) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export function OntologySidebar({
  onCreateNode,
  onCreateLink,
  onCreateAction,
  onCreate,
  onViewChange,
  activeView,
  filters = [],
  onFiltersChange,
  searchQuery = '',
  onSearchChange,
}: OntologySidebarProps = {}) {
  const router = useRouter();
  const [nodes, setNodes] = useState<OntologyNode[]>([]);
  const [edges, setEdges] = useState<OntologyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['core'])
  );

  // Counts for different entity types
  const [actionCount, setActionCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [functionCount, setFunctionCount] = useState(0);
  const [sourceCount, setSourceCount] = useState(0);
  const [datasetCount, setDatasetCount] = useState(0);
  const [transformCount, setTransformCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [scheduleCount, setScheduleCount] = useState(0);
  const [dataProductCount, setDataProductCount] = useState(0);
  const [workflowCount, setWorkflowCount] = useState(0);
  const [widgetCount, setWidgetCount] = useState(0);

  useEffect(() => {
    loadOntologyData();
  }, []);

  const loadOntologyData = async () => {
    try {
      // Load nodes
      const nodesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-node',
      });

      if (nodesResult.success && nodesResult.data?.Items) {
        setNodes(nodesResult.data.Items);
      }

      // Load edges
      const edgesResult = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-ontology-edge',
      });

      if (edgesResult.success && edgesResult.data?.Items) {
        setEdges(edgesResult.data.Items);
      }

      // Load counts from dedicated tables
      const tableTypes = ['action', 'event', 'function', 'source', 'dataset', 'transform', 'view', 'schedule', 'workflow'];

      for (const tableType of tableTypes) {
        const result = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'scan',
          table: `core-ontology-${tableType}`,
        });

        if (result.success && result.data?.Items) {
          const count = result.data.Items.length;
          switch (tableType) {
            case 'action': setActionCount(count); break;
            case 'event': setEventCount(count); break;
            case 'function': setFunctionCount(count); break;
            case 'source': setSourceCount(count); break;
            case 'dataset': setDatasetCount(count); break;
            case 'transform': setTransformCount(count); break;
            case 'view': setViewCount(count); break;
            case 'schedule': setScheduleCount(count); break;
            case 'workflow': setWorkflowCount(count); break;
          }
        }
      }

      // Check for data products in ontology nodes
      const dataProductNodes = nodes.filter(n =>
        n.type?.toLowerCase().includes('product') ||
        n.category?.toLowerCase().includes('product')
      );
      setDataProductCount(dataProductNodes.length);

      // Count widgets (nodes with type='widget')
      const widgetNodes = nodes.filter(n => n.type === 'widget');
      setWidgetCount(widgetNodes.length);
    } catch (error) {
      console.error('Failed to load ontology:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Core sections - fundamental ontology elements
  const coreSections: SidebarSection[] = [
    {
      id: 'objects',
      label: 'Objects',
      icon: Network,
      count: nodes.length,
    },
    {
      id: 'links',
      label: 'Links',
      icon: Link2,
      count: edges.length,
    },
    {
      id: 'widgets',
      label: 'Widgets',
      icon: Blocks,
      count: widgetCount,
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: Zap,
      count: actionCount,
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      count: eventCount,
    },
    {
      id: 'functions',
      label: 'Functions',
      icon: Workflow,
      count: functionCount,
    },
    {
      id: 'views',
      label: 'Views',
      icon: Eye,
      count: viewCount,
    },
    {
      id: 'schedules',
      label: 'Schedules',
      icon: Clock,
      count: scheduleCount,
    },
  ];

  // Data sections - data management and transformation
  const dataSections: SidebarSection[] = [
    {
      id: 'sources',
      label: 'Sources',
      icon: Database,
      count: sourceCount,
    },
    {
      id: 'datasets',
      label: 'Datasets',
      icon: Layers,
      count: datasetCount,
    },
    {
      id: 'data-products',
      label: 'Data Products',
      icon: Layers,
      count: dataProductCount,
    },
    {
      id: 'transforms',
      label: 'Transforms',
      icon: GitBranch,
      count: transformCount,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: Workflow,
      count: workflowCount,
    },
  ];

  // System sections - health monitoring
  const systemSections: SidebarSection[] = [
    {
      id: 'health',
      label: 'Health',
      icon: Activity,
      count: 0, // TODO: Load health issue count
    },
  ];

  const renderSection = (
    section: SidebarSection,
    depth: number = 0
  ) => {
    const Icon = section.icon;
    const isExpanded = expandedSections.has(section.id);
    const hasItems = section.items && section.items.length > 0;

    return (
      <div key={section.id}>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (hasItems) {
                toggleSection(section.id);
              } else {
                onViewChange?.(section.id);
              }
            }}
            className={cn(
              "flex-1 flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
              "hover:bg-muted",
              activeView === section.id && "bg-muted",
              depth > 0 && "pl-6"
            )}
          >
            {hasItems && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            )}
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">{section.label}</span>
            {section.count !== undefined && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {section.count}
              </span>
            )}
          </button>

          {section.action && (
            <button
              onClick={section.action.onClick}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              title={section.action.label}
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {hasItems && isExpanded && section.items && (
          <div className="ml-6 space-y-1 mt-1">
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={item.onClick}
                className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 min-w-[250px] border-r bg-muted/30 flex flex-col h-full shrink-0">
      {/* Search Section */}
      <div className="p-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2"
            onClick={onCreate}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Core Section */}
        <div>
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Core
          </div>
          <div className="space-y-1">
            {coreSections.map((section) => renderSection(section))}
          </div>
        </div>

        {/* Data Section */}
        <div>
          <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Data
          </div>
          <div className="space-y-1">
            {dataSections.map((section) => renderSection(section))}
          </div>
        </div>

        {/* System Section */}
        <div>
          <div className="space-y-1">
            {systemSections.map((section) => renderSection(section))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      {!loading && (
        <div className="p-3 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Total Nodes</span>
            <span className="font-medium">{nodes.length}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Total Links</span>
            <span className="font-medium">{edges.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

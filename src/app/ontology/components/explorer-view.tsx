"use client";

/**
 * Explorer View Component
 * Shows recent items and search functionality
 */

import { useState, useMemo } from 'react';
import { Search, Database, Link2, Zap, ArrowRight } from 'lucide-react';
import { Input, Card, CardContent, Badge } from '@captify-io/core';
import type { OntologyNode } from '../hooks/use-ontology-store';

interface ExplorerViewProps {
  nodes: OntologyNode[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNodeClick: (nodeId: string) => void;
}

export function ExplorerView({
  nodes,
  searchQuery,
  onSearchChange,
  onNodeClick,
}: ExplorerViewProps) {
  // Get recent items (for now, just show first 6)
  // TODO: Track user interactions and show actual recent items
  const recentItems = useMemo(() => {
    return nodes.slice(0, 6);
  }, [nodes]);

  // Group nodes by type for stats
  const stats = useMemo(() => {
    const typeGroups = nodes.reduce((acc, node) => {
      const type = node.type || 'unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, links: 0 };
      }
      acc[type].count++;
      return acc;
    }, {} as Record<string, { count: number; links: number }>);

    return typeGroups;
  }, [nodes]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'object':
      case 'entity':
        return Database;
      case 'link':
      case 'relationship':
        return Link2;
      case 'action':
      case 'workflow':
        return Zap;
      default:
        return Database;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
      {/* Search Section */}
      <div className="flex flex-col items-center justify-center p-12 pt-20">
        <div className="w-full max-w-2xl">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search ontology..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>

          {/* Recent Items */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Items
              </h3>
              <button className="text-sm text-primary hover:underline flex items-center gap-1">
                View All
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentItems.map((item) => {
                const Icon = getIconForType(item.type);
                const itemStats = stats[item.type] || { count: 0, links: 0 };
                const iconColor = item.properties?.color || '#3b82f6';

                return (
                  <Card
                    key={item.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNodeClick(item.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="p-2 rounded flex-shrink-0" style={{backgroundColor: `${iconColor}20`}}>
                          <Icon className="h-5 w-5" style={{color: iconColor}} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{itemStats.count} objects</span>
                            <span>•</span>
                            <span>{itemStats.links} links</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {item.description || 'No description available'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

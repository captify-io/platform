/**
 * Table View Component
 * Displays ontology nodes and edges in table format
 */

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@captify-io/core';
import { Badge } from '@captify-io/core';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { OntologyNode, OntologyEdge } from '../../hooks/use-ontology-store';

interface TableViewProps {
  type: 'objects' | 'links' | 'actions' | 'events' | 'functions' | 'sources' | 'datasets' | 'transforms' | 'spaces' | 'views' | 'health' | 'schedules' | 'data-products' | 'workflows';
  nodes?: OntologyNode[];
  edges?: OntologyEdge[];
  onRowClick?: (item: OntologyNode | OntologyEdge) => void;
}

export function TableView({ type, nodes = [], edges = [], onRowClick }: TableViewProps) {
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Sort edges
  const sortedEdges = useMemo(() => {
    if (type !== 'links') return edges;

    return [...edges].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof OntologyEdge];
      let bValue: any = b[sortColumn as keyof OntologyEdge];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [edges, sortColumn, sortDirection, type]);

  // Sort nodes
  const sortedNodes = useMemo(() => {
    if (type === 'links') return nodes;

    return [...nodes].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof OntologyNode];
      let bValue: any = b[sortColumn as keyof OntologyNode];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Convert to string for comparison
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [nodes, sortColumn, sortDirection, type]);

  // Render table based on type
  if (type === 'links') {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-full overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('source')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center">
                  Source
                  <SortIcon column="source" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('relation')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center">
                  Relation
                  <SortIcon column="relation" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('target')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center">
                  Target
                  <SortIcon column="target" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('sourceType')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center">
                  Source Type
                  <SortIcon column="sourceType" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('targetType')} className="cursor-pointer hover:bg-muted/50">
                <div className="flex items-center">
                  Target Type
                  <SortIcon column="targetType" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEdges.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No links found
                </TableCell>
              </TableRow>
            ) : (
              sortedEdges.map((edge) => (
                <TableRow
                  key={edge.id}
                  onClick={() => onRowClick?.(edge)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{edge.source}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{edge.relation}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{edge.target}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {edge.sourceType || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {edge.targetType || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    );
  }

  // Default: objects and other node-based views
  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-full overflow-x-auto">
        <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('name')} className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center">
                Name
                <SortIcon column="name" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center">
                Type
                <SortIcon column="type" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('category')} className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center">
                Category
                <SortIcon column="category" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('domain')} className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center">
                Domain
                <SortIcon column="domain" />
              </div>
            </TableHead>
            <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center">
                Description
                <SortIcon column="description" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNodes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No items found
              </TableCell>
            </TableRow>
          ) : (
            sortedNodes.map((node) => (
              <TableRow
                key={node.id}
                onClick={() => onRowClick?.(node)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{node.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{node.type}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {node.category || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {node.domain || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm max-w-md truncate">
                  {node.description || '-'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

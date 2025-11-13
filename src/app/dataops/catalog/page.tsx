'use client';

/**
 * Dataset Catalog Page
 * Browse and discover datasets - "Facebook for Data"
 */

import { useState, useEffect } from 'react';
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core';
import { Badge } from '@captify-io/core/components/ui/badge';
import { apiClient } from '@captify-io/core/lib/api';
import {
  FolderOpen,
  Search,
  Grid,
  List,
  Star,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Eye,
  Heart,
  MessageSquare,
  Filter,
  SortAsc,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { Dataset } from '@captify-io/core/types/dataops';

type ViewMode = 'grid' | 'list';
type SortBy = 'qualityScore' | 'popularity' | 'rating' | 'updatedAt';

export default function DatasetCatalogPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    classification?: string;
    minQuality?: number;
    tags?: string[];
  }>({});
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataset',
        data: {
          Limit: 100,
        },
      });

      setDatasets(response.Items || []);
    } catch (error) {
      console.error('Error loading datasets:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAndSortedDatasets = datasets
    .filter((dataset) => {
      if (searchQuery && !dataset.displayName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.classification && dataset.classification !== filters.classification) {
        return false;
      }
      if (filters.minQuality && dataset.qualityScore < filters.minQuality) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'qualityScore':
          return b.qualityScore - a.qualityScore;
        case 'popularity':
          return b.popularityScore - a.popularityScore;
        case 'rating':
          return b.rating - a.rating;
        case 'updatedAt':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });

  const qualityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="flex-1 overflow-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dataset Catalog</h1>
          <p className="text-muted-foreground">
            Discover and explore datasets across your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search datasets by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="qualityScore">Quality Score</option>
            <option value="popularity">Popularity</option>
            <option value="rating">Rating</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={filters.classification || ''}
            onChange={(e) =>
              setFilters({ ...filters, classification: e.target.value || undefined })
            }
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Classifications</option>
            <option value="U">Unclassified</option>
            <option value="C">Confidential</option>
            <option value="S">Secret</option>
            <option value="TS">Top Secret</option>
          </select>

          <select
            value={filters.minQuality || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                minQuality: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Any Quality</option>
            <option value="80">High Quality (80+)</option>
            <option value="60">Medium Quality (60+)</option>
            <option value="40">Low Quality (40+)</option>
          </select>

          {(searchQuery || filters.classification || filters.minQuality) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilters({});
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{datasets.length}</div>
          <div className="text-sm text-muted-foreground">Total Datasets</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">
            {datasets.filter((d) => d.qualityScore >= 80).length}
          </div>
          <div className="text-sm text-muted-foreground">High Quality</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {datasets.filter((d) => d.piiFields && d.piiFields.length > 0).length}
          </div>
          <div className="text-sm text-muted-foreground">Contains PII</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-500">
            {datasets.filter((d) => d.rating >= 4).length}
          </div>
          <div className="text-sm text-muted-foreground">Highly Rated</div>
        </Card>
      </div>

      {/* Datasets */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredAndSortedDatasets.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No datasets found</h3>
          <p className="text-muted-foreground">
            {searchQuery || Object.keys(filters).length > 0
              ? 'Try adjusting your search or filters'
              : 'No datasets have been cataloged yet'}
          </p>
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedDatasets.map((dataset) => (
            <Link key={dataset.id} href={`/dataops/catalog/${dataset.id}`}>
              <Card
                className={`${viewMode === 'grid' ? 'p-6' : 'p-4'} hover:shadow-lg transition-shadow cursor-pointer`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FolderOpen className="h-5 w-5 text-purple-500" />
                      </div>
                      <Badge className="bg-blue-500 text-white text-xs">
                        {dataset.classification}
                      </Badge>
                    </div>

                    <h3 className="font-semibold mb-2 line-clamp-1">{dataset.displayName}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {dataset.description || 'No description available'}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quality</span>
                        <span className={`font-semibold ${qualityColor(dataset.qualityScore)}`}>
                          {dataset.qualityScore}/100
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Columns</span>
                        <span className="font-semibold">{dataset.columns?.length || 0}</span>
                      </div>
                      {dataset.rowCount !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rows</span>
                          <span className="font-semibold">
                            {dataset.rowCount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {dataset.piiFields && dataset.piiFields.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-600 mb-3">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{dataset.piiFields.length} PII fields</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">{renderStars(dataset.rating)}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {dataset.accessCount}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FolderOpen className="h-6 w-6 text-purple-500" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{dataset.displayName}</h3>
                          <Badge className="bg-blue-500 text-white text-xs">
                            {dataset.classification}
                          </Badge>
                          {dataset.piiFields && dataset.piiFields.length > 0 && (
                            <Badge variant="outline" className="text-xs text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              PII
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {dataset.description || 'No description available'}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className={`font-semibold ${qualityColor(dataset.qualityScore)}`}>
                            {dataset.qualityScore}
                          </div>
                          <div className="text-xs text-muted-foreground">Quality</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{dataset.columns?.length || 0}</div>
                          <div className="text-xs text-muted-foreground">Columns</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">{renderStars(dataset.rating)}</div>
                          <div className="text-xs text-muted-foreground">
                            ({dataset.ratingCount})
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

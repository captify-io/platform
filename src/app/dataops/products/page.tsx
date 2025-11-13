'use client';

/**
 * Data Products Catalog Page
 * Browse and discover API-accessible data products
 */

import { useState, useEffect } from 'react';
import { Card } from '@captify-io/core/components/ui/card';
import { Button } from '@captify-io/core';
import { Badge } from '@captify-io/core/components/ui/badge';
import { apiClient } from '@captify-io/core/lib/api';
import {
  Package,
  Plus,
  Search,
  Grid,
  List,
  Star,
  TrendingUp,
  Zap,
  Users,
  Activity,
  CheckCircle,
  AlertCircle,
  Code,
  Database,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import type { DataProduct } from '@captify-io/core/types/dataops';

type ViewMode = 'grid' | 'list';
type SortBy = 'qualityScore' | 'popularity' | 'rating' | 'updatedAt';

export default function DataProductsPage() {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    domain?: string;
    status?: string;
    maturity?: string;
    classification?: string;
  }>({});
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      setLoading(true);
      const response = await apiClient.run({
        service: 'platform.dynamodb',
        operation: 'scan',
        table: 'core-dataops-data-product',
        data: {
          Limit: 100,
        },
      });

      setProducts(response.Items || []);
    } catch (error) {
      console.error('Error loading data products:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredAndSortedProducts = products
    .filter((product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filters.domain && product.domain !== filters.domain) return false;
      if (filters.status && product.status !== filters.status) return false;
      if (filters.maturity && product.maturity !== filters.maturity) return false;
      if (filters.classification && product.classification !== filters.classification)
        return false;
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'production':
        return 'bg-green-500 text-white';
      case 'staging':
        return 'bg-blue-500 text-white';
      case 'dev':
        return 'bg-yellow-500 text-black';
      case 'draft':
        return 'bg-gray-500 text-white';
      case 'deprecated':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const maturityIcon = (maturity: string) => {
    switch (maturity) {
      case 'mature':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'stable':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'beta':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'experimental':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
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
          <h1 className="text-3xl font-bold mb-2">Data Products</h1>
          <p className="text-muted-foreground">
            API-accessible data products with SLOs and versioning
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Product
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
              placeholder="Search data products..."
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
            value={filters.domain || ''}
            onChange={(e) => setFilters({ ...filters, domain: e.target.value || undefined })}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Domains</option>
            <option value="sales">Sales</option>
            <option value="logistics">Logistics</option>
            <option value="finance">Finance</option>
            <option value="operations">Operations</option>
          </select>

          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Status</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="dev">Dev</option>
            <option value="draft">Draft</option>
          </select>

          <select
            value={filters.maturity || ''}
            onChange={(e) => setFilters({ ...filters, maturity: e.target.value || undefined })}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">All Maturity</option>
            <option value="mature">Mature</option>
            <option value="stable">Stable</option>
            <option value="beta">Beta</option>
            <option value="experimental">Experimental</option>
          </select>

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

          {(searchQuery || Object.values(filters).some((v) => v)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFilters({});
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-sm text-muted-foreground">Total Products</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-500">
            {products.filter((p) => p.status === 'production').length}
          </div>
          <div className="text-sm text-muted-foreground">In Production</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-500">
            {products.filter((p) => p.maturity === 'stable' || p.maturity === 'mature').length}
          </div>
          <div className="text-sm text-muted-foreground">Stable/Mature</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-500">
            {products.reduce((sum, p) => sum + p.uniqueConsumers, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Total Consumers</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {products.filter((p) => p.rating >= 4).length}
          </div>
          <div className="text-sm text-muted-foreground">Highly Rated</div>
        </Card>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No data products found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || Object.values(filters).some((v) => v)
              ? 'Try adjusting your search or filters'
              : 'Create your first data product to get started'}
          </p>
          {!searchQuery && !Object.values(filters).some((v) => v) && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Data Product
            </Button>
          )}
        </Card>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          }
        >
          {filteredAndSortedProducts.map((product) => (
            <Link key={product.id} href={`/dataops/products/${product.id}`}>
              <Card
                className={`${viewMode === 'grid' ? 'p-6' : 'p-4'} hover:shadow-lg transition-shadow cursor-pointer`}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        {maturityIcon(product.maturity)}
                        <Badge className={`${statusColor(product.status)} text-xs`}>
                          {product.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-1 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {product.domain}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        v{product.version}
                      </Badge>
                      <Badge className="bg-blue-500 text-white text-xs">
                        {product.classification}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Quality</span>
                        <span className="font-semibold">{product.qualityScore}/100</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Availability</span>
                        <span className="font-semibold">{product.slos.availability}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Latency P95</span>
                        <span className="font-semibold">{product.slos.latencyP95}ms</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      {product.endpoints.rest && (
                        <span className="flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          REST
                        </span>
                      )}
                      {product.endpoints.graphql && (
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          GraphQL
                        </span>
                      )}
                      {product.endpoints.sql && (
                        <span className="flex items-center gap-1">
                          <Database className="h-3 w-3" />
                          SQL
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-1">{renderStars(product.rating)}</div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {product.uniqueConsumers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {product.accessCount}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Package className="h-6 w-6 text-green-500" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          {maturityIcon(product.maturity)}
                          <Badge className={`${statusColor(product.status)} text-xs`}>
                            {product.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {product.domain}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            v{product.version}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold">{product.qualityScore}</div>
                          <div className="text-xs text-muted-foreground">Quality</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{product.slos.availability}%</div>
                          <div className="text-xs text-muted-foreground">Uptime</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">{product.uniqueConsumers}</div>
                          <div className="text-xs text-muted-foreground">Consumers</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">{renderStars(product.rating)}</div>
                          <div className="text-xs text-muted-foreground">({product.ratingCount})</div>
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

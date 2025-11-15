"use client";

/**
 * Ontology Sidebar
 * Left navigation for Ontology with Foundry and Pipelines sections
 */

import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from '@captify-io/core';
import {
  Sparkles,
  Circle,
  Link2,
  Zap,
  Database,
  Settings,
  Package,
  Database as DataIcon,
  FolderOpen,
  Package2,
  Folder,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export type OntologyViewType =
  | 'discover'
  | 'objects'
  | 'links'
  | 'actions'
  | 'properties'
  | 'functions'
  | 'widgets'
  | 'data-sources'
  | 'datasets'
  | 'data-products'
  | 'catalog'
  | 'governance';

interface OntologySidebarProps {
  onViewChange?: (view: OntologyViewType) => void;
  activeView?: OntologyViewType;
  counts?: {
    objects: number;
    links: number;
    actions: number;
    properties: number;
    functions: number;
    widgets: number;
    dataSources: number;
    datasets: number;
    dataProducts: number;
    catalog: number;
    governance: number;
  };
}

export function OntologySidebar({
  onViewChange,
  activeView = 'discover',
  counts = {
    objects: 0,
    links: 0,
    actions: 0,
    properties: 0,
    functions: 0,
    widgets: 0,
    dataSources: 0,
    datasets: 0,
    dataProducts: 0,
    catalog: 0,
    governance: 0,
  },
}: OntologySidebarProps) {
  const handleViewChange = (view: OntologyViewType) => {
    onViewChange?.(view);
  };

  return (
    <Sidebar>
      <SidebarContent>
        {/* Discover - Top of sidebar */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => handleViewChange('discover')}
                isActive={activeView === 'discover'}
                tooltip="Discover all entities"
                className="h-12"
              >
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Discover</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Foundry Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Foundry</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('objects')}
                  isActive={activeView === 'objects'}
                  tooltip="Ontology objects"
                >
                  <Circle className="h-4 w-4" />
                  <span>Objects</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.objects}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('links')}
                  isActive={activeView === 'links'}
                  tooltip="Object relationships"
                >
                  <Link2 className="h-4 w-4" />
                  <span>Links</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.links}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('actions')}
                  isActive={activeView === 'actions'}
                  tooltip="Object actions"
                >
                  <Zap className="h-4 w-4" />
                  <span>Actions</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.actions}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('properties')}
                  isActive={activeView === 'properties'}
                  tooltip="Object properties"
                >
                  <Database className="h-4 w-4" />
                  <span>Properties</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.properties}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('functions')}
                  isActive={activeView === 'functions'}
                  tooltip="Functions and operations"
                >
                  <Settings className="h-4 w-4" />
                  <span>Functions</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.functions}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('widgets')}
                  isActive={activeView === 'widgets'}
                  tooltip="UI widgets"
                >
                  <Package className="h-4 w-4" />
                  <span>Widgets</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.widgets}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pipelines Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Pipelines</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('data-sources')}
                  isActive={activeView === 'data-sources'}
                  tooltip="Data sources"
                >
                  <DataIcon className="h-4 w-4" />
                  <span>Data Sources</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.dataSources}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('datasets')}
                  isActive={activeView === 'datasets'}
                  tooltip="Datasets"
                >
                  <FolderOpen className="h-4 w-4" />
                  <span>Datasets</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.datasets}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('data-products')}
                  isActive={activeView === 'data-products'}
                  tooltip="Data products"
                >
                  <Package2 className="h-4 w-4" />
                  <span>Data Products</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.dataProducts}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('catalog')}
                  isActive={activeView === 'catalog'}
                  tooltip="Data catalog"
                >
                  <Folder className="h-4 w-4" />
                  <span>Catalog</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.catalog}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleViewChange('governance')}
                  isActive={activeView === 'governance'}
                  tooltip="Data governance"
                >
                  <Shield className="h-4 w-4" />
                  <span>Governance</span>
                  <SidebarMenuBadge className="ml-auto">
                    {counts.governance}
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

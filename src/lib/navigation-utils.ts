"use client";

import { BreadcrumbItem } from "@/context/NavigationContext";

/**
 * Navigation utilities for deep linking and breadcrumb generation
 */

export interface DeepLinkContext {
  applicationId?: string;
  applicationName?: string;
  agentId?: string;
  conversationId?: string;
  documentId?: string;
  userId?: string;
}

/**
 * Generate a deep link URL with proper context
 */
export function generateDeepLink(
  basePath: string,
  context: DeepLinkContext,
  additionalParams?: Record<string, string>
): string {
  const url = new URL(basePath, window.location.origin);

  // Add context parameters
  if (context.applicationId) {
    url.searchParams.set("app", context.applicationId);
  }
  if (context.agentId) {
    url.searchParams.set("agent", context.agentId);
  }
  if (context.conversationId) {
    url.searchParams.set("conversation", context.conversationId);
  }
  if (context.documentId) {
    url.searchParams.set("document", context.documentId);
  }
  if (context.userId) {
    url.searchParams.set("user", context.userId);
  }

  // Add additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Parse URL parameters to extract deep link context
 */
export function parseDeepLinkContext(
  searchParams: URLSearchParams
): DeepLinkContext {
  return {
    applicationId: searchParams.get("app") || undefined,
    agentId: searchParams.get("agent") || undefined,
    conversationId: searchParams.get("conversation") || undefined,
    documentId: searchParams.get("document") || undefined,
    userId: searchParams.get("user") || undefined,
  };
}

/**
 * Generate contextual breadcrumbs based on deep link context
 */
export function generateContextualBreadcrumbs(
  baseBreadcrumbs: BreadcrumbItem[],
  context: DeepLinkContext
): BreadcrumbItem[] {
  const breadcrumbs = [...baseBreadcrumbs];

  // Add application context
  if (context.applicationName && context.applicationId) {
    breadcrumbs.push({
      label: context.applicationName,
      href: `/apps/${context.applicationId}`,
    });
  }

  // Add agent context
  if (context.agentId) {
    breadcrumbs.push({
      label: `Agent: ${context.agentId}`,
      href: `/agents/${context.agentId}`,
    });
  }

  // Add conversation context
  if (context.conversationId) {
    breadcrumbs.push({
      label: `Conversation`,
      href: context.agentId
        ? `/agents/${context.agentId}/conversations/${context.conversationId}`
        : `/conversations/${context.conversationId}`,
    });
  }

  // Add document context
  if (context.documentId) {
    breadcrumbs.push({
      label: `Document`,
      href: `/documents/${context.documentId}`,
    });
  }

  return breadcrumbs;
}

/**
 * Navigation presets for common scenarios
 */
export const navigationPresets = {
  agentConversation: (agentId: string, conversationId: string) =>
    generateDeepLink(`/agents/${agentId}`, { agentId, conversationId }),

  applicationDocument: (applicationId: string, documentId: string) =>
    generateDeepLink(`/apps/${applicationId}/documents/${documentId}`, {
      applicationId,
      documentId,
    }),

  adminUser: (userId: string) =>
    generateDeepLink(`/admin/users/${userId}`, { userId }),

  searchResults: (query: string, filters?: Record<string, string>) =>
    generateDeepLink("/search", {}, { q: query, ...filters }),
};

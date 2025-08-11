import { NextRequest, NextResponse } from "next/server";
import { requireUserSession } from "@/lib/services/session";
import { BOMDatabase } from "@/app/mi/services/database";
import {
  MI_CONFIG,
  getRiskColor,
  getSupplierStatus,
  getChartColor,
} from "@/app/mi/lib/config";
import type { ProcessedBOMParams } from "@/app/mi/types";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 MI BOM API - Starting request");

    // Debug: Log all headers
    console.log("🔍 Request headers:");
    for (const [key, value] of request.headers.entries()) {
      if (
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("aws")
      ) {
        console.log(`   ${key}: ${value ? "present" : "missing"}`);
      }
    }

    // Authenticate user and get session with ID token
    const session = await requireUserSession(request);
    console.log("✅ User authenticated:", session.email);
    console.log("🔍 Session idToken present:", !!session.idToken);
    console.log(
      "🔍 Session awsSessionToken present:",
      !!session.awsSessionToken
    );
    console.log(
      "🔍 Session awsExpiresAt:",
      session.awsExpiresAt
        ? new Date(session.awsExpiresAt).toISOString()
        : "not set"
    );

    const { searchParams } = new URL(request.url);

    const params: ProcessedBOMParams = {
      nodeId:
        searchParams.get("nodeId") || MI_CONFIG.api.defaultParams.bom.nodeId,
      depth: searchParams.get("depth") || MI_CONFIG.api.defaultParams.bom.depth,
      view: searchParams.get("view") || MI_CONFIG.api.defaultParams.bom.view,
      asof: searchParams.get("asof") || new Date().toISOString().split("T")[0],
    };

    console.log("🔍 BOM params:", params);

    // Get root node using the database service
    const rootResult = await BOMDatabase.getRootNode(session, params.nodeId);

    if (!rootResult) {
      return NextResponse.json(
        { error: "Node not found", nodeId: params.nodeId },
        { status: 404 }
      );
    }

    // Get children and suppliers in parallel
    const [childrenResult, supplierResult] = await Promise.all([
      BOMDatabase.getChildren(session, params.nodeId),
      BOMDatabase.getSuppliers(session, params.nodeId),
    ]);

    // Transform data for UI with theme-aware styling using config utilities
    const bomData = {
      metadata: {
        nodeId: params.nodeId,
        depth: parseInt(params.depth),
        view: params.view,
        asof: params.asof,
        generated: new Date().toISOString(),
      },
      rootNode: {
        id: rootResult.pk,
        name: rootResult.name,
        entity: rootResult.entity,
        level: rootResult.level,
        wbs: rootResult.wbs,
        riskScore: rootResult.riskScore || 0,
        costImpact: rootResult.costImpact || 0,
        attrs: rootResult.attrs,
        riskColor: getRiskColor(rootResult.riskScore || 0),
      },
      children: childrenResult.map((child, index) => ({
        id: child.pk,
        name: child.name,
        entity: child.entity,
        level: child.level,
        wbs: child.wbs,
        riskScore: child.riskScore || 0,
        costImpact: child.costImpact || 0,
        hasChildren: child.level < parseInt(params.depth),
        chartColor: getChartColor(index),
        riskColor: getRiskColor(child.riskScore || 0),
      })),
      suppliers: supplierResult.map((supplier, index) => ({
        id: supplier.supplierId,
        name: supplier.supplierId,
        leadDays: supplier.metrics?.leadDays || 0,
        otifPct: supplier.metrics?.otifPct || 0,
        unitCost: supplier.metrics?.unitCost || 0,
        status: getSupplierStatus(
          supplier.metrics?.leadDays || 0,
          supplier.metrics?.otifPct || 0
        ),
        chartColor: getChartColor(index),
      })),
      chartData: {
        riskDistribution: childrenResult.map((child, index) => ({
          name: child.name?.substring(0, 12) || `Part ${index + 1}`,
          risk: Math.round((child.riskScore || 0) * 100),
          cost: Math.round((child.costImpact || 0) / 1000), // In thousands
          fill: getChartColor(index),
        })),
        supplierMetrics: supplierResult.map((supplier, index) => ({
          name: supplier.supplierId?.split(":")[1] || `Supplier ${index + 1}`,
          leadTime: supplier.metrics?.leadDays || 0,
          otd: Math.round((supplier.metrics?.otifPct || 0) * 100),
          cost: Math.round((supplier.metrics?.unitCost || 0) / 100), // In hundreds
          fill: getChartColor(index),
        })),
      },
      priorityActions: [
        {
          id: "explore-children",
          title: `Explore ${childrenResult.length} Child Components`,
          description: "Drill down to see detailed component relationships",
          priority: "Medium" as const,
          action: "navigate",
          target: "#bom-explorer",
        },
        {
          id: "review-suppliers",
          title: `Review ${supplierResult.length} Suppliers`,
          description: "Analyze supplier performance and lead times",
          priority: "High" as const,
          action: "navigate",
          target: "#supply-chain",
        },
        ...(rootResult.riskScore > MI_CONFIG.business.riskThresholds.high
          ? [
              {
                id: "mitigate-risk",
                title: "Mitigate High Risk Component",
                description:
                  "This component has elevated risk - consider alternatives",
                priority: "Critical" as const,
                action: "alert",
              },
            ]
          : []),
      ],
    };

    return NextResponse.json(bomData, {
      headers: {
        "Cache-Control": "public, max-age=600", // 10 minute cache
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("BOM API error:", error);

    // Handle authentication errors specifically
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }

      if (
        error.message.includes("Session expired") ||
        error.message.includes("Token expired")
      ) {
        return NextResponse.json(
          {
            error: "Session expired",
            message: "Your session has expired. Please log in again.",
            requiresReauth: true,
          },
          { status: 401 }
        );
      }

      if (error.message.includes("Authentication token expired")) {
        return NextResponse.json(
          {
            error: "Token expired",
            message:
              "Your authentication token has expired. Please log in again.",
            requiresReauth: true,
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to fetch BOM data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

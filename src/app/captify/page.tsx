"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import {
  Eye, Target, Boxes, ClipboardList, Briefcase, Settings,
  TrendingUp, Network, Activity
} from "lucide-react";

export default function CaptifyHomePage() {
  const { session } = useCaptify();
  const router = useRouter();
  const userGroups = (session as any)?.groups || [];

  // Quick action cards based on user roles
  const quickActions = [
    {
      title: "Insights",
      description: "Enterprise-wide view of AI capabilities and maturity",
      icon: Eye,
      href: "/captify/insights",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: true,
    },
    {
      title: "Strategy",
      description: "Define strategy, map outcomes, and align funding",
      icon: Target,
      href: "/captify/strategy",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: userGroups.some((g: string) => g.includes("admin") || g.includes("program-manager")),
    },
    {
      title: "Ontology",
      description: "Manage data products, models, agents, and systems",
      icon: Boxes,
      href: "/captify/ontology",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: true,
    },
    {
      title: "Operations",
      description: "Daily delivery and governance tracking",
      icon: ClipboardList,
      href: "/captify/operations",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: true,
    },
    {
      title: "Program",
      description: "Cost, schedule, and performance alignment",
      icon: Briefcase,
      href: "/captify/program",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: userGroups.some((g: string) => g.includes("admin") || g.includes("program-manager")),
    },
    {
      title: "Admin",
      description: "Platform administration and configuration",
      icon: Settings,
      href: "/captify/admin",
      color: "text-primary",
      bgColor: "bg-primary/10",
      visible: userGroups.some((g: string) => g.includes("admin")),
    },
  ];

  // Quick stats (placeholder for now)
  const stats = [
    { label: "Active Strategies", value: "—", icon: Target, color: "text-primary" },
    { label: "Operational Capabilities", value: "—", icon: TrendingUp, color: "text-primary" },
    { label: "Ontology Entities", value: "—", icon: Network, color: "text-primary" },
    { label: "Active Tasks", value: "—", icon: Activity, color: "text-primary" },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Captify Ontology Manager</h1>
        <p className="text-muted-foreground text-lg">
          Unified platform for managing operational AI ontology—connecting strategy, funding, outcomes, and capabilities
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions
            .filter(action => action.visible)
            .map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="bg-card border rounded-lg p-6 text-left hover:shadow-md transition-shadow"
              >
                <div className={`${action.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </button>
            ))}
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-muted border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-2">Getting Started</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Start by defining your <strong>Strategic Objectives</strong> in the Strategy section</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Map <strong>Outcomes</strong> to your strategies and link them to funding (CLINs)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Build your AI <strong>Ontology</strong> by adding Data Products, Models, and Agents</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Track daily <strong>Operations</strong> and move capabilities through lifecycle stages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">5.</span>
            <span>Monitor <strong>Insights</strong> to see enterprise-wide AI maturity and readiness</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

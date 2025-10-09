"use client";

import { useCaptify } from "@captify-io/core/components";
import { useRouter } from "next/navigation";
import { Database, Brain, Bot, Server, Zap } from "lucide-react";

export default function OntologyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Data Products",
      description: "Data assets and AWS Glue resources",
      icon: Database,
      href: "/captify/ontology/data-products",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "ML Models",
      description: "Machine learning models and SageMaker resources",
      icon: Brain,
      href: "/captify/ontology/models",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "AI Agents",
      description: "AI agents and Bedrock integrations",
      icon: Bot,
      href: "/captify/ontology/agents",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Systems",
      description: "Integrated systems and platforms",
      icon: Server,
      href: "/captify/ontology/systems",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Capabilities",
      description: "Business and technical capabilities",
      icon: Zap,
      href: "/captify/ontology/capabilities",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ontology</h1>
        <p className="text-muted-foreground">Manage AI assets, capabilities, and integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <button
            key={section.title}
            onClick={() => router.push(section.href)}
            className="bg-card border rounded-lg p-6 text-left hover:shadow-md transition-shadow"
          >
            <div className={`${section.bgColor} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              <section.icon className={`h-6 w-6 ${section.color}`} />
            </div>
            <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

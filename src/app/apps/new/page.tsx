"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAppPage() {
  const router = useRouter();
  const [alias, setAlias] = useState("");
  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [category, setCategory] = useState("custom");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    {
      value: "marketing",
      label: "Marketing & Customer Engagement",
      icon: "🎯",
    },
    { value: "supply-chain", label: "Supply Chain & Logistics", icon: "📦" },
    {
      value: "operations",
      label: "Operations & Process Management",
      icon: "⚙️",
    },
    {
      value: "analytics",
      label: "Analytics & Business Intelligence",
      icon: "📊",
    },
    { value: "security", label: "Security & Compliance", icon: "🛡️" },
    { value: "finance", label: "Finance & Accounting", icon: "💰" },
    { value: "hr", label: "Human Resources", icon: "👥" },
    { value: "custom", label: "Custom Application", icon: "🔧" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/apps/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias, name, agentId, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to register");
      }
      router.push(`/apps/${alias}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Application
          </h1>
          <p className="text-gray-600">
            Build amazing applications with AI-powered default content and
            interactive dashboards
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Application Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Analytics, Supply Chain Monitor"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              A descriptive name for your application
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              URL Alias
            </label>
            <input
              type="text"
              required
              value={alias}
              onChange={(e) =>
                setAlias(
                  e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
                )
              }
              placeholder="e.g., marketing-analytics, supply-chain-monitor"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              URL-friendly identifier (lowercase, hyphens only)
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Application Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Category determines default content templates and features
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              AI Agent ID
            </label>
            <input
              type="text"
              required
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g., marketing-agent-123, supply-chain-agent-456"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Bedrock Agent ID for AI-powered features
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ✨ What you&apos;ll get:
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Amazing default dashboards with interactive charts and
                visualizations
              </li>
              <li>• AI-powered content generation and recommendations</li>
              <li>• Real-time data updates and performance metrics</li>
              <li>• Chat-driven content modification and personalization</li>
              <li>• Professional scorecards, maps, and analytics components</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Amazing Application...</span>
              </div>
            ) : (
              "Create Application with Enhanced Content"
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            New applications automatically include enhanced content based on
            category selection
          </p>
          <div className="flex justify-center mt-4">
            <a
              href="/enhanced-demo"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Preview enhanced applications →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

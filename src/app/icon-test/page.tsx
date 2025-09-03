"use client";
import { Rocket, Shield, Zap, Users, Home, Settings } from "lucide-react";
import { DynamicIcon } from "../../components/ui";

export default function IconTest() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Icon Test Page</h1>

      {/* Test static lucide-react icons */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Static Lucide Icons (directly imported)
        </h2>
        <div className="flex gap-4 items-center">
          <Rocket className="h-8 w-8 text-blue-500" />
          <Shield className="h-8 w-8 text-green-500" />
          <Zap className="h-8 w-8 text-yellow-500" />
          <Users className="h-8 w-8 text-purple-500" />
          <Home className="h-8 w-8 text-red-500" />
          <Settings className="h-8 w-8 text-gray-500" />
        </div>
      </div>

      {/* Test DynamicIcon with valid icon names */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Dynamic Icons (valid names)</h2>
        <div className="flex gap-4 items-center">
          <DynamicIcon name="rocket" className="h-8 w-8 text-blue-500" />
          <DynamicIcon name="shield" className="h-8 w-8 text-green-500" />
          <DynamicIcon name="zap" className="h-8 w-8 text-yellow-500" />
          <DynamicIcon name="users" className="h-8 w-8 text-purple-500" />
          <DynamicIcon name="home" className="h-8 w-8 text-red-500" />
          <DynamicIcon name="settings" className="h-8 w-8 text-gray-500" />
        </div>
      </div>

      {/* Test DynamicIcon with invalid icon names (should show fallback) */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Dynamic Icons (invalid names - should show circle fallback)
        </h2>
        <div className="flex gap-4 items-center">
          <DynamicIcon
            name="nonexistent-icon"
            className="h-8 w-8 text-red-500"
          />
          <DynamicIcon
            name="another-invalid"
            className="h-8 w-8 text-blue-500"
          />
          <DynamicIcon name="also-invalid" className="h-8 w-8 text-green-500" />
        </div>
      </div>

      {/* Test different sizes */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Different Sizes</h2>
        <div className="flex gap-4 items-center">
          <DynamicIcon name="star" size={16} className="text-yellow-500" />
          <DynamicIcon name="star" size={24} className="text-yellow-500" />
          <DynamicIcon name="star" size={32} className="text-yellow-500" />
          <DynamicIcon name="star" size={48} className="text-yellow-500" />
        </div>
      </div>

      {/* Test app-specific icon names from database */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          App Icons (typical database values)
        </h2>
        <div className="flex gap-4 items-center">
          <DynamicIcon name="database" className="h-8 w-8 text-blue-500" />
          <DynamicIcon name="server" className="h-8 w-8 text-green-500" />
          <DynamicIcon name="cloud" className="h-8 w-8 text-cyan-500" />
          <DynamicIcon name="code" className="h-8 w-8 text-orange-500" />
          <DynamicIcon name="cpu" className="h-8 w-8 text-red-500" />
          <DynamicIcon name="monitor" className="h-8 w-8 text-gray-500" />
        </div>
      </div>

      {/* Show loading state */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Loading State Preview</h2>
        <p className="text-sm text-gray-600">
          Dynamic icons show a pulsing circle while loading. This happens very
          quickly so you might not see it.
        </p>
        <div className="flex gap-4 items-center">
          <div className="h-8 w-8 bg-current rounded-full animate-pulse opacity-30"></div>
          <span className="text-sm">← This is what shows during loading</span>
        </div>
      </div>
    </div>
  );
}

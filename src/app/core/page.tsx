"use client";

import { AppLayout, DynamicIcon } from "@captify/core";

export default function CorePage() {
  return (
    <AppLayout applicationId="core" showMenu={true} showChat={true}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Core Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your organization&apos;s core settings and configurations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Users</h3>
              <DynamicIcon name="users" className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Manage user accounts and permissions
            </p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Manage Users
            </button>
          </div>

          {/* Organizations Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Organizations
              </h3>
              <DynamicIcon name="building" className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Configure organizational structure and settings
            </p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Manage Organizations
            </button>
          </div>

          {/* Roles Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Roles</h3>
              <DynamicIcon name="shield" className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Define roles and access permissions
            </p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
              Manage Roles
            </button>
          </div>

          {/* Settings Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
              <DynamicIcon name="settings" className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Configure platform-wide settings
            </p>
            <button className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors">
              Platform Settings
            </button>
          </div>

          {/* Analytics Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              <DynamicIcon
                name="bar-chart-3"
                className="h-6 w-6 text-indigo-600"
              />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              View platform usage and metrics
            </p>
            <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
              View Analytics
            </button>
          </div>

          {/* System Health Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                System Health
              </h3>
              <DynamicIcon
                name="activity"
                className="h-6 w-6 text-emerald-600"
              />
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Monitor system status and performance
            </p>
            <button className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors">
              Check Health
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

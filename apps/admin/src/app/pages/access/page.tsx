'use client';

/**
 * Access Management Dashboard Page
 * Overview of access management features
 */

import React from "react";

export default function AccessPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Access Management - Next.js Watch Test! �
      </h1>
      <div className="grid gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">User Management</h2>
          <p className="text-gray-600">
            Manage user accounts, profiles, and permissions.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Role Management</h2>
          <p className="text-gray-600">
            Define and manage organizational roles and responsibilities.
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Policy Management</h2>
          <p className="text-gray-600">
            Configure access policies and permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

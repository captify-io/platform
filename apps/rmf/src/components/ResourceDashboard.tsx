import React from 'react';
import type { RMFResource } from '../types/index.js';

interface ResourceDashboardProps {
  resources: RMFResource[];
}

export function ResourceDashboard({ resources }: ResourceDashboardProps) {
  return (
    <div className="resource-dashboard">
      <h2>Resource Dashboard</h2>
      <div className="resource-grid">
        {resources.map((resource) => (
          <div key={resource.id} className="resource-card">
            <h3>{resource.name}</h3>
            <p>Type: {resource.type}</p>
            <p>Status: {resource.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
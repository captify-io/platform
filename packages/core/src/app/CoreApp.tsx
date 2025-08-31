import React from "react";

export interface CoreAppProps {
  // Add props as needed
  params?: any;
}

/**
 * Main Core App Component
 * This will be loaded by the AppLayout when someone navigates to /core
 */
export default function CoreApp({ params }: CoreAppProps) {
  return (
    <div className="core-app">
      <h1>Captify Core</h1>
      <p>Core functionality and services</p>
      {/* Add your core app content here */}
    </div>
  );
}

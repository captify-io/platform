'use client';

/**
 * Core App Dashboard Page
 * This is a placeholder component that demonstrates the core package
 * can export React components and JSX content.
 */
export default function CoreDashboardPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Captify Core Dashboard
        </h1>
        <p className="text-gray-600">
          Core services and administrative tools for the Captify platform
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">DynamoDB Services</h2>
          <p className="text-gray-600 mb-4">
            Manage DynamoDB tables and data operations
          </p>
          <div className="text-sm text-blue-600">Services: dynamo.manifest</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">User Management</h2>
          <p className="text-gray-600 mb-4">
            Core user administration and permissions
          </p>
          <div className="text-sm text-blue-600">Components: admin/users</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-2">System Health</h2>
          <p className="text-gray-600 mb-4">
            Monitor core services and infrastructure
          </p>
          <div className="text-sm text-green-600">Status: Active</div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Available Services</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <code className="text-sm">
            POST /api/core → services/dynamo.manifest.execute()
          </code>
        </div>
      </section>
    </div>
  );
}

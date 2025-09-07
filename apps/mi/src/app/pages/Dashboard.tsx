/**
 * Materiel Insights Dashboard Page
 * Overview of aircraft fleet status, maintenance alerts, and key metrics
 */
export default function MIDashboardPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Materiel Insights Dashboard
        </h1>
        <p className="text-gray-600">
          Aircraft lifecycle management and maintenance oversight
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Fleet Status Cards */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-green-600">
            Active Aircraft
          </h3>
          <p className="text-3xl font-bold text-gray-900">47</p>
          <p className="text-sm text-gray-500">Fleet operational status</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-yellow-600">
            In Maintenance
          </h3>
          <p className="text-3xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-500">Scheduled maintenance</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-red-600">
            Critical Issues
          </h3>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-sm text-gray-500">Require immediate attention</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2 text-blue-600">
            Availability
          </h3>
          <p className="text-3xl font-bold text-gray-900">85.5%</p>
          <p className="text-sm text-gray-500">Fleet availability rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Problem Reports */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Recent Problem Reports</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
              <div>
                <p className="font-medium">Hydraulic Leak - AC-042</p>
                <p className="text-sm text-gray-600">Priority: Critical</p>
              </div>
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Open
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
              <div>
                <p className="font-medium">Avionics Display Issue - AC-018</p>
                <p className="text-sm text-gray-600">Priority: High</p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Investigating
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
              <div>
                <p className="font-medium">Landing Gear Inspection - AC-031</p>
                <p className="text-sm text-gray-600">Priority: Medium</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Action Required
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Upcoming Maintenance</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">C-Check - AC-025</p>
                <p className="text-sm text-gray-600">Due: Mar 15, 2025</p>
              </div>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                5 days
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Engine Overhaul - AC-007</p>
                <p className="text-sm text-gray-600">Due: Mar 22, 2025</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                12 days
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Annual Inspection - AC-041</p>
                <p className="text-sm text-gray-600">Due: Apr 5, 2025</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                26 days
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parts Consumption */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Top Consumed Parts</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Engine Oil Filters</span>
              <span className="text-sm font-medium">24 units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Brake Pads</span>
              <span className="text-sm font-medium">18 units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Hydraulic Seals</span>
              <span className="text-sm font-medium">15 units</span>
            </div>
          </div>
        </div>

        {/* Engineering Requests */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">
            Active Engineering Requests
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Modification Requests</span>
              <span className="text-sm font-medium">7</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Design Changes</span>
              <span className="text-sm font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Repair Procedures</span>
              <span className="text-sm font-medium">12</span>
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Compliance Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">FAA Compliance</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                ✓ Current
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">EASA Compliance</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                ✓ Current
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">ISO Standards</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                ⚠ Review Due
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Bill of Materials (BOM) Management Page
 * Manage aircraft component hierarchies and part information
 */
export default function BOMPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bill of Materials
        </h1>
        <p className="text-gray-600">
          Manage aircraft component hierarchies and parts inventory
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Aircraft BOM Structure</h2>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Component
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Export BOM
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Aircraft Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Aircraft
            </label>
            <select className="w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>AC-025 - Boeing 737-800</option>
              <option>AC-031 - Airbus A320</option>
              <option>AC-042 - Boeing 777-300ER</option>
            </select>
          </div>

          {/* BOM Tree Structure */}
          <div className="space-y-2">
            {/* Level 0 - Aircraft */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-blue-600">📋</span>
                  <div>
                    <h3 className="font-semibold">AC-025 - Boeing 737-800</h3>
                    <p className="text-sm text-gray-600">
                      S/N: 12345 | Config: B737-800-STD
                    </p>
                  </div>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Level 0
                </span>
              </div>
            </div>

            {/* Level 1 - Major Assemblies */}
            <div className="ml-6 space-y-2">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">⚙️</span>
                    <div>
                      <h4 className="font-medium">
                        Engine Assembly - CFM56-7B27
                      </h4>
                      <p className="text-sm text-gray-600">
                        P/N: CFM56-7B27 | Qty: 2 | Critical
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Level 1
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">🏗️</span>
                    <div>
                      <h4 className="font-medium">Wing Assembly - Left</h4>
                      <p className="text-sm text-gray-600">
                        P/N: 737-WL-001 | Qty: 1 | Critical
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Level 1
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">🔧</span>
                    <div>
                      <h4 className="font-medium">
                        Landing Gear Assembly - Main
                      </h4>
                      <p className="text-sm text-gray-600">
                        P/N: 737-LG-M01 | Qty: 2 | Essential
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Level 1
                  </span>
                </div>
              </div>
            </div>

            {/* Level 2 - Sub-assemblies */}
            <div className="ml-12 space-y-2">
              <div className="bg-yellow-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600">🔩</span>
                    <div>
                      <h5 className="font-medium">Engine Oil Filter</h5>
                      <p className="text-sm text-gray-600">
                        P/N: OF-CFM56-001 | Qty: 1 | Standard
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Level 2
                  </span>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-600">⚡</span>
                    <div>
                      <h5 className="font-medium">Fuel Pump Assembly</h5>
                      <p className="text-sm text-gray-600">
                        P/N: FP-CFM56-002 | Qty: 2 | Critical
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Level 2
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Component Details Panel */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Component Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Part Number
                </label>
                <p className="text-sm text-gray-900">CFM56-7B27</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Serial Number
                </label>
                <p className="text-sm text-gray-900">ENG001234</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Install Date
                </label>
                <p className="text-sm text-gray-900">2024-01-15</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Life Remaining
                </label>
                <p className="text-sm text-gray-900">15,420 hrs</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Manufacturer
                </label>
                <p className="text-sm text-gray-900">CFM International</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Criticality
                </label>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                  Critical
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Next Action
                </label>
                <p className="text-sm text-gray-900">
                  Inspection due 2025-03-20
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Serviceable
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Engineering Requests Management Page
 * Track change requests, modifications, and engineering work
 */
export default function EngineeringRequestsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Engineering Requests
        </h1>
        <p className="text-gray-600">
          Manage engineering change requests, modifications, and technical
          reviews
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              Active Engineering Requests
            </h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              New Request
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Types</option>
              <option>Design Change</option>
              <option>Modification</option>
              <option>Repair</option>
              <option>Inspection</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Priorities</option>
              <option>Critical</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Status</option>
              <option>Draft</option>
              <option>Under Review</option>
              <option>Approved</option>
              <option>In Progress</option>
            </select>
          </div>

          {/* Requests Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-semibold">Request #</th>
                  <th className="text-left p-3 font-semibold">Type</th>
                  <th className="text-left p-3 font-semibold">Summary</th>
                  <th className="text-left p-3 font-semibold">Priority</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Assigned To</th>
                  <th className="text-left p-3 font-semibold">Due Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">ER-2025-001</td>
                  <td className="p-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Modification
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        Engine Thrust Reverser Upgrade
                      </p>
                      <p className="text-sm text-gray-600">
                        Improve fuel efficiency and noise reduction
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Critical
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Under Review
                    </span>
                  </td>
                  <td className="p-3">John Smith</td>
                  <td className="p-3">2025-03-30</td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">ER-2025-002</td>
                  <td className="p-3">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Design Change
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        Avionics Display Layout Revision
                      </p>
                      <p className="text-sm text-gray-600">
                        Update cockpit display configuration
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                      High
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      In Progress
                    </span>
                  </td>
                  <td className="p-3">Sarah Johnson</td>
                  <td className="p-3">2025-04-15</td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">ER-2025-003</td>
                  <td className="p-3">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      Repair
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        Landing Gear Actuator Repair Procedure
                      </p>
                      <p className="text-sm text-gray-600">
                        Develop repair method for hydraulic leak
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Medium
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Approved
                    </span>
                  </td>
                  <td className="p-3">Mike Wilson</td>
                  <td className="p-3">2025-03-25</td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </td>
                </tr>

                <tr className="border-b hover:bg-gray-50">
                  <td className="p-3">ER-2025-004</td>
                  <td className="p-3">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Inspection
                    </span>
                  </td>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        Wing Spar Crack Inspection Protocol
                      </p>
                      <p className="text-sm text-gray-600">
                        Enhanced inspection procedure for fatigue cracks
                      </p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                      Critical
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      Draft
                    </span>
                  </td>
                  <td className="p-3">Emily Davis</td>
                  <td className="p-3">2025-03-20</td>
                  <td className="p-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      View
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Request Details Panel */}
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">
              Request Details - ER-2025-001
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">General Information</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Requester
                    </label>
                    <p className="text-sm text-gray-900">
                      Fleet Operations Team
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Aircraft Affected
                    </label>
                    <p className="text-sm text-gray-900">
                      All Boeing 737-800 series
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Cost
                    </label>
                    <p className="text-sm text-gray-900">$2,500,000</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Effort
                    </label>
                    <p className="text-sm text-gray-900">480 hours</p>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Progress & Approvals</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-green-500 rounded-full"></span>
                    <span className="text-sm">Initial Review - Completed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-yellow-500 rounded-full"></span>
                    <span className="text-sm">
                      Technical Review - In Progress
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-gray-300 rounded-full"></span>
                    <span className="text-sm">
                      Management Approval - Pending
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 bg-gray-300 rounded-full"></span>
                    <span className="text-sm">Implementation - Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

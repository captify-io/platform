/**
 * Problem Reports Management Page
 * Document and track aircraft issues and incidents
 */
export default function ProblemReportsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Problem Reports
        </h1>
        <p className="text-gray-600">
          Document, track, and resolve aircraft issues and incidents
        </p>
      </header>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Problem Reports</h2>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
              New Problem Report
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-700">Critical</h3>
              <p className="text-2xl font-bold text-red-900">3</p>
              <p className="text-sm text-red-600">Flight safety impacts</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-lg font-semibold text-orange-700">
                High Priority
              </h3>
              <p className="text-2xl font-bold text-orange-900">8</p>
              <p className="text-sm text-orange-600">Operational impacts</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-700">
                Medium Priority
              </h3>
              <p className="text-2xl font-bold text-yellow-900">15</p>
              <p className="text-sm text-yellow-600">Minor impacts</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700">
                Under Investigation
              </h3>
              <p className="text-2xl font-bold text-blue-900">12</p>
              <p className="text-sm text-blue-600">Active investigations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Aircraft</option>
              <option>AC-025</option>
              <option>AC-031</option>
              <option>AC-042</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Categories</option>
              <option>Mechanical</option>
              <option>Electrical</option>
              <option>Avionics</option>
              <option>Structural</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md">
              <option>All Status</option>
              <option>Open</option>
              <option>Investigating</option>
              <option>Action Required</option>
              <option>Closed</option>
            </select>
          </div>

          {/* Problem Reports List */}
          <div className="space-y-4">
            {/* Critical Problem Report */}
            <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    PR-2025-012
                  </h3>
                  <p className="text-red-700">Hydraulic System Leak - AC-042</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Critical
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Open
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Occurrence:</strong> 2025-03-08 14:30 UTC
                  </p>
                  <p>
                    <strong>Flight:</strong> FL-425 (LAX to JFK)
                  </p>
                  <p>
                    <strong>Reporter:</strong> Capt. Johnson
                  </p>
                </div>
                <div>
                  <p>
                    <strong>System:</strong> Hydraulic System A
                  </p>
                  <p>
                    <strong>Flight Safety:</strong>{" "}
                    <span className="text-red-600 font-medium">Yes</span>
                  </p>
                  <p>
                    <strong>Regulatory:</strong>{" "}
                    <span className="text-red-600 font-medium">Required</span>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Assigned To:</strong> Hydraulics Team
                  </p>
                  <p>
                    <strong>Due Date:</strong> 2025-03-12
                  </p>
                  <p>
                    <strong>Status:</strong> Investigating root cause
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-sm text-red-800">
                  <strong>Description:</strong> Significant hydraulic fluid leak
                  observed from System A during pre-flight inspection. Aircraft
                  grounded pending investigation. Immediate replacement of
                  suspect component required.
                </p>
              </div>
            </div>

            {/* High Priority Problem Report */}
            <div className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-orange-900">
                    PR-2025-011
                  </h3>
                  <p className="text-orange-700">
                    Avionics Display Intermittent Failure - AC-025
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                    High
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Action Required
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Occurrence:</strong> 2025-03-07 09:15 UTC
                  </p>
                  <p>
                    <strong>Flight:</strong> FL-287 (DFW to MIA)
                  </p>
                  <p>
                    <strong>Reporter:</strong> F/O Martinez
                  </p>
                </div>
                <div>
                  <p>
                    <strong>System:</strong> Primary Flight Display
                  </p>
                  <p>
                    <strong>Flight Safety:</strong>{" "}
                    <span className="text-orange-600 font-medium">Minor</span>
                  </p>
                  <p>
                    <strong>Regulatory:</strong>{" "}
                    <span className="text-gray-600">Not Required</span>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Assigned To:</strong> Avionics Team
                  </p>
                  <p>
                    <strong>Due Date:</strong> 2025-03-15
                  </p>
                  <p>
                    <strong>Status:</strong> Component replacement scheduled
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-orange-200">
                <p className="text-sm text-orange-800">
                  <strong>Description:</strong> Primary Flight Display #1
                  experienced intermittent flickering during cruise phase.
                  Display returned to normal after system reset. Suspected loose
                  connection or failing display unit.
                </p>
              </div>
            </div>

            {/* Medium Priority Problem Report */}
            <div className="border border-yellow-200 bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900">
                    PR-2025-010
                  </h3>
                  <p className="text-yellow-700">
                    Cabin Air Conditioning Noise - AC-031
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Medium
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Investigating
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Occurrence:</strong> 2025-03-05 16:45 UTC
                  </p>
                  <p>
                    <strong>Flight:</strong> FL-156 (ORD to SEA)
                  </p>
                  <p>
                    <strong>Reporter:</strong> Cabin Crew
                  </p>
                </div>
                <div>
                  <p>
                    <strong>System:</strong> Environmental Control
                  </p>
                  <p>
                    <strong>Flight Safety:</strong>{" "}
                    <span className="text-gray-600">No</span>
                  </p>
                  <p>
                    <strong>Regulatory:</strong>{" "}
                    <span className="text-gray-600">Not Required</span>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Assigned To:</strong> Environmental Systems
                  </p>
                  <p>
                    <strong>Due Date:</strong> 2025-03-20
                  </p>
                  <p>
                    <strong>Status:</strong> Scheduled for next maintenance
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Description:</strong> Unusual noise from cabin air
                  conditioning system reported by multiple passengers and crew.
                  No impact on system performance, but noise level affects
                  passenger comfort.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Generate Report
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Export Data
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Regulatory Filing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

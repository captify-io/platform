/**
 * Advanced Forecasting Page
 * Predictive analytics for maintenance and parts demand
 */
export default function ForecastingPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Advanced Forecasting
        </h1>
        <p className="text-gray-600">
          Predictive analytics for maintenance demand, parts consumption, and
          fleet planning
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Forecast Configuration */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Forecast Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forecast Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Maintenance Demand</option>
                <option>Parts Consumption</option>
                <option>Cost Projection</option>
                <option>Fleet Availability</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Horizon
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>3 Months</option>
                <option>6 Months</option>
                <option>12 Months</option>
                <option>24 Months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aircraft Filter
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>All Aircraft</option>
                <option>Boeing 737 Fleet</option>
                <option>Airbus A320 Fleet</option>
                <option>Wide Body Fleet</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Generate Forecast
            </button>
          </div>
        </div>

        {/* Forecast Summary */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">
            Maintenance Demand Forecast - 12 Months
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">247</p>
              <p className="text-sm text-gray-600">Scheduled Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">89</p>
              <p className="text-sm text-gray-600">Unscheduled Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">92%</p>
              <p className="text-sm text-gray-600">Forecast Confidence</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">$4.2M</p>
              <p className="text-sm text-gray-600">Estimated Cost</p>
            </div>
          </div>

          {/* Simple Chart Placeholder */}
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border">
            <div className="text-center">
              <p className="text-gray-500 mb-2">📊 Maintenance Demand Trend</p>
              <p className="text-sm text-gray-400">
                Chart visualization would be displayed here
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parts Consumption Forecast */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">
            Parts Consumption Forecast
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Engine Oil Filters</p>
                <p className="text-sm text-gray-600">Current Stock: 45 units</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">28 units</p>
                <p className="text-sm text-gray-600">Needed (6 months)</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Brake Pads</p>
                <p className="text-sm text-gray-600">Current Stock: 32 units</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-600">24 units</p>
                <p className="text-sm text-gray-600">Needed (6 months)</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Hydraulic Seals</p>
                <p className="text-sm text-gray-600">Current Stock: 78 units</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">18 units</p>
                <p className="text-sm text-gray-600">Needed (6 months)</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">Avionics Components</p>
                <p className="text-sm text-gray-600">Current Stock: 12 units</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">8 units</p>
                <p className="text-sm text-gray-600">Needed (6 months)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reliability Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Reliability Trends</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-medium text-green-700">Engine Systems</h3>
              <p className="text-sm text-gray-600">
                Reliability improving by 2.3% quarterly
              </p>
              <p className="text-sm text-green-600">
                MTBF: 8,450 hours (↑ 245 hours)
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-medium text-yellow-700">Hydraulic Systems</h3>
              <p className="text-sm text-gray-600">
                Reliability stable with seasonal variation
              </p>
              <p className="text-sm text-yellow-600">
                MTBF: 3,200 hours (→ no change)
              </p>
            </div>

            <div className="border-l-4 border-red-500 pl-4">
              <h3 className="font-medium text-red-700">Avionics Systems</h3>
              <p className="text-sm text-gray-600">
                Reliability declining, requires attention
              </p>
              <p className="text-sm text-red-600">
                MTBF: 2,100 hours (↓ 180 hours)
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-medium text-blue-700">Landing Gear</h3>
              <p className="text-sm text-gray-600">
                Reliability improving with new procedures
              </p>
              <p className="text-sm text-blue-600">
                MTBF: 5,670 hours (↑ 320 hours)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">
          Forecast Factors & Methodology
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Key Factors Considered</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Historical maintenance data (5 years)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Flight operations schedule
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Environmental conditions
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Component life limits
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Manufacturer recommendations
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-3">Machine Learning Models</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Time Series Analysis</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  94% Accuracy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Random Forest Regression</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  91% Accuracy
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Neural Network</span>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  87% Accuracy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

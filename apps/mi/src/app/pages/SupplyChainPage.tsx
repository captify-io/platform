/**
 * Supply Chain Management Page
 * Parts availability and procurement
 */
export default function SupplyChainPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Supply Chain</h1>
        <p className="text-gray-600">
          Parts availability, procurement, and inventory management
        </p>
      </header>

      <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
        <div className="text-6xl mb-4">🚚</div>
        <h2 className="text-xl font-semibold mb-2">Supply Chain Management</h2>
        <p className="text-gray-600 mb-4">
          This page will contain tools for supply chain management, parts
          procurement, and inventory optimization.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Coming Soon
        </button>
      </div>
    </div>
  );
}

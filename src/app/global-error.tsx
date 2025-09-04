'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">Error</h1>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 mb-8">
                An unexpected error occurred. Please try again.
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => reset()}
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

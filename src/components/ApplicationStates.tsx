export function ApplicationLoading({ name }: { name?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading {name || "Application"}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we initialize the application...
        </p>
      </div>
    </div>
  );
}

export function ApplicationNotFound({ slug }: { slug: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-gray-400 text-2xl">📱</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Application Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The application{" "}
          <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">
            {slug}
          </code>{" "}
          is not installed or configured.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>To install this application, run:</p>
          <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
            npm run captify:install {slug}
          </code>
        </div>
        <a
          href="/applications"
          className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
        >
          View Available Applications
        </a>
      </div>
    </div>
  );
}

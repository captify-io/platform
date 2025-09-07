export default function HomePage() {
  return (
    <div className="h-full bg-background overflow-auto">
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">
            Welcome to Captify
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent platform for secure application management and
            deployment. Build, monitor, and scale your applications with
            confidence.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="h-12 w-12 mx-auto text-primary mb-4">🚀</div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                Fast Deployment
              </h3>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Deploy applications quickly with our streamlined workflow and
                automated processes.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="h-12 w-12 mx-auto text-primary mb-4">🛡️</div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                Enterprise Security
              </h3>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Built with security-first principles and compliance standards
                for enterprise use.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="h-12 w-12 mx-auto text-primary mb-4">⚡</div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                High Performance
              </h3>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Optimized for speed and efficiency with real-time monitoring and
                analytics.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm text-center">
            <div className="flex flex-col space-y-1.5 p-6">
              <div className="h-12 w-12 mx-auto text-primary mb-4">👥</div>
              <h3 className="text-2xl font-semibold leading-none tracking-tight">
                Team Collaboration
              </h3>
            </div>
            <div className="p-6 pt-0">
              <p className="text-sm text-muted-foreground">
                Work together seamlessly with integrated tools and shared
                workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Get Started
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex-1 max-w-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  Explore Applications
                </h3>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Browse and manage your applications from the dashboard.
                </p>
              </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex-1 max-w-sm">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-lg font-semibold leading-none tracking-tight">
                  Monitor Services
                </h3>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  Keep track of your services and their performance metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

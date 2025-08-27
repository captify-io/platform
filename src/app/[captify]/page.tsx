import { notFound } from "next/navigation";
import { applicationController } from "../../lib/application-controller";
import { ApplicationErrorBoundary } from "../../components/ApplicationErrorBoundary";
import {
  ApplicationNotFound,
  ApplicationLoading,
} from "../../components/ApplicationStates";
import { Suspense } from "react";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string }>;
}

async function ApplicationContent({ slug }: { slug: string }) {
  // Get the application configuration
  const application = await applicationController.getApplication(slug);

  if (!application) {
    return <ApplicationNotFound slug={slug} />;
  }

  // Get the component for this application - this is now async
  const AppComponent = await applicationController.getApplicationComponent(
    slug
  );

  if (!AppComponent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {application.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {application.description}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Application component not found. Make sure the package is properly
            installed.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Try running:</p>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
              npm run install-app {slug}
            </code>
          </div>
        </div>
      </div>
    );
  }

  // Render the application component
  return <AppComponent application={application} />;
}

export default async function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { captify: slug } = await params;

  return (
    <ApplicationErrorBoundary>
      <Suspense fallback={<ApplicationLoading />}>
        <ApplicationContent slug={slug} />
      </Suspense>
    </ApplicationErrorBoundary>
  );
}

export async function generateStaticParams() {
  const applications = await applicationController.getAllApplications();

  return applications.map((app) => ({
    captify: app.slug,
  }));
}

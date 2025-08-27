import { applicationController } from "../../lib/controller";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string }>;
}

export default async function CaptifyLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify: slug } = await params;
  const application = await applicationController.getApplication(slug);

  if (!application) {
    return children;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{application.name}</h1>
              <span className="text-sm text-muted-foreground">
                {application.version}
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {application.description}
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export async function generateStaticParams() {
  const applications = await applicationController.getAllApplications();

  return applications.map((app) => ({
    captify: app.slug,
  }));
}

import { PackagePageRouter } from "../../components/packages/PackagePageRouter";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string[] }>;
}

export default async function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { captify } = await params;

  const packageSlug = captify[0];
  const pageRoute = captify[1] || "home";

  console.log("[CaptifyAppPage] captify params:", captify);
  console.log("[CaptifyAppPage] packageSlug:", packageSlug);

  // If no package specified, redirect to home or show error
  if (!packageSlug || packageSlug === "core") {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">No Package Specified</h2>
          <p className="text-muted-foreground mb-4">
            Please navigate to a specific app like /pmbook or /admin
          </p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Available apps:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• /pmbook - PMBook Application</li>
              <li>• /admin - Admin Panel</li>
              <li>• /mi - Material Insights</li>
              <li>• /rmf - Resource Management Framework</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PackagePageRouter
      currentHash={pageRoute}
      packageSlug={packageSlug}
      packageName={packageSlug.charAt(0).toUpperCase() + packageSlug.slice(1)}
    />
  );
}

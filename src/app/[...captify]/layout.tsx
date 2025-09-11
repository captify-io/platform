import { ReactNode } from "react";
import { ClientCaptifyLayout } from "../../components/ClientCaptifyLayout";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string[] }>;
}

// List of valid package names that have @captify-io/* packages
const VALID_PACKAGES = ["pmbook", "admin", "mi", "rmf"];

export default async function CaptifyPageLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify } = await params;
  const packageName = captify[0] || "";

  // Validate package name before calling ThreePanelLayout
  if (!packageName || !VALID_PACKAGES.includes(packageName)) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="text-center max-w-2xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Package Not Found
          </h2>
          <p className="text-muted-foreground mb-4">
            The package "{packageName}" is not available or does not exist.
          </p>
          <div className="bg-muted p-4 rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Available packages:</p>
            <ul className="space-y-1 text-muted-foreground">
              {VALID_PACKAGES.map((pkg) => (
                <li key={pkg}>
                  • /{pkg} - {pkg.charAt(0).toUpperCase() + pkg.slice(1)}{" "}
                  Application
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClientCaptifyLayout
      packageName={packageName}
      packageSource="services/config"
    >
      {children}
    </ClientCaptifyLayout>
  );
}

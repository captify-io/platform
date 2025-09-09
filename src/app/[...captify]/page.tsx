import { PackagePageRouter } from "@captify-io/core/components";

interface CaptifyAppPageProps {
  params: Promise<{ captify: string[] }>;
}

export default async function CaptifyAppPage({ params }: CaptifyAppPageProps) {
  const { captify } = await params;

  const packageSlug = captify[0] || "core";
  const pageRoute = captify[1] || "home";

  return (
    <PackagePageRouter
      currentHash={pageRoute}
      packageSlug={packageSlug}
      packageName={packageSlug.charAt(0).toUpperCase() + packageSlug.slice(1)}
    />
  );
}

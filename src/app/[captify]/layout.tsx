import { ThreePanelLayout } from "@captify/core/components";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string }>;
}

export default async function CaptifyPageLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify } = await params;

  // Pass the package name through a data attribute so the context can pick it up
  return (
    <div data-package={captify} className="h-full">
      <ThreePanelLayout>{children}</ThreePanelLayout>
    </div>
  );
}

export async function generateStaticParams() {
  // Define available packages for static generation
  const packages = ["core"]; // Add your packages here

  return packages.map((pkg) => ({
    captify: pkg,
  }));
}

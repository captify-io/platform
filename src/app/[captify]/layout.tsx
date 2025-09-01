import { ThreePanelLayout } from "@captify/core/components";
import { CaptifyProvider } from "@captify/core/context";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string }>;
}

export default async function CaptifyLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify } = await params;

  return (
    <CaptifyProvider>
      <ThreePanelLayout>{children}</ThreePanelLayout>
    </CaptifyProvider>
  );
}

export async function generateStaticParams() {
  // Define available packages for static generation
  const packages = ["core"]; // Add your packages here

  return packages.map((pkg) => ({
    captify: pkg,
  }));
}

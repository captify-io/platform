import { PackageProvider } from "../../context/PackageContext";
import { ThreePanelLayout } from "../../components/ThreePanelLayout";

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
    <PackageProvider packageName={captify}>
      <ThreePanelLayout>{children}</ThreePanelLayout>
    </PackageProvider>
  );
}

export async function generateStaticParams() {
  // Define available packages for static generation
  const packages = ["core"]; // Add your packages here

  return packages.map((pkg) => ({
    captify: pkg,
  }));
}

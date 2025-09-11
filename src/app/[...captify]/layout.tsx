import { ReactNode } from "react";
import { ClientCaptifyLayout } from "../../components/ClientCaptifyLayout";

interface CaptifyLayoutProps {
  children: React.ReactNode;
  params: Promise<{ captify: string[] }>;
}

export default async function CaptifyPageLayout({
  children,
  params,
}: CaptifyLayoutProps) {
  const { captify } = await params;

  return (
    <ClientCaptifyLayout
      packageName={captify[0] || ""}
      packageSource="services/config"
    >
      {children}
    </ClientCaptifyLayout>
  );
}

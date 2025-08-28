import { AppLayout } from "@captify/client";

interface CaptifyLayoutProps { 
  children: React.ReactNode; 
  params: Promise<{ captify: string }>; 
}

export default async function CaptifyLayout({ children, params }: CaptifyLayoutProps) {
  const { captify } = await params;
  
  return <AppLayout>{children}</AppLayout>;
}

export async function generateStaticParams() {
  // Return empty array for now - no dynamic routes generated
  return [];
}

import ShellLayout from "@/components/layout/ShellLayout";

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ alias: string }>;
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const resolvedParams = await params;
  return <ShellLayout params={resolvedParams}>{children}</ShellLayout>;
}

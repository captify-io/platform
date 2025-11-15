import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

interface WorkspaceLayoutProps {
  children: ReactNode;
}

export default async function WorkspaceLayout({
  children,
}: WorkspaceLayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  // Workspace context comes from CaptifyProvider
  // which reads from userState.currentWorkspace

  return <>{children}</>;
}

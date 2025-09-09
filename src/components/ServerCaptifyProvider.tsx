import { ReactNode } from "react";
import { auth } from "@captify-io/core/auth";
import { CaptifyProvider } from "@captify-io/core/components";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

export async function ServerCaptifyProvider({
  children,
}: ServerCaptifyProviderProps) {
  const session = await auth();

  return <CaptifyProvider session={session}>{children}</CaptifyProvider>;
}

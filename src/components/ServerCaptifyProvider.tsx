import { ReactNode } from "react";
import { auth } from "../lib/auth";
import { CaptifyProvider } from "./providers/CaptifyProvider";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

export async function ServerCaptifyProvider({
  children,
}: ServerCaptifyProviderProps) {
  const session = await auth();

  return <CaptifyProvider session={session}>{children}</CaptifyProvider>;
}

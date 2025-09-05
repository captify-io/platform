import { ReactNode } from "react";
import { getServerSession } from "@captify/core/auth";
import { CaptifyProvider } from "@captify/core/components";

interface ServerCaptifyProviderProps {
  children: ReactNode;
}

export async function ServerCaptifyProvider({ children }: ServerCaptifyProviderProps) {
  const session = await getServerSession();
  
  return (
    <CaptifyProvider session={session}>
      {children}
    </CaptifyProvider>
  );
}

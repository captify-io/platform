import { ReactNode } from "react";
import { getServerSession } from "../lib/auth";
import { CaptifyProvider } from "./CaptifyProvider";

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

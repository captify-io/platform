import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "./api/[...nextauth]/lib/auth-config";
import { TopNavigation, SmartBreadcrumb } from "../components";
import { CaptifyProvider } from "../context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Captify Platform",
  description: "Multi-application platform with dynamic routing and AI capabilities",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <CaptifyProvider>
          <TopNavigation />
          <SmartBreadcrumb />
          {children}
        </CaptifyProvider>
      </body>
    </html>
  );
}

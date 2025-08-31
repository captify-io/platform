import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CaptifyLayout } from "../components/CaptifyLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Captify Platform",
  description:
    "Multi-application platform with dynamic routing and AI capabilities",
};

// Server component - minimal dependencies
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CaptifyLayout>{children}</CaptifyLayout>
      </body>
    </html>
  );
}

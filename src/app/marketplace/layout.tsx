import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace - Captify",
  description: "Discover and access applications",
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

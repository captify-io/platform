/**
 * Admin Layout
 * Full-screen flex layout for [sidebar][content] pattern
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin | Platform',
  description: 'Administer Captify platform applications, users, and settings',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      {children}
    </div>
  );
}

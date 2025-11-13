/**
 * Spaces Layout
 * Full-screen flex layout for [sidebar][content] pattern
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spaces | Platform',
  description: 'Work management system for government contracts',
};

export default function SpacesLayout({
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

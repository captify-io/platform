/**
 * Ontology Layout
 * Two-column layout with sidebar navigation and content area
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ontology | Platform',
  description: 'Visual ontology explorer and designer',
};

export default function OntologyLayout({
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

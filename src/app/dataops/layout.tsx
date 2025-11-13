/**
 * DataOps Layout
 * Two-column layout with sidebar navigation and content area
 */

import { Metadata } from 'next';
import { DataOpsLayoutWrapper } from './layout-wrapper';

export const metadata: Metadata = {
  title: 'DataOps | Platform',
  description: 'NextGen DataOps - AI-powered data operations platform',
};

export default function DataOpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex overflow-hidden bg-background">
      <DataOpsLayoutWrapper>{children}</DataOpsLayoutWrapper>
    </div>
  );
}

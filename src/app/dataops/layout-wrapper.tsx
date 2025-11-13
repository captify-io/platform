"use client";

/**
 * DataOps Layout Wrapper
 * Client component to handle sidebar and routing
 */

import { usePathname } from 'next/navigation';
import { DataOpsSidebar } from './components/dataops-sidebar';

export function DataOpsLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine active page from pathname
  const getActivePage = () => {
    if (pathname === '/dataops') return 'dashboard';
    if (pathname?.startsWith('/dataops/sources')) return 'sources';
    if (pathname?.startsWith('/dataops/products')) return 'products';
    if (pathname?.startsWith('/dataops/catalog')) return 'catalog';
    if (pathname?.startsWith('/dataops/quality')) return 'quality';
    if (pathname?.startsWith('/dataops/lineage')) return 'lineage';
    if (pathname?.startsWith('/dataops/compliance')) return 'compliance';
    if (pathname?.startsWith('/dataops/pipelines')) return 'pipelines';
    return undefined;
  };

  return (
    <>
      <DataOpsSidebar activePage={getActivePage()} />
      <div className="flex-1 flex overflow-hidden bg-background">
        {children}
      </div>
    </>
  );
}

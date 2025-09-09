'use client';

import { useEffect, useState } from 'react';
// Temporarily disabled - app-loader uses Node.js APIs not available in browser
// import { loadDynamicApps } from '@/lib/app-loader';

interface LoadedApp {
  enabled: boolean;
  path: string;
  package: string;
  module?: any;
}

export function AppRegistry({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<Record<string, LoadedApp>>({});
  const [loading, setLoading] = useState(false); // Changed to false since we're not loading

  // Temporarily disabled dynamic app loading
  // useEffect(() => {
  //   async function loadApps() {
  //     try {
  //       const loadedApps = await loadDynamicApps();
  //       setApps(loadedApps);
        
  //       // Store in window for global access
  //       if (typeof window !== 'undefined') {
  //         (window as any).__CAPTIFY_APPS__ = loadedApps;
  //       }
  //     } catch (error) {
  //       console.error('Failed to load apps:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   loadApps();
  // }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div data-captify-apps={Object.keys(apps).join(',')}>
      {children}
    </div>
  );
}

export function useApps() {
  const [apps, setApps] = useState<Record<string, LoadedApp>>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).__CAPTIFY_APPS__) {
      setApps((window as any).__CAPTIFY_APPS__);
    }
    // Temporarily disabled
    // else {
    //   loadDynamicApps().then(setApps);
    // }
  }, []);

  return apps;
}
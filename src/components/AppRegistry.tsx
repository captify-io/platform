'use client';

import { useEffect, useState } from 'react';

interface LoadedApp {
  enabled: boolean;
  path: string;
  package: string;
  module?: any;
}

export function AppRegistry({ children }: { children: React.ReactNode }) {
  const [apps, setApps] = useState<Record<string, LoadedApp>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Store empty apps for now - dynamic discovery happens at runtime
    if (typeof window !== 'undefined') {
      (window as any).__CAPTIFY_APPS__ = {};
    }
  }, []);

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
  }, []);

  return apps;
}
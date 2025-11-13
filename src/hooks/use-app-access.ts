import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { extractAppSlug, isSystemRoute } from '../lib/app-utils';
import { checkAppAccess } from '../actions/check-app-access';

interface AppConfig {
  slug: string;
  name: string;
  manifest?: {
    visibility?: string;
  };
}

interface AppAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  appConfig?: AppConfig;
  reason?: string;
}

/**
 * Hook to check app access
 * Reads config.json and checks if visibility === 'public'
 */
export function useAppAccess(): AppAccessResult {
  const pathname = usePathname();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<AppConfig | undefined>();
  const [reason, setReason] = useState<string | undefined>();

  useEffect(() => {
    async function check() {
      // System routes always have access
      if (isSystemRoute(pathname)) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      // Extract app slug
      const slug = extractAppSlug(pathname);
      if (!slug) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        // Call server action to read config and check visibility
        const result = await checkAppAccess(slug);

        setHasAccess(result.hasAccess);
        setReason(result.reason);
        setAppConfig(result.config);
      } catch (error) {
        console.error('[useAppAccess] Error:', error);
        setHasAccess(false);
        setReason('error');
      } finally {
        setIsLoading(false);
      }
    }

    check();
  }, [pathname]);

  return { hasAccess, isLoading, appConfig, reason };
}

"use client";

import { useRouter } from "next/navigation";
import { useNavigationLoading } from "@/context/NavigationLoadingContext";

export function useNavigationWithLoading() {
  const router = useRouter();
  const { showLoading, hideLoading } = useNavigationLoading();

  const navigateWithLoading = (
    href: string, 
    appName?: string, 
    delay = 100
  ) => {
    const message = appName ? `Loading ${appName}...` : "Loading application...";
    
    showLoading(message);
    
    // Small delay to show the loading screen before navigation
    setTimeout(() => {
      router.push(href);
    }, delay);
  };

  const replaceWithLoading = (
    href: string, 
    appName?: string, 
    delay = 100
  ) => {
    const message = appName ? `Loading ${appName}...` : "Loading application...";
    
    showLoading(message);
    
    // Small delay to show the loading screen before navigation
    setTimeout(() => {
      router.replace(href);
    }, delay);
  };

  return {
    navigateWithLoading,
    replaceWithLoading,
    showLoading,
    hideLoading,
  };
}

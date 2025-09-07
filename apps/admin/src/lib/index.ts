import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Logout function
export function logout() {
  // Clear any stored auth tokens
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth-token");
    sessionStorage.removeItem("auth-token");
  }

  // Redirect to sign out page
  window.location.href = "/auth/signout";
}

// API and applications functionality moved to root
export { apiClient, type CaptifyResponse } from "@captify/core/lib";

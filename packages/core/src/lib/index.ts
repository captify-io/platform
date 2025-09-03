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

// Re-export API types and client
export { apiClient } from "./api";
export type { CaptifyResponse, ApiRequest } from "./api";

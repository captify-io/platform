/**
 * Captify Hook - Re-export from CaptifyContext
 *
 * This hook provides access to the global Captify state including:
 * - User session and authentication
 * - Current application context
 * - Menu and navigation state
 * - Global application data
 */
"use client";

export { useCaptify } from "../context/CaptifyContext";
export type { CaptifyContextType } from "../context/CaptifyContext";

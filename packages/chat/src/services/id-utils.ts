/**
 * ID and timestamp utilities for chat system
 * Provides consistent ID generation and timestamp formatting
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Generate a timestamp with microsecond precision for DynamoDB sorting
 * Format: ISO string + microseconds (e.g., "2025-08-12T14:24:21.503456Z")
 */
export function generateTimestamp(): string {
  const now = new Date();
  const isoString = now.toISOString();

  // Add microseconds using performance.now() for higher precision
  const microseconds = Math.floor((performance.now() % 1000) * 1000)
    .toString()
    .padStart(6, "0");

  // Replace milliseconds with microseconds
  return isoString.slice(0, -4) + microseconds + "Z";
}

/**
 * Generate a message ID using UUID v4
 */
export function generateMessageId(): string {
  return uuidv4();
}

/**
 * Generate a thread ID using UUID v4
 */
export function generateThreadId(): string {
  return uuidv4();
}

/**
 * Generate a tool run ID using UUID v4
 */
export function generateToolRunId(): string {
  return uuidv4();
}

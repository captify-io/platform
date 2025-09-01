import { CaptifyClient } from "./client";

/**
 * Creates a CaptifyClient instance with default configuration
 */
export function createApiClient(): CaptifyClient {
  return new CaptifyClient({
    appId: "core",
    session: null, // Session will be handled by the client internally
  });
}

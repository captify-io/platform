// RMF API utilities - server-side only
export const RMF_API_VERSION = 'v1';

export function createRMFAPIEndpoint(path: string): string {
  return `/api/rmf/${RMF_API_VERSION}${path}`;
}
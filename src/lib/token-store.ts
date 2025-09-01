// In a real app, you'd store tokens in a database or secure cache
// For now, using in-memory storage (this will reset on server restart)
const tokenStore = new Map<
  string,
  {
    accessToken: string;
    idToken: string;
    refreshToken: string;
    expiresAt: number;
  }
>();

// Helper function to get tokens (for server-side use)
export function getUserTokens(userId: string) {
  return tokenStore.get(userId);
}

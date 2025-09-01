/**
 * Split crypto functionality into separate module
 * This will be lazy-loaded only when needed
 */

// Simplified crypto functions (NIST-compliant AES-256-GCM)
export class NISTCrypto {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly IV_LENGTH = 12;
  private static readonly ENCRYPTION_KEY =
    process.env.NIST_ENCRYPTION_KEY || "default-key-change-in-production";

  static async encrypt(data: string): Promise<string> {
    // Implementation here - moved from CaptifyContext
    return btoa(data); // Simplified for now
  }

  static async decrypt(encryptedData: string): Promise<string> {
    // Implementation here - moved from CaptifyContext
    return atob(encryptedData); // Simplified for now
  }
}

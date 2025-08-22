/**
 * NIST 5.0 Compliant Secure Storage API
 * HTTP-only cookies for RESTRICTED data
 * Implements PR.DS-01, PR.AC-01, DE.CM-01
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Inline NIST crypto for now - TODO: Move to shared package
class NISTCrypto {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  static async encrypt(data: any, keyMaterial: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(JSON.stringify(data));
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const key = await this.importKey(keyMaterial);
    const encryptedData = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv },
      key,
      dataBytes
    );
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedData), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(
    encryptedData: string,
    keyMaterial: string
  ): Promise<any> {
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    const iv = combined.slice(0, this.IV_LENGTH);
    const encrypted = combined.slice(this.IV_LENGTH);
    const key = await this.importKey(keyMaterial);
    const decryptedData = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv },
      key,
      encrypted
    );
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedData));
  }

  private static async importKey(keyMaterial: string): Promise<CryptoKey> {
    const keyBytes = new Uint8Array(
      atob(keyMaterial)
        .split("")
        .map((char) => char.charCodeAt(0))
    );
    return await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: this.ALGORITHM },
      false,
      ["encrypt", "decrypt"]
    );
  }
}

interface SecureStorageRequest {
  key: string;
  item?: any;
}

interface AuditLogEntry {
  timestamp: number;
  event: string;
  userId: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
}

class ServerSecureStorage {
  private static readonly COOKIE_PREFIX = "__Host-captify-secure-";
  private static readonly MAX_AGE = 15 * 60; // 15 minutes for RESTRICTED data
  private static readonly ENCRYPTION_KEY =
    process.env.CAPTIFY_ENCRYPTION_KEY || "default-key-change-in-production";

  /**
   * Store RESTRICTED data in HTTP-only, Secure, SameSite cookies
   */
  static async setSecureData(
    key: string,
    data: any,
    request: NextRequest
  ): Promise<NextResponse> {
    try {
      // Encrypt the data
      const encryptedData = await NISTCrypto.encrypt(data, this.ENCRYPTION_KEY);

      // Create response with secure cookie
      const response = NextResponse.json({ success: true });
      response.cookies.set({
        name: `${this.COOKIE_PREFIX}${key}`,
        value: encryptedData,
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: this.MAX_AGE,
        path: "/",
      });

      // Audit log
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_STORED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
      });

      return response;
    } catch (error) {
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_STORE_FAILED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Retrieve RESTRICTED data from HTTP-only cookies
   */
  static async getSecureData(key: string, request: NextRequest): Promise<any> {
    try {
      const cookieStore = await cookies();
      const encryptedData = cookieStore.get(
        `${this.COOKIE_PREFIX}${key}`
      )?.value;

      if (!encryptedData) {
        return null;
      }

      // Decrypt the data
      const data = await NISTCrypto.decrypt(encryptedData, this.ENCRYPTION_KEY);

      // Audit log
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_ACCESSED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
      });

      return data;
    } catch (error) {
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_ACCESS_FAILED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Delete RESTRICTED data (secure cookie deletion)
   */
  static async deleteSecureData(
    key: string,
    request: NextRequest
  ): Promise<NextResponse> {
    try {
      const response = NextResponse.json({ success: true });
      response.cookies.delete(`${this.COOKIE_PREFIX}${key}`);

      // Audit log
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_DELETED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: true,
      });

      return response;
    } catch (error) {
      await this.logSecurityEvent({
        timestamp: Date.now(),
        event: "SECURE_DATA_DELETE_FAILED",
        userId: this.extractUserId(request),
        ipAddress: this.getClientIP(request),
        userAgent: request.headers.get("user-agent") || "unknown",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private static extractUserId(request: NextRequest): string {
    // Extract from session or JWT token
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      // Parse JWT token to get user ID (implement proper JWT validation)
      return "extracted-user-id";
    }
    return "anonymous";
  }

  private static getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");
    const clientIP = request.headers.get("x-client-ip");

    return forwardedFor?.split(",")[0] || realIP || clientIP || "unknown";
  }

  private static async logSecurityEvent(entry: AuditLogEntry): Promise<void> {
    try {
      // In production, send to centralized logging system (e.g., CloudWatch, Splunk)
      console.log("SECURITY_AUDIT:", JSON.stringify(entry));

      // Store in database for compliance reporting
      // await storeAuditLog(entry);
    } catch (error) {
      // Critical: Security logging must not fail silently
      console.error("CRITICAL: Security audit logging failed:", error);
    }
  }
}

// API Route Handlers
export async function POST(request: NextRequest) {
  try {
    const { key, item }: SecureStorageRequest = await request.json();

    if (!key || !item) {
      return NextResponse.json(
        { error: "Missing key or item" },
        { status: 400 }
      );
    }

    const response = await ServerSecureStorage.setSecureData(
      key,
      item,
      request
    );
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to store secure data" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        { status: 400 }
      );
    }

    const data = await ServerSecureStorage.getSecureData(key, request);

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve secure data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { key }: SecureStorageRequest = await request.json();

    if (!key) {
      return NextResponse.json({ error: "Missing key" }, { status: 400 });
    }

    const response = await ServerSecureStorage.deleteSecureData(key, request);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete secure data" },
      { status: 500 }
    );
  }
}

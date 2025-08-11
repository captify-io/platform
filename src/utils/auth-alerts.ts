/**
 * Client-side authentication alerts and utilities
 */

export interface TokenStatus {
  isExpired: boolean;
  expiresAt: number;
  timeUntilExpiry: number;
  status: "expired" | "expiring-soon" | "valid";
}

/**
 * Check token expiration status
 */
export function checkTokenStatus(expiresAt: number): TokenStatus {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = expiresAt - now;

  let status: "expired" | "expiring-soon" | "valid";
  if (timeUntilExpiry <= 0) {
    status = "expired";
  } else if (timeUntilExpiry < 300) {
    // 5 minutes
    status = "expiring-soon";
  } else {
    status = "valid";
  }

  return {
    isExpired: timeUntilExpiry <= 0,
    expiresAt,
    timeUntilExpiry,
    status,
  };
}

/**
 * Show browser alert with token status
 */
export function showTokenAlert(
  tokenStatus: TokenStatus,
  userEmail?: string
): void {
  const expiryDate = new Date(tokenStatus.expiresAt * 1000);
  const currentDate = new Date();

  let message = `🔐 Authentication Token Status\n\n`;
  message += `User: ${userEmail || "Unknown"}\n`;
  message += `Current Time: ${currentDate.toLocaleString()}\n`;
  message += `Token Expires: ${expiryDate.toLocaleString()}\n`;
  message += `Time Until Expiry: ${tokenStatus.timeUntilExpiry} seconds\n\n`;

  switch (tokenStatus.status) {
    case "expired":
      message += `🔴 STATUS: EXPIRED\n`;
      message += `Token expired ${Math.abs(
        tokenStatus.timeUntilExpiry
      )} seconds ago!\n`;
      message += `You will be redirected to login.`;
      break;
    case "expiring-soon":
      message += `🟡 STATUS: EXPIRING SOON\n`;
      message += `Token will expire in ${tokenStatus.timeUntilExpiry} seconds.\n`;
      message += `The system will attempt to refresh automatically.`;
      break;
    case "valid":
      message += `🟢 STATUS: VALID\n`;
      message += `Token is valid for ${Math.floor(
        tokenStatus.timeUntilExpiry / 60
      )} minutes.`;
      break;
  }

  alert(message);
}

/**
 * Log detailed token information to console
 */
export function logTokenStatus(
  tokenStatus: TokenStatus,
  userEmail?: string
): void {
  const expiryDate = new Date(tokenStatus.expiresAt * 1000);
  const currentDate = new Date();

  console.log(`🔍 CLIENT-SIDE TOKEN CHECK:`);
  console.log(`   User: ${userEmail || "Unknown"}`);
  console.log(`   Current time: ${currentDate.toISOString()}`);
  console.log(`   Token expires: ${expiryDate.toISOString()}`);
  console.log(`   Time until expiry: ${tokenStatus.timeUntilExpiry} seconds`);

  const statusEmoji = {
    expired: "🔴",
    "expiring-soon": "🟡",
    valid: "🟢",
  };

  console.log(
    `   Status: ${
      statusEmoji[tokenStatus.status]
    } ${tokenStatus.status.toUpperCase()}`
  );

  if (tokenStatus.status === "expired") {
    console.error(
      `🚨 TOKEN EXPIRED ${Math.abs(tokenStatus.timeUntilExpiry)} seconds ago!`
    );
  }
}

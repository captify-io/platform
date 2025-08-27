/**
 * NextAuth Handler
 * Main authentication handler for the application
 */

import NextAuth from "next-auth";
import { authOptions } from "../../lib/auth-config";

// Create the NextAuth handler using the centralized auth configuration
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
export default handler;

/**
 * Collab Manager - Shared Instance Access
 *
 * Exports getInstance for use in API routes
 * Allows agents to access document instances and broadcast changes
 *
 * NOTE: This is exported from core but imports platform's instance manager.
 * Platform provides the getInstance and instances exports that core uses.
 */

import { getInstance, instances } from '../../../../platform/src/collab/instance.js';

export { getInstance };

/**
 * Broadcast a message to all clients connected to a document
 */
export function broadcastToDocument(documentId: string, message: any, excludeClientID: string | null = null): boolean {
  const instance = instances.get(documentId);

  if (!instance) {
    console.warn(`[CollabManager] No instance found for document ${documentId}`);
    return false;
  }

  const clients = Array.from(instance.users.values());
  let sentCount = 0;

  clients.forEach((client: any) => {
    if (client.readyState === 1 && client.clientID !== excludeClientID) {
      try {
        client.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error('[CollabManager] Error sending message:', error);
      }
    }
  });

  console.log(`[CollabManager] Broadcast to ${sentCount} clients on document ${documentId}`);
  return sentCount > 0;
}

/**
 * Get current document version
 */
export function getDocumentVersion(documentId: string) {
  const instance = instances.get(documentId);

  if (!instance) {
    return null;
  }

  return {
    version: instance.version,
    userCount: instance.userCount,
  };
}

/**
 * Get document instance if it exists
 */
export function getExistingInstance(documentId: string) {
  return instances.get(documentId) || null;
}

/**
 * Fabric WebSocket Utilities
 *
 * Provides functions to interact with the fabric WebSocket server
 * from API endpoints and other server-side code.
 */

import { WebSocket } from 'ws';

// Store for document instances and connected clients
// This will be populated by server.mjs
export const documentConnections = new Map<
  string,
  Set<WebSocket & { clientID?: string; documentId?: string }>
>();

/**
 * Register a WebSocket connection for a document
 * Called by server.mjs when a client connects
 */
export function registerConnection(
  documentId: string,
  ws: WebSocket & { clientID?: string; documentId?: string }
): void {
  if (!documentConnections.has(documentId)) {
    documentConnections.set(documentId, new Set());
  }
  documentConnections.get(documentId)!.add(ws);
}

/**
 * Unregister a WebSocket connection
 * Called by server.mjs when a client disconnects
 */
export function unregisterConnection(
  documentId: string,
  ws: WebSocket & { clientID?: string; documentId?: string }
): void {
  const connections = documentConnections.get(documentId);
  if (connections) {
    connections.delete(ws);
    if (connections.size === 0) {
      documentConnections.delete(documentId);
    }
  }
}

/**
 * Broadcast ProseMirror steps to a specific client by clientID
 * Steps are applied immediately, with pending marks for user review
 */
export async function broadcastStepsToClient(
  documentId: string,
  clientID: string,
  steps: any[],
  changeId: string
): Promise<void> {
  const connections = documentConnections.get(documentId);

  if (!connections || connections.size === 0) {
    console.log(`[Fabric WebSocket] No clients connected to ${documentId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'steps',
    steps,
    clientIDs: steps.map(() => 'agent'), // Mark as coming from agent
    changeId,
  });

  let found = false;

  connections.forEach((ws) => {
    if (ws.clientID === clientID && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        found = true;
        console.log(
          `[Fabric WebSocket] Sent ${steps.length} steps (change ${changeId}) to client ${clientID}`
        );
      } catch (error) {
        console.error(
          `[Fabric WebSocket] Failed to send to client ${clientID}:`,
          error
        );
      }
    }
  });

  if (!found) {
    console.warn(
      `[Fabric WebSocket] Client ${clientID} not found in ${connections.size} connected clients`
    );
  }
}

/**
 * Broadcast ProseMirror steps directly to all clients
 * Steps are applied immediately, with pending marks for user review
 */
export async function broadcastSteps(
  documentId: string,
  steps: any[],
  changeId: string
): Promise<void> {
  const connections = documentConnections.get(documentId);

  if (!connections || connections.size === 0) {
    console.log(`[Fabric WebSocket] No clients connected to ${documentId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'steps',
    steps,
    clientIDs: steps.map(() => 'agent'), // Mark as coming from agent
    changeId,
  });

  let broadcastCount = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        broadcastCount++;
      } catch (error) {
        console.error(
          `[Fabric WebSocket] Failed to send to client ${ws.clientID}:`,
          error
        );
      }
    }
  });

  console.log(
    `[Fabric WebSocket] Broadcast ${steps.length} steps (change ${changeId}) to ${broadcastCount} clients`
  );
}

/**
 * Broadcast a pending change to all clients connected to a document
 * DEPRECATED: Use broadcastSteps instead for mark-based approach
 */
export async function broadcastPendingChange(
  documentId: string,
  pendingChange: any
): Promise<void> {
  const connections = documentConnections.get(documentId);

  if (!connections || connections.size === 0) {
    console.log(`[Fabric WebSocket] No clients connected to ${documentId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'agent-change-pending',
    change: pendingChange,
  });

  let broadcastCount = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        broadcastCount++;
      } catch (error) {
        console.error(
          `[Fabric WebSocket] Failed to send to client ${ws.clientID}:`,
          error
        );
      }
    }
  });

  console.log(
    `[Fabric WebSocket] Broadcast pending change ${pendingChange.id} to ${broadcastCount} clients`
  );
}

/**
 * Broadcast accepted change to all clients
 * This triggers the actual application of the steps to the document
 */
export async function broadcastAcceptedChange(
  documentId: string,
  changeId: string,
  steps: any[]
): Promise<void> {
  const connections = documentConnections.get(documentId);

  if (!connections || connections.size === 0) {
    console.log(`[Fabric WebSocket] No clients connected to ${documentId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'agent-change-accepted',
    changeId,
    steps,
  });

  let broadcastCount = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        broadcastCount++;
      } catch (error) {
        console.error(
          `[Fabric WebSocket] Failed to send to client ${ws.clientID}:`,
          error
        );
      }
    }
  });

  console.log(
    `[Fabric WebSocket] Broadcast accepted change ${changeId} to ${broadcastCount} clients`
  );
}

/**
 * Broadcast rejected change to all clients
 */
export async function broadcastRejectedChange(
  documentId: string,
  changeId: string
): Promise<void> {
  const connections = documentConnections.get(documentId);

  if (!connections || connections.size === 0) {
    console.log(`[Fabric WebSocket] No clients connected to ${documentId}`);
    return;
  }

  const message = JSON.stringify({
    type: 'agent-change-rejected',
    changeId,
  });

  let broadcastCount = 0;

  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        broadcastCount++;
      } catch (error) {
        console.error(
          `[Fabric WebSocket] Failed to send to client ${ws.clientID}:`,
          error
        );
      }
    }
  });

  console.log(
    `[Fabric WebSocket] Broadcast rejected change ${changeId} to ${broadcastCount} clients`
  );
}

/**
 * Get count of connected clients for a document
 */
export function getConnectionCount(documentId: string): number {
  const connections = documentConnections.get(documentId);
  return connections ? connections.size : 0;
}

/**
 * Get all connected document IDs
 */
export function getConnectedDocuments(): string[] {
  return Array.from(documentConnections.keys());
}

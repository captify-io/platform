/**
 * Custom Server for Platform with ProseMirror Collab WebSocket Support
 *
 * Based on https://github.com/ProseMirror/website/blob/master/src/collab/server/server.js
 *
 * Runs Next.js and WebSocket server on the same port (3000)
 * - HTTP/HTTPS requests → Next.js
 * - WebSocket upgrade requests to /ws/fabric → ProseMirror collab server
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { getToken } from 'next-auth/jwt';
import { Node } from 'prosemirror-model';
import { Step } from 'prosemirror-transform';
import { getInstance } from './src/collab/instance.js';
import {
  registerConnection,
  unregisterConnection,
} from './src/app/api/lib/fabric-websocket.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

/**
 * Load document from DynamoDB
 */
async function loadDocument(documentId, schema, credentials, session) {
  try {
    const { fabric } = await import('@captify-io/core/services');

    // Get note from DynamoDB
    const result = await fabric.execute(
      {
        service: 'fabric',
        operation: 'getNote',
        data: { noteId: documentId },
      },
      credentials,
      session
    );

    if (!result.success || !result.note) {
      // Create empty document with one paragraph
      console.log(`[Collab] Creating new document ${documentId}`);
      return {
        doc: schema.nodeFromJSON({
          type: 'doc',
          content: [{ type: 'paragraph' }],
        }),
        version: 0,
      };
    }

    const note = result.note;

    // Load ProseMirror document from JSON
    if (note.doc) {
      console.log(`[Collab] Loaded document ${documentId}, version ${note.version || 0}`);
      return {
        doc: schema.nodeFromJSON(note.doc),
        version: note.version || 0,
      };
    }

    // Empty document with one paragraph
    return {
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
      version: 0,
    };
  } catch (error) {
    console.error(`[Collab] Error loading document ${documentId}:`, error);
    // Return empty document with one paragraph on error
    return {
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [{ type: 'paragraph' }],
      }),
      version: 0,
    };
  }
}

/**
 * Save document to DynamoDB (debounced)
 */
const saveTimers = new Map();

function debouncedSaveToDatabase(documentId, spaceId, doc, version, credentials, session) {
  // Clear existing timer
  if (saveTimers.has(documentId)) {
    clearTimeout(saveTimers.get(documentId));
  }

  // Set new timer - save after 2 seconds of inactivity
  const timer = setTimeout(async () => {
    try {
      console.log(`[Collab] Saving ${documentId} to DynamoDB, version ${version}`);

      const { fabric } = await import('@captify-io/core/services');

      // Save document as ProseMirror JSON
      await fabric.execute(
        {
          service: 'fabric',
          operation: 'updateNote',
          data: {
            noteId: documentId,
            doc: doc.toJSON(), // Store as searchable JSON
            version,
          },
        },
        credentials,
        session
      );

      console.log(`[Collab] Saved ${documentId} successfully`);
    } catch (error) {
      console.error(`[Collab] Failed to save ${documentId}:`, error);
    } finally {
      saveTimers.delete(documentId);
    }
  }, 2000);

  saveTimers.set(documentId, timer);
}

/**
 * Handle WebSocket connection
 */
async function handleWebSocket(ws, request) {
  const { query } = parse(request.url, true);
  const { documentId, spaceId } = query;

  if (!documentId || !spaceId) {
    ws.close(1008, 'Missing required parameters');
    return;
  }

  // Auth entication (same as before)
  const mockReq = {
    headers: request.headers,
    cookies: {},
  };

  const cookieHeader = request.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...rest] = cookie.split('=');
      mockReq.cookies[name.trim()] = rest.join('=');
    });
  }

  let token;
  try {
    token = await getToken({
      req: mockReq,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: dev ? 'next-auth.session-token' : '__Secure-next-auth.session-token',
    });
  } catch (error) {
    console.error('[Collab] Failed to get session token:', error);
    ws.close(1008, 'Invalid session token');
    return;
  }

  if (!token) {
    console.error('[Collab] No valid session token found');
    ws.close(1008, 'Authentication required');
    return;
  }

  const { getStoredTokens } = await import('./src/lib/auth-store.ts');
  const sessionId = token.sessionId;

  if (!sessionId) {
    console.error('[Collab] No sessionId in token');
    ws.close(1008, 'Invalid session');
    return;
  }

  const storedTokens = await getStoredTokens(sessionId);
  if (!storedTokens) {
    console.error('[Collab] No stored tokens found');
    ws.close(1008, 'Session expired');
    return;
  }

  const { getAwsCredentialsFromIdentityPool } = await import('./src/app/api/lib/credentials.ts');

  const sessionWithTokens = {
    user: {
      id: token.sub,
      email: token.email,
      name: token.name || token.email,
    },
    idToken: storedTokens.idToken,
    accessToken: storedTokens.accessToken,
  };

  let credentials;
  try {
    credentials = await getAwsCredentialsFromIdentityPool(
      sessionWithTokens,
      process.env.COGNITO_IDENTITY_POOL_ID,
      false
    );
  } catch (error) {
    console.error('[Collab] Failed to get AWS credentials:', error);
    ws.close(1008, 'Failed to get credentials');
    return;
  }

  const session = {
    user: {
      id: token.sub,
      userId: token.sub,
      email: token.email,
      name: token.name || token.email,
      organizationId: token.organizationId,
    },
    organizationId: token.organizationId,
    clearanceLevel: token.clearanceLevel || 'UNCLASSIFIED',
    markings: token.markings || [],
  };

  const userId = token.sub;
  const clientID = randomUUID();

  console.log(`[Collab] Client ${userId} (${clientID}) connected to ${documentId}`);

  // Get schema from core
  const { schema } = await import('@captify-io/core/components/fabric');

  // Get or create document instance
  const instance = await getInstance(
    documentId,
    schema,
    (docId, sch) => loadDocument(docId, sch, credentials, session)
  );

  // Add connection to instance (use clientID as unique identifier)
  instance.addUser(clientID, ws);

  // Store metadata on WebSocket
  ws.clientID = clientID;
  ws.documentId = documentId;
  ws.spaceId = spaceId;
  ws.userId = userId;
  ws.credentials = credentials;
  ws.session = session;
  ws.instance = instance;
  ws.isAlive = true;

  // Register connection for fabric-websocket utilities
  registerConnection(documentId, ws);

  // Send initial state
  ws.send(JSON.stringify({
    type: 'connected',
    clientID,
    documentId,
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'sync':
          // Client requesting sync
          handleSync(ws, message);
          break;

        case 'steps':
          // Client sending steps
          handleSteps(ws, message);
          break;

        case 'presence':
          // Client sending presence update (cursor/selection position)
          handlePresence(ws, message);
          break;

        case 'pullUpdates':
          // Client requesting updates since version
          handlePullUpdates(ws, message);
          break;

        default:
          console.warn(`[Collab] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[Collab] Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message',
      }));
    }
  });

  // Handle pong
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // Handle disconnect
  ws.on('close', () => {
    console.log(`[Collab] Client ${userId} (${clientID}) disconnected from ${documentId}`);
    instance.removeUser(clientID);

    // Unregister connection for fabric-websocket utilities
    unregisterConnection(documentId, ws);

    // Notify other clients that this user left
    const clients = Array.from(instance.users.values());
    clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'user_left',
          clientID,
          userId,
        }));
      }
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`[Collab] WebSocket error for ${userId} (${clientID}):`, error);
  });
}

/**
 * Handle sync request
 */
function handleSync(ws, message) {
  const instance = ws.instance;

  // Send current document and version
  ws.send(JSON.stringify({
    type: 'sync',
    doc: instance.doc.toJSON(),
    version: instance.version,
  }));

  console.log(`[Collab] Sent sync to ${ws.userId}, version ${instance.version}`);
}

/**
 * Handle steps from client
 */
function handleSteps(ws, message) {
  const { version, steps: stepsJSON, clientID } = message;
  const instance = ws.instance;
  const schema = instance.doc.type.schema;

  try {
    // Deserialize steps
    const steps = stepsJSON.map(json => Step.fromJSON(schema, json));

    // Add steps to instance
    const result = instance.addEvents(version, steps, clientID || ws.clientID);

    if (!result) {
      // Version mismatch - client needs to sync
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Version not current',
        code: 'VERSION_MISMATCH',
      }));
      return;
    }

    // Broadcast steps to ALL clients (including sender)
    // This is critical: the sender needs to receive their own steps back
    // so receiveTransaction() can confirm them and update the version
    const clients = Array.from(instance.users.values());
    clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'steps',
          version: instance.version - steps.length, // Starting version
          steps: stepsJSON,
          clientIDs: steps.map(() => clientID || ws.clientID),
        }));
      }
    });

    // Save to DynamoDB (debounced)
    debouncedSaveToDatabase(
      ws.documentId,
      ws.spaceId,
      instance.doc,
      instance.version,
      ws.credentials,
      ws.session
    );

    console.log(`[Collab] Applied ${steps.length} steps from ${ws.userId}, new version ${instance.version}`);
  } catch (error) {
    console.error('[Collab] Error handling steps:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Failed to apply steps',
    }));
  }
}

/**
 * Handle presence update (cursor/selection position)
 */
function handlePresence(ws, message) {
  const instance = ws.instance;

  // Broadcast presence to all OTHER clients (not sender)
  const clients = Array.from(instance.users.values());
  clients.forEach(client => {
    if (client !== ws && client.readyState === 1) {
      client.send(JSON.stringify({
        type: 'presence',
        clientID: message.clientID,
        userId: message.userId,
        userName: message.userName,
        userColor: message.userColor,
        selection: message.selection,
      }));
    }
  });
}

/**
 * Handle pull updates request
 */
function handlePullUpdates(ws, message) {
  const { version } = message;
  const instance = ws.instance;

  const data = instance.getEvents(version);

  if (data === false) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'History no longer available',
    }));
    return;
  }

  // If there are new steps, send them
  if (data.steps.length > 0) {
    ws.send(JSON.stringify({
      type: 'steps',
      version,
      steps: data.steps.map(s => s.toJSON()),
      clientIDs: data.steps.map(s => s.clientID),
    }));
  } else {
    // No new steps - client is up to date
    ws.send(JSON.stringify({
      type: 'upToDate',
      version: instance.version,
    }));
  }
}

// Prepare Next.js app
app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server
  const wss = new WebSocketServer({
    noServer: true,
    path: '/ws/fabric',
  });

  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url);

    if (pathname === '/ws/fabric') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        handleWebSocket(ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`[Collab] Terminating inactive client: ${ws.userId}`);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Cleanup
  server.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  // Start server
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> ProseMirror Collab WebSocket server listening on ws://${hostname}:${port}/ws/fabric`);
  });
});

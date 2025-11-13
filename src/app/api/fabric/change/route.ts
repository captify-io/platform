/**
 * Fabric Change API Endpoint
 *
 * Receives change requests from agents and broadcasts them as pending changes
 * to all connected clients via WebSocket.
 *
 * Flow:
 * 1. Agent calls this endpoint with operation details
 * 2. Validate authentication and parse operation
 * 3. Create ProseMirror steps for the change
 * 4. Broadcast to WebSocket as pending change
 * 5. Clients display change with accept/reject UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { randomUUID } from 'crypto';

// Import WebSocket broadcast function
import { broadcastPendingChange } from '../../lib/fabric-websocket';

interface ChangeRequest {
  documentId: string;
  clientId: string; // REQUIRED: Browser client ID for WebSocket targeting
  operation: 'insert' | 'delete' | 'replace';

  // Position specification (one of these required)
  position?: number;
  searchCriteria?: {
    text: string;
    occurrence: number; // 1-based (1 = first occurrence)
  };
  from?: number;
  to?: number;

  // Content for insert/replace
  content?: string | any; // string or ProseMirrorNode JSON

  // Metadata
  reason?: string;
  agentId?: string;
  threadId?: string;
}

interface ChangeResponse {
  success: boolean;
  pendingChangeId?: string;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChangeResponse>> {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // 1. Authenticate
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated. Please log in.',
        },
        { status: 401, headers }
      );
    }

    // 2. Parse request body
    let body: ChangeRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
        },
        { status: 400, headers }
      );
    }

    // 3. Validate required fields
    if (!body.documentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'documentId is required',
        },
        { status: 400, headers }
      );
    }

    if (!body.operation) {
      return NextResponse.json(
        {
          success: false,
          error: 'operation is required (insert, delete, replace)',
        },
        { status: 400, headers }
      );
    }

    // 4. Validate position specification
    const hasPosition = body.position !== undefined;
    const hasSearchCriteria = body.searchCriteria !== undefined;
    const hasRange = body.from !== undefined && body.to !== undefined;

    if (!hasPosition && !hasSearchCriteria && !hasRange) {
      return NextResponse.json(
        {
          success: false,
          error: 'Must specify position, searchCriteria, or from/to range',
        },
        { status: 400, headers }
      );
    }

    // 5. Validate content for insert/replace
    if ((body.operation === 'insert' || body.operation === 'replace') && !body.content) {
      return NextResponse.json(
        {
          success: false,
          error: `content is required for ${body.operation} operation`,
        },
        { status: 400, headers }
      );
    }

    // 6. Load document to validate and resolve positions
    const { fabric } = await import('@captify-io/core/services');
    const { getAwsCredentialsFromIdentityPool } = await import('../../lib/credentials');
    const { getStoredTokens } = await import('../../../../lib/auth-store');

    const sessionId = (session as any).sessionId;
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session',
        },
        { status: 401, headers }
      );
    }

    const storedTokens = await getStoredTokens(sessionId);
    if (!storedTokens) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session expired',
        },
        { status: 401, headers }
      );
    }

    const sessionWithTokens = {
      ...session,
      idToken: storedTokens.idToken,
      accessToken: storedTokens.accessToken,
    };

    const credentials = await getAwsCredentialsFromIdentityPool(
      sessionWithTokens,
      process.env.COGNITO_IDENTITY_POOL_ID!,
      false
    );

    // Load document
    const noteResult = await fabric.execute(
      {
        service: 'fabric',
        operation: 'getNote',
        data: { noteId: body.documentId },
      },
      credentials,
      {
        user: {
          id: session.user.id,
          userId: session.user.id,
          email: session.user.email,
          name: session.user.name,
          organizationId: (session as any).organizationId,
        },
        organizationId: (session as any).organizationId,
      }
    );

    if (!noteResult.success || !noteResult.note) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found',
        },
        { status: 404, headers }
      );
    }

    const note = noteResult.note;

    // 7. Resolve position if using searchCriteria
    let position = body.position;
    let from = body.from;
    let to = body.to;

    if (body.searchCriteria) {
      // Load schema and document
      const { schema } = await import('@captify-io/core/components/fabric');
      const doc = schema.nodeFromJSON(note.doc);

      // Search document text for the criteria
      const searchResult = findTextInDocument(
        doc,
        body.searchCriteria.text,
        body.searchCriteria.occurrence
      );

      if (!searchResult) {
        return NextResponse.json(
          {
            success: false,
            error: `Could not find "${body.searchCriteria.text}" (occurrence ${body.searchCriteria.occurrence})`,
          },
          { status: 400, headers }
        );
      }

      position = searchResult.position;
      from = searchResult.from;
      to = searchResult.to;
    }

    // 8. Create ProseMirror steps with pending mark
    const { schema } = await import('@captify-io/core/components/fabric');
    const { Fragment, Slice } = await import('prosemirror-model');
    const { ReplaceStep, AddMarkStep, RemoveMarkStep } = await import('prosemirror-transform');

    const changeId = randomUUID();
    const pendingMark = schema.marks.pending.create({
      id: changeId,
      agentId: body.agentId || 'agent',
      reason: body.reason,
      createdAt: Date.now().toString(),
    });

    let steps: any[] = [];
    let inverseSteps: any[] = [];

    try {
      if (body.operation === 'insert') {
        // Insert content WITH pending mark
        const insertPos = position || from || 0;
        let content;

        if (typeof body.content === 'string') {
          // Create text with pending mark
          content = schema.text(body.content, [pendingMark]);
        } else {
          // For node content, wrap in pending mark if possible
          const node = schema.nodeFromJSON(body.content);
          content = node.mark([pendingMark]);
        }

        // Create insert step
        const slice = new Slice(Fragment.from(content), 0, 0);
        const step = new ReplaceStep(insertPos, insertPos, slice);
        steps.push(step.toJSON());

        // Inverse: delete the inserted content
        const invStep = new ReplaceStep(insertPos, insertPos + content.nodeSize, Slice.empty);
        inverseSteps.unshift(invStep.toJSON());

      } else if (body.operation === 'delete') {
        // For delete: add pending mark to existing content
        // User can then reject to keep it, or accept to delete it
        const deleteFrom = from || position || 0;
        const deleteTo = to || (deleteFrom + 1);

        // Add mark to indicate deletion
        const step = new AddMarkStep(deleteFrom, deleteTo, pendingMark);
        steps.push(step.toJSON());

        // Inverse: remove the mark
        const invStep = new RemoveMarkStep(deleteFrom, deleteTo, pendingMark);
        inverseSteps.unshift(invStep.toJSON());

      } else if (body.operation === 'replace') {
        // Replace: mark old content for deletion, insert new content with pending mark
        const replaceFrom = from || position || 0;
        const replaceTo = to || (replaceFrom + 1);

        // Step 1: Mark existing content for deletion
        const markStep = new AddMarkStep(replaceFrom, replaceTo, pendingMark);
        steps.push(markStep.toJSON());

        // Step 2: Insert new content with pending mark after the old content
        let newContent;
        if (typeof body.content === 'string') {
          newContent = schema.text(body.content, [pendingMark]);
        } else {
          const node = schema.nodeFromJSON(body.content);
          newContent = node.mark([pendingMark]);
        }

        const slice = new Slice(Fragment.from(newContent), 0, 0);
        const insertStep = new ReplaceStep(replaceTo, replaceTo, slice);
        steps.push(insertStep.toJSON());

        // Inverse: remove inserted content, remove mark from original
        const invInsert = new ReplaceStep(replaceTo, replaceTo + newContent.nodeSize, Slice.empty);
        const invMark = new RemoveMarkStep(replaceFrom, replaceTo, pendingMark);
        inverseSteps.unshift(invInsert.toJSON(), invMark.toJSON());
      }
    } catch (stepError) {
      console.error('[Fabric Change] Error creating steps:', stepError);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create steps: ${stepError instanceof Error ? stepError.message : 'Unknown error'}`,
        },
        { status: 500, headers }
      );
    }

    // 9. Broadcast steps directly via WebSocket to specific client
    // No DynamoDB storage - the document IS the source of truth
    try {
      const { broadcastStepsToClient } = await import('../../lib/fabric-websocket');
      await broadcastStepsToClient(body.documentId, body.clientId, steps, changeId);
    } catch (broadcastError) {
      console.error('[Fabric Change] Failed to broadcast steps:', broadcastError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to broadcast change to connected clients',
        },
        { status: 500, headers }
      );
    }

    // 10. Return success
    return NextResponse.json(
      {
        success: true,
        changeId,
        message: 'Change applied to document with pending mark. Users can accept/reject.',
      },
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Fabric Change] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500, headers }
    );
  }
}

/**
 * Find text in ProseMirror document
 * Returns the position of the nth occurrence
 */
function findTextInDocument(
  doc: any,
  searchText: string,
  occurrence: number
): { position: number; from: number; to: number } | null {
  const text = doc.textContent;
  const searchLower = searchText.toLowerCase();
  const textLower = text.toLowerCase();

  let count = 0;
  let index = -1;

  // Find nth occurrence
  while (count < occurrence) {
    index = textLower.indexOf(searchLower, index + 1);
    if (index === -1) {
      return null;
    }
    count++;
  }

  // Convert text index to ProseMirror position
  // Text index is 0-based, ProseMirror position accounts for node boundaries
  let pos = 1; // Start after doc node
  let textPos = 0;

  doc.descendants((node: any, nodePos: number) => {
    if (node.isText) {
      const nodeTextLength = node.text.length;
      if (textPos + nodeTextLength > index) {
        // Found the node containing our position
        const offsetInNode = index - textPos;
        pos = nodePos + offsetInNode;
        return false; // Stop iteration
      }
      textPos += nodeTextLength;
    } else if (node.isTextblock) {
      // Space between blocks
      textPos += 1;
    }
    return true; // Continue iteration
  });

  return {
    position: pos,
    from: pos,
    to: pos + searchText.length,
  };
}

/**
 * Generate preview text for pending change
 */
function generatePreview(
  operation: string,
  content: any,
  reason?: string
): string {
  if (reason) {
    return reason;
  }

  const contentText = typeof content === 'string'
    ? content
    : content?.text || JSON.stringify(content).substring(0, 50);

  switch (operation) {
    case 'insert':
      return `Insert "${contentText.substring(0, 50)}${contentText.length > 50 ? '...' : ''}"`;
    case 'delete':
      return 'Delete selected text';
    case 'replace':
      return `Replace with "${contentText.substring(0, 50)}${contentText.length > 50 ? '...' : ''}"`;
    default:
      return `${operation} operation`;
  }
}

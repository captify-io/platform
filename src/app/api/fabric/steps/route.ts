/**
 * Fabric Steps API Endpoint
 *
 * COMMENTED OUT: Causes React bundling issues in server context
 *
 * Server-side endpoint for applying ProseMirror steps to a document.
 * Used by agent tools to make collaborative edits without WebSocket connections.
 *
 * This endpoint:
 * 1. Validates authentication
 * 2. Gets AWS credentials
 * 3. Applies steps to the document instance
 * 4. Broadcasts to all connected WebSocket clients
 * 5. Saves to DynamoDB
 */

/*
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';

// fabric-steps types (will import function dynamically at runtime)
interface ApplyStepsRequest {
  documentId: string;
  spaceId: string;
  version: number;
  steps: any[];
  clientID?: string;
}

export async function POST(request: NextRequest) {
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
    let body: ApplyStepsRequest;
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

    if (!body.spaceId) {
      return NextResponse.json(
        {
          success: false,
          error: 'spaceId is required',
        },
        { status: 400, headers }
      );
    }

    if (body.version === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'version is required',
        },
        { status: 400, headers }
      );
    }

    if (!body.steps || !Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'steps array is required and must not be empty',
        },
        { status: 400, headers }
      );
    }

    // 4. Get AWS credentials
    const { getStoredTokens } = await import('../../../../lib/auth-store');
    const { getAwsCredentialsFromIdentityPool } = await import('../../lib/credentials');

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

    // 5. Apply steps using helper (dynamic import to avoid bundling)
    const { applySteps } = await import('@captify-io/core/lib/fabric-steps');

    const apiSession = {
      user: {
        id: session.user.id,
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        organizationId: (session as any).organizationId,
      },
      organizationId: (session as any).organizationId,
    };

    const result = await applySteps(body, credentials, apiSession);

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 400, headers }
      );
    }

    return NextResponse.json(
      result,
      { status: 200, headers }
    );

  } catch (error) {
    console.error('[Fabric Steps API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500, headers }
    );
  }
}
*/

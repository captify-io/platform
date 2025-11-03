/**
 * Tool Registration API
 * Bulk register tools from JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/auth';
import { apiClient } from '@captify-io/core/lib/api';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tools from request body
    const { tools } = await request.json();

    if (!Array.isArray(tools)) {
      return NextResponse.json({ error: 'Invalid tools array' }, { status: 400 });
    }

    // Register each tool
    const results = [];
    for (const tool of tools) {
      try {
        const result = await apiClient.run({
          service: 'platform.dynamodb',
          operation: 'put',
          table: 'core-tool',
          data: {
            Item: tool
          }
        });

        results.push({
          id: tool.id,
          name: tool.name,
          success: result.success,
          error: result.error
        });
      } catch (error: any) {
        results.push({
          id: tool.id,
          name: tool.name,
          success: false,
          error: error.message
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      registered: successful,
      failed,
      results
    });

  } catch (error: any) {
    console.error('Tool registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to register tools' },
      { status: 500 }
    );
  }
}

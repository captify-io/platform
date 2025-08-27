// Types for client-side API functionality

export interface CaptifyRequest {
  // DynamoDB operations
  table?: string;
  key?: Record<string, any>;
  item?: Record<string, any>;

  // DynamoDB Query/Scan parameters (camelCase to match backend)
  indexName?: string;
  keyConditionExpression?: string;
  filterExpression?: string;
  expressionAttributeValues?: Record<string, any>;
  expressionAttributeNames?: Record<string, string>;
  limit?: number;
  scanIndexForward?: boolean;
  exclusiveStartKey?: Record<string, any>;

  // S3 operations (future)
  bucket?: string;

  // Lambda operations (future)
  function?: string;

  // Generic resource operations
  resource?: string;
  operation?: string;
  params?: Record<string, any>;
  data?: any;
}

export interface CaptifyResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    requestId: string;
    timestamp: string;
    source: string;
  };
}

export interface CaptifyClientOptions {
  appId?: string;
  baseUrl?: string;
  session?: any; // NextAuth session object
}

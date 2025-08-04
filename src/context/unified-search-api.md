# Unified Search API - Direct AWS Integration

## Architecture Overview

The unified search API (`/api/search`) connects directly to AWS services instead of using intermediate Lambda functions. This approach provides several benefits:

### Benefits of Direct Integration

- **Simpler Architecture**: No intermediate Lambda functions or API Gateway complexity
- **Better Performance**: Eliminates extra network hops through Lambda/API Gateway
- **Cost Effective**: No Lambda execution costs, only AWS service usage
- **Easier Development**: Direct debugging in Next.js environment
- **Better Error Handling**: Full control over error responses and logging
- **Reduced Latency**: Direct connection to Neptune, S3, and other services

## Implementation Details

### File Structure

```
src/app/api/search/route.ts    # Main search API implementation
```

### AWS Services Integration

#### 1. AWS Service Catalog

- **Client**: `ServiceCatalogClient` from `@aws-sdk/client-service-catalog`
- **Purpose**: Search for AWS service products using real Service Catalog API
- **Query Type**: Full-text search across service names and descriptions
- **Authentication**: Uses AWS credentials from environment variables

#### 2. Amazon Neptune (Graph Database)

- **Client**: `NeptunedataClient` from `@aws-sdk/client-neptunedata`
- **Purpose**: Search graph data using Gremlin queries
- **Query Type**: Searches for vertices with matching name, title, or description
- **Authentication**: Uses AWS credentials from environment variables

#### 2. Amazon S3 (Object Storage)

- **Client**: `S3Client` from `@aws-sdk/client-s3`
- **Purpose**: Search documents and files by prefix
- **Query Type**: List objects with query as prefix
- **Authentication**: Uses AWS credentials from environment variables

#### 3. AWS Services Catalog

- **Type**: Real-time AWS Service Catalog API calls
- **Purpose**: Search actual AWS service products from Service Catalog
- **Search Fields**: Product name, description, support information

### Authentication Flow

1. **Session Validation**: Uses NextAuth.js to validate user session
2. **AWS Credentials**: Uses environment variables for AWS SDK authentication
3. **Authorization**: Returns 401 for unauthenticated requests

### Search Algorithm

The search performs parallel queries across multiple real AWS data sources:

1. **AWS Service Catalog** (real-time API)

   - Calls AWS Service Catalog SearchProducts API
   - Returns up to `limit/3` results to balance with other sources

2. **Neptune Graph Database** (if configured)

   - Executes Gremlin query to find matching vertices
   - Returns up to `limit/2` results to balance with other sources
   - Gracefully handles failures without affecting other searches

3. **S3 Object Storage** (if configured)
   - Lists objects with query as prefix
   - Returns up to `limit/3` results
   - Gracefully handles failures without affecting other searches

### Response Format

```typescript
interface SearchResponse {
  query: string;
  totalResults: number;
  sections: SearchSection[];
  suggestions: string[];
  executionTime: number;
}

interface SearchSection {
  sectionTitle: string;
  provider: string;
  totalCount: number;
  results: SearchResult[];
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  serviceId: string;
  topServiceFeatures: string[];
  source: string;
}
```

### Environment Configuration

Required environment variables:

```bash
# AWS Configuration
REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Neptune (optional)
NEPTUNE_ENDPOINT=your-neptune-endpoint
NEPTUNE_PORT=8182
MOCK_NEPTUNE=true  # Set to false for real Neptune queries

# S3 (optional)
S3_BUCKET=your-bucket-name
```

### Error Handling

- **Authentication Errors**: Returns 401 Unauthorized
- **Validation Errors**: Returns 400 Bad Request for missing query
- **Service Errors**: Individual service failures don't affect overall search
- **Internal Errors**: Returns 500 with error details

### Performance Optimizations

1. **Parallel Execution**: All search sources are queried simultaneously
2. **Result Limiting**: Each source has proportional limits to balance results
3. **Graceful Degradation**: Failed services don't break the overall search
4. **Execution Timing**: Tracks and returns search execution time

### Usage Examples

#### POST Request

```bash
curl -X POST http://localhost:3001/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "lambda", "limit": 10}'
```

#### GET Request

```bash
curl "http://localhost:3001/api/search?query=s3&limit=5"
```

### Integration with Frontend

The search API integrates with the `useUnifiedSearch` hook and `GlobalSearch` component:

1. **Debounced Input**: 300ms delay to prevent excessive API calls
2. **Real-time Results**: Updates dropdown as user types
3. **Keyboard Navigation**: Supports arrow keys and Enter for selection
4. **Loading States**: Shows loading indicator during search

### Future Enhancements

1. **Bedrock Integration**: Add AI-powered semantic search using Amazon Bedrock
2. **Full-text Search**: Implement Elasticsearch or OpenSearch for document content
3. **Caching**: Add Redis caching for frequently searched terms
4. **Analytics**: Track search patterns and optimize results
5. **Faceted Search**: Add filters by service type, provider, etc.

## Testing the Implementation

1. Start the development server: `npm run dev`
2. Navigate to any authenticated page
3. Use the search box in the top navigation (Alt+S shortcut)
4. Type queries like "lambda", "s3", "cognito" to see results
5. Check browser dev tools for API call details and timing

The search now works entirely through direct AWS service integration without requiring Lambda functions or API Gateway deployment.

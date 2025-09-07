# Captify Package Development Template

This template defines the standard structure and patterns for creating new Captify packages. Follow these conventions to ensure consistency and proper integration with the core platform.

## Package Structure

```
packages/{package-name}/
├── src/
│   ├── app/                    # Application pages and client logic
│   │   ├── index.ts            # Main export file for all pages
│   │   ├── client.ts           # Client-side application logic
│   │   ├── pageLoader.ts       # Dynamic page loader
│   │   └── pages/              # Page components
│   │       ├── Dashboard.tsx   # Main dashboard page
│   │       ├── Settings.tsx    # Settings page
│   │       └── index.ts        # Export all pages
│   ├── services/               # Backend API services
│   │   ├── index.ts           # Main service export
│   │   └── {service}.ts       # Individual service implementations
│   ├── components/             # Reusable UI components
│   │   ├── index.ts           # Component exports
│   │   └── {component}/       # Component folders
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts           # Type exports
│   │   └── {domain}.ts        # Domain-specific types
│   ├── lib/                    # Utility functions and helpers
│   │   └── index.ts           # Library exports
│   └── hooks/                  # React hooks
│       └── index.ts           # Hook exports
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
└── tsup.config.ts             # Build configuration
```

## 1. Types and Database Tables

### Core Type Extension

All database entities MUST extend the Core interface. This automatically creates DynamoDB tables.

```typescript
// src/types/{domain}.ts
import { Core } from "@captify/core/types";

// This interface will automatically create a DynamoDB table: captify-{package}-User
export interface User extends Core {
  // Core provides: id, slug, name, app, order, fields, description,
  //                ownerId, createdAt, createdBy, updatedAt, updatedBy

  // Add domain-specific fields
  email: string;
  username: string;
  status: "active" | "inactive" | "pending";
  profile: {
    firstName: string;
    lastName: string;
    department?: string;
  };
  roles: string[];
  preferences: Record<string, any>;
}

// Complex types with nested structures
export interface DomainType extends Core {
  type: "web" | "desktop" | "mobile";
  url: string;
  icon?: string;
  category: string;
  permissions: {
    required: string[];
    optional: string[];
  };
  metadata: {
    version: string;
    vendor: string;
    lastUpdated: Date;
  };
}
```

### Type Export Pattern

```typescript
// src/types/index.ts
export * from "./core";
export * from "./user";
export * from "./application";
// Export all domain types
```

### Table Naming Convention

- Tables are automatically named: `captify-{package}-{TypeName}`
- Example: `User` interface in `@captify/mi` package → `captify-mi-User` table
- The Core interface provides standard fields for all entities

## 2. Pages and Navigation

### Page Component Structure

```typescript
// src/app/pages/Dashboard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useCaptify } from "@captify/core";
import { Card, CardContent, CardHeader, CardTitle } from "@captify/core/ui";

export function DashboardPage() {
  const { client, session } = useCaptify();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await client.run({
        service: "dashboard",
        operation: "getDashboardData",
        data: { userId: session?.user?.id },
      });
      setData(response);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Page content */}
    </div>
  );
}

// CRITICAL: Must have default export for dynamic imports
export default DashboardPage;
```

### Page Export Pattern

```typescript
// src/app/pages/index.ts
export { DashboardPage } from "./Dashboard";
export { SettingsPage } from "./Settings";
export { ReportsPage } from "./Reports";
// Export all pages (named exports)
```

### Page Loader Implementation

```typescript
// src/app/pageLoader.ts
"use client";

import { lazy } from "react";

// Dynamic imports for code splitting
export const pageLoader = {
  dashboard: lazy(() => import("./pages/Dashboard")),
  settings: lazy(() => import("./pages/Settings")),
  reports: lazy(() => import("./pages/Reports")),
};

export async function loadPage(pageName: string) {
  const loader = pageLoader[pageName.toLowerCase()];
  if (!loader) {
    throw new Error(`Page not found: ${pageName}`);
  }
  return loader;
}
```

### Main App Export

```typescript
// src/app/index.ts
export * from "./pages";
export { pageLoader, loadPage } from "./pageLoader";
export { AppClient } from "./client";
```

## 3. Services and API Integration

### Service Implementation Pattern

```typescript
// src/services/{service}.ts
import { BaseService } from "@captify/core";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";

export class UserService extends BaseService {
  private dynamoClient: DynamoDBDocumentClient;

  constructor() {
    super();
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.dynamoClient = DynamoDBDocumentClient.from(client);
  }

  // Service operations must return serializable data
  async getUser(userId: string) {
    const command = new GetCommand({
      TableName: "captify-core-User",
      Key: { id: userId },
    });

    const response = await this.dynamoClient.send(command);
    return response.Item || null;
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const command = new PutCommand({
      TableName: "captify-core-User",
      Item: {
        ...updates,
        id: userId,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      },
    });

    await this.dynamoClient.send(command);
    return { success: true, userId };
  }

  // Complex operations with multiple AWS services
  async getUserWithApplications(userId: string) {
    // Get user
    const user = await this.getUser(userId);
    if (!user) return null;

    // Get user's applications
    const applications = await this.getUserApplications(userId);

    return {
      ...user,
      applications,
    };
  }
}

// Export singleton instance
export const userService = new UserService();
```

### Service Export Pattern

```typescript
// src/services/index.ts
import { userService } from "./user";
import { applicationService } from "./application";
import { analyticsService } from "./analytics";

// Export all services as a single object
export const services = {
  user: userService,
  application: applicationService,
  analytics: analyticsService,
};

// The API will automatically map these to endpoints:
// POST /api/captify
// {
//   "service": "user",
//   "operation": "getUser",
//   "data": { "userId": "123" }
// }
```

## 4. Components

### Component Structure

```typescript
// src/components/UserProfile/UserProfile.tsx
"use client";

import React from "react";
import { Card, Avatar, Button } from "@captify/core/ui";
import { User } from "../../types";

interface UserProfileProps {
  user: User;
  onEdit?: () => void;
  readonly?: boolean;
}

export function UserProfile({
  user,
  onEdit,
  readonly = false,
}: UserProfileProps) {
  return (
    <Card>
      <CardHeader>
        <Avatar src={user.avatar} alt={user.name} />
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
        {!readonly && <Button onClick={onEdit}>Edit Profile</Button>}
      </CardContent>
    </Card>
  );
}
```

### Component Export Pattern

```typescript
// src/components/index.ts
export { UserProfile } from "./UserProfile/UserProfile";
export { ApplicationGrid } from "./ApplicationGrid/ApplicationGrid";
export { NotificationPanel } from "./NotificationPanel/NotificationPanel";
```

## 5. Package Configuration

### package.json

```json
{
  "name": "@captify/{package}",
  "version": "1.0.0",
  "main": "./dist/services.js",
  "types": "./dist/services.d.ts",
  "exports": {
    "./services": {
      "import": "./dist/services.js",
      "types": "./dist/services.d.ts"
    },
    "./app": {
      "import": "./dist/app.js",
      "types": "./dist/app.d.ts"
    },
    "./components": {
      "import": "./dist/components.js",
      "types": "./dist/components.d.ts"
    },
    "./types": {
      "import": "./dist/types.js",
      "types": "./dist/types.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@captify/core": "workspace:*",
    "@aws-sdk/client-dynamodb": "^3.693.0",
    "@aws-sdk/lib-dynamodb": "^3.693.0"
  },
  "devDependencies": {
    "tsup": "^8.5.0",
    "typescript": "^5.9.2"
  }
}
```

### tsup.config.ts

```typescript
import { defineConfig } from "tsup";
import baseConfig from "../../tsup.config.base";

export default defineConfig({
  ...baseConfig,
  entry: {
    services: "src/services/index.ts",
    app: "src/app/index.ts",
    "app/client": "src/app/client.ts",
    "app/pageLoader": "src/app/pageLoader.ts",
    components: "src/components/index.ts",
    types: "src/types/index.ts",
  },
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["react", "react-dom", "@captify/core"],
});
```

## 6. Client-Side Data Fetching

### Using the Captify Client

```typescript
// In page components
import { useCaptify } from "@captify/core";

function MyPage() {
  const { client, session } = useCaptify();

  const fetchData = async () => {
    try {
      const result = await client.run({
        service: "myService", // Maps to services.myService
        operation: "getData", // Calls myService.getData()
        data: { id: "123" }, // Parameters passed to the operation
      });
      return result;
    } catch (error) {
      console.error("API call failed:", error);
    }
  };
}
```

## 7. Authentication and Session

### Using Session Data

```typescript
import { useCaptify } from "@captify/core";

function ProtectedComponent() {
  const { session } = useCaptify();

  if (!session) {
    return <div>Please sign in</div>;
  }

  const isAdmin = session.user?.groups?.includes("Admins");
  const userId = session.user?.id;
  const userEmail = session.user?.email;

  return (
    <div>
      Welcome {session.user?.name}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

## 8. Best Practices

### Type Safety

- Always extend Core for database entities
- Use proper TypeScript types for all data
- Avoid `any` types except when absolutely necessary

### Error Handling

```typescript
// In services
async getUser(userId: string) {
  try {
    const response = await this.dynamoClient.send(command);
    return response.Item;
  } catch (error) {
    console.error("Failed to get user:", error);
    throw new Error(`User not found: ${userId}`);
  }
}

// In components
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  setError(null);
  try {
    const data = await client.run({ ... });
    setData(data);
  } catch (err) {
    setError(err.message || "Failed to load data");
  } finally {
    setLoading(false);
  }
};
```

### State Management

- Use React hooks for local state
- Use Captify context for global app state
- Keep components focused and composable

### Performance

- Use lazy loading for pages
- Implement proper loading states
- Cache data when appropriate
- Use pagination for large datasets

## 9. Common Patterns

### List Pages with Filtering

```typescript
export function UserListPage() {
  const { client } = useCaptify();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    const response = await client.run({
      service: "user",
      operation: "listUsers",
      data: { filter },
    });
    setUsers(response.items || []);
    setLoading(false);
  };

  return (
    <div>
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search users..."
      />
      {loading ? <Spinner /> : <UserGrid users={users} />}
    </div>
  );
}
```

### Form Pages

```typescript
export function UserEditPage({ userId }) {
  const { client } = useCaptify();
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.run({
        service: "user",
        operation: "updateUser",
        data: { userId, updates: formData },
      });
      toast.success("User updated successfully");
    } catch (error) {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
```

## 10. Testing Checklist

Before deploying a new package:

- [ ] All types extend Core interface
- [ ] Pages have default exports
- [ ] Services return serializable data
- [ ] API operations are properly exposed in services/index.ts
- [ ] Package.json has correct exports
- [ ] Build completes without errors
- [ ] Types are properly exported
- [ ] Client-side code uses proper error handling
- [ ] Authentication is properly handled
- [ ] Loading states are implemented

## Example Package Creation Flow

1. Create package folder: `packages/my-app/`
2. Copy `tsconfig.json` and `tsup.config.ts` from another package
3. Create type definitions extending Core
4. Implement services with DynamoDB operations
5. Create page components with default exports
6. Set up page loader for dynamic imports
7. Export everything properly in index files
8. Configure package.json with proper exports
9. Build and test: `pnpm run build`
10. Integrate with main app navigation

## Notes

- Database tables are automatically created when types extend Core
- The API automatically maps service operations to HTTP endpoints
- Pages must have default exports for dynamic importing to work
- All AWS operations should use environment variables for credentials
- Use the Captify client for all API calls from components
- Follow the existing patterns in @captify/core for consistency

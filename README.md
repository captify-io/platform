# @captify-io/platform

Core components, utilities, and services for the Captify platform.

## Installation

```bash
npm install @captify-io/platform
```

## Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

```bash
npm install clsx tailwind-merge lucide-react
```

## Usage

### Components

```tsx
import { DynamicIcon } from "@captify-io/platform/components/ui";
import { Button } from "@captify-io/platform/components/ui";

// Use DynamicIcon with any lucide icon name
<DynamicIcon name="home" className="w-4 h-4" />
```

### Utilities

```tsx
import { cn } from "@captify-io/platform/lib/utils";
```

### Hooks

```tsx
import { useAuth } from "@captify-io/platform/hooks";
```

### Services

```tsx
import { api } from "@captify-io/platform/services";
```

## Available Exports

- `/components` - All React components
- `/components/ui` - UI components (includes DynamicIcon)
- `/components/theme` - Theme components
- `/lib` - Utility functions
- `/lib/auth` - Authentication utilities
- `/lib/api` - API utilities
- `/lib/utils` - General utilities
- `/hooks` - React hooks
- `/services` - Service modules
- `/types` - TypeScript type definitions

## Recent Changes

### v1.0.59
- **Authentication & Authorization Improvements**
  - Fixed TypeScript compilation errors in auth.ts with explicit parameter types
  - Implemented organization-level GitHub NODE_AUTH_TOKEN for cross-repository package access
  - Simplified user registration workflow to use DynamoDB as single source of truth
  - Added approval workflow that updates user status directly in DynamoDB
  - Enhanced authorization logic to check both Cognito groups and DynamoDB status

- **Dynamic Package Loading**
  - Removed static app registry dependency in PackagePageRouter
  - Implemented dynamic package loading with explicit imports for better reliability
  - Added proper error handling for missing packages and pages

- **GitHub Integration**
  - Configured organization-level secrets for seamless package installation across repositories
  - Removed repository-level NODE_AUTH_TOKEN secrets in favor of organization-level token
  - Verified package access and installation works correctly with new token configuration

### v1.0.55
- Fixed lucide-react/dynamic module resolution for external apps
- Added lucide-react as peer dependency
- Updated tsup configuration to properly externalize lucide-react subpath imports

## GitHub Organization Token Setup

To enable cross-repository package installation in the captify-io organization, you need to configure a GitHub Personal Access Token with proper scopes.

### Creating an Organization Personal Access Token

**1. Create the token:**
- Go to GitHub.com → Your profile → Settings
- Developer settings → Personal access tokens → Fine-grained tokens
- Click "Generate new token"

**2. Configure the token:**
- **Resource owner**: Select `captify-io` (the organization)
- **Repository access**: Select "All repositories"
- **Account permissions**: None needed
- **Repository permissions**:
  - `Contents: Read` - Access repository content
  - `Metadata: Read` - Read repository metadata
  - `Packages: Read` - Download packages from GitHub Packages
  - `Packages: Write` - Publish packages (if needed)

**3. Alternative: Classic Personal Access Token**
If fine-grained tokens don't work, create a classic token with these scopes:
- `read:packages` - Download packages
- `write:packages` - Publish packages (if needed)
- `repo` - Full repository access (for private repos)

### Setting up Organization Secret

**4. Add as organization secret:**
- Go to captify-io organization → Settings
- Secrets and variables → Actions
- Click "New organization secret"
- Name: `NODE_AUTH_TOKEN`
- Value: [paste the token you created]
- Repository access: "All repositories"

### Workflow Configuration

The workflow uses the organization-level `NODE_AUTH_TOKEN` secret:

```yaml
- name: Configure npm for GitHub Packages
  run: |
    echo "@captify-io:registry=https://npm.pkg.github.com" >> ~/.npmrc
    echo "//npm.pkg.github.com/:_authToken=${{ secrets.NODE_AUTH_TOKEN }}" >> ~/.npmrc
```

**Important Notes:**
- The token must be created by an organization owner/admin
- Ensure the token has access to all repositories that need package access
- The organization-level secret automatically inherits to all repositories
- Remove any repository-level `NODE_AUTH_TOKEN` secrets to avoid conflicts

### Troubleshooting 403 Errors

If you see `403 Forbidden - Permission permission_denied: The token provided does not match expected scopes`:

1. Verify the token has `read:packages` scope
2. Ensure the token was created with `captify-io` as the resource owner
3. Check that the organization secret is properly configured
4. Confirm the token creator has admin access to the organization

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build:package

# Run development server
npm run dev
```

## License

MIT
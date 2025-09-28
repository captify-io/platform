# @captify-io/platform

Core components, utilities, and services for the Captify platform.

## Installation

```bash
npm install @captify-io/platform
```

## Peer Dependencies

This package requires the following peer dependencies to be installed in your project:

```bash
npm install lucide-react
```

**Note**: `lucide-react` is required for icons in your application. The platform package no longer exports a `DynamicIcon` component - consuming applications should use `lucide-react` directly for better compatibility and smaller bundle sizes.

## Usage

### Components

```tsx
import { Button } from "@captify-io/platform/components/ui";
import { Home, Settings, User } from "lucide-react";

// Use lucide-react icons directly
<Home className="w-4 h-4" />
<Button>
  <Settings className="w-4 h-4 mr-2" />
  Settings
</Button>
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
- `/components/ui` - UI components (Button, Card, Dialog, etc.)
- `/components/theme` - Theme components
- `/lib` - Utility functions
- `/lib/auth` - Authentication utilities
- `/lib/api` - API utilities
- `/lib/utils` - General utilities
- `/hooks` - React hooks
- `/services` - Service modules
- `/types` - TypeScript type definitions

## Recent Changes

### v1.0.75
- **Cross-Origin Authentication Support**
  - Configured NextAuth cookies for cross-origin session sharing
  - Added support for external applications running on different ports/domains
  - Enhanced apiClient with `credentials: "include"` for automatic cookie forwarding
  - Supports development mode with `.localhost` domain sharing
  - Production-ready with `sameSite: "none"` for secure cross-domain requests
  - Maintains security with `httpOnly` cookies and proper CSRF protection
  - External apps can now authenticate directly with the main platform

### v1.0.67
- **Agent Chat Interface Improvements**
  - Streamlined chat interface with cleaner layout and reduced padding
  - Removed borders between header, content, and footer areas
  - Helper panel now closed by default for maximum conversation space
  - Moved thread statistics (temperature, tokens, provider, model) to footer under textarea
  - Redesigned message display with time/token info outside message bubbles
  - Simplified datasets UI with prominent "+ New Dataset" button and clean list view
  - Enhanced Knowledge Base functionality with drag-and-drop file upload
  - Added proper share functionality in chat header between refresh and settings
  - Improved helper panel with Datasets, Ontology, and Usage tabs
  - Fixed helper panel close/open functionality with proper state management

### v1.0.66
- **Icon Management Simplification**
  - **BREAKING CHANGE**: Removed DynamicIcon component from platform package
  - Consuming applications should now use `lucide-react` directly for all icons
  - This eliminates module resolution issues and reduces bundle size
  - Updated tsup config to properly externalize all lucide-react imports
  - Simplified icon usage pattern for better developer experience

### v1.0.65
- **Security & Dependencies**
  - Fixed moderate severity vulnerabilities in PrismJS dependency chain
  - Added npm override for prismjs@^1.30.0 to resolve DOM Clobbering vulnerability
  - Updated all dependencies to latest secure versions
  - Added react-syntax-highlighter@15.6.6 for enhanced code highlighting

### v1.0.64
- **TypeScript Compatibility**
  - Fixed DynamicIcon component TypeScript compilation errors
  - Resolved JSX compatibility issues with ForwardRef types
  - Improved type exports for better consuming application support

### v1.0.63
- **DynamicIcon Implementation**
  - Replaced problematic lucide-react/dynamic export with custom implementation
  - Created self-contained DynamicIcon using React.lazy for dynamic imports
  - Fixed "Can't resolve 'lucide-react/dynamic'" errors in consuming applications
  - Added missing react-syntax-highlighter dependency

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
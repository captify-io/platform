# Core Package Migration Log

## Overview

Migration of shared utilities, auth, components, and core types from src/ to @captify/core package.

## Migration Status

### ✅ Completed

- [x] Basic package structure created
- [x] Auth utilities (partial)
- [x] Config management
- [x] Core hooks (useNavigationLoading)
- [x] Basic UI components (Button, Card, Badge)

### 🔄 In Progress

#### **Phase 1: Type Consolidation (Current)**

**Objective**: Establish core shared types and remove any application-specific types from core

**Source Types to Review:**

- `src/types/next-auth.d.ts` - NextAuth type extensions
- Core types from other packages that should be shared

**Target Structure:**

```
packages/core/src/types/
├── auth.ts           # Authentication & session types
├── config.ts         # Configuration types
├── ui.ts            # UI component prop types
├── hooks.ts         # Hook return types
└── index.ts         # Export all core types
```

**Type Mappings & Decisions:**

1. **Authentication Types** (from src/types/next-auth.d.ts)

   - **Action**: Move to packages/core/src/types/auth.ts
   - **Types**:
     - NextAuth session extensions
     - User type extensions
     - JWT callback types
     - AWS session integration types

2. **Configuration Types** (existing in package)

   - **Current**: CaptifyConfig, AwsCredentials ✅
   - **Action**: Expand as needed for shared config

3. **UI Component Types** (to be added)
   - **Action**: Create shared prop types for core UI components
   - **Types**:
     - ButtonProps
     - CardProps
     - BadgeProps
     - LoadingProps
     - Common component variants

### 🎯 Next Steps

#### **Phase 2: Component Consolidation**

- [ ] Move shared UI components from src/components/ui/ to core package
- [ ] Ensure shadcn/ui components are properly exported
- [ ] Update component prop types to use core types

#### **Phase 3: Utility Migration**

- [ ] Move shared utilities from src/lib/ to core package
- [ ] Consolidate authentication utilities
- [ ] Move navigation/breadcrumb utilities to core

#### **Phase 4: Hook Migration**

- [ ] Move remaining shared hooks to core package
- [ ] Ensure proper hook typing with core types
- [ ] Update hook dependencies

## Files Requiring Updates

### High Priority (Core dependencies)

1. `src/types/next-auth.d.ts` - Auth type extensions
2. `src/lib/utils.ts` - Shared utilities
3. `src/components/ui/*.tsx` - UI component library
4. Auth-related hooks and components

### Medium Priority (Shared functionality)

1. Navigation and breadcrumb utilities
2. Theme provider and theme utilities
3. Configuration management utilities
4. Error handling utilities

### Low Priority (Nice to have)

1. Common validation utilities
2. Date/time formatting utilities
3. API response utilities

## Dependencies & Integration

### Package Relationships

- **@captify/core** should NOT depend on other @captify packages
- Other packages (@captify/api, @captify/applications, @captify/chat) can depend on @captify/core
- Keep core package minimal and focused on shared functionality

### Core Principles

1. **No Application Logic**: Core should not contain application-specific types or logic
2. **Pure Utilities**: Focus on shared utilities, types, and components
3. **Stable API**: Core package changes affect all other packages
4. **Minimal Dependencies**: Keep external dependencies minimal

## Type Consistency & Standards

### Naming Conventions

- ✅ Use camelCase for all properties
- ✅ Use PascalCase for type/interface names
- ✅ Use consistent suffixes (Props, Config, State, etc.)

### Type Organization

- Group related types in same file
- Use clear, descriptive type names
- Export everything through index.ts
- Document complex types with comments

### Shared Type Categories

1. **Authentication**: Session, user, JWT types
2. **Configuration**: App config, environment types
3. **UI Components**: Props, variants, styling types
4. **API**: Common request/response patterns
5. **Hooks**: Return types, parameter types

## Testing Strategy

1. **Type Safety**: Ensure no circular dependencies
2. **Import Resolution**: Verify all packages can import core types
3. **Component Functionality**: Test UI components work correctly
4. **Auth Integration**: Verify auth types work with NextAuth
5. **Build Process**: Ensure core package builds successfully

## Notes

- Core package should be the foundation for all other packages ✅
- Avoid putting application-specific types in core
- Consider impact of changes - core affects all packages
- Keep backwards compatibility when possible
- Focus on developer experience and type safety

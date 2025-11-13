# Fabric - Session Update: 2025-11-10 Part 3

## Session Overview

**Duration**: Test generation and automation setup
**Goal**: Create automated test generation system from YAML user stories
**Outcome**: Successfully generated 768 lines of Jest tests from machine-readable specifications

## Major Accomplishments

### 1. Test Generator Script Created

**Problem**: No automated way to generate tests from YAML user stories
**Solution**: Created comprehensive test generator script using TypeScript and YAML parser
**Impact**: Enables TDD workflow with auto-generated tests from specifications

**Generator Features**:
- ✅ Parses YAML user story files
- ✅ Generates Jest test files with proper structure
- ✅ Handles arrange-act-assert pattern
- ✅ Supports mocks, props, and input parameters
- ✅ Auto-generates imports based on dependencies
- ✅ Adds user story context as comments
- ✅ Includes edge case documentation
- ✅ Supports component, unit, and integration tests

**File Created**: [scripts/generate-tests.ts](../../../scripts/generate-tests.ts)

### 2. Test Files Generated

**Generated Files**:
1. [tests/01-core-services.test.ts](./tests/01-core-services.test.ts) - 343 lines
2. [tests/03-frontend-ui.test.ts](./tests/03-frontend-ui.test.ts) - 425 lines

**Total**: 768 lines of auto-generated Jest tests

**Test Coverage**:

**Phase 1: Core Services (01-core-services.test.ts)**
- 7 user stories
- 21+ test scenarios
- Coverage: Note CRUD, Y.js state, sync, snapshots, search

**Phase 3: Frontend UI (03-frontend-ui.test.ts)**
- 8 user stories
- 15+ test scenarios
- Coverage: Sidebar tabs, folder view, editor, inspector, ontology view, search, bookmarks, daily notes

### 3. NPM Script Added

**Script**: `npm run generate:tests`

**Usage**:
```bash
# Generate tests from all workshops
npm run generate:tests

# Generate tests from specific workshop
npm run generate:tests -- src/workshops/fabric/user-stories/

# Generate tests from specific file
npm run generate:tests -- src/workshops/fabric/user-stories/01-core-services.yaml
```

### 4. YAML Package Installed

**Package**: `yaml@^2.8.1`

**Purpose**: Parse YAML user story files during test generation

## Technical Decisions

### 1. Test Generator Architecture

**File Structure**:
```typescript
interface YAMLSpec {
  feature: {
    id: string;
    name: string;
    priority: string;
    story_points: number;
    estimated_hours: number;
  };
  dependencies?: string[];
  services_required?: string[];
  components_required?: string[];
  stories: UserStory[];
}

interface UserStory {
  id: string;
  title: string;
  as_a: string;
  i_want: string;
  so_that: string;
  test_scenarios: TestScenario[];
}

interface TestScenario {
  name: string;
  type: 'unit' | 'component' | 'integration';
  arrange: {
    mocks?: Record<string, any>;
    props?: Record<string, any>;
    input?: Record<string, any>;
  };
  act: string;
  assert: string[];
}
```

### 2. Generated Test Structure

**Example**:
```typescript
// Auto-generated from src/workshops/fabric/user-stories/01-core-services.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Core Fabric Services (01)
// Priority: P0
// Story Points: 21
// Estimated Hours: 40

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Core Fabric Services', () => {
  describe('US-01-01: Create new note with Y.js state', () => {
    // User Story:
    // As Fabric user
    // I want to create a new note in my space
    // So that I can start documenting knowledge

    it('should create note with valid parameters', async () => {
      // Arrange
      (apiClient.run as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          noteId: "note-123",
          title: "Test Note",
          yjsState: "Binary()",
          createdAt: "2025-11-10T00:00:00Z"
        }
      });
      const input = {
        spaceId: "space-123",
        title: "Test Note"
      };

      // Act
      const result = await createNote(input)

      // Assert
      expect(result.success).toBe(true)
      expect(result.data.noteId).toBe('note-123')
      expect(result.data.title).toBe('Test Note')
      expect(result.data.yjsState).toBeDefined()
    });
  });
});
```

### 3. Import Handling

**Strategy**: Single import of `apiClient` for all service-based tests

**Reasoning**:
- Avoids duplicate imports
- Simplifies generated code
- apiClient is the standard service interface

**Before (problematic)**:
```typescript
import { apiClient } from '@captify-io/core/lib/api';
import { apiClient } from '@captify-io/core/services/ontology';  // Duplicate!
import { apiClient } from '@captify-io/core/services/aws/dynamodb';  // Duplicate!
```

**After (fixed)**:
```typescript
import { apiClient } from '@captify-io/core/lib/api';
```

### 4. Mock Handling

**Support for Two Mock Types**:

1. **Resolved Promises**:
```yaml
mocks:
  apiClient.run:
    resolves:
      success: true
      data:
        noteId: "note-123"
```

Generates:
```typescript
(apiClient.run as jest.Mock).mockResolvedValue({
  success: true,
  data: {
    noteId: "note-123"
  }
});
```

2. **Rejected Promises**:
```yaml
mocks:
  apiClient.run:
    rejects: "User not found"
```

Generates:
```typescript
(apiClient.run as jest.Mock).mockRejectedValue(new Error('User not found'));
```

### 5. React Testing Library Integration

**Detection**: Automatically includes React Testing Library if any test scenario has `type: "component"`

**Generated Imports**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```

**Component Test Example**:
```typescript
it('should render sidebar with four tabs', async () => {
  // Arrange
  const props = {
    spaceId: "space-123",
    activeTab: "folder",
    isOpen: true
  };

  // Act
  render(<Sidebar {...props} />)

  // Assert
  expect(screen.getByText('Folder')).toBeInTheDocument()
  expect(screen.getByText('Ontology')).toBeInTheDocument()
  expect(screen.getByText('Search')).toBeInTheDocument()
  expect(screen.getByText('Bookmarks')).toBeInTheDocument()
});
```

## Issues Encountered & Resolved

### Issue 1: YAML Parse Error

**Error**:
```
YAMLParseError: Nested mappings are not allowed in compact mappings at line 203
```

**Cause**: Inline object syntax in YAML:
```yaml
mocks:
  apiClient.run: jest.fn().mockResolvedValue({ success: true })
```

**Fix**: Changed to proper YAML structure:
```yaml
mocks:
  apiClient.run:
    resolves:
      success: true
```

**File Fixed**: [user-stories/03-frontend-ui.yaml](./user-stories/03-frontend-ui.yaml) line 203

### Issue 2: Duplicate Imports

**Problem**: Multiple service dependencies all tried to import `apiClient`

**Solution**: Simplified import logic to only import `apiClient` once from `@captify-io/core/lib/api`

## Files Created/Modified

### New Files
```
platform/
├── scripts/
│   └── generate-tests.ts                         # Test generator script (325 lines)
└── src/workshops/fabric/
    ├── tests/
    │   ├── 01-core-services.test.ts               # Generated tests (343 lines)
    │   └── 03-frontend-ui.test.ts                 # Generated tests (425 lines)
    └── SESSION-2025-11-10-PART3.md                # This file
```

### Modified Files
```
platform/
├── package.json                                   # Added generate:tests script, yaml dependency
└── src/workshops/fabric/
    ├── status.md                                  # Updated metrics and session history
    └── user-stories/
        └── 03-frontend-ui.yaml                    # Fixed YAML syntax error
```

## Success Metrics

**Test Generation**: ✅ 100%
- ✅ Test generator script created
- ✅ 2 test files generated (768 lines total)
- ✅ All YAML files processed successfully
- ✅ NPM script configured
- ✅ Dependencies installed

**Test Coverage Planning**: ✅ Complete
- ✅ Phase 1: 21+ test scenarios planned
- ✅ Phase 3: 15+ test scenarios planned
- ✅ Total: 36+ test scenarios ready for implementation

**TDD Workflow Setup**: ✅ Complete
- ✅ Red phase: Tests written (will fail, functions not implemented)
- ⏳ Green phase: Pending (implement functions to pass tests)
- ⏳ Refactor phase: Pending (optimize after green)

## Next Steps (Immediate)

### 1. Begin Phase 1 Implementation: Core Services

**Order of Implementation** (following TDD red-green-refactor):

1. **Create Types** (`core/src/services/fabric/types.ts`)
   - FabricNote, FabricFolder, FabricTemplate, FabricCanvas
   - Service request/response types

2. **Implement Note Service** (`core/src/services/fabric/note.ts`)
   - Run tests: `npm test -- 01-core-services.test.ts`
   - Implement: createNote, getNote, updateNote, deleteNote, listNotes
   - Tests should pass (green phase)

3. **Implement Y.js Service** (`core/src/services/fabric/yjs.ts`)
   - loadYjsState, saveYjsState, mergeYjsUpdates

4. **Implement Sync Service** (`core/src/services/fabric/sync.ts`)
   - broadcastUpdate, pollUpdates

5. **Implement Snapshot Service** (`core/src/services/fabric/snapshot.ts`)
   - createSnapshot, listSnapshots, restoreSnapshot

6. **Implement Search Service** (`core/src/services/fabric/search.ts`)
   - searchNotes, searchByTags

7. **Create Service Index** (`core/src/services/fabric/index.ts`)
   - Export all operations with execute() pattern

### 2. Create Ontology Types

**Required Types**:
- `fabric-note`: DynamoDB table for notes
- `fabric-folder`: Folder metadata
- `fabric-template`: Note templates
- `fabric-canvas`: Canvas configurations

**Script to Create**: `scripts/seed-fabric-ontology.ts`

### 3. Update API Route

**File**: `platform/src/app/api/captify/route.ts`

**Add**: Fabric service handler

```typescript
case 'platform.fabric':
  result = await import('@captify-io/core/services/fabric').then(m =>
    m.execute(operation, data, credentials)
  );
  break;
```

## Blockers Remaining

**None** - All blockers from Part 2 have been resolved:
- ✅ Test generator created
- ✅ Tests generated from YAML

## Lessons Learned

### What Worked Well

1. **YAML User Stories**: Machine-readable format enables automation
2. **Test Generator Pattern**: Studied existing workshops, found consistent pattern
3. **Incremental Debugging**: Fixed YAML syntax error quickly by reading specific line range
4. **Import Simplification**: Reduced complexity by standardizing on apiClient

### What Could Improve

1. **YAML Validation**: Could add schema validation before test generation
2. **Error Messages**: Could improve generator error messages for debugging
3. **Test Templates**: Could support multiple test patterns (Vitest, etc.)

### Key Insights

1. **TDD Automation**: Auto-generated tests from specs accelerates development
2. **Workshop Pattern**: Other workshops follow same structure, can reuse tools
3. **YAML Flexibility**: YAML is powerful but syntax-sensitive, need careful formatting
4. **Test-First Mindset**: Having tests before implementation forces clear requirements

## Related Documentation

- **Workshop Process**: [../readme.md](../readme.md)
- **Vision**: [./readme.md](./readme.md)
- **Status**: [./status.md](./status.md)
- **Roadmap**: [./plan/implementation-roadmap.md](./plan/implementation-roadmap.md)
- **Feature Specs**:
  - [01-core-services.md](./features/01-core-services.md)
  - [02-prosemirror-wrapper.md](./features/02-prosemirror-wrapper.md)
  - [03-frontend-ui.md](./features/03-frontend-ui.md)
- **User Stories**:
  - [01-core-services.yaml](./user-stories/01-core-services.yaml)
  - [03-frontend-ui.yaml](./user-stories/03-frontend-ui.yaml)
- **Generated Tests**:
  - [01-core-services.test.ts](./tests/01-core-services.test.ts)
  - [03-frontend-ui.test.ts](./tests/03-frontend-ui.test.ts)
- **Previous Sessions**:
  - [SESSION-2025-11-10.md](./SESSION-2025-11-10.md) (Part 1)
  - [SESSION-2025-11-10-PART2.md](./SESSION-2025-11-10-PART2.md) (Part 2)

## Test Generator Usage Examples

### Generate All Tests
```bash
npm run generate:tests
```

### Generate Tests for Specific Workshop
```bash
npm run generate:tests -- src/workshops/fabric/user-stories/
```

### Generate Tests for Specific File
```bash
npm run generate:tests -- src/workshops/fabric/user-stories/01-core-services.yaml
```

### Regenerate After YAML Changes
```bash
# Make changes to YAML file
npm run generate:tests -- src/workshops/fabric/user-stories/03-frontend-ui.yaml
# Tests automatically regenerated
```

## Code Standards Applied

- ✅ TypeScript strict types
- ✅ kebab-case file naming
- ✅ Comprehensive documentation
- ✅ Error handling with try-catch
- ✅ Auto-generated file warnings
- ✅ Arrange-Act-Assert test pattern
- ✅ Jest mocking conventions
- ✅ React Testing Library best practices

---

**Session Type**: Test Generation & Automation
**Progress**: Planning complete for Phases 1-3 (12% overall project)
**Tests Generated**: 768 lines across 2 files
**Next Phase**: Implementation (Phase 1: Core Services)
**Status**: Ready to begin TDD red-green-refactor workflow
**Confidence Level**: Very High (clear requirements, auto-generated tests, proven patterns)

# Feature: ProseMirror React Wrapper (TipTap Alternative)

## Overview

Build a React wrapper around ProseMirror that replicates TipTap's developer experience without the subscription costs. This wrapper will provide hooks, components, and utilities for integrating ProseMirror with React, including support for React-based NodeViews, Y.js collaboration, and a clean API for commands and extensions.

**Decision**: Use ProseMirror directly instead of TipTap to avoid vendor lock-in and subscription costs while maintaining full control over the editor architecture.

## Requirements

### Functional Requirements

1. **React Integration**
   - `useEditor()` hook for creating editor instances
   - `<EditorContent>` component for rendering editor
   - `<NodeViewWrapper>` and `<NodeViewContent>` for React node views
   - Context API for sharing editor instance across components

2. **Node View System**
   - Support React components as node views
   - Portal-based rendering for React node views
   - Props interface matching ProseMirror's NodeView API
   - Update mechanism for reactive node views

3. **Y.js Collaboration**
   - Integration with `y-prosemirror` binding
   - Collaborative cursors and selections
   - Undo/redo with Y.js
   - Awareness protocol for presence

4. **Extension System**
   - Plugin-based architecture
   - Node and mark schema definitions
   - Command builders
   - Input rules and paste handlers

5. **Developer Experience**
   - TypeScript-first with strict types
   - Simple API matching TipTap's patterns
   - Comprehensive error handling
   - Performance optimized (memoization, subscriptions)

### Non-Functional Requirements

1. **Performance**
   - Editor initialization: <100ms
   - React re-renders minimized (only on relevant changes)
   - Node view updates: <16ms (60fps)
   - Memory efficient (cleanup on unmount)

2. **Bundle Size**
   - Smaller than TipTap (no abstraction overhead)
   - Tree-shakeable exports
   - Only include used ProseMirror packages

3. **Compatibility**
   - React 18+ (with Suspense and concurrent features)
   - ProseMirror 1.x
   - Y.js 13.x
   - Server-side rendering support

## Architecture

### Directory Structure

```
core/src/components/editor/
├── index.tsx                    # Main exports
├── hooks/
│   ├── use-editor.ts            # Create editor instance
│   ├── use-editor-state.ts      # Subscribe to editor state
│   └── use-node-view.ts         # React node view hook
├── components/
│   ├── editor-content.tsx       # Main editor component
│   ├── node-view-wrapper.tsx    # Wrapper for React node views
│   └── node-view-content.tsx    # Content area for node views
├── context/
│   ├── editor-context.tsx       # Context for sharing editor
│   └── node-view-context.tsx    # Context for node view props
├── core/
│   ├── editor.ts                # Editor class wrapper
│   ├── node-view-renderer.tsx   # React NodeView → ProseMirror bridge
│   └── portal-manager.ts        # Manage React portals for node views
├── schema/
│   ├── nodes/
│   │   ├── doc.ts
│   │   ├── paragraph.ts
│   │   ├── heading.ts
│   │   ├── workflow-step.ts     # Custom stateful node
│   │   ├── widget.ts            # Dynamic widget node
│   │   ├── callout.ts           # Callout block
│   │   └── index.ts
│   ├── marks/
│   │   ├── bold.ts
│   │   ├── italic.ts
│   │   ├── wikilink.ts          # Custom wikilink mark
│   │   ├── tag.ts               # Custom tag mark
│   │   └── index.ts
│   └── index.ts                 # Schema builder
├── plugins/
│   ├── yjs.ts                   # Y.js collaboration plugin
│   ├── wikilink-autocomplete.ts # Auto-complete on [[
│   ├── context-menu.ts          # Right-click menu
│   ├── placeholder.ts           # Placeholder text
│   └── index.ts
├── commands/
│   ├── workflow.ts              # Workflow-specific commands
│   ├── widget.ts                # Widget commands
│   ├── formatting.ts            # Bold, italic, etc.
│   └── index.ts
├── markdown/
│   ├── serializer.ts            # ProseMirror → Markdown
│   ├── parser.ts                # Markdown → ProseMirror
│   └── index.ts
└── types.ts                     # TypeScript interfaces
```

## Core Implementation

### 1. Editor Wrapper Class

Based on TipTap's Editor class but simplified:

```typescript
// core/src/components/editor/core/editor.ts
import { EditorState, Transaction, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, Node as PMNode } from 'prosemirror-model';
import { PortalManager } from './portal-manager';
import type { EditorOptions, CommandManager } from '../types';

export class Editor {
  public view!: EditorView;
  public state!: EditorState;
  public schema: Schema;
  public portals: PortalManager;

  private subscribers = new Set<() => void>();
  private element: HTMLElement | null = null;

  constructor(options: EditorOptions = {}) {
    this.schema = options.schema || createDefaultSchema();
    this.portals = new PortalManager();

    // Create initial state
    this.state = EditorState.create({
      doc: options.doc || this.schema.topNodeType.createAndFill(),
      schema: this.schema,
      plugins: options.plugins || [],
    });

    // Create view
    this.view = new EditorView(undefined, {
      state: this.state,
      dispatchTransaction: this.dispatchTransaction.bind(this),
      nodeViews: options.nodeViews || {},
    });
  }

  private dispatchTransaction(transaction: Transaction) {
    const newState = this.view.state.apply(transaction);
    this.view.updateState(newState);
    this.state = newState;

    // Notify subscribers
    this.subscribers.forEach(callback => callback());

    // Call user callback
    this.options.onUpdate?.({ editor: this, transaction });
  }

  public setContent(content: string | PMNode | object) {
    // Parse content and set editor state
    // Implementation depends on content type
  }

  public getHTML(): string {
    // Serialize to HTML
  }

  public getJSON(): object {
    return this.state.doc.toJSON();
  }

  public commands: CommandManager = {
    // Command implementations
  };

  public subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public destroy() {
    this.view.destroy();
    this.subscribers.clear();
    this.portals.destroy();
  }
}
```

### 2. useEditor Hook

Replicates TipTap's `useEditor()` with subscription-based updates:

```typescript
// core/src/components/editor/hooks/use-editor.ts
import { useEffect, useRef, useMemo, DependencyList } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { Editor } from '../core/editor';
import type { EditorOptions } from '../types';

export interface UseEditorOptions extends EditorOptions {
  /**
   * Whether to render the editor immediately.
   * Set to false for SSR.
   */
  immediatelyRender?: boolean;
}

export function useEditor(
  options: UseEditorOptions = {},
  deps: DependencyList = []
): Editor | null {
  const editorRef = useRef<Editor | null>(null);

  // Create editor instance
  if (!editorRef.current && options.immediatelyRender !== false) {
    editorRef.current = new Editor(options);
  }

  // Re-create editor if deps change
  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new Editor(options);
    }

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, deps);

  // Subscribe to editor updates
  const snapshot = useSyncExternalStore(
    (callback) => {
      if (!editorRef.current) return () => {};
      return editorRef.current.subscribe(callback);
    },
    () => editorRef.current,
    () => null // Server snapshot
  );

  return snapshot;
}
```

### 3. EditorContent Component

Based on TipTap's pattern with portal management:

```typescript
// core/src/components/editor/components/editor-content.tsx
import React, { useEffect, useRef, forwardRef, memo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { Editor } from '../core/editor';

export interface EditorContentProps {
  editor: Editor | null;
  className?: string;
  style?: React.CSSProperties;
}

const EditorContentComponent = forwardRef<HTMLDivElement, EditorContentProps>(
  ({ editor, className, style }, ref) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!editor || !mountRef.current) return;

      // Mount ProseMirror view into div
      const element = mountRef.current;
      element.appendChild(editor.view.dom);

      return () => {
        // Clean up
        if (editor.view.dom.parentNode === element) {
          element.removeChild(editor.view.dom);
        }
      };
    }, [editor]);

    // Subscribe to portal updates
    const portals = useSyncExternalStore(
      (callback) => {
        if (!editor) return () => {};
        return editor.portals.subscribe(callback);
      },
      () => editor?.portals.getSnapshot() || [],
      () => [] // Server snapshot
    );

    return (
      <>
        <div ref={mountRef} className={className} style={style} />
        {portals}
      </>
    );
  }
);

EditorContentComponent.displayName = 'EditorContent';

export const EditorContent = memo(EditorContentComponent);
```

### 4. Portal Manager for React NodeViews

Based on TipTap's portal system:

```typescript
// core/src/components/editor/core/portal-manager.ts
import ReactDOM from 'react-dom/client';
import type { ReactNode } from 'react';

export class PortalManager {
  private portals = new Map<string, ReactNode>();
  private roots = new Map<string, ReactDOM.Root>();
  private subscribers = new Set<() => void>();

  public addPortal(id: string, element: HTMLElement, reactElement: ReactNode) {
    // Create React root for portal
    const root = ReactDOM.createRoot(element);
    root.render(reactElement);

    this.roots.set(id, root);
    this.portals.set(id, ReactDOM.createPortal(reactElement, element, id));

    // Notify subscribers
    this.notify();
  }

  public removePortal(id: string) {
    const root = this.roots.get(id);
    if (root) {
      root.unmount();
      this.roots.delete(id);
    }

    this.portals.delete(id);
    this.notify();
  }

  public subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public getSnapshot() {
    return Array.from(this.portals.values());
  }

  private notify() {
    this.subscribers.forEach(callback => callback());
  }

  public destroy() {
    this.roots.forEach(root => root.unmount());
    this.roots.clear();
    this.portals.clear();
    this.subscribers.clear();
  }
}
```

### 5. React NodeView Renderer

Bridge between ProseMirror NodeView and React component:

```typescript
// core/src/components/editor/core/node-view-renderer.tsx
import { NodeView } from 'prosemirror-view';
import { Node as PMNode } from 'prosemirror-model';
import { Decoration, EditorView } from 'prosemirror-view';
import { createElement } from 'react';
import { NodeViewContext } from '../context/node-view-context';
import type { Editor } from './editor';
import type { ReactNodeViewComponent } from '../types';

export class ReactNodeView implements NodeView {
  public dom: HTMLElement;
  public contentDOM?: HTMLElement;

  private component: ReactNodeViewComponent;
  private editor: Editor;
  private getPos: () => number;
  private node: PMNode;
  private decorations: Decoration[];

  constructor(
    node: PMNode,
    view: EditorView,
    getPos: () => number,
    decorations: Decoration[],
    component: ReactNodeViewComponent,
    editor: Editor
  ) {
    this.node = node;
    this.editor = editor;
    this.getPos = getPos;
    this.decorations = decorations;
    this.component = component;

    // Create DOM elements
    this.dom = document.createElement('div');
    this.dom.classList.add('react-node-view');

    // Content DOM for editable content
    if (node.type.spec.content) {
      this.contentDOM = document.createElement('div');
      this.contentDOM.classList.add('react-node-view-content');
    }

    // Render React component
    this.renderComponent();
  }

  private renderComponent() {
    const Component = this.component;
    const props = {
      node: this.node,
      editor: this.editor,
      getPos: this.getPos,
      decorations: this.decorations,
      updateAttributes: (attrs: Record<string, any>) => {
        const pos = this.getPos();
        const tr = this.editor.view.state.tr.setNodeMarkup(pos, null, {
          ...this.node.attrs,
          ...attrs,
        });
        this.editor.view.dispatch(tr);
      },
      deleteNode: () => {
        const pos = this.getPos();
        const tr = this.editor.view.state.tr.delete(pos, pos + this.node.nodeSize);
        this.editor.view.dispatch(tr);
      },
    };

    // Create React element with context
    const element = createElement(
      NodeViewContext.Provider,
      {
        value: {
          contentDOM: this.contentDOM,
        },
      },
      createElement(Component, props)
    );

    // Add to portal manager
    this.editor.portals.addPortal(
      `node-${this.getPos()}`,
      this.dom,
      element
    );
  }

  update(node: PMNode, decorations: Decoration[]) {
    // Check if node type is the same
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.decorations = decorations;
    this.renderComponent();

    return true;
  }

  destroy() {
    this.editor.portals.removePortal(`node-${this.getPos()}`);
  }

  // Optional methods
  selectNode() {}
  deselectNode() {}
  setSelection() {}
  stopEvent() { return false; }
  ignoreMutation() { return true; }
}

// Helper to create React NodeView factory
export function ReactNodeViewRenderer(component: ReactNodeViewComponent) {
  return (node: PMNode, view: EditorView, getPos: () => number, decorations: Decoration[], editor: Editor) => {
    return new ReactNodeView(node, view, getPos, decorations, component, editor);
  };
}
```

### 6. NodeView Components

Wrapper and content components for React node views:

```typescript
// core/src/components/editor/components/node-view-wrapper.tsx
import React, { forwardRef } from 'react';

export interface NodeViewWrapperProps {
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  [key: string]: any;
}

export const NodeViewWrapper = forwardRef<HTMLElement, NodeViewWrapperProps>(
  ({ as: Component = 'div', children, ...props }, ref) => {
    return (
      <Component ref={ref} data-node-view-wrapper="" {...props}>
        {children}
      </Component>
    );
  }
);

NodeViewWrapper.displayName = 'NodeViewWrapper';
```

```typescript
// core/src/components/editor/components/node-view-content.tsx
import React, { forwardRef, useContext } from 'react';
import { NodeViewContext } from '../context/node-view-context';

export interface NodeViewContentProps {
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
  [key: string]: any;
}

export const NodeViewContent = forwardRef<HTMLElement, NodeViewContentProps>(
  ({ as: Component = 'div', ...props }, ref) => {
    const { contentDOM } = useContext(NodeViewContext);

    return (
      <Component
        ref={(element: HTMLElement) => {
          if (element && contentDOM) {
            element.appendChild(contentDOM);
          }
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
        }}
        data-node-view-content=""
        {...props}
      />
    );
  }
);

NodeViewContent.displayName = 'NodeViewContent';
```

### 7. Example Usage

```typescript
// Usage example: Workflow Step Node
import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent } from '@captify-io/core/components/editor';
import { Button } from '@captify-io/core/components/ui';
import { CheckCircle } from 'lucide-react';

// React component for workflow step
function WorkflowStepView({ node, updateAttributes }) {
  const { id, title, status } = node.attrs;

  const handleComplete = () => {
    updateAttributes({
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <NodeViewWrapper className="workflow-step" data-status={status}>
      <div className="flex items-center gap-2 p-4 border rounded-lg">
        {status === 'completed' && <CheckCircle className="text-green-500" />}
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <NodeViewContent className="content" />
        </div>
        {status !== 'completed' && (
          <Button onClick={handleComplete}>Complete</Button>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Use in component
function FabricEditor({ noteId, ydoc }) {
  const editor = useEditor({
    schema: createFabricSchema(),
    plugins: [
      ySyncPlugin(ydoc.getXmlFragment('prosemirror')),
      // ... other plugins
    ],
    nodeViews: {
      workflowStep: ReactNodeViewRenderer(WorkflowStepView),
      widget: ReactNodeViewRenderer(WidgetView),
      // ... other node views
    },
  });

  return <EditorContent editor={editor} />;
}
```

## Dependencies

### ProseMirror Core Packages
```json
{
  "prosemirror-state": "^1.4.3",
  "prosemirror-view": "^1.33.0",
  "prosemirror-model": "^1.21.0",
  "prosemirror-transform": "^1.9.0",
  "prosemirror-commands": "^1.5.2",
  "prosemirror-keymap": "^1.2.2",
  "prosemirror-history": "^1.4.0",
  "prosemirror-inputrules": "^1.4.0",
  "prosemirror-schema-list": "^1.3.0",
  "prosemirror-gapcursor": "^1.3.2",
  "prosemirror-dropcursor": "^1.8.1"
}
```

### Y.js Collaboration
```json
{
  "yjs": "^13.6.10",
  "y-prosemirror": "^1.2.5"
}
```

### React Integration
```json
{
  "use-sync-external-store": "^1.2.0"
}
```

### Utilities
```json
{
  "prosemirror-markdown": "^1.12.0"
}
```

## Implementation Checklist

- [ ] Create `core/src/components/editor/` directory structure
- [ ] Implement `Editor` class wrapper
- [ ] Implement `useEditor()` hook with subscriptions
- [ ] Implement `EditorContent` component with portal management
- [ ] Implement `PortalManager` for React node views
- [ ] Implement `ReactNodeView` bridge
- [ ] Implement `NodeViewWrapper` and `NodeViewContent` components
- [ ] Create default schema with basic nodes/marks
- [ ] Add Y.js collaboration plugin
- [ ] Write unit tests for all components
- [ ] Write integration tests with React Testing Library
- [ ] Document API with JSDoc
- [ ] Create Storybook stories for examples

## Success Metrics

- **Bundle size**: <150KB gzipped (vs TipTap ~200KB)
- **Performance**: Editor initialization <100ms
- **Developer experience**: API matches TipTap's ease of use
- **Cost savings**: $0 vs $99/month per developer
- **Test coverage**: ≥90%
- **Type safety**: 100% TypeScript coverage

---

**Feature ID**: 03
**Priority**: P0 (Critical)
**Story Points**: 21
**Dependencies**: ProseMirror packages installed
**Status**: Planning
**Owner**: Platform Team

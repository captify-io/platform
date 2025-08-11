# ResizableChatPanel Component

## Overview

The `ResizableChatPanel` is an enhanced wrapper around the `ChatInterface` that provides user-draggable width adjustment functionality. This allows users to dynamically resize the chat panel by dragging the left edge.

## Features

- **Mouse-based resizing**: Users can click and drag the left edge of the chat panel to adjust its width
- **Width constraints**: Panel width is constrained between 280px (minimum) and 600px (maximum)
- **Visual feedback**: Cursor changes to indicate resizable area
- **Smooth transitions**: Hover effects and smooth width adjustments
- **Preserved functionality**: All original ChatInterface functionality is maintained

## Usage

```tsx
import { ResizableChatPanel } from "@/components/apps";

<ResizableChatPanel
  applicationId="my-app"
  applicationName="My Application"
  isCollapsible={true}
  isSliding={true}
  isOpen={isChatVisible}
  onToggle={toggleChat}
/>;
```

## Implementation Details

- Uses mouse event handlers (`onMouseDown`, `onMouseMove`, `onMouseUp`) for resize functionality
- Implements width constraints and prevents text selection during resize
- Provides visual feedback with cursor changes (`cursor-ew-resize`)
- Seamlessly integrates with existing layout system

## Props

The component accepts all the same props as `ChatInterface`, as it wraps and forwards them.

## File Structure

- `ResizableChatPanel.tsx` - Main resizable wrapper component
- `ChatInterface.tsx` - Core chat functionality (wrapped by ResizableChatPanel)
- `ChatHeader.tsx` - Header with controls and provider badges
- `ChatContent.tsx` - Message display area
- `ChatFooter.tsx` - Input field and controls
- `ChatSettings.tsx` - Provider configuration
- `ChatHistory.tsx` - Conversation history sidebar

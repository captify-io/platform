Captify Chat — Console & Dock (Agnostic Interface)
Purpose
A reusable, app-agnostic chat interface that works in:

Console (full page): ChatGPT-style, with Threads (left), Chat (center), Tools/Context (right).

Dock (compact): Slide-over panel embeddable in any app view.

The chat engine is shared by both shells. All client calls use the app-scoped AppApiClient and Captify’s three-tier auth on the server.

Non-negotiables (Captify standards)
No any, no commented code, no unused imports, no console.log in prod.

Centralized API clients only (no direct fetch).

Three-tier AWS credential fallback implemented in each API route.

AppLayout provides database-driven menus; no hardcoded nav.

Use Lucide (import { DynamicIcon } from 'lucide-react/dynamic') and optimize with useMemo/useCallback.

Scenarios & Routes

1. Console (full-page)
   Route: /app/console (optional deep link /app/console/t/:threadId)

Regions:

Left: Thread list (search, filters, pin, rename, delete, new)

Center: Chat content (streaming, tool runs, citations)

Right: Tabs → Tools | Context | Agent

2. Dock (compact, in-app)
   Mounted via AppLayout (e.g., showChat), opens as a slide-over.

Reuses the same ChatInterface engine; minimal chrome; Tools via popover.

File Layout (client)
Existing (keep):

app/components/apps/ChatHeader.tsx

app/components/apps/ChatContent.tsx

app/components/apps/ChatInterface.tsx

app/components/apps/ChatSettings.tsx

Add:

app/components/apps/console/ConsoleLayout.tsx — 3-pane shell

app/components/apps/console/ThreadList.tsx — virtualized threads

app/components/apps/console/RightPane.tsx — tabs (Tools/Context/Agent)

app/components/apps/console/ToolCard.tsx — tool descriptor → run UI

app/components/apps/console/DatasourcePicker.tsx — select AWS/Data Products/Files/SharePoint

app/components/apps/chat/MessageList.tsx — messages + ToolRun blocks

app/components/apps/chat/Composer.tsx — input, token estimator, attachments, datasource chips

app/components/apps/dock/DockChat.tsx — compact overlay shell

app/app/console/page.tsx — Console route

All new components must be strict TS, accessible, and free of dead code.

Server/API (routes)
Existing (extend, don’t replace):

api/chat/bedrock-agent — also returns available agents + default

api/chat/llm — add SSE for streaming + tool events

api/chat/history — add thread filters/pagination

api/chat/title — rename thread

api/chat/reset — clear thread

New:

api/chat/tools — list tool descriptors for the current app/agent

api/chat/tools/run — invoke a tool (server streams updates on the same SSE channel)

api/chat/datasource — list locked (app KB) + selectable sources; update per-thread selections

api/chat/tokens — live token accounting (see Token Tracking)

All routes implement the three-tier auth and return/accept typed DTOs.

Data Contracts (UI ↔ API)
ts
Copy
Edit
export interface ChatAgentRef { id: string; name: string; description?: string; icon?: string; default?: boolean; }

export type MessageRole = "user" | "assistant" | "system";

export interface Citation { label: string; href?: string; sourceId?: string; }

export interface ToolRun {
id: string;
name: string;
status: "queued" | "running" | "succeeded" | "failed";
input?: unknown; // tool-specific types at usage site
output?: unknown; // tool-specific types at usage site
outputRef?: string; // optional S3 ref for large payloads
}

export interface ChatMessage {
id: string;
role: MessageRole;
content: string; // markdown
createdAt: string; // ISO
toolRuns?: ToolRun[];
citations?: Citation[];
meta?: Record<string, unknown>;
}

export interface ChatThread {
id: string;
agentId: string;
title: string;
createdAt: string;
updatedAt: string;
messageCount: number;
pinned?: boolean;
datasources?: DatasourceRef[];
}

export type DatasourceKind = "app-kb" | "aws" | "data-product" | "file" | "sharepoint";

export interface DatasourceRef {
id: string;
kind: DatasourceKind;
label: string;
locked?: boolean; // true for app KB
}

export interface ToolDescriptor {
id: string;
name: string;
icon?: string;
description?: string;
inputSchema?: Record<string, unknown>; // JSON schema / Zod JSON
}

export type StreamingEventType = "message_delta" | "message_done" | "toolrun_update" | "notice" | "tokens_update";

export interface StreamingEvent<T = unknown> {
type: StreamingEventType;
data: T;
}
API Surface (request/response)
Agents & Threads

GET /api/chat/bedrock-agent

Res { agents: ChatAgentRef[]; defaultAgentId: string }

GET /api/chat/history?cursor&agentId&filter

Res { threads: ChatThread[]; nextCursor?: string }

POST /api/chat/history

Req { agentId: string }

Res ChatThread

PATCH /api/chat/title

Req { threadId: string; title: string }

Res { ok: true }

POST /api/chat/reset

Req { threadId: string }

Res { ok: true }

Messaging (SSE)

POST /api/chat/llm

Req { threadId: string; content: string; datasources?: DatasourceRef[]; attachments?: { id: string; name: string; size: number; type: string }[] }

Res: Opens SSE stream emitting:

message_delta { id, role, chunk: string }

message_done { id, role }

toolrun_update { run: ToolRun }

notice { level: "info" | "warn" | "error"; text: string }

tokens_update { available: number; estimatedNext: number; spentDelta?: number }

Tools

GET /api/chat/tools

Res ToolDescriptor[]

POST /api/chat/tools/run

Req { threadId: string; toolId: string; input: Record<string, unknown> }

Res { ok: true } (progress via toolrun_update SSE events)

Datasources

GET /api/chat/datasource

Res { locked: DatasourceRef[]; selectable: DatasourceRef[] }

POST /api/chat/datasource

Req { threadId: string; add?: DatasourceRef[]; remove?: DatasourceRef[] }

Res { ok: true }

Tokens (live accounting)

GET /api/chat/tokens

Res { available: number; window: { period: "daily" | "monthly"; resetAt: string } }

All endpoints must set/consume auth headers: X-ID-Token, X-AWS-Session-Token, X-User-Email.

Streaming Protocol (SSE)
Events are text/event-stream with event: = one of:

message_delta, message_done, toolrun_update, notice, tokens_update

Clients must:

Append message_delta chunks to the current assistant message.

Update ToolRun rows on toolrun_update.

Show banners/toasts for notice.

Update token UI on tokens_update (and pre-send estimator).

Right Pane (Console)
Tools tab
Renders ToolDescriptor[] as cards with generated forms from inputSchema.

Submitting runs POST /api/chat/tools/run.

Tool outputs also appear inline in the center as ToolRun blocks.

Context tab
DatasourcePicker:

Shows locked app KB (pre-selected, not removable).

Allows user to add/remove selectable sources: AWS resources (e.g., Kendra index), Data Products, Files (uploads), SharePoint sites.

Selection is saved on the thread and passed with each message.

Agent tab
Model/alias (read-only or role-gated change), temperature, safety flags.

System prompt preview (role-gated edit).

Rate limits (read-only).

Token Tracking (user visibility + server enforcement)
Goal: Keep the user aware of spend before sending, and reflect live updates during/after runs. Admins can grant/adjust tokens per user; the server enforces limits.

Concepts
Available tokens — remaining user allowance for the current window (daily or monthly).

Estimated next — projected cost of the message/tool run given content, context size, model pricing, and selected datasources.

Spent delta — tokens actually consumed by the last operation.

Client behavior
Composer shows ~N tokens (est.) as the user types (debounced).

On POST /api/chat/llm, the SSE stream emits tokens_update events to reflect provisional and final usage.

The header displays a compact meter: available and window reset time.

If estimatedNext > available, the Send button disables with a tooltip explaining why.

Server behavior
GET /api/chat/tokens returns the authoritative available balance and window.

On each message/tool execution:

Compute estimate from model metadata (tokens per 1K, input/output), context size (system + history in window), and tool overhead when known.

If estimate exceeds available (and no overflow policy), reject with a notice.

After completion, actual usage is measured and persisted; emit tokens_update { spentDelta, available }.

Pricing/limits are stored centrally (DB/config). No new env files.

Admin assignment (out of scope UI; protocol ready)
Admin grants/updates a user’s token allowance and window in the admin app.

Chat reads allowances via GET /api/chat/tokens.

Windows: daily or monthly with resetAt ISO timestamp.

Optional per-model or per-agent multipliers supported in the server calculator.

DTOs

ts
Copy
Edit
export interface TokenWindow { period: "daily" | "monthly"; resetAt: string; }
export interface TokenState { available: number; window: TokenWindow; }
export interface TokensUpdate { available: number; estimatedNext: number; spentDelta?: number; }
Persistence (DynamoDB)
Threads: captify-chat-threads

PK: app#${appId}, SK: thread#${threadId}

Attrs: userId, title, agentId, datasources[], updatedAt, pinned

GSI1: user#${userId} / updatedAt

Messages: captify-chat-messages

PK: thread#${threadId}, SK: ts#${iso}

Attrs: role, content, toolRuns[], citations[]

Large outputs → S3, referenced by toolRuns.outputRef

(Admin) Token grants: captify-token-grants

PK: user#${userId}, SK: window#${period}

Attrs: available, resetAt, policy (optional caps per model/agent)

Component Contracts (client)
ts
Copy
Edit
// ChatInterface.tsx (shared engine)
export interface ChatInterfaceProps {
mode: "console" | "dock";
initialThreadId?: string;
onThreadChange?: (threadId: string) => void;
}

export interface ChatHeaderProps {
agent: ChatAgentRef;
agents: ChatAgentRef[];
title: string;
tokenEstimate: number;
tokenAvailable: number;
onAgentChange: (id: string) => void;
onRename: (title: string) => void;
onStop: () => void;
onRetry: () => void;
onOpenSettings?: () => void;
}

export interface ComposerProps {
disabled?: boolean;
tokenEstimate: number;
tokenAvailable: number;
datasources: DatasourceRef[];
onDatasourcesChange: (next: DatasourceRef[]) => void;
onSend: (content: string, attachments?: File[]) => void;
}
Keyboard & UX
Send: Ctrl/Cmd + Enter

New thread: Ctrl/Cmd + N

Focus input: I

Stop generation: Esc

Empty state mirrors current design (“Start a conversation…”), scoped to workspace/app.

Phased Work Plan
Phase 1 — Shells & Engine

Console shells (ConsoleLayout, ThreadList, RightPane)

Dock shell (DockChat)

ChatInterface SSE lifecycle + retries/stop

MessageList, Composer with token estimator

Extend history, llm (SSE), title, reset

Phase 2 — Tools & Datasources

/api/chat/tools, /api/chat/tools/run (AI SDK registry)

ToolCard, inline ToolRun rendering

DatasourcePicker, /api/chat/datasource, persist selections

Phase 3 — Tokens & Polish

/api/chat/tokens + SSE tokens_update

Thread/message virtualization; degraded-mode notices

Copy, pin, delete, rename; tests for SSE reconnect & auth headers

Phase 4 — Extras

Attachments (Files → S3); Share threads (role-gated)

Export transcript; basic analytics by agent/tool

Acceptance Criteria (v1)
Console and Dock both run on the same engine and respect Captify auth and API client rules.

Threads list, live streaming, stop/retry, title save, reset work reliably.

Tools list & runs are visible (right pane + inline blocks); datasources can be toggled and persist per thread.

The composer shows estimated tokens; header shows available tokens and updates live via tokens_update.

All code is strict TypeScript, clean, accessible, and free of direct fetch/console logs.

Notes

SSE is preferred for simplicity; WebSockets can be added later without API shape changes.

Model pricing/usage calculators live server-side; the client only displays estimate and reacts to tokens_update.

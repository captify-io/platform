"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { type Message as AiMessage } from "ai/react";

export type ChatMessage = AiMessage & { createdAt?: string };

// Regexes for server-side trace/rationale markers
const TRACE_RE = /<!--TRACE:[\s\S]*?-->/g;
const TRACEJSON_RE = /<!--TRACEJSON:[\s\S]*?-->/g;

// Some Bedrock agents emit XML-ish wrappers. Strip the tags but keep inner text.
const AGENT_TAG_RE =
  /<\/?(answer|answer_part|assistant|assistant_part|sources?|source|search_results?|search_result|content|text|tool_use|tool_result|citations?)\b[^>]*>/gi;

// Remove all trace markers
const stripTraceMarkers = (s: string) =>
  String(s || "")
    .replace(TRACEJSON_RE, "")
    .replace(TRACE_RE, "");

// Strip known agent XML-like tags but keep their contents
const stripAgentXml = (s: string) => String(s || "").replace(AGENT_TAG_RE, "");

// Full sanitize pass for rendering in markdown
const sanitizeForDisplay = (s: string) =>
  stripAgentXml(stripTraceMarkers(s)).trim();

interface ModelInvocationInput {
  text?: string;
  inferenceConfiguration?: unknown;
  foundationModel?: string;
  modelId?: string;
  [key: string]: unknown;
}

interface ModelInvocationOutput {
  finalResponse?: string;
  rawResponse?: string;
  [key: string]: unknown;
}

interface Rationale {
  text?: string;
  [key: string]: unknown;
}

interface OrchestrationTrace {
  type?: string;
  traceId?: string;
  modelInvocationInput?: ModelInvocationInput;
  rationale?: Rationale;
  modelInvocationOutput?: ModelInvocationOutput;
  knowledgeBaseLookupTrace?: unknown;
  invocationInput?: unknown;
  observation?: unknown;
  [key: string]: unknown;
}

interface TraceEvent {
  type?: string;
  traceId?: string;
  orchestrationTrace?: OrchestrationTrace;
  trace?: {
    orchestrationTrace?: OrchestrationTrace;
  };
  [key: string]: unknown;
}

function TraceViewer({ traces }: { traces: TraceEvent[] }) {
  if (!traces?.length) return null;

  const J = ({ value }: { value: unknown }) => (
    <pre className="text-[11px] bg-muted p-2 rounded overflow-x-auto">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );

  const normalize = (t: TraceEvent) => {
    const o = t?.orchestrationTrace ?? t?.trace?.orchestrationTrace ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const out: Array<{ label: string; content: any }> = [];

    if (o.modelInvocationInput) {
      const mi = o.modelInvocationInput;
      out.push({
        label: "Model Invocation Input",
        content: {
          text: mi.text ?? undefined,
          inferenceConfiguration: mi.inferenceConfiguration ?? undefined,
          foundationModel: mi.foundationModel ?? mi.modelId ?? undefined,
        },
      });
    }
    if (o.rationale?.text) {
      out.push({ label: "Rationale", content: o.rationale.text });
    }
    if (o.knowledgeBaseLookupTrace) {
      out.push({
        label: "Knowledge Base Lookup",
        content: o.knowledgeBaseLookupTrace,
      });
    }
    if (o.invocationInput) {
      out.push({
        label: "Action Invocation Input",
        content: o.invocationInput,
      });
    }
    if (o.observation) {
      out.push({ label: "Action Observation", content: o.observation });
    }
    if (o.modelInvocationOutput?.finalResponse) {
      out.push({
        label: "Model Final Response",
        content: o.modelInvocationOutput.finalResponse,
      });
    } else if (o.modelInvocationOutput?.rawResponse) {
      out.push({
        label: "Model Raw Response",
        content: o.modelInvocationOutput.rawResponse,
      });
    }
    if (t?.preProcessingTrace) {
      out.push({ label: "Pre-processing", content: t.preProcessingTrace });
    }
    if (t?.postProcessingTrace) {
      out.push({ label: "Post-processing", content: t.postProcessingTrace });
    }
    if (out.length === 0) out.push({ label: "Trace (raw chunk)", content: t });

    return out;
  };

  return (
    <div className="mt-2 space-y-2">
      {traces.map((t, i) => {
        const steps = normalize(t);
        const meta = {
          type: t?.type ?? t?.orchestrationTrace?.type,
          eventTime: t?.eventTime,
          traceId: t?.traceId ?? t?.orchestrationTrace?.traceId,
        };

        return (
          <div key={i} className="border border-border rounded p-2">
            <div className="text-[11px] font-medium mb-1">
              Trace event #{i + 1}
              {meta.type ? ` · ${meta.type}` : ""}
              {meta.eventTime ? ` · ${meta.eventTime}` : ""}
            </div>
            <ul className="space-y-2">
              {steps.map((s, idx) => (
                <li key={idx}>
                  <div className="text-[11px] font-medium">{s.label}</div>
                  <J value={s.content} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

interface ChatContentProps {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  welcomeMessage?: string;
  reasoning?: string;
  traceEvents?: Record<string, unknown>[];
}

export function ChatContent({
  messages,
  isLoading,
  error,
  welcomeMessage,
  reasoning,
  traceEvents = [],
}: ChatContentProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              <Bot className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Start a conversation</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {welcomeMessage || "Ask me anything about your workspace"}
              </p>
            </div>
          )}

          {messages.map((message) => {
            const m = message as ChatMessage;
            const isUser = m.role === "user";
            const timeLabel = m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={m.id}
                className={cn(
                  "flex items-start space-x-3",
                  isUser ? "flex-row-reverse space-x-reverse" : ""
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-7 h-7 border rounded flex items-center justify-center",
                    isUser
                      ? "bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex-1 max-w-[85%]",
                    isUser ? "text-right" : ""
                  )}
                >
                  <div
                    className={cn(
                      "px-3 py-2 text-sm border rounded-lg",
                      isUser
                        ? "bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white ml-auto inline-block"
                        : "bg-card border-border text-card-foreground"
                    )}
                  >
                    {isUser ? (
                      m.content
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
                          {sanitizeForDisplay((m.content as string) || "")}
                        </ReactMarkdown>

                        {reasoning && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Reasoning
                            </summary>
                            <div className="text-xs mt-1 whitespace-pre-wrap text-muted-foreground/90">
                              {reasoning}
                            </div>
                          </details>
                        )}

                        {traceEvents.length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Trace
                            </summary>
                            <TraceViewer traces={traceEvents} />
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "text-xs text-muted-foreground mt-1",
                      isUser ? "text-right" : ""
                    )}
                  >
                    {timeLabel}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-7 h-7 border rounded bg-muted border-border text-muted-foreground flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-card border border-border text-card-foreground text-sm rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-7 h-7 border rounded bg-red-100 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1">
                <div className="px-3 py-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm rounded-lg">
                  Sorry, I encountered an error. Please try again.
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

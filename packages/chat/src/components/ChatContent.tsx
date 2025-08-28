"use client";

import React, { useRef, useEffect, useMemo, useCallback, memo } from "react";
import { ScrollArea, Button } from "@captify/client";
import { cn } from "../lib/utils";
import { Bot, User, Loader2, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "next-themes";
import { type Message } from "@ai-sdk/react";

export type ChatMessage = Message & { createdAt?: Date };

// Constants moved outside component to prevent recreation
const TRACE_RE = /<!--TRACE:[\s\S]*?-->/g;
const TRACEJSON_RE = /<!--TRACEJSON:[\s\S]*?-->/g;
const AGENT_TAG_RE =
  /<\/?(answer|answer_part|assistant|assistant_part|sources?|source|search_results?|search_result|content|text|tool_use|tool_result|citations?)\b[^>]*>/gi;

// Language mapping for better performance
const LANGUAGE_MAP: Record<string, string> = {
  py: "python",
  python3: "python",
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  htm: "html",
  xhtml: "html",
  c: "c",
  h: "c",
  java: "java",
  css: "css",
  scss: "scss",
  sass: "sass",
  md: "markdown",
  markdown: "markdown",
  sh: "bash",
  shell: "bash",
  bash: "bash",
  json: "json",
  sql: "sql",
  xml: "xml",
};

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  python: "Python",
  typescript: "TypeScript",
  javascript: "JavaScript",
  html: "HTML",
  c: "C",
  java: "Java",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  markdown: "Markdown",
  bash: "Bash",
  json: "JSON",
  sql: "SQL",
  xml: "XML",
};

// Language detection patterns
const LANGUAGE_PATTERNS: Array<[RegExp, string]> = [
  [
    /^(import\s|from\s|def\s|class\s|if\s__name__\s*==\s*['"]\s*__main__\s*['"]|print\s*\(|#.*python)/m,
    "python",
  ],
  [
    /^(import\s.*from|export\s|interface\s|type\s.*=|const\s.*:\s|function\s|class\s|\/\/.*typescript)/m,
    "typescript",
  ],
  [
    /^(var\s|let\s|const\s|function\s|class\s|\$\(|\/\/.*javascript)/m,
    "javascript",
  ],
  [/^<(!DOCTYPE|html|head|body|div|span|p|a|img)/i, "html"],
  [/^(#include\s|int\s+main|void\s+|char\s|\/\*.*c\s*\*\/)/m, "c"],
  [
    /^(public\s+class|import\s+java|package\s|public\s+static\s+void\s+main)/m,
    "java",
  ],
];

// Optimized utility functions
const stripTraceMarkers = (s: string): string =>
  String(s || "")
    .replace(TRACEJSON_RE, "")
    .replace(TRACE_RE, "");

const stripAgentXml = (s: string): string =>
  String(s || "").replace(AGENT_TAG_RE, "");

const sanitizeForDisplay = (s: string): string =>
  stripAgentXml(stripTraceMarkers(s)).trim();

// Optimized language detection
const detectLanguage = (content: string, className?: string): string => {
  // Try className first (most reliable)
  const match = /language-(\w+)/.exec(className || "");
  if (match) {
    const detected = match[1].toLowerCase();
    return LANGUAGE_MAP[detected] || detected;
  }

  // Fallback to content analysis
  const code = content.trim();
  for (const [pattern, lang] of LANGUAGE_PATTERNS) {
    if (pattern.test(code)) return lang;
  }

  // JSON detection with error handling
  if (
    code &&
    code.trim() !== "" &&
    /^\s*[\{\[]/.test(code) &&
    /[\}\]]\s*$/.test(code)
  ) {
    try {
      JSON.parse(code);
      return "json";
    } catch {
      // Not valid JSON
    }
  }

  return "text";
};

const getLanguageDisplayName = (lang: string): string =>
  LANGUAGE_DISPLAY_NAMES[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);

// Optimized Code Component with memoization
interface CodeProps {
  node?: unknown;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeComponent = memo<CodeProps>(
  ({ inline, className, children, ...props }) => {
    const { theme } = useTheme();
    const [copied, setCopied] = React.useState(false);

    const codeString = useMemo(
      () => String(children).replace(/\n$/, ""),
      [children]
    );

    const language = useMemo(
      () => detectLanguage(codeString, className),
      [codeString, className]
    );

    const handleCopy = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(codeString);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    }, [codeString]);

    const syntaxStyle = useMemo(
      () => (theme === "dark" ? oneDark : oneLight),
      [theme]
    );

    const customStyle = useMemo(
      () => ({
        margin: 0,
        padding: "1rem",
        background: "transparent",
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      }),
      []
    );

    if (inline) {
      return (
        <code
          className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="relative group">
        <div className="flex items-center justify-between py-2 px-4 bg-muted border-b">
          <span className="text-xs font-medium text-muted-foreground">
            {getLanguageDisplayName(language)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        <SyntaxHighlighter
          style={syntaxStyle}
          language={language}
          PreTag="div"
          className="!m-0 !bg-transparent"
          customStyle={customStyle}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  }
);

CodeComponent.displayName = "CodeComponent";

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
  reasoningText?: string;
  traceEvents?: Record<string, unknown>[];
}

// Memoized message component for better performance
const MessageItem = memo<{
  message: ChatMessage;
  reasoningText?: string;
  traceEvents?: Record<string, unknown>[];
}>(({ message, reasoningText, traceEvents = [] }) => {
  const isUser = message.role === "user";

  const timeLabel = useMemo(() => {
    if (!message.createdAt) return "";
    return new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [message.createdAt]);

  const sanitizedContent = useMemo(
    () => sanitizeForDisplay(message.content || ""),
    [message.content]
  );

  const markdownComponents = useMemo(
    () => ({
      code: CodeComponent,
      ul: ({ children, ...props }: any) => (
        <ul className="list-disc list-inside space-y-1 my-2" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: any) => (
        <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
          {children}
        </ol>
      ),
      li: ({ children, ...props }: any) => (
        <li className="text-sm leading-relaxed" {...props}>
          {children}
        </li>
      ),
      blockquote: ({ children, ...props }: any) => (
        <blockquote
          className="border-l-4 border-blue-500 pl-4 py-2 my-3 bg-muted/50 rounded-r"
          {...props}
        >
          {children}
        </blockquote>
      ),
      table: ({ children, ...props }: any) => (
        <table
          className="min-w-full border border-border rounded-lg my-4"
          {...props}
        >
          {children}
        </table>
      ),
      th: ({ children, ...props }: any) => (
        <th
          className="border-b border-border bg-muted px-4 py-2 text-left font-semibold"
          {...props}
        >
          {children}
        </th>
      ),
      td: ({ children, ...props }: any) => (
        <td className="border-b border-border px-4 py-2" {...props}>
          {children}
        </td>
      ),
      h1: ({ children, ...props }: any) => (
        <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: any) => (
        <h2 className="text-base font-semibold mt-3 mb-2 first:mt-0" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: any) => (
        <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0" {...props}>
          {children}
        </h3>
      ),
      p: ({ children, ...props }: any) => {
        // Always use div for paragraphs to avoid hydration issues with nested block elements
        return (
          <div className="mb-2 last:mb-0 leading-relaxed" {...props}>
            {children}
          </div>
        );
      },
      // Fix div nesting issues by avoiding wrapper divs in table
      thead: ({ children, ...props }: any) => (
        <thead {...props}>{children}</thead>
      ),
      tbody: ({ children, ...props }: any) => (
        <tbody {...props}>{children}</tbody>
      ),
      tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    }),
    []
  );

  return (
    <div
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

      <div className={cn("flex-1 max-w-[85%]", isUser ? "text-right" : "")}>
        <div
          className={cn(
            "px-3 py-2 text-sm border rounded-lg",
            isUser
              ? "bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white ml-auto inline-block"
              : "bg-card border-border text-card-foreground"
          )}
        >
          {isUser ? (
            sanitizedContent
          ) : (
            <article className="prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={markdownComponents}
              >
                {sanitizedContent}
              </ReactMarkdown>

              {reasoningText && (
                <details className="mt-2" open>
                  <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    Agent Reasoning
                  </summary>
                  <div className="text-xs mt-1 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                    {reasoningText}
                  </div>
                </details>
              )}

              {traceEvents.length > 0 && (
                <details className="mt-2" open>
                  <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    Agent Process ({traceEvents.length} step
                    {traceEvents.length !== 1 ? "s" : ""})
                  </summary>
                  <TraceViewer traces={traceEvents} />
                </details>
              )}
            </article>
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
});

MessageItem.displayName = "MessageItem";

// Optimized ChatContent component
export const ChatContent = memo<ChatContentProps>(
  ({
    messages,
    isLoading,
    error,
    welcomeMessage,
    reasoningText,
    traceEvents = [],
  }) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Optimized scroll function with debouncing
    const scrollToBottom = useCallback(
      (behavior: ScrollBehavior = "smooth") => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
        }
      },
      []
    );

    // Debounced auto-scroll on messages change
    useEffect(() => {
      const timeoutId = setTimeout(() => scrollToBottom(), 100);
      return () => clearTimeout(timeoutId);
    }, [messages.length, isLoading, scrollToBottom]);

    // Initial scroll on mount
    useEffect(() => {
      if (messages.length > 0) {
        scrollToBottom("auto");
      }
    }, []); // Only run on mount

    const hasMessages = messages.length > 0;

    return (
      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="p-4 space-y-4">
            {!hasMessages && (
              <div className="text-center text-sm text-muted-foreground py-12">
                <Bot className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Start a conversation</p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {welcomeMessage || "Ask me anything about your workspace"}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                reasoningText={reasoningText}
                traceEvents={traceEvents}
              />
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-7 h-7 border rounded bg-muted border-border text-muted-foreground flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="px-3 py-2 bg-card border border-border text-card-foreground text-sm rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <span className="text-blue-600 font-medium">
                        Agent is thinking...
                      </span>
                    </div>
                    {reasoningText && (
                      <div className="mt-2 text-xs p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-200">
                        <div className="font-medium mb-1">
                          Current reasoning:
                        </div>
                        <div className="whitespace-pre-wrap">
                          {reasoningText}
                        </div>
                      </div>
                    )}
                    {traceEvents.length > 0 && (
                      <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                        Processing step {traceEvents.length}...
                      </div>
                    )}
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

            <div ref={messagesEndRef} className="h-0" />
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ChatContent.displayName = "ChatContent";

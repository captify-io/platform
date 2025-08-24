"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet";

export type ConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sessionId: string;
};

interface ChatHistoryProps {
  showHistory: boolean;
  history: ConversationSummary[];
  onHistoryChange: (open: boolean) => void;
  onResumeConversation: (item: ConversationSummary) => void;
}

export function ChatHistory({
  showHistory,
  history,
  onHistoryChange,
  onResumeConversation,
}: ChatHistoryProps) {
  return (
    <Sheet open={showHistory} onOpenChange={onHistoryChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle>Conversations</SheetTitle>
        </SheetHeader>
        <div className="p-2 space-y-1 overflow-auto h-full">
          {history.length === 0 ? (
            <div className="text-xs text-muted-foreground p-4">
              No conversations yet.
            </div>
          ) : (
            history.map((h) => (
              <button
                key={h.id}
                onClick={() => onResumeConversation(h)}
                className="w-full text-left p-3 hover:bg-muted rounded border-b border-border/50"
              >
                <div className="text-sm font-medium truncate">{h.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(h.updatedAt).toLocaleString()}
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
      <SheetTrigger asChild />
    </Sheet>
  );
}

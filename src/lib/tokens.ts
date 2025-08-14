import type { Message } from '@ai-sdk/react';

// Lightweight estimate (~4 characters per token)
export function estimateTokens(messages: Message[] | undefined) {
  if (!messages?.length) return 0;
  const totalChars = messages.reduce((sum, m) => {
    const clean = String(m.content || "")
      .replace(/<!--TRACE:[\s\S]*?-->/g, "")
      .replace(/<!--TRACEJSON:[\s\S]*?-->/g, "");
    return sum + clean.length;
  }, 0);
  return Math.max(1, Math.round(totalChars / 4));
}

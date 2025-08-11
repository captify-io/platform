import { Brain, Zap } from "lucide-react";

export type ProviderType = "bedrock-agent" | "llm";

export interface Provider {
  value: string;
  label: string;
  type: ProviderType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const providers: Provider[] = [
  {
    value: "bedrock-agent",
    label: "Bedrock Agent",
    type: "bedrock-agent",
    icon: Brain,
    description: "AI Agent with reasoning and tools",
  },
  {
    value: "openai",
    label: "OpenAI GPT",
    type: "llm",
    icon: Zap,
    description: "ChatGPT models",
  },
  {
    value: "anthropic",
    label: "Claude",
    type: "llm",
    icon: Zap,
    description: "Anthropic Claude models",
  },
  {
    value: "azure-openai",
    label: "Azure OpenAI",
    type: "llm",
    icon: Zap,
    description: "Microsoft Azure OpenAI",
  },
  {
    value: "grok",
    label: "Grok",
    type: "llm",
    icon: Zap,
    description: "xAI Grok models",
  },
  {
    value: "bedrock",
    label: "Amazon Bedrock",
    type: "llm",
    icon: Zap,
    description: "AWS Bedrock models",
  },
];

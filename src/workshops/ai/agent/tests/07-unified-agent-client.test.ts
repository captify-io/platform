// Auto-generated from agent/user-stories/07-unified-agent-client.yaml
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests
//
// Feature: Unified AgentClient Class (07)
// Priority: P0
// Story Points: 8
// Estimated Hours: 16

import { apiClient } from '@captify-io/core/lib/api';

jest.mock('@captify-io/core/lib/api');

describe('Feature: Unified AgentClient Class', () => {
  describe('US-07-01: Create unified AgentClient interface', () => {
    // User Story:
    // As a developer
    // I want a single client class that works with all agent types
    // So that I can switch agent modes without changing my code

    it('should create client with default settings', async () => {
      // Arrange
      const input = {
        "mode": "assistant"
};

      // Act
      const client = new AgentClient({ mode: input.mode });

      // Assert
      expect(client).toBeDefined();
      expect(client.sendMessage).toBeDefined();
      expect(client.streamMessage).toBeDefined();
      expect(client.loadTools).toBeDefined();
    });

    it('should send message and return response', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello, world!"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const response = await client.sendMessage(input.message)
;

      // Assert
      expect(response).toHaveProperty('content');
      expect(response.content).toBe('Hello! How can I help you?');
    });

    it('should switch modes dynamically', async () => {
      // Arrange
      const input = {
        "initialMode": "assistant",
        "newMode": "captify-agent"
};

      // Act
      const client = new AgentClient({ mode: input.initialMode })
await client.setMode(input.newMode)
;

      // Assert
      expect(client.getMode()).toBe(input.newMode);
    });

  });

  describe('US-07-02: Implement assistant mode adapter', () => {
    // User Story:
    // As a developer
    // I want to use AgentClient with basic assistant mode
    // So that I can have simple conversations without tools

    it('should use streamText for assistant mode', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "What is 2+2?"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const response = await client.sendMessage(input.message)
;

      // Assert
      expect(ai.streamText).toHaveBeenCalled();
      expect(ai.streamText).toHaveBeenCalledWith(expect.objectContaining({ prompt: input.message }));
      expect(response.content).toBe('4');
    });

    it('should stream assistant responses', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Count to 3"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const stream = await client.streamMessage(input.message)
const chunks = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
;

      // Assert
      expect(chunks).toHaveLength(3);
      expect(chunks).toEqual(['1', ' 2', ' 3']);
    });

    it('should not include tools in assistant mode', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
await client.sendMessage(input.message)
;

      // Assert
      expect(ai.streamText).toHaveBeenCalledWith(expect.not.objectContaining({ tools: expect.anything() }));
    });

  });

  describe('US-07-03: Implement captify-agent mode adapter', () => {
    // User Story:
    // As a developer
    // I want to use AgentClient with captify-agent mode
    // So that I can access memory, search, and custom tools

    it('should use captify service for captify-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "message": "Search for contracts",
        "threadId": "thread-123"
};

      // Act
      const client = new AgentClient({ mode: input.mode, threadId: input.threadId })
const response = await client.sendMessage(input.message)
;

      // Assert
      expect(captifyAgent.run).toHaveBeenCalled();
      expect(response.content).toBe('Found 5 contracts');
    });

    it('should load custom tools in captify-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "tools": [
                {
                        "name": "search",
                        "description": "Search documents"
                }
        ]
};

      // Act
      const client = new AgentClient({ mode: input.mode })
await client.loadTools(input.tools)
const availableTools = client.getAvailableTools()
;

      // Assert
      expect(availableTools).toContain('search');
    });

    it('should execute tool calls in captify-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "message": "Search for user Alice"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const response = await client.sendMessage(input.message)
;

      // Assert
      expect(response.toolCalls).toHaveLength(1);
      expect(response.toolCalls[0].name).toBe('search');
    });

  });

  describe('US-07-04: Implement aws-agent mode adapter', () => {
    // User Story:
    // As a developer
    // I want to use AgentClient with AWS Bedrock agents
    // So that I can leverage enterprise agent capabilities

    it('should use Bedrock service for aws-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "aws-agent",
        "agentId": "agent-123",
        "message": "What is my contract status?"
};

      // Act
      const client = new AgentClient({ mode: input.mode, agentId: input.agentId })
const response = await client.sendMessage(input.message)
;

      // Assert
      expect(bedrockAgent.invokeAgent).toHaveBeenCalled();
      expect(bedrockAgent.invokeAgent).toHaveBeenCalledWith(expect.objectContaining({ agentId: input.agentId }));
      expect(response.content).toBe('Your contract is active');
    });

    it('should maintain session across messages in aws-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "aws-agent",
        "agentId": "agent-123",
        "messages": [
                "Hello",
                "What did I just say?"
        ]
};

      // Act
      const client = new AgentClient({ mode: input.mode, agentId: input.agentId })
const response1 = await client.sendMessage(input.messages[0])
const response2 = await client.sendMessage(input.messages[1])
;

      // Assert
      expect(response1.sessionId).toBe('session-789');
      expect(response2.sessionId).toBe('session-789');
      expect(bedrockAgent.invokeAgent).toHaveBeenCalledTimes(2);
    });

    it('should stream Bedrock agent responses', async () => {
      // Arrange
      const input = {
        "mode": "aws-agent",
        "agentId": "agent-123",
        "message": "Summarize contracts"
};

      // Act
      const client = new AgentClient({ mode: input.mode, agentId: input.agentId })
const stream = await client.streamMessage(input.message)
const chunks = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
;

      // Assert
      expect(chunks).toHaveLength(3);
      expect(chunks.join('')).toBe('Contract summary: 5 active');
    });

  });

  describe('US-07-05: Create settings manager with validation', () => {
    // User Story:
    // As a developer
    // I want type-safe settings for each agent mode
    // So that I can configure agents correctly with compile-time safety

    it('should validate assistant mode settings', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "settings": {
                "model": "gpt-4",
                "temperature": 0.7,
                "maxTokens": 1000
        }
};

      // Act
      const client = new AgentClient({ mode: input.mode, ...input.settings });

      // Assert
      expect(client.getSettings()).toMatchObject(input.settings);
    });

    it('should reject invalid temperature', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "settings": {
                "temperature": 3
        }
};

      // Act
      const createClient = () => new AgentClient({ mode: input.mode, ...input.settings });

      // Assert
      expect(createClient).toThrow();
      expect(createClient).toThrow(/temperature must be between 0 and 2/i);
    });

    it('should validate captify-agent settings', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "settings": {
                "threadId": "thread-123",
                "systemPrompt": "You are a helpful assistant",
                "tools": [
                        "search",
                        "memory"
                ]
        }
};

      // Act
      const client = new AgentClient({ mode: input.mode, ...input.settings });

      // Assert
      expect(client.getSettings()).toMatchObject(input.settings);
    });

    it('should validate aws-agent settings', async () => {
      // Arrange
      const input = {
        "mode": "aws-agent",
        "settings": {
                "agentId": "agent-123",
                "agentAliasId": "alias-456"
        }
};

      // Act
      const client = new AgentClient({ mode: input.mode, ...input.settings });

      // Assert
      expect(client.getSettings()).toMatchObject(input.settings);
    });

    it('should require agentId for aws-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "aws-agent"
};

      // Act
      const createClient = () => new AgentClient({ mode: input.mode });

      // Assert
      expect(createClient).toThrow();
      expect(createClient).toThrow(/agentId is required for aws-agent mode/i);
    });

    it('should update settings with validation', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "initialSettings": {
                "temperature": 0.7
        },
        "newSettings": {
                "temperature": 0.9,
                "maxTokens": 2000
        }
};

      // Act
      const client = new AgentClient({ mode: input.mode, ...input.initialSettings })
await client.updateSettings(input.newSettings)
;

      // Assert
      expect(client.getSettings()).toMatchObject(input.newSettings);
    });

  });

  describe('US-07-06: Implement unified streaming interface', () => {
    // User Story:
    // As a developer
    // I want consistent streaming API across all agent modes
    // So that I can build UIs that work with any agent type

    it('should return async iterable stream', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const stream = await client.streamMessage(input.message)
;

      // Assert
      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it('should yield text chunks in consistent format', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Count to 3"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const stream = await client.streamMessage(input.message)
const chunks = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
;

      // Assert
      expect(chunks).toHaveLength(3);
      expect(chunks[0]).toHaveProperty('type', 'text');
      expect(chunks[0]).toHaveProperty('text', '1');
    });

    it('should yield tool call chunks in captify-agent mode', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "message": "Search for Alice"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const stream = await client.streamMessage(input.message)
const chunks = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
;

      // Assert
      expect(chunks).toHaveLength(3);
      expect(chunks[0].type).toBe('tool-call');
      expect(chunks[1].type).toBe('tool-result');
      expect(chunks[2].type).toBe('text');
    });

    it('should include finish reason in final chunk', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const stream = await client.streamMessage(input.message)
let finalChunk
for await (const chunk of stream) {
  finalChunk = chunk
}
;

      // Assert
      expect(finalChunk).toHaveProperty('finishReason', 'stop');
    });

  });

  describe('US-07-07: Implement consistent error handling', () => {
    // User Story:
    // As a developer
    // I want predictable error handling across all agent modes
    // So that I can gracefully handle failures in my application

    it('should throw AgentError on API failure', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
const sendMessage = () => client.sendMessage(input.message)
;

      // Assert
      await expect(sendMessage()).rejects.toThrow(AgentError);
      await expect(sendMessage()).rejects.toThrow(/API call failed/i);
    });

    it('should include error type in AgentError', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
try {
  await client.sendMessage(input.message)
} catch (error) {
  return error
}
;

      // Assert
      expect(result).toBeInstanceOf(AgentError);
      expect(result.type).toBe('rate-limit');
      expect(result.retryAfter).toBeDefined();
    });

    it('should throw validation error for invalid settings', async () => {
      // Arrange
      const input = {
        "mode": "assistant",
        "settings": {
                "temperature": 5
        }
};

      // Act
      try {
  new AgentClient({ mode: input.mode, ...input.settings })
} catch (error) {
  return error
}
;

      // Assert
      expect(result).toBeInstanceOf(AgentError);
      expect(result.type).toBe('validation');
      expect(result.message).toMatch(/temperature/i);
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      const input = {
        "mode": "captify-agent",
        "message": "Hello"
};

      // Act
      const client = new AgentClient({ mode: input.mode })
try {
  await client.sendMessage(input.message)
} catch (error) {
  return error
}
;

      // Assert
      expect(result).toBeInstanceOf(AgentError);
      expect(result.type).toBe('network');
      expect(result.code).toBe('ECONNREFUSED');
    });

  });

});

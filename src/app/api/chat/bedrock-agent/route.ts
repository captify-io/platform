import { NextRequest } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { fromEnv } from '@aws-sdk/credential-providers';

export async function POST(req: NextRequest) {
  console.log('🤖 Bedrock Agent API - Request received');
  
  try {
    const { messages, sessionId, agentId, agentAliasId } = await req.json();
    console.log('📝 Request payload:', { 
      messageCount: messages?.length, 
      sessionId,
      agentId: agentId || process.env.AWS_BEDROCK_AGENT_ID,
      agentAliasId: agentAliasId || process.env.AWS_BEDROCK_AGENT_ALIAS_ID,
      messages: messages?.map((m: any) => ({ role: m.role, contentLength: m.content?.length }))
    });

    // Get the last user message as input for the agent
    const lastMessage = messages[messages.length - 1];
    const inputText = lastMessage?.content || '';
    console.log('💬 Input text for agent:', { 
      inputLength: inputText.length,
      preview: inputText.substring(0, 100) + (inputText.length > 100 ? '...' : '')
    });

    // Initialize Bedrock Agent Runtime client
    console.log('🔧 Initializing Bedrock Agent client...');
    const client = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: fromEnv(),
    });
    console.log('✅ Bedrock Agent client initialized');

    const commandParams = {
      agentId: agentId || process.env.AWS_BEDROCK_AGENT_ID,
      agentAliasId: agentAliasId || process.env.AWS_BEDROCK_AGENT_ALIAS_ID,
      sessionId: sessionId || `session-${Date.now()}`,
      inputText,
      enableTrace: true, // Enable trace for reasoning visibility
    };
    console.log('📋 Command parameters:', commandParams);

    const command = new InvokeAgentCommand(commandParams);
    console.log('🚀 Invoking Bedrock Agent...');

    const response = await client.send(command);
    console.log('📥 Bedrock Agent response received:', {
      hasCompletion: !!response.completion,
      sessionId: response.sessionId,
      contentType: response.contentType
    });

    // Create a streaming response compatible with the AI SDK
    console.log('🌊 Creating streaming response...');
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        console.log('📡 Stream started');
        
        try {
          if (response.completion) {
            console.log('✅ Completion stream available, processing chunks...');
            let fullResponse = '';
            let chunkCount = 0;
            
            for await (const chunk of response.completion) {
              chunkCount++;
              console.log(`📦 Processing chunk ${chunkCount}:`, {
                hasTrace: !!chunk.trace,
                hasChunk: !!chunk.chunk,
                chunkBytes: chunk.chunk?.bytes ? chunk.chunk.bytes.length : 0
              });
              
              // Handle trace events for reasoning
              if (chunk.trace) {
                // Process reasoning traces here if needed
                const trace = chunk.trace;
                console.log('🧠 Trace received:', {
                  hasOrchestrationTrace: !!trace.orchestrationTrace,
                  hasRationale: !!trace.orchestrationTrace?.rationale,
                  hasInvocationInput: !!trace.orchestrationTrace?.invocationInput,
                  hasObservation: !!trace.orchestrationTrace?.observation
                });
                
                if (trace.orchestrationTrace?.rationale?.text) {
                  const reasoning = trace.orchestrationTrace.rationale.text;
                  console.log('💭 Agent reasoning:', reasoning);
                }
                
                if (trace.orchestrationTrace?.invocationInput) {
                  console.log('⚡ Tool invocation:', trace.orchestrationTrace.invocationInput);
                }
                
                if (trace.orchestrationTrace?.observation) {
                  console.log('👀 Tool observation:', trace.orchestrationTrace.observation);
                }
              }
              
              // Handle actual response content
              if (chunk.chunk?.bytes) {
                const text = new TextDecoder().decode(chunk.chunk.bytes);
                console.log('📝 Text chunk decoded:', { 
                  length: text.length, 
                  preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
                });
                fullResponse += text;
                
                // Stream the text chunk
                const streamChunk = `0:"${text.replace(/"/g, '\\"')}"\n`;
                controller.enqueue(encoder.encode(streamChunk));
                console.log('📤 Chunk sent to client');
              }
            }
            
            console.log('🏁 Streaming complete:', {
              totalChunks: chunkCount,
              totalResponseLength: fullResponse.length,
              responsePreview: fullResponse.substring(0, 100) + (fullResponse.length > 100 ? '...' : '')
            });
            
            // Send completion signal
            const finishChunk = `d:{"finishReason":"stop","usage":{"promptTokens":${inputText.length},"completionTokens":${fullResponse.length}}}\n`;
            controller.enqueue(encoder.encode(finishChunk));
            console.log('✅ Completion signal sent');
          } else {
            console.log('❌ No completion stream in response');
          }
        } catch (error) {
          console.error('💥 Stream processing error:', error);
          const errorChunk = `d:{"error":"${error.message || 'Unknown error'}"}\n`;
          controller.enqueue(encoder.encode(errorChunk));
        } finally {
          console.log('🔚 Stream closed');
          controller.close();
        }
      },
    });

    console.log('📡 Creating HTTP response with streaming headers...');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('💥 Bedrock Agent API error:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.$metadata && { awsMetadata: error.$metadata })
    });
    
    // Log specific AWS errors
    if (error.name === 'AccessDeniedException') {
      console.error('🔒 AWS Access Denied - Check your credentials and permissions');
    } else if (error.name === 'ResourceNotFoundException') {
      console.error('🔍 AWS Resource Not Found - Check agent ID and alias ID');
    } else if (error.name === 'ValidationException') {
      console.error('⚠️ AWS Validation Error - Check request parameters');
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message,
        type: error.name || 'Unknown'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

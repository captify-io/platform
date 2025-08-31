/**
 * Chat API Handlers
 * All server-side logic for chat operations
 */

import { apiClient } from "@/lib/api/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/lib/auth-config";

export const chatHandlers = {
  /**
   * Send a chat message
   */
  POST: async (req: Request) => {
    try {
      const session = (await getServerSession(authOptions as any)) as any;

      if (!session?.user) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { message, sessionId, agentId } = await req.json();

      if (!message) {
        return new Response(JSON.stringify({ error: "Message is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = (session.user as any)?.id || session.user?.email;

      // This would call the chat service to process the message
      // For now, using a simple echo response
      const chatResponse = `Echo: ${message}`;
      const finalSessionId = sessionId || `session-${Date.now()}`;

      // Store the message
      await apiClient.run({
        service: "dynamo",
        operation: "put",
        app: "chat",
        table: "messages",
        data: {
          values: [
            {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: message,
              role: "user",
              userId,
              sessionId: finalSessionId,
              timestamp: new Date().toISOString(),
              agentId,
            },
          ],
        },
      });

      // Store the response
      await apiClient.run({
        service: "dynamo",
        operation: "put",
        app: "chat",
        table: "messages",
        data: {
          values: [
            {
              id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              content: chatResponse,
              role: "assistant",
              userId,
              sessionId: finalSessionId,
              timestamp: new Date().toISOString(),
              agentId,
            },
          ],
        },
      });

      const response = {
        success: true,
        data: {
          response: chatResponse,
          sessionId: finalSessionId,
        },
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Chat POST error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  /**
   * Get chat history
   */
  GET: async (req: Request) => {
    try {
      const session = (await getServerSession(authOptions as any)) as any;

      if (!session?.user) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId");
      const userId = (session.user as any)?.id || session.user?.email;

      let response;
      if (sessionId) {
        // Get messages for specific session
        response = await apiClient.run({
          service: "dynamo",
          operation: "query",
          app: "chat",
          table: "messages",
          data: {
            index: "sessionId-index",
            values: [{ sessionId: sessionId }],
          },
        });
      } else {
        // Get all sessions for user
        response = await apiClient.run({
          service: "dynamo",
          operation: "scan",
          app: "chat",
          table: "sessions",
          data: {
            values: [{ userId: userId }],
          },
        });
      }

      if (!response.success) {
        return new Response(JSON.stringify({ error: response.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Chat GET error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  /**
   * Delete chat session
   */
  DELETE: async (req: Request) => {
    try {
      const session = (await getServerSession(authOptions as any)) as any;

      if (!session?.user) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const { sessionId } = await req.json();

      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: "sessionId is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const userId = (session.user as any)?.id || session.user?.email;

      const response = await apiClient.run({
        service: "dynamo",
        operation: "delete",
        app: "chat",
        table: "sessions",
        data: {
          values: [
            {
              id: sessionId,
              userId: userId,
            },
          ],
        },
      });

      if (!response.success) {
        return new Response(JSON.stringify({ error: response.error }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Chat DELETE error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};

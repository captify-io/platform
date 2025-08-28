/**
 * Chat API Handlers
 * All server-side logic for chat operations
 */

import { CaptifyApi } from "@captify/api";
import type { ApiUserSession } from "@captify/api";

export const chatHandlers = {
  /**
   * Send a chat message
   */
  POST: async (req: Request) => {
    try {
      const { message, userId, sessionId, agentId, userSession } =
        await req.json();

      if (!message || !userId) {
        return new Response(
          JSON.stringify({ error: "Message and userId are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!userSession) {
        return new Response(
          JSON.stringify({ error: "User session is required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create CaptifyApi instance and make request
      const captifyApi = new CaptifyApi();
      const response = await captifyApi.request({
        service: "chat",
        operation: "send",
        data: {
          message,
          userId,
          sessionId,
          agentId,
        },
        userSession,
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
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");
      const sessionId = url.searchParams.get("sessionId");
      const userSessionParam = url.searchParams.get("userSession");

      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!userSessionParam) {
        return new Response(
          JSON.stringify({ error: "User session is required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      let userSession: ApiUserSession;
      try {
        userSession = JSON.parse(userSessionParam);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid user session format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create CaptifyApi instance and make request
      const captifyApi = new CaptifyApi();
      const response = await captifyApi.request({
        service: "chat",
        operation: "getHistory",
        data: {
          userId,
          sessionId,
        },
        userSession,
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
      const { sessionId, userId, userSession } = await req.json();

      if (!sessionId || !userId) {
        return new Response(
          JSON.stringify({ error: "sessionId and userId are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!userSession) {
        return new Response(
          JSON.stringify({ error: "User session is required" }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create CaptifyApi instance and make request
      const captifyApi = new CaptifyApi();
      const response = await captifyApi.request({
        service: "chat",
        operation: "deleteSession",
        data: {
          sessionId,
          userId,
        },
        userSession,
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

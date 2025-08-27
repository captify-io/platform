/**
 * VeriPicks Server Handlers
 * API route handlers for VeriPicks scraping endpoints
 */

// Generic handler interface compatible with Next.js but not dependent on it
type RouteHandler = (request: Request, context?: any) => Promise<Response>;

interface RouteHandlers {
  GET?: RouteHandler;
  POST?: RouteHandler;
  PUT?: RouteHandler;
  DELETE?: RouteHandler;
}

// Helper function to create route handlers with both GET and POST support
function createScrapeHandlers(endpoint: string): RouteHandlers {
  return {
    GET: async (request: Request, context?: any): Promise<Response> => {
      try {
        const url = new URL(request.url);
        return new Response(
          JSON.stringify({
            message: `VeriPicks ${endpoint} GET endpoint`,
            path: url.pathname,
            method: "GET",
            timestamp: new Date().toISOString(),
            endpoint,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error(`VeriPicks ${endpoint} GET error:`, error);
        return new Response(
          JSON.stringify({
            error: "Internal server error",
            endpoint,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },

    POST: async (request: Request, context?: any): Promise<Response> => {
      try {
        const url = new URL(request.url);
        const body = await request.json().catch(() => ({}));

        return new Response(
          JSON.stringify({
            message: `VeriPicks ${endpoint} POST endpoint`,
            path: url.pathname,
            method: "POST",
            timestamp: new Date().toISOString(),
            endpoint,
            received: body,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error(`VeriPicks ${endpoint} POST error:`, error);
        return new Response(
          JSON.stringify({
            error: "Internal server error",
            endpoint,
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
  };
}

// Export all VeriPicks handlers
export const veripicksHandlers = {
  scrape: createScrapeHandlers("scrape"),
  scrapeGames: createScrapeHandlers("scrape/games"),
  scrapeGamePicks: createScrapeHandlers("scrape/game-picks"),
  scrapePicks: createScrapeHandlers("scrape/picks"),
  scrapeExperts: createScrapeHandlers("scrape/experts"),
  scrapeFollowing: createScrapeHandlers("scrape/following"),
};

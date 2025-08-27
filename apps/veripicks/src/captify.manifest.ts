/**
 * VeriPicks Application Manifest
 * Declares VeriPicks APIs and configuration to the Captify platform
 */

import { veripicksHandlers } from "./server/handlers";

export const captifyManifest = {
  slug: "veripicks",
  name: "VeriPicks",
  version: "1.0.0",
  description: "Sports betting data scraping and analytics platform",

  // Menu configuration for the platform
  menu: {
    label: "VeriPicks",
    icon: "TrendingUp",
    order: 20,
  },

  // API routes this package contributes
  routes: [
    {
      path: "/api/veripicks/scrape",
      handlers: veripicksHandlers.scrape,
      secure: false,
      description: "Main scraping endpoint for sports data",
    },
    {
      path: "/api/veripicks/scrape/games",
      handlers: veripicksHandlers.scrapeGames,
      secure: false,
      description: "Scrape game data from various sources",
    },
    {
      path: "/api/veripicks/scrape/game-picks",
      handlers: veripicksHandlers.scrapeGamePicks,
      secure: false,
      description: "Scrape game picks and predictions",
    },
    {
      path: "/api/veripicks/scrape/picks",
      handlers: veripicksHandlers.scrapePicks,
      secure: false,
      description: "Scrape betting picks data",
    },
    {
      path: "/api/veripicks/scrape/experts",
      handlers: veripicksHandlers.scrapeExperts,
      secure: false,
      description: "Scrape expert predictions and analysis",
    },
    {
      path: "/api/veripicks/scrape/following",
      handlers: veripicksHandlers.scrapeFollowing,
      secure: false,
      description: "Scrape following/follower data",
    },
  ],

  // Application pages this package contributes
  pages: [
    {
      path: "/app/veripicks",
      secure: true,
      roles: ["user", "admin"],
      description: "VeriPicks analytics dashboard",
    },
  ],
};

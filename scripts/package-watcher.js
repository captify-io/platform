#!/usr/bin/env node

/**
 * Package Change Notifier
 * Watches for changes in @captify-io/core package and triggers browser refresh
 */

const chokidar = require("chokidar");
const WebSocket = require("ws");
const path = require("path");

class PackageWatcher {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.setupWebSocketServer();
    this.watchPackageChanges();
  }

  setupWebSocketServer() {
    // Create WebSocket server on a different port than Next.js
    this.wss = new WebSocket.Server({ port: 3002 });

    this.wss.on("connection", (ws) => {
      console.log("🔌 Browser connected to package watcher");
      this.clients.add(ws);

      ws.on("close", () => {
        this.clients.delete(ws);
        console.log("🔌 Browser disconnected from package watcher");
      });
    });

    console.log("🚀 Package watcher WebSocket server running on port 3002");
  }

  watchPackageChanges() {
    const packageDistPath = path.resolve(process.cwd(), "packages/core/dist");

    console.log(`👀 Watching for changes in: ${packageDistPath}`);

    const watcher = chokidar.watch(packageDistPath, {
      ignored: /\.map$/,
      persistent: true,
      ignoreInitial: true,
    });

    watcher.on("change", (filePath) => {
      console.log(`📦 Package file changed: ${path.basename(filePath)}`);
      this.notifyClients("package-changed", { file: filePath });
    });

    watcher.on("add", (filePath) => {
      console.log(`📦 Package file added: ${path.basename(filePath)}`);
      this.notifyClients("package-changed", { file: filePath });
    });
  }

  notifyClients(type, data) {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(`🔄 Notified ${this.clients.size} browser(s) of ${type}`);
  }
}

// Only run if this is the main module
if (require.main === module) {
  new PackageWatcher();
}

module.exports = PackageWatcher;

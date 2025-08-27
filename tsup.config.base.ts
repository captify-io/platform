import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function peerExternals() {
  try {
    const pkg = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8")
    );
    return Object.keys(pkg.peerDependencies ?? {});
  } catch {
    return [];
  }
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: {
    resolve: true,
    // Override problematic tsconfig settings for DTS generation
    compilerOptions: {
      moduleResolution: "bundler",
      module: "esnext",
      allowImportingTsExtensions: false,
      skipLibCheck: true,
    },
  },
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === "production",
  platform: "neutral", // Support both client and server environments
  target: "es2022",
  external: peerExternals(),
  banner: {
    js: `"use client";`,
  },
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
});

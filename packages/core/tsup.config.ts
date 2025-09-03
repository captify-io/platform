import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

// Helper function to create config for each entry
const createEntryConfig = (
  entryName: string,
  entryPath: string,
  addUseClient: boolean
) => ({
  entry: { [entryName]: entryPath },
  format: ["esm"] as ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: entryName === "services", // Only clean once (first entry alphabetically)
  target: "es2022",
  minify: false,
  treeshake: false,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "@aws-sdk/*",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
  ...(addUseClient && {
    banner: {
      js: '"use client";',
    },
  }),
  onSuccess: isDev ? `echo '@captify/core ${entryName} rebuilt!'` : undefined,
  watch: isDev ? [`src/**/*.ts`, `src/**/*.tsx`] : false,
});

export default defineConfig([
  // Server-side modules (no "use client")
  createEntryConfig("services", "src/services/index.ts", false),
  createEntryConfig("api", "src/lib/index.ts", false),
  createEntryConfig("types", "src/types/index.ts", false),

  // Client-side modules (with "use client")
  createEntryConfig("app", "src/app/index.ts", true),
  createEntryConfig("components", "src/components/index.ts", true),
  createEntryConfig("hooks", "src/hooks/index.ts", true),
  createEntryConfig("ui", "src/components/ui/index.ts", true),
]);

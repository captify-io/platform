import { defineConfig } from "tsup";
import { createSharedConfig } from "../../tsup.config.base.js";

const entries = [
  // Server-side modules (no "use client")
  {
    entryName: "services",
    entryPath: "src/services/index.ts",
    addUseClient: false,
  },
  { entryName: "types", entryPath: "src/types/index.ts", addUseClient: false },
  { entryName: "app", entryPath: "src/app/index.ts", addUseClient: true }, // This needs use client for dynamic imports
  { entryName: "lib", entryPath: "src/lib/index.ts", addUseClient: false },

  // Client-side modules (with "use client")
  {
    entryName: "components",
    entryPath: "src/components/index.ts",
    addUseClient: true,
  },
];

export default defineConfig(createSharedConfig(entries));

import { defineConfig } from "tsup";
import { createSharedConfig } from "../../tsup.config.base.js";

const entries = [
  // Server-side modules (no "use client")
  { entryName: "services", entryPath: "src/services/index.ts", addUseClient: false },
  { entryName: "api", entryPath: "src/lib/index.ts", addUseClient: false },
  { entryName: "types", entryPath: "src/types/index.ts", addUseClient: false },

  // Client-side modules (with "use client")
  { entryName: "app", entryPath: "src/app/index.ts", addUseClient: true },
  { entryName: "components", entryPath: "src/components/index.ts", addUseClient: true },
  { entryName: "context", entryPath: "src/context/index.ts", addUseClient: true },
  { entryName: "hooks", entryPath: "src/hooks/index.ts", addUseClient: true },
  { entryName: "ui", entryPath: "src/components/ui/index.ts", addUseClient: true },
];

export default defineConfig(createSharedConfig(entries));
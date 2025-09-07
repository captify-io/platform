import { defineConfig, type Options } from "tsup";
import { createSharedConfig } from "../../tsup.config.base.js";

const entries = [
  // Main entry point
  { entryName: "index", entryPath: "src/index.ts", addUseClient: false },
  
  // Components (with "use client") - special handling for dynamic imports
  { entryName: "components", entryPath: "src/components/index.ts", addUseClient: true },
  { entryName: "ui", entryPath: "src/components/ui/index.ts", addUseClient: true },
  
  // Types (no "use client")
  { entryName: "types", entryPath: "src/types/index.ts", addUseClient: false },
  
  // Hooks (with "use client")  
  { entryName: "hooks", entryPath: "src/hooks/index.ts", addUseClient: true },
  
  // Lib utilities (mixed)
  { entryName: "lib", entryPath: "src/lib/index.ts", addUseClient: false },
  
  // Services (server-side only, no "use client")
  { entryName: "services", entryPath: "src/services/index.ts", addUseClient: false },
];

// Create config from base but customize for components entry
const configs = createSharedConfig(entries);

// Disable declaration generation for components entry to avoid rootDir issues
const componentsConfig = configs.find((c: Options) => 
  c.entry && Object.keys(c.entry)[0] === 'components'
);
if (componentsConfig) {
  componentsConfig.dts = false;
}

export default defineConfig(configs);
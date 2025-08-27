import { defineConfig } from "tsup";
import baseConfig from "../../tsup.config.base.js";

export default defineConfig({
  ...baseConfig,
  // Keep single entry point
  entry: ["src/index.ts"],
  // Enable DTS generation for TypeScript declarations
  dts: true,
});

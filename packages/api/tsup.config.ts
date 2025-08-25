import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2017",
  // Ensure proper module resolution
  bundle: true,
  splitting: false,
  // Help with path resolution
  external: [
    // Don't bundle these dependencies
    "@captify/core",
    "next-auth",
    "next-auth/next",
    "next-auth/providers/cognito",
    "@aws-sdk/*"
  ],
  // Add explicit resolution for local modules
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.js', '.tsx', '.jsx'];
  }
});

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
  // Don't bundle these external dependencies
  external: [
    "@captify/core",
    "next-auth",
    "next-auth/next",
    "next-auth/providers/cognito"
  ],
  // Exclude AWS SDK to avoid bundling large dependencies
  noExternal: [],
  // Configure esbuild for proper module resolution
  esbuildOptions(options) {
    options.resolveExtensions = ['.ts', '.js', '.tsx', '.jsx'];
    // Don't transform relative imports
    options.preserveSymlinks = false;
  }
});

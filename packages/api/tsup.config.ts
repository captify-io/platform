import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  target: "node18",
  platform: "node",
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    // AWS SDK packages
    "@aws-sdk/*",
    // Next.js packages
    "next-auth",
    "next-auth/*",
  ],
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs", "esm"],
  platform: "node",
  dts: true,
  sourcemap: true,
  clean: true,
});

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: false,
  clean: true,
  treeshake: false,
  banner: {
    js: '"use client";',
  },
  external: ["react", "react-dom"],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    };
  },
});

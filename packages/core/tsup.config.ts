import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      app: "src/app/index.ts",
      services: "src/services/index.ts",
      index: "src/index.ts",
    },
    format: ["esm"], // Next 15 prefers ESM
    dts: true, // types for each entry
    splitting: false, // libraries often keep this off
    sourcemap: true,
    clean: true,
    target: "es2022",
    minify: true, // enable minification
    treeshake: true,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@aws-sdk/*",
    ],
    banner: {
      js: `"use strict";`,
    },
  },
]);

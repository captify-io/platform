import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

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
    sourcemap: isDev, // only in development for faster builds
    clean: true,
    target: "es2022",
    minify: !isDev, // disable minification in development for faster builds
    treeshake: !isDev, // disable treeshaking in development for faster builds
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
    onSuccess: isDev ? "echo '📦 @captify/core rebuilt successfully!'" : undefined,
    // Use string array for watch patterns
    watch: isDev ? ["src/**/*.ts", "src/**/*.tsx"] : false,
  },
]);

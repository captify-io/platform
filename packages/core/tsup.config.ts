import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig([
  {
    entry: {
      app: "src/app/index.ts",
      services: "src/services/index.ts",
      components: "src/components/index.ts",
      context: "src/context/index.ts",
      hooks: "src/hooks/index.ts",
      api: "src/lib/index.ts",
      ui: "src/components/ui/index.ts",
    },
    format: ["esm"], // Next 15 prefers ESM
    dts: true, // types for each entry
    splitting: false, // libraries often keep this off
    sourcemap: isDev, // only in development for faster builds
    clean: true,
    target: "es2022",
    minify: false, // disable minification to preserve "use client" directives
    treeshake: false, // disable treeshaking to preserve "use client" directives
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@aws-sdk/*",
    ],
    // Add banner to preserve "use client" directives
    banner: {
      js: '"use client";',
    },
    onSuccess: isDev ? "echo '@captify/core rebuilt successfully!'" : undefined,
    // Use string array for watch patterns
    watch: isDev ? ["src/**/*.ts", "src/**/*.tsx"] : false,
  },
]);

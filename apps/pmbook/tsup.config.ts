import { defineConfig } from "tsup";

const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  entry: {
    services: "src/services/index.ts",
    app: "src/app/index.ts",
    components: "src/components/index.ts",
    types: "src/types/index.ts",
  },
  format: ["esm"],
  dts: {
    compilerOptions: {
      incremental: false,
      composite: false,
    },
  },
  splitting: false,
  sourcemap: isDev,
  clean: true,
  target: "es2022",
  minify: false, // Disable minification to preserve directive
  treeshake: false, // Disable tree shaking to preserve directive
  external: [
    "react",
    "react-dom",
    "@captify/admin",
    "lucide-react",
    "@captify/core",
  ],
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
    options.keepNames = true;
    options.legalComments = "none";
    // Ensure the banner is preserved
    options.banner = {
      js: '"use client";\n',
    };
  },
  banner: {
    js: '"use client";\n',
  },
});

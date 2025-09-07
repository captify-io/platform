import { defineConfig, type Options } from "tsup";

const isDev = process.env.NODE_ENV === "development";

export interface EntryConfig {
  entryName: string;
  entryPath: string;
  addUseClient: boolean;
}

export const createSharedConfig = (entries: EntryConfig[]): Options[] => {
  return entries.map((entry, index) => ({
    entry: { [entry.entryName]: entry.entryPath },
    format: ["esm"] as ["esm"],
    dts: {
      // Override specific tsconfig options to disable incremental compilation
      compilerOptions: {
        incremental: false,
        composite: false,
      },
    },
    splitting: false,
    sourcemap: isDev,
    clean: false, // Disable cleaning to prevent race conditions
    target: "es2022",
    minify: !isDev,
    treeshake: !isDev,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "next",
      "next/link",
      "next/navigation",
      "next/router",
      "@aws-sdk/*",
      "@captify/*",
    ],
    esbuildOptions(options) {
      options.jsx = "automatic";
      options.jsxImportSource = "react";
      options.keepNames = true;
      options.legalComments = "none";
      // Preserve the use client directive on its own line
      if (entry.addUseClient) {
        options.banner = {
          js: '"use client";\n\n',
        };
      }
    },
    onSuccess: isDev ? `echo Built ${entry.entryName}` : undefined,
    watch: isDev ? ["src/**/*.ts", "src/**/*.tsx"] : false,
  }));
};

// Default configuration for simple packages
export const defaultConfig = defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: isDev,
  clean: true,
  target: "es2022",
  minify: !isDev,
  treeshake: !isDev,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "react/jsx-dev-runtime",
    "@captify/*",
  ],
  watch: isDev,
});

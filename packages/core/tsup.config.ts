import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/lib/index.ts",
    "src/hooks/index.ts",
    "src/components/index.ts",
    "src/auth/index.ts",
    "src/chat/index.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", "next"],
});

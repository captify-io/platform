// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  // Each folder gets its own subpath package
  entry: [
    "src/index.ts",
    "src/lib/index.ts",
    "src/lib/auth.ts",
    "src/lib/api.ts",
    "src/lib/utils.ts",
    "src/hooks/index.ts",
    "src/types/index.ts",
    "src/components/index.ts",
    "src/components/ui/index.ts",
    "src/components/theme/index.ts",
    "src/services/index.ts",
  ],

  // Build both CJS and ESM
  format: ["cjs", "esm"],

  // Skip tsup dts generation - use separate tsc command
  dts: false,

  outDir: "dist",
  clean: true,

  // Don’t bundle peer deps or big externals
  external: [
    "react",
    "react-dom",
    "next",
    "next-auth",
    "next-themes",
    "clsx",
    "tailwind-merge",
    "lucide-react",
    "lucide-react/dynamic",
    "zod",
    "@aws-sdk/*",
    "@radix-ui/*",
    "@hookform/resolvers",
    "class-variance-authority",
    "cmdk",
    "embla-carousel-react",
    "input-otp",
    "react-day-picker",
    "react-hook-form",
    "react-resizable-panels",
    "recharts",
    "sonner",
    "vaul",
  ],

  bundle: true,
  splitting: false,
  sourcemap: false,
  treeshake: true,
  target: "es2020",
  minify: process.env.NODE_ENV === "production",

  esbuildOptions(options) {
    options.dropLabels = ["TYPE_ONLY"];
  },
});

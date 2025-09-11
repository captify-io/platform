import { defineConfig } from "tsup";

export default defineConfig({
  // Entry points for the distributable package
  entry: {
    // Core utilities
    "lib/auth": "src/lib/auth.ts",
    "lib/api": "src/lib/api.ts",
    "lib/utils": "src/lib/utils.ts",
    "lib/react-compat": "src/lib/react-compat.ts",

    // Types
    "lib/types": "src/types/index.ts",

    // Hooks
    "lib/hooks": "src/hooks/index.ts",

    // Lib index (for /lib export)
    "lib/index": "src/lib/index.ts",

    // UI components (barrel export)
    "components/ui": "src/components/ui/index.ts",

    // Theme components
    "components/theme": "src/components/theme/index.ts",

    // All components
    "components/index": "src/components/index.ts",

    // Main entry point
    index: "src/index.ts",
  },

  // Output formats
  format: ["cjs", "esm"],

  // TypeScript declarations generated separately
  dts: false,

  // Output directory
  outDir: "dist",

  // Clean output directory before building
  clean: true,

  // External dependencies (don't bundle these)
  external: [
    "react",
    "react-dom",
    "next",
    "next-auth",
    "next-themes",
    "lucide-react",
    "clsx",
    "tailwind-merge",
    "@aws-sdk/*",
    "@radix-ui/*",
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
    "@hookform/resolvers",
    "@captify-io/pmbook",
    "zod",
  ],

  // Splitting
  splitting: false,

  // Source maps for debugging
  sourcemap: false,

  // Target
  target: "es2020",

  // Bundle mode - bundle for proper distribution
  bundle: true,

  // Tree shaking
  treeshake: true,

  // Minify for production
  minify: process.env.NODE_ENV === "production",
  
  // esbuild options to handle TypeScript properly
  esbuildOptions(options) {
    options.dropLabels = ["TYPE_ONLY"];
    options.supported = {
      ...options.supported,
      "const-and-let": true,
    };
  },
});

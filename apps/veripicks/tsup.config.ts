import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Keep peer deps out of the bundle (react, next, etc.)
function peerExternals() {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8")
  );
  return Object.keys(pkg.peerDependencies ?? {});
}

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: false, // Disable DTS for applications
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === "production",
  platform: "node",
  target: "node22",

  // required because we use alias below
  bundle: true,
  splitting: false,

  external: peerExternals(),

  esbuildOptions(options) {
    // allow `import ... from "@/..."` inside this package
    options.alias = { ...(options.alias ?? {}), "@": "./src" };
    options.resolveExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
    options.preserveSymlinks = false;
    options.mainFields = ["module", "main"];
    options.conditions = ["import", "module", "default"];
  },

  outExtension({ format }) {
    return { js: format === "esm" ? ".mjs" : ".cjs" };
  },

  shims: true,
});

import { defineConfig } from "tsup";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

function peerExternals() {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8")
  );
  return Object.keys(pkg.peerDependencies ?? {});
}

const pkg = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8")
);

export default defineConfig({
  entry: ["src/index.ts"], // re-export manifest from index.ts
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: process.env.NODE_ENV === "production",
  platform: "neutral",
  target: "es2022",

  bundle: true,
  splitting: false,

  external: [...peerExternals(), "@captify/client", "@captify/api"],

  esbuildOptions(options) {
    options.alias = {
      "@": resolve(process.cwd(), "src"),
    };
  },

  onSuccess: async () => {
    console.log(`✅ ${pkg.name} built successfully`);
  },
});

// next.config.ts
import type { NextConfig } from "next";

function CaptifyRegistryPlugin() {
  const fs = require("fs");
  const path = require("path");

  return {
    apply(compiler: any) {
      compiler.hooks.beforeCompile.tap("CaptifyRegistryPlugin", () => {
        const pkgRoot = path.join(process.cwd(), "node_modules", "@captify-io");
        const outFile = path.join(
          process.cwd(),
          "src",
          ".captify.generated.ts"
        );

        let pairs: string[] = [];
        if (fs.existsSync(pkgRoot)) {
          for (const slug of fs.readdirSync(pkgRoot)) {
            // Only include directories
            const full = path.join(pkgRoot, slug);
            if (!fs.statSync(full).isDirectory()) continue;

            // Check that the package exposes ./app (via exports or file presence)
            const pkgJsonPath = path.join(full, "package.json");
            let hasApp = false;
            let importPath = `@captify-io/${slug}/app`;
            
            try {
              const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
              if (pkg?.exports && (pkg.exports["./app"] || pkg.exports.app)) {
                // Check if the app export file actually exists
                const appExport = pkg.exports["./app"] || pkg.exports.app;
                const exportPath = typeof appExport === 'object' ? appExport.import : appExport;
                const actualPath = path.join(full, exportPath);
                
                if (fs.existsSync(actualPath)) {
                  hasApp = true;
                  importPath = `@captify-io/${slug}/app`;
                } else {
                  // App export file doesn't exist, check if main export works instead
                  console.log(`[CaptifyRegistry] App export for ${slug} points to non-existent file, trying main export`);
                  if (pkg?.exports && pkg.exports["."]?.import) {
                    const mainExportPath = pkg.exports["."].import;
                    const mainActualPath = path.join(full, mainExportPath);
                    if (fs.existsSync(mainActualPath)) {
                      hasApp = true;
                      importPath = `@captify-io/${slug}`;
                    } else if (mainExportPath.endsWith('.mjs')) {
                      const jsMainVariant = path.join(full, mainExportPath.replace('.mjs', '.js'));
                      if (fs.existsSync(jsMainVariant)) {
                        hasApp = true;
                        importPath = `@captify-io/${slug}`;
                      }
                    }
                  }
                }
              } else if (pkg?.exports && pkg.exports["."]?.import) {
                // If no specific app export, check if main export has pageRegistry
                const mainExportPath = pkg.exports["."].import;
                const actualPath = path.join(full, mainExportPath);
                if (fs.existsSync(actualPath)) {
                  hasApp = true;
                  importPath = `@captify-io/${slug}`;
                }
              } else {
                // Fallback: look for common app entry files
                const candidates = [
                  { file: path.join(full, "dist", "index.js"), path: `@captify-io/${slug}` },
                  { file: path.join(full, "dist", "index.mjs"), path: `@captify-io/${slug}` },
                  { file: path.join(full, "index.js"), path: `@captify-io/${slug}` }, 
                  { file: path.join(full, "app.js"), path: `@captify-io/${slug}/app` },
                  { file: path.join(full, "app.ts"), path: `@captify-io/${slug}/app` },
                ];
                
                for (const candidate of candidates) {
                  if (fs.existsSync(candidate.file)) {
                    hasApp = true;
                    importPath = candidate.path;
                    break;
                  }
                }
              }
            } catch {
              // ignore
            }

            if (hasApp) {
              pairs.push(
                `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(importPath)})`
              );
            }
          }
        }

        const file =
          `/* AUTO-GENERATED: do not edit by hand */\n` +
          `export const captifyApps: Record<string, () => Promise<any>> = {\n` +
          pairs.join(",\n") +
          `\n};\n`;

        fs.mkdirSync(path.dirname(outFile), { recursive: true });
        fs.writeFileSync(outFile, file);
        // console.log(`[Captify] wrote ${outFile}`);
      });
    },
  };
}

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: false,

  // Make sure Next compiles your workspace packages
  transpilePackages: ["@captify-io/*"],

  webpack: (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(CaptifyRegistryPlugin());

    // Your aliases (kept as-is)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@captify-io/platform/hooks": require.resolve("./src/hooks/index.ts"),
      "@captify-io/platform/ui": require.resolve(
        "./src/components/ui/index.ts"
      ),
      "@captify-io/platform/api": require.resolve("./src/lib/api.ts"),
      "@captify-io/platform/utils": require.resolve("./src/lib/utils.ts"),
      "@captify-io/platform/types": require.resolve("./src/types/index.ts"),
      "@captify-io/platform/auth": require.resolve("./src/lib/auth.ts"),
      "@captify-io/platform/components": require.resolve(
        "./src/components/index.ts"
      ),
      "@captify-io/platform/lib": require.resolve("./src/lib/index.ts"),
      "@captify-io/platform/theme": require.resolve(
        "./src/components/theme/index.ts"
      ),
      // Fix broken pmbook package exports
      "@captify-io/pmbook": require.resolve("./node_modules/@captify-io/pmbook/dist/index.js"),
      "@captify-io/pmbook/app": require.resolve("./node_modules/@captify-io/pmbook/dist/index.js"),
    };

    // Optional: reduce noise, but don’t hide real bundling errors
    config.ignoreWarnings = [/Failed to parse source map/];

    return config;
  },

  turbopack: {
    rules: {
      "*.svg": { loaders: ["@svgr/webpack"], as: "*.js" },
    },
  },
};

export default nextConfig;

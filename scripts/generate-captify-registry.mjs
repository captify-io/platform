// scripts/generate-captify-registry.mjs
import fs from "node:fs";
import path from "node:path";

const pkgRoot = path.join(process.cwd(), "node_modules", "@captify-io");
const outFile = path.join(process.cwd(), "src", ".captify.generated.ts");

let pairs = [];

if (fs.existsSync(pkgRoot)) {
  for (const slug of fs.readdirSync(pkgRoot)) {
    const dir = path.join(pkgRoot, slug);
    if (!fs.statSync(dir).isDirectory()) continue;

    // Check for explicit export OR common dist files
    const pkgJsonPath = path.join(dir, "package.json");
    let hasApp = false;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      if (pkg?.exports && (pkg.exports["./app"] || pkg.exports.app)) {
        hasApp = true;
      } else {
        const candidates = [
          path.join(dir, "app.js"),
          path.join(dir, "app.ts"),
          path.join(dir, "dist", "app.js"),
          path.join(dir, "dist", "app.mjs"),
        ];
        hasApp = candidates.some((p) => fs.existsSync(p));
      }
    } catch {
      /* ignore */
    }

    if (hasApp) {
      pairs.push(
        `  ${JSON.stringify(slug)}: () => import(${JSON.stringify(
          `@captify-io/${slug}/app`
        )})`
      );
    }
  }
}

// Always emit a file (even if empty) so the import never fails
const file =
  `/* AUTO-GENERATED: do not edit by hand */\n` +
  `export const captifyApps: Record<string, () => Promise<any>> = {\n` +
  pairs.join(",\n") +
  `\n};\n`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, file);
console.log(`[captify] wrote ${path.relative(process.cwd(), outFile)}`);

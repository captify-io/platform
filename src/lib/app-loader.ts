import { existsSync, readFileSync } from "fs";
import path from "path";

export interface AppConfig {
  enabled: boolean;
  path: string;
  package: string;
}

export interface CaptifyConfig {
  name?: string;
  version?: string;
  packages?: Record<string, any>;
  apps?: Record<string, AppConfig>;
  settings?: {
    packageManager?: string;
    typescript?: boolean;
    eslint?: boolean;
    autoDiscover?: boolean;
  };
}

export function loadCaptifyConfig(): CaptifyConfig {
  const configPath = path.join(process.cwd(), "captify.config.json");

  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.warn("Could not parse captify.config.json, using defaults");
    }
  }

  return {
    packages: {},
    apps: {},
    settings: {
      autoDiscover: true,
    },
  };
}

export async function loadDynamicApps() {
  const config = loadCaptifyConfig();
  const loadedApps: Record<string, any> = {};

  if (config.apps) {
    for (const [appName, appConfig] of Object.entries(config.apps)) {
      if (appConfig.enabled) {
        try {
          // Try to dynamically import the app
          const appModule = await import(appConfig.package);
          loadedApps[appName] = {
            ...appConfig,
            module: appModule,
          };
          console.log(`✓ Loaded app: ${appName} from ${appConfig.package}`);
        } catch (error) {
          console.warn(
            `Could not load app ${appName} from ${appConfig.package}:`,
            error
          );
        }
      }
    }
  }

  // Auto-discover installed packages
  if (config.settings?.autoDiscover) {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // Look for @captify-io/* packages (excluding core)
        for (const [pkgName, version] of Object.entries(dependencies)) {
          if (pkgName.startsWith("@captify-io/") && pkgName !== "@captify-io/core") {
            const appName = pkgName.replace("@captify-io/", "");
            if (!loadedApps[appName]) {
              try {
                const appModule = await import(`${pkgName}/app`);
                loadedApps[appName] = {
                  enabled: true,
                  path: `/${appName}`,
                  package: `${pkgName}/app`,
                  module: appModule,
                };
                console.log(`✓ Auto-discovered app: ${appName}`);
              } catch (error) {
                console.warn(`Could not auto-load ${pkgName}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.warn("Could not read package.json for auto-discovery");
      }
    }
  }

  return loadedApps;
}

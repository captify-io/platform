/**
 * Auto-discovery for Captify packages
 * Automatically finds and registers all @captify-io/* packages
 */

import { serviceRegistry } from "./service-registry";
import fs from "fs";
import path from "path";

/**
 * Automatically discover and register @captify packages
 * This runs at build time to find all available packages
 */
export async function autoDiscoverPackages() {
  try {
    // Look for packages in node_modules/@captify
    const packagesDir = path.join(process.cwd(), "node_modules", "@captify");

    if (!fs.existsSync(packagesDir)) {
      console.warn("No @captify packages directory found");
      return;
    }

    const packages = fs.readdirSync(packagesDir).filter((dir) => {
      // Check if it's a directory with a services export
      const packagePath = path.join(packagesDir, dir);
      const servicesPath = path.join(packagePath, "dist", "services.js");
      return (
        fs.statSync(packagePath).isDirectory() && fs.existsSync(servicesPath)
      );
    });

    // Register each discovered package
    for (const packageName of packages) {
      if (!serviceRegistry.isPackageRegistered(packageName)) {
        // Register with dynamic import
        serviceRegistry.registerPackage(
          packageName,
          () => import(`@captify-io/${packageName}/services`)
        );
        console.log(`✅ Auto-registered package: @captify-io/${packageName}`);
      }
    }

    console.log(
      `📦 Total packages registered: ${
        serviceRegistry.getRegisteredPackages().length
      }`
    );
  } catch (error) {
    console.error("Error during package auto-discovery:", error);
  }
}

// Option 2: Use a configuration file
export async function loadPackagesFromConfig() {
  try {
    // Look for a captify.config.json in the project root
    const configPath = path.join(process.cwd(), "captify.config.json");

    if (!fs.existsSync(configPath)) {
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (config.packages && Array.isArray(config.packages)) {
      for (const packageName of config.packages) {
        if (!serviceRegistry.isPackageRegistered(packageName)) {
          serviceRegistry.registerPackage(
            packageName,
            () => import(`@captify-io/${packageName}/services`)
          );
          console.log(
            `✅ Registered package from config: @captify-io/${packageName}`
          );
        }
      }
    }
  } catch (error) {
    console.error("Error loading packages from config:", error);
  }
}

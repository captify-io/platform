/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for highlighting potential problems
  reactStrictMode: true,
  productionBrowserSourceMaps: false,

  // Transpile packages (Next.js 15+ feature for workspace packages)
  transpilePackages: ["@captify/core"],

  // Optimize images
  images: {
    domains: ["localhost"],
  },

  // Turbopack configuration for development
  turbopack: {
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
  },

  // Webpack configuration (only for production builds)
  webpack: (config, { isServer, dev }) => {
    // Only apply webpack config for non-dev builds (when not using Turbopack)
    if (!dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ["**/packages/**", "**/node_modules/**"],
      };
      config.devtool = false;
    }

    // Add error logging plugin
    config.plugins.push({
      apply(compiler) {
        compiler.hooks.done.tap("LogFirstErrors", (stats) => {
          const s = stats.toJson({ errors: true });
          if (s.errors?.length) {
            console.error("WEBPACK ERROR 1:\n", s.errors[0]);
          }
        });
      },
    });

    return config;
  },
};

export default nextConfig;

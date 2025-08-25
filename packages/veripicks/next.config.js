/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  
  // Environment variables for Captify SDK
  env: {
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    DYNAMODB_GAMES_TABLE: process.env.DYNAMODB_GAMES_TABLE || 'veripicks-games',
    DYNAMODB_PICKS_TABLE: process.env.DYNAMODB_PICKS_TABLE || 'veripicks-picks',
    DYNAMODB_USERS_TABLE: process.env.DYNAMODB_USERS_TABLE || 'veripicks-users',
    ACTION_NETWORK_API_KEY: process.env.ACTION_NETWORK_API_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  },

  // Webpack configuration for SDK imports
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle @captify/core package resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@captify/core': require.resolve('@captify/core'),
    };

    return config;
  },

  // API routes configuration
  async rewrites() {
    return [
      {
        source: '/api/games/:path*',
        destination: '/api/games/:path*',
      },
      {
        source: '/api/picks/:path*', 
        destination: '/api/picks/:path*',
      },
      {
        source: '/api/users/:path*',
        destination: '/api/users/:path*',
      },
    ];
  },

  // Headers for CORS and security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'development' ? '*' : 'https://veripicks.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization, X-ID-Token, X-AWS-Session-Token, X-User-Email',
          },
        ],
      },
    ];
  },

  // Image optimization for team logos and user avatars
  images: {
    domains: [
      'a.espncdn.com',
      'logoeps.com',
      'assets.vercel.com',
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Build output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    // Dangerously allow production builds with TypeScript errors
    // Remove this in production
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Only run ESLint on specific directories during build
    dirs: ['src', 'pages', 'components', 'lib', 'utils'],
  },
};

module.exports = nextConfig;

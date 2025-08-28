import type { NextConfig } from 'next';
import path from 'node:path';

const config: NextConfig = {
  webpack: (cfg) => {
    cfg.resolve.alias = { 
      ...(cfg.resolve.alias||{}), 
      '@': path.resolve(__dirname, 'src')
    };
    return cfg;
  }
};
export default config;

'use server';

import fs from 'fs';
import path from 'path';

interface AppConfig {
  slug: string;
  name: string;
  manifest?: {
    visibility?: 'public' | 'internal' | 'private';
  };
}

export async function checkAppAccess(slug: string) {
  try {
    const configPath = path.join(process.cwd(), 'src', 'app', slug, 'config.json');

    if (!fs.existsSync(configPath)) {
      return { hasAccess: false, reason: 'app_not_found' };
    }

    const content = fs.readFileSync(configPath, 'utf-8');
    const config: AppConfig = JSON.parse(content);

    const visibility = config.manifest?.visibility || 'internal';

    if (visibility === 'public') {
      return { hasAccess: true, config };
    }

    return { hasAccess: false, reason: 'no_membership', config };
  } catch (error) {
    console.error('[checkAppAccess] Error:', error);
    return { hasAccess: false, reason: 'error' };
  }
}

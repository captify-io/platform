/**
 * PM2 Ecosystem Configuration
 *
 * Manages the platform process with production settings
 */

module.exports = {
  apps: [
    {
      name: 'platform',
      script: 'npm',
      args: 'start',
      cwd: '/opt/captify-apps/platform',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
      // Auto-restart on crashes
      autorestart: true,
      // Max memory before restart (1GB)
      max_memory_restart: '1G',
      // Error and output logs
      error_file: '/home/ec2-user/.pm2/logs/platform-error.log',
      out_file: '/home/ec2-user/.pm2/logs/platform-out.log',
      // Merge logs from cluster instances
      merge_logs: true,
      // Log date format
      time: true,
    },
  ],
};

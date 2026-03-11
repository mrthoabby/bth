/** @type {import('pm2').ProcessDescription[]} */
module.exports = {
  apps: [
    {
      name: 'bth',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};

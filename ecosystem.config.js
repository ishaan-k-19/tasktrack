module.exports = {
  apps: [
    {
      name: 'tasktrack',
      script: 'npx',
      args: 'serve -s dist -l 3006',
      cwd: '/home/deploy/apps/tasktrack',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3006
      }
    }
  ]
};

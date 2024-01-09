// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "ecosystem",
      script: "index.js", // Path to your main application file
      instances: "max", // Set to 'max' to use all available CPU cores
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3008, // Set your application's port
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3008,
      },
    },
  ],
};

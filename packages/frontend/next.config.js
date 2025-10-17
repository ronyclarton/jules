/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This is needed to ensure that file changes are detected
  // when running in a Docker container.
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    };
    return config;
  },
};

module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Workaround: next-app-loader.js (legacy flat file) takes priority over
    // next-app-loader/index.js in Node module resolution, but the flat file
    // passes VAR_ORIGINAL_PATHNAME to templates that no longer have this
    // placeholder in Next.js 15.5.18, causing an invariant build error.
    // Force webpack to use the correct refactored loader directly.
    config.resolveLoader.alias["next-app-loader"] = path.resolve(
      __dirname,
      "node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js"
    );
    return config;
  },
};

module.exports = nextConfig;

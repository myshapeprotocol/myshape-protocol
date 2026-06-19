const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: "myshape",
  project: "myshape-protocol",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
});
